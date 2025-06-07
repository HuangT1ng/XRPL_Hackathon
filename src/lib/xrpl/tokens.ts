import { Wallet, convertStringToHex, TrustSetFlags } from 'xrpl';
import { xrplClient } from './client';
import { SMECampaign, Milestone } from '@/types';
import { log } from '@/lib/logger';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  totalSupply: number;
  decimals: number;
}

export class XRPLTokenService {
  async issueFungibleToken(
    wallet: Wallet,
    tokenSymbol: string,
    totalSupply: number
  ): Promise<string> {
    try {
      await xrplClient.connect();

      // Step 1: Enable ripping on the issuer's account to allow others to create trustlines
      log.info('XRPL_TOKEN', `Enabling default ripple for token ${tokenSymbol}`, { account: wallet.classicAddress });
      const accountSetTx = {
        TransactionType: 'AccountSet' as const,
        Account: wallet.classicAddress,
        SetFlag: 8, // asfDefaultRipple
      };
      await xrplClient.submitTransaction(accountSetTx, wallet);
      log.info('XRPL_TOKEN', 'Default ripple enabled successfully');

      // The token is "issued" when the issuer sends it to another account that has set a trustline.
      // There is no need to send a Payment to oneself. The total supply is a concept managed off-chain
      // or by the circulating supply across all holders.
      
      // For fungible tokens (IOUs), the currency code is key.
      const currencyCode = tokenSymbol.padEnd(3, '\0');

      return currencyCode;

    } catch (error) {
      log.error('XRPL_TOKEN', 'Error issuing fungible token', { error });
      throw error;
    }
  }

