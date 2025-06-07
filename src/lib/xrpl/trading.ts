import { Wallet } from 'xrpl';
import { xrplClient } from './client';

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: number;
  slippage: number;
  userAddress: string;
}

export interface LiquidityParams {
  tokenA: string;
  tokenB: string;
  amountA: number;
  amountB: number;
  userAddress: string;
}

export interface PriceData {
  price: number;
  volume24h: number;
  priceChange24h: number;
  timestamp: number;
}

export class XRPLTradingService {
  async executeSwap(wallet: Wallet, params: SwapParams): Promise<any> {
    try {
      await xrplClient.connect();

      // For a swap, we create a Payment transaction.
      // We specify the Amount to deliver (the token the user wants to receive)
      // and a SendMax, which is the maximum amount of the other token they are willing to give up.
      // The AMM automatically provides the exchange rate.

      // First, get the issuer addresses for the tokens involved.
      // This is a simplified approach for the demo. A real app would look these up dynamically.
      const rlusdIssuer = 'rNxFiiwTtFQuFp4uZVeKWQCvFhNH5sR8Yp'; // The fixed issuer of RLUSD
      const campaignTokenInfo = await this.getTokenInfoFromAMM(params.toToken);
      const campaignTokenIssuer = campaignTokenInfo.issuer;
      
      const amountToReceive = {
        currency: params.toToken,
        issuer: campaignTokenIssuer,
        value: '0.000001' // Bogus small value, the real amount is determined by the pathfinding.
                         // The important part is specifying the currency we want.
      };
      
      const amountToSpend = {
        currency: params.fromToken,
        issuer: rlusdIssuer,
        value: params.amount.toString()
      };

      const paymentTx = {
        TransactionType: 'Payment' as const,
        Account: wallet.classicAddress,
        Amount: amountToReceive,
        SendMax: amountToSpend,
        Destination: wallet.classicAddress, // Sending to ourselves to execute the swap
        Flags: 131072 // tfPartialPayment
      };

      const result = await xrplClient.submitTransaction(paymentTx, wallet);
      return result;

    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  async executePartialExit(
    wallet: Wallet, 
    tokenSymbol: string, 
    percentage: number
  ): Promise<any> {
    try {
      await xrplClient.connect();

      // Get user's token balance
      const balance = await this.getTokenBalance(wallet.classicAddress, tokenSymbol);
      const amountToSell = balance * (percentage / 100);

      // Execute swap to RLUSD
      return await this.executeSwap(wallet, {
        fromToken: tokenSymbol,
        toToken: 'RLUSD',
        amount: amountToSell,
        slippage: 2, // 2% slippage tolerance
        userAddress: wallet.classicAddress
      });
    } catch (error) {
      console.error('Error executing partial exit:', error);
      throw error;
    }
  }

  async addLiquidity(wallet: Wallet, params: LiquidityParams): Promise<any> {
    try {
      await xrplClient.connect();

      const liquidityTransaction = {
        TransactionType: 'AMMDeposit',
        Account: wallet.classicAddress,
        Asset: {
          currency: params.tokenA === 'XRP' ? 'XRP' : params.tokenA,
          issuer: params.tokenA === 'XRP' ? undefined : wallet.classicAddress
        },
        Asset2: {
          currency: params.tokenB === 'XRP' ? 'XRP' : params.tokenB,
          issuer: params.tokenB === 'XRP' ? undefined : wallet.classicAddress
        },
        Amount: params.tokenA === 'XRP' 
          ? (params.amountA * 1000000).toString() 
          : {
              currency: params.tokenA,
              issuer: wallet.classicAddress,
              value: params.amountA.toString()
            },
        Amount2: params.tokenB === 'XRP' 
          ? (params.amountB * 1000000).toString() 
          : {
              currency: params.tokenB,
              issuer: wallet.classicAddress,
              value: params.amountB.toString()
            }
      };

      const result = await xrplClient.submitTransaction(liquidityTransaction, wallet);
      return result;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  }

  async removeLiquidity(
    wallet: Wallet, 
    tokenA: string, 
    tokenB: string, 
    lpTokenAmount: number
  ): Promise<any> {
    try {
      await xrplClient.connect();

      const withdrawTransaction = {
        TransactionType: 'AMMWithdraw',
        Account: wallet.classicAddress,
        Asset: {
          currency: tokenA === 'XRP' ? 'XRP' : tokenA,
          issuer: tokenA === 'XRP' ? undefined : wallet.classicAddress
        },
        Asset2: {
          currency: tokenB === 'XRP' ? 'XRP' : tokenB,
          issuer: tokenB === 'XRP' ? undefined : wallet.classicAddress
        },
        LPTokenIn: {
          currency: 'LP',
          issuer: wallet.classicAddress,
          value: lpTokenAmount.toString()
        }
      };

      const result = await xrplClient.submitTransaction(withdrawTransaction, wallet);
      return result;
    } catch (error) {
      console.error('Error removing liquidity:', error);
      throw error;
    }
  }

  async getRealTimePrices(tokenPair: string): Promise<PriceData> {
    try {
      await xrplClient.connect();

      const [tokenA, tokenB] = tokenPair.split('/');
      
      // Get AMM info for the pair
      const ammInfo = await this.getAMMInfo(tokenA, tokenB);
      
      if (!ammInfo) {
        throw new Error(`No AMM pool found for ${tokenPair}`);
      }

      // Calculate current price from pool reserves
      const reserveA = parseFloat(ammInfo.amm.amount);
      const reserveB = parseFloat(ammInfo.amm.amount2.value || ammInfo.amm.amount2);
      const price = reserveB / reserveA;

      // Get 24h volume and price change (simplified)
      const volume24h = await this.get24hVolume(tokenA, tokenB);
      const priceChange24h = await this.get24hPriceChange(tokenA, tokenB);

      return {
        price,
        volume24h,
        priceChange24h,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting real-time prices:', error);
      throw error;
    }
  }

  async getTokenBalance(address: string, tokenSymbol: string): Promise<number> {
    try {
      await xrplClient.connect();

      if (tokenSymbol === 'XRP') {
        const balance = await xrplClient.getAccountBalance(address);
        return parseFloat(balance);
      } else {
        const response = await xrplClient.getClient().request({
          command: 'account_lines',
          account: address
        });

        const tokenLine = response.result.lines.find(
          (line: any) => line.currency === tokenSymbol
        );

        return tokenLine ? parseFloat(tokenLine.balance) : 0;
      }
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  async getAMMInfo(tokenA: string, tokenB: string): Promise<any> {
    try {
      await xrplClient.connect();

      const response = await xrplClient.getClient().request({
        command: 'amm_info',
        asset: {
          currency: tokenA === 'XRP' ? 'XRP' : tokenA
        },
        asset2: {
          currency: tokenB === 'XRP' ? 'XRP' : tokenB
        }
      });

      return response.result;
    } catch (error) {
      console.error('Error getting AMM info:', error);
      return null;
    }
  }

  async calculatePriceImpact(
    tokenA: string, 
    tokenB: string, 
    amountIn: number
  ): Promise<number> {
    try {
      const ammInfo = await this.getAMMInfo(tokenA, tokenB);
      
      if (!ammInfo) {
        return 0;
      }

      const reserveA = parseFloat(ammInfo.amm.amount);
      const reserveB = parseFloat(ammInfo.amm.amount2.value || ammInfo.amm.amount2);
      
      // Calculate price impact using constant product formula
      const currentPrice = reserveB / reserveA;
      const newReserveA = reserveA + amountIn;
      const newReserveB = (reserveA * reserveB) / newReserveA;
      const newPrice = newReserveB / newReserveA;
      
      const priceImpact = Math.abs((newPrice - currentPrice) / currentPrice) * 100;
      return priceImpact;
    } catch (error) {
      console.error('Error calculating price impact:', error);
      return 0;
    }
  }

  async getOptimalSwapRoute(
    fromToken: string, 
    toToken: string, 
    amount: number
  ): Promise<any[]> {
    try {
      // Simplified path finding - in production, this would use more sophisticated routing
      const directRoute = await this.getAMMInfo(fromToken, toToken);
      
      if (directRoute) {
        return [{
          path: [fromToken, toToken],
          expectedOutput: await this.calculateSwapOutput(fromToken, toToken, amount),
          priceImpact: await this.calculatePriceImpact(fromToken, toToken, amount)
        }];
      }

      // Try routing through XRP
      const routeThroughXRP = [];
      const route1 = await this.getAMMInfo(fromToken, 'XRP');
      const route2 = await this.getAMMInfo('XRP', toToken);
      
      if (route1 && route2) {
        routeThroughXRP.push({
          path: [fromToken, 'XRP', toToken],
          expectedOutput: await this.calculateMultiHopOutput(fromToken, toToken, amount, 'XRP'),
          priceImpact: await this.calculateMultiHopPriceImpact(fromToken, toToken, amount, 'XRP')
        });
      }

      return routeThroughXRP;
    } catch (error) {
      console.error('Error finding optimal swap route:', error);
      return [];
    }
  }

  private async calculateSwapOutput(
    tokenA: string, 
    tokenB: string, 
    amountIn: number
  ): Promise<number> {
    const ammInfo = await this.getAMMInfo(tokenA, tokenB);
    
    if (!ammInfo) {
      return 0;
    }

    const reserveA = parseFloat(ammInfo.amm.amount);
    const reserveB = parseFloat(ammInfo.amm.amount2.value || ammInfo.amm.amount2);
    const fee = 0.005; // 0.5% trading fee
    
    // Constant product formula with fees
    const amountInWithFee = amountIn * (1 - fee);
    const amountOut = (reserveB * amountInWithFee) / (reserveA + amountInWithFee);
    
    return amountOut;
  }

  private async calculateMultiHopOutput(
    fromToken: string, 
    toToken: string, 
    amount: number, 
    intermediateToken: string
  ): Promise<number> {
    const firstHop = await this.calculateSwapOutput(fromToken, intermediateToken, amount);
    const secondHop = await this.calculateSwapOutput(intermediateToken, toToken, firstHop);
    return secondHop;
  }

  private async calculateMultiHopPriceImpact(
    fromToken: string, 
    toToken: string, 
    amount: number, 
    intermediateToken: string
  ): Promise<number> {
    const impact1 = await this.calculatePriceImpact(fromToken, intermediateToken, amount);
    const firstHopOutput = await this.calculateSwapOutput(fromToken, intermediateToken, amount);
    const impact2 = await this.calculatePriceImpact(intermediateToken, toToken, firstHopOutput);
    
    // Combined price impact (simplified)
    return impact1 + impact2;
  }

  private async get24hVolume(tokenA: string, tokenB: string): Promise<number> {
    // Mock implementation - would query historical transaction data
    return Math.random() * 100000;
  }

  private async get24hPriceChange(tokenA: string, tokenB: string): Promise<number> {
    // Mock implementation - would calculate from historical price data
    return (Math.random() - 0.5) * 20; // Random change between -10% and +10%
  }

  private async getTokenInfoFromAMM(tokenSymbol: string): Promise<{issuer: string}> {
    // This is a mock. A real implementation would need a reliable way 
    // to find the issuer for a given token symbol, perhaps from a curated list
    // or by querying a registry. For the demo, we find an AMM that involves the token
    // and assume the other asset is RLUSD to find the issuer.
    const amms = await xrplClient.getClient().request({
      command: 'amm_info',
      asset: { currency: 'RLUSD' },
      asset2: { currency: tokenSymbol }
    });
    
    // For simplicity, we'll just grab the first one.
    const amm = amms.result.amm;
    if (!amm) throw new Error(`Could not find an AMM for ${tokenSymbol} and RLUSD`);

    // The issuer is part of the Amount2 object (the campaign token)
    return {
      issuer: amm.amount2.issuer
    };
  }
} 