  async createAMMPool(
    wallet: Wallet,
    pitTokenId: string,
    rlusdAmount: number,
    pitTokenAmount: number
  ): Promise<string> {
    try {
      await xrplClient.connect();

      // The AMMCreate caller needs to hold the asset. For development, we simulate a payment from the issuer.
      // In a real app, the user would need to acquire this token first.
      const funderSecret = import.meta.env.VITE_RLUSD_ISSUER_SECRET as string;
      if (!funderSecret) {
        const errorMessage = "VITE_RLUSD_ISSUER_SECRET is not set in your environment variables. Cannot auto-fund wallet for development.";
        log.error('XRPL_TOKEN', errorMessage);
        throw new Error(errorMessage);
      }
      const funderWallet = Wallet.fromSecret(funderSecret);
      const rlusdIssuer = funderWallet.classicAddress;

      // Enable rippling on the issuer account to allow token transfers
      try {
        log.info('XRPL_TOKEN', `Enabling default ripple for RLUSD issuer...`);
        const accountSetTx = {
          TransactionType: 'AccountSet' as const,
          Account: rlusdIssuer,
          SetFlag: 8, // asfDefaultRipple
        };
        await xrplClient.submitTransaction(accountSetTx, funderWallet);
        log.info('XRPL_TOKEN', 'Default ripple enabled successfully for RLUSD issuer.');
      } catch (error: any) {
        // Ignore error if flag is already set (tecALREADY)
        if (error.data?.result?.engine_result_code !== -99) {
           log.warn('XRPL_TOKEN', 'Could not enable ripple, flag might be set already.', { message: error.message });
        }
      }

      // Non-standard currency codes must be represented as a 40-character hex string.
      const rlusdCurrencyCode = convertStringToHex('RLUSD').padEnd(40, '0');
      
      log.info('XRPL_TOKEN', `Ensuring Trust Line for RLUSD from issuer ${rlusdIssuer} is set...`);
      const trustSetTx = {
        TransactionType: 'TrustSet' as const,
        Account: wallet.classicAddress,
        LimitAmount: {
          currency: rlusdCurrencyCode,
          issuer: rlusdIssuer,
          value: (rlusdAmount * 2).toString() // Set a limit greater than the needed amount
        },
        Flags: TrustSetFlags.tfClearNoRipple
      };
      await xrplClient.submitTransaction(trustSetTx, wallet);
      log.info('XRPL_TOKEN', 'RLUSD Trust Line configured successfully.');
      
      try {
        log.info('XRPL_TOKEN', `Auto-funding wallet with ${rlusdAmount} RLUSD for development...`);
        
        const paymentTx = {
          TransactionType: 'Payment' as const,
          Account: funderWallet.classicAddress,
          Destination: wallet.classicAddress,
          Amount: {
            currency: rlusdCurrencyCode, // Non-standard currencies must be in hex format
            issuer: rlusdIssuer,
            value: rlusdAmount.toString()
          }
        };
        const paymentResult = await xrplClient.submitTransaction(paymentTx, funderWallet);
        if (paymentResult.result.meta.TransactionResult !== 'tesSUCCESS') {
          throw new Error(`Auto-funding payment failed: ${paymentResult.result.meta.TransactionResult}`);
        }
        log.info('XRPL_TOKEN', 'Auto-funding successful.');
      } catch(e) {
        const error = e instanceof Error ? e : new Error(String(e));
        log.error('XRPL_TOKEN', 'Failed to auto-fund wallet for development.', { 
          message: error.message,
          stack: error.stack,
          name: error.name,
         });
        throw error;
      }

      const pitCurrencyCode = convertStringToHex(pitTokenId).padEnd(40, '0');

      // --- DEBUGGING ---
      log.info('DEBUG: AMM ISSUER CHECK', `Campaign Issuer: ${wallet.classicAddress}, RLUSD Issuer: ${rlusdIssuer}, Are Same: ${wallet.classicAddress === rlusdIssuer}`);
      // --- END DEBUGGING ---

      // Create AMM pool for PIT/RLUSD pair
      const ammCreateTransaction = {
        TransactionType: 'AMMCreate',
        Account: wallet.classicAddress,
        Amount: {
          currency: rlusdCurrencyCode,
          issuer: rlusdIssuer, 
          value: rlusdAmount.toString()
        },
        Amount2: {
          currency: pitCurrencyCode,
          issuer: wallet.classicAddress,
          value: pitTokenAmount.toString()
        },
        TradingFee: 500 // 0.5% trading fee
      };

      const result = await xrplClient.submitTransaction(ammCreateTransaction, wallet);
      
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        // Extract AMM ID from transaction metadata
        const ammId = this.extractAMMID(result.result.meta);
        return ammId;
      } else {
        throw new Error(`AMM creation failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error: any) {
      log.error('XRPL_TOKEN', 'Error creating AMM pool', { 
        message: error.message, 
        data: error.data,
        stack: error.stack,
       });
      throw error;
    }
  }

  async setupMilestoneEscrows(
    wallet: Wallet,
    milestones: Milestone[],
    totalFunding: number,
    campaignEndDate: Date
  ): Promise<string[]> {
    const escrowHashes: string[] = [];

    try {
      await xrplClient.connect();

      for (const milestone of milestones) {
        const escrowAmount = Math.floor((milestone.fundingPercentage / 100) * totalFunding);
        
        const escrowTransaction = {
          TransactionType: 'EscrowCreate',
          Account: wallet.classicAddress,
          Destination: wallet.classicAddress, // SME receives the funds
          Amount: (escrowAmount * 1000000).toString(), // Convert to drops
          FinishAfter: Math.floor(milestone.targetDate.getTime() / 1000),
          CancelAfter: Math.floor(campaignEndDate.getTime() / 1000),
          Condition: this.generateMilestoneCondition(milestone.id),
          Memos: [{
            Memo: {
              MemoType: convertStringToHex('milestone'),
              MemoData: convertStringToHex(JSON.stringify({
                milestoneId: milestone.id,
                campaignId: milestone.id.split('-')[0], // Extract campaign ID
                fundingPercentage: milestone.fundingPercentage
              }))
            }
          }]
        };

        const result = await xrplClient.submitTransaction(escrowTransaction, wallet);
        
        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          escrowHashes.push(result.result.hash);
        } else {
          throw new Error(`Escrow creation failed for milestone ${milestone.id}: ${result.result.meta.TransactionResult}`);
        }
      }

      return escrowHashes;
    } catch (error) {
      log.error('XRPL_TOKEN', 'Error setting up milestone escrows', { error });
      throw error;
    }
  }

  async finishMilestoneEscrow(
    wallet: Wallet,
    escrowHash: string,
    fulfillment: string
  ): Promise<boolean> {
    try {
      await xrplClient.connect();

      const finishTransaction = {
        TransactionType: 'EscrowFinish',
        Account: wallet.classicAddress,
        Owner: wallet.classicAddress,
        OfferSequence: await this.getEscrowSequence(escrowHash),
        Fulfillment: fulfillment
      };

      const result = await xrplClient.submitTransaction(finishTransaction, wallet);
      return result.result.meta.TransactionResult === 'tesSUCCESS';
    } catch (error) {
      log.error('XRPL_TOKEN', 'Error finishing milestone escrow', { error });
      throw error;
    }
  }

  async cancelEscrow(
    wallet: Wallet,
    escrowHash: string
  ): Promise<boolean> {
    try {
      await xrplClient.connect();

      const cancelTransaction = {
        TransactionType: 'EscrowCancel',
        Account: wallet.classicAddress,
        Owner: wallet.classicAddress,
        OfferSequence: await this.getEscrowSequence(escrowHash)
      };

      const result = await xrplClient.submitTransaction(cancelTransaction, wallet);
      return result.result.meta.TransactionResult === 'tesSUCCESS';
    } catch (error) {
      log.error('XRPL_TOKEN', 'Error canceling escrow', { error });
      throw error;
    }
  }

  async getTokenInfo(tokenId: string): Promise<any> {
    try {
      await xrplClient.connect();
      
      const response = await xrplClient.getClient().request({
        command: 'nft_info',
        nft_id: tokenId
      });

      return response.result;
    } catch (error) {
      log.error('XRPL_TOKEN', 'Error getting token info', { error });
      throw error;
    }
  }

  async getAMMInfo(ammId: string): Promise<any> {
    try {
      await xrplClient.connect();
      
      const response = await xrplClient.getClient().request({
        command: 'amm_info',
        amm_account: ammId
      });

      return response.result;
    } catch (error) {
      log.error('XRPL_TOKEN', 'Error getting AMM info', { error });
      throw error;
    }
  }

  private extractNFTokenID(meta: any): string {
    // Extract NFTokenID from transaction metadata
    if (meta.CreatedNode && meta.CreatedNode.NewFields && meta.CreatedNode.NewFields.NFTokens) {
      return meta.CreatedNode.NewFields.NFTokens[0].NFToken.NFTokenID;
    }
    throw new Error('Could not extract NFTokenID from transaction metadata');
  }

  private extractAMMID(meta: any): string {
    // Extract AMM ID from transaction metadata
    for (const node of meta.AffectedNodes) {
      if (node.CreatedNode && node.CreatedNode.LedgerEntryType === 'AMM') {
        if (node.CreatedNode.NewFields && node.CreatedNode.NewFields.Account) {
          log.info('XRPL_TOKEN', 'Successfully extracted AMM ID', { ammId: node.CreatedNode.NewFields.Account });
          return node.CreatedNode.NewFields.Account;
        }
      }
    }
    log.error('XRPL_TOKEN', 'Could not find AMM account in transaction metadata', { metadata: meta });
    throw new Error('Could not extract AMM ID from transaction metadata');
  }

  private generateMilestoneCondition(milestoneId: string): string {
    // Generate a condition hash for milestone completion
    // This would be fulfilled when milestone proof is verified
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`milestone_${milestoneId}`).digest('hex').toUpperCase();
  }

  private async getEscrowSequence(escrowHash: string): Promise<number> {
    // Get the sequence number for an escrow transaction
    const txResponse = await xrplClient.getClient().request({
      command: 'tx',
      transaction: escrowHash
    });
    
    const sequence = txResponse.result.tx_json?.Sequence;

    if (sequence === undefined) {
      const fallbackSequence = (txResponse.result as any).Sequence as number | undefined;
      if (fallbackSequence !== undefined) {
        return fallbackSequence;
      }
      throw new Error(`Could not find Sequence for transaction with hash ${escrowHash}`);
    }
    
    return sequence;
  }

  /**
   * (FOR DEMO PURPOSES) Sends RLUSD from the issuer to a buyer's account.
   */
  async sendRLUSDToBuyer(buyerAddress: string, amount: number): Promise<void> {
    log.info('DEMO_FUNDING', `Attempting to send ${amount} RLUSD to ${buyerAddress}`);
    try {
      await xrplClient.connect();

      const funderSecret = import.meta.env.VITE_RLUSD_ISSUER_SECRET as string;
      if (!funderSecret) {
        throw new Error("VITE_RLUSD_ISSUER_SECRET is not set.");
      }
      
      const funderWallet = Wallet.fromSecret(funderSecret);
      const rlusdIssuer = funderWallet.classicAddress;
      const rlusdCurrencyCode = convertStringToHex('RLUSD').padEnd(40, '0');

      // The buyer needs a trust line to the issuer first. 
      // We will create it on their behalf for the demo.
      log.info('DEMO_FUNDING', `Setting RLUSD trust line for ${buyerAddress}...`);
      const buyerWallet = Wallet.fromSeed(buyerAddress); // This is not right, need buyer's secret
      const trustSetTx = {
        TransactionType: 'TrustSet' as const,
        Account: buyerAddress,
        LimitAmount: {
          currency: rlusdCurrencyCode,
          issuer: rlusdIssuer,
          value: (amount * 2).toString() 
        }
      };
      // This tx needs to be signed by the BUYER, not the funder. This approach is flawed.
      // await xrplClient.submitTransaction(trustSetTx, funderWallet);

      log.info('DEMO_FUNDING', `Sending ${amount} RLUSD payment...`);
      const paymentTx = {
        TransactionType: 'Payment' as const,
        Account: rlusdIssuer,
        Destination: buyerAddress,
        Amount: {
          currency: rlusdCurrencyCode,
          issuer: rlusdIssuer,
          value: amount.toString()
        }
      };

      const paymentResult = await xrplClient.submitTransaction(paymentTx, funderWallet);
      if (paymentResult.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Demo funding payment failed: ${paymentResult.result.meta.TransactionResult}`);
      }
      log.info('DEMO_FUNDING', `Successfully sent ${amount} RLUSD to ${buyerAddress}`);

    } catch (error: any) {
      log.error('DEMO_FUNDING', 'Failed to send RLUSD to buyer', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async getIssuedTokens(issuerAddress: string): Promise<any[]> {
    try {
      await xrplClient.connect();
      const response = await xrplClient.getClient().request({
        command: 'account_lines',
        account: issuerAddress,
        ledger_index: 'validated',
      });
      log.info('XRPL_TOKEN', `Found ${response.result.lines.length} issued tokens for ${issuerAddress}`);
      return response.result.lines;
    } catch (error) {
      log.error('XRPL_TOKEN', `Error fetching issued tokens for ${issuerAddress}`, { error });
      throw error;
    }
  }
} 