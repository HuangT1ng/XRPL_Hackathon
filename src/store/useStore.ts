import { create } from 'zustand';
import { Wallet } from 'xrpl';
import { WalletState, SMECampaign, InvestorPortfolio, PoolStats, XRPLAMMObject, XRPLEscrowObject } from '@/types';
import { crowdLiftXRPL } from '@/lib/xrpl';
import { xrplWalletService } from '@/lib/xrpl/wallet';
import { config } from '@/lib/config';
import { log } from '@/lib/logger';
// import { issuerCampaigns } from '@/data/mockData';
import { xrplClient } from '@/lib/xrpl';
import { decodeHexCurrency } from '@/lib/xrpl/utils';
import { mockCampaigns } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

interface AppState {
  // Wallet
  wallet: WalletState & { xrplWallet?: Wallet };
  connectWallet: (secret?: string) => Promise<void>;
  disconnectWallet: () => void;
  
  // Campaigns
  campaigns: SMECampaign[];
  selectedCampaign: SMECampaign | null;
  setCampaigns: (campaigns: SMECampaign[]) => void;
  setSelectedCampaign: (campaign: SMECampaign | null) => void;
  createCampaign: (campaignData: Partial<SMECampaign>) => Promise<string>;
  
  // Portfolio
  portfolio: InvestorPortfolio | null;
  setPortfolio: (portfolio: InvestorPortfolio) => void;
  refreshPortfolio: () => Promise<void>;
  
  // Trading
  executeSwap: (fromToken: string, toToken: string, amount: number, slippage: number) => Promise<any>;
  executePartialExit: (tokenSymbol: string, percentage: number) => Promise<any>;
  addLiquidity: (tokenA: string, tokenB: string, amountA: number, amountB: number) => Promise<any>;
  
  // Pool Stats
  poolStats: Record<string, PoolStats>;
  setPoolStats: (poolId: string, stats: PoolStats) => void;
  refreshPoolStats: (tokenPair: string) => Promise<void>;
  
  // Milestones
  submitMilestoneProof: (campaignId: string, milestoneId: string, photoProof: any) => Promise<string>;
  verifyMilestone: (milestoneId: string, proofHash: string, approved: boolean) => Promise<string>;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Wallet
  wallet: {
    address: null,
    isConnected: false,
    balance: 0,
    network: 'testnet',
  },
  
  connectWallet: async (secret) => {
    if (secret) {
      log.info('WALLET', 'Importing wallet from secret...');
    } else {
      log.info('WALLET', 'Starting new wallet creation process...');
    }
    set({ isLoading: true, error: null });
    try {
      let walletInfo;

      if (secret) {
        // Import wallet from secret
        walletInfo = xrplWalletService.importWallet(secret);
        // We need to fetch the balance for an imported wallet
        const balance = await xrplWalletService.getWalletBalance(walletInfo.address);
        walletInfo.balance = balance;
        log.info('WALLET', 'Wallet imported successfully', { address: walletInfo.address, balance: walletInfo.balance });
      } else {
        // Create and fund a new wallet
        log.info('WALLET', 'Creating and funding real XRPL wallet...');
        walletInfo = await xrplWalletService.createAndFundWallet();
        log.info('WALLET', 'New wallet created successfully', { address: walletInfo.address, balance: walletInfo.balance });
      }
      
      set({
        wallet: {
          address: walletInfo.address,
          isConnected: true,
          balance: parseFloat(walletInfo.balance),
          network: walletInfo.network as 'testnet' | 'mainnet' | 'devnet',
          xrplWallet: walletInfo.wallet
        },
        isLoading: false,
      });

      // Initialize XRPL services
      log.info('WALLET', 'Initializing XRPL services...');
      await crowdLiftXRPL.initialize();
      log.info('WALLET', 'XRPL services initialized successfully');
      
    } catch (error) {
      log.error('WALLET', 'Failed to connect wallet', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isLoading: false 
      });
    }
  },
  
  disconnectWallet: () => {
    set({
      wallet: {
        address: null,
        isConnected: false,
        balance: 0,
        network: 'testnet',
      },
      portfolio: null,
    });
  },
  
  // Campaigns
  campaigns: [],
  selectedCampaign: null,
  setCampaigns: (campaigns) => set({ campaigns }),
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
  
  createCampaign: async (campaignData) => {
    const { wallet, campaigns } = get();
    if (!wallet.isConnected || !wallet.xrplWallet) {
      throw new Error('Wallet not connected');
    }

    // Build the new campaign object
    const campaignId = `campaign-${Date.now()}`;
    const newCampaign: SMECampaign = {
      id: campaignId,
      name: campaignData.name || 'Unnamed Campaign',
      description: campaignData.description || '',
      industry: campaignData.industry || '',
      fundingGoal: campaignData.fundingGoal || 0,
      currentFunding: 0,
      tokenSymbol: campaignData.tokenSymbol || 'PIT',
      tokenPrice: campaignData.tokenPrice || 1,
      totalSupply: campaignData.totalSupply || 1000000,
      circulatingSupply: 0,
      founderAddress: wallet.address!,
      status: 'active',
      createdAt: new Date(),
      launchDate: campaignData.launchDate || new Date(),
      endDate: campaignData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      milestones: campaignData.milestones || [],
      image: campaignData.image || '/api/placeholder/400/300',
      amm: {
        poolId: `pool_${campaignId}`,
        tvl: 0,
        apr: 0,
        depth: 0
      }
    };

    // Update campaigns on server
    try {
      await fetch('http://localhost:3000/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });
    } catch (e) {
      // Log but don't block UI
      console.error('Failed to update campaigns on server:', e);
    }

    // Add to in-memory state
    set({
      campaigns: [...campaigns, newCampaign],
    });

    return campaignId;
  },
  
  // Portfolio
  portfolio: null,
  setPortfolio: (portfolio) => set({ portfolio }),
  
  refreshPortfolio: async () => {
    const { wallet } = get();
    if (!wallet.isConnected || !wallet.address) return;

    set({ isLoading: true });
    try {
      if (config.dev.enableLogging) {
        console.log('Refreshing portfolio for wallet:', wallet.address);
      }

      // Initialize portfolio data structure
      const portfolioData: InvestorPortfolio = {
        holdings: [],
        liquidityPositions: [],
        pendingRefunds: [],
        totalValue: 0,
        totalPnL: 0
      };

      // 1. Get XRP balance
      const xrpBalance = await xrplWalletService.getWalletBalance(wallet.address);
      portfolioData.totalValue = parseFloat(xrpBalance);

      // 2. Get token holdings (NFTokens and issued tokens)
      try {
        const accountLines = await xrplClient.getClient().request({
          command: 'account_lines',
          account: wallet.address
        });

        // Process each token line
        for (const line of accountLines.result.lines) {
          if (parseFloat(line.balance) > 0) {
            const decodedSymbol = decodeHexCurrency(line.currency);
            portfolioData.holdings.push({
              campaignId: `${decodedSymbol}-${line.account}`,
              tokenSymbol: decodedSymbol,
              issuer: line.account,
              quantity: parseFloat(line.balance),
              averageCost: 0, // Would need historical data to calculate
              currentPrice: 0, // Would need price feed
              totalValue: parseFloat(line.balance), // Simplified for now
              pnl: 0,
              pnlPercentage: 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching token holdings:', error);
      }

      // 3. Get AMM positions
      try {
        const accountObjects = await xrplClient.getClient().request({
          command: 'account_objects',
          account: wallet.address,
          type: 'amm'
        });

        // Process each AMM position
        for (const amm of accountObjects.result.account_objects as unknown as XRPLAMMObject[]) {
          if (amm.Amount && amm.Amount2) {
            const amountValue = typeof amm.Amount === 'string' ? amm.Amount : amm.Amount.value || '0';
            const amount2Value = typeof amm.Amount2 === 'string' ? amm.Amount2 : amm.Amount2.value || '0';
            const amountCurrency = typeof amm.Amount === 'string' ? 'XRP' : amm.Amount.currency || 'XRP';
            const amount2Currency = typeof amm.Amount2 === 'string' ? 'XRP' : amm.Amount2.currency || 'XRP';

            portfolioData.liquidityPositions.push({
              poolId: amm.index,
              campaignId: amountCurrency,
              tokenA: amountCurrency,
              tokenB: amount2Currency,
              liquidityProvided: parseFloat(amountValue),
              currentValue: parseFloat(amountValue),
              feesEarned: 0, // Would need historical data
              apr: 0 // Would need pool data
            });
          }
        }
      } catch (error) {
        console.error('Error fetching AMM positions:', error);
      }

      // 4. Get pending escrows (potential refunds)
      try {
        const accountObjects = await xrplClient.getClient().request({
          command: 'account_objects',
          account: wallet.address,
          type: 'escrow'
        });

        // Process each escrow
        for (const escrow of accountObjects.result.account_objects as unknown as XRPLEscrowObject[]) {
          if (escrow.Amount) {
            const amountValue = typeof escrow.Amount === 'string' ? escrow.Amount : escrow.Amount.value || '0';
            portfolioData.pendingRefunds.push({
              campaignId: escrow.index,
              amount: parseFloat(amountValue),
              reason: 'Escrow release',
              availableAt: new Date(escrow.FinishAfter * 1000),
              status: 'pending'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching escrows:', error);
      }

      // Update portfolio in state
      set({ portfolio: portfolioData, isLoading: false });
      
      if (config.dev.enableLogging) {
        console.log('Portfolio refreshed:', portfolioData);
      }
    } catch (error) {
      console.error('Failed to refresh portfolio:', error);
      set({ isLoading: false });
    }
  },
  
  // Trading
  executeSwap: async (fromToken, toToken, amount, slippage) => {
    const { wallet } = get();
    if (!wallet.xrplWallet) {
      throw new Error('Wallet not connected');
    }

    set({ isLoading: true, error: null });
    try {
      const result = await crowdLiftXRPL.trading.executeSwap(wallet.xrplWallet, {
        fromToken,
        toToken,
        amount,
        slippage,
        userAddress: wallet.address!
      });

      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Failed to execute swap:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to execute swap',
        isLoading: false 
      });
      throw error;
    }
  },

  executePartialExit: async (tokenSymbol, percentage) => {
    const { wallet } = get();
    if (!wallet.xrplWallet) {
      throw new Error('Wallet not connected');
    }

    set({ isLoading: true, error: null });
    try {
      const result = await crowdLiftXRPL.trading.executePartialExit(
        wallet.xrplWallet,
        tokenSymbol,
        percentage
      );

      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Failed to execute partial exit:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to execute partial exit',
        isLoading: false 
      });
      throw error;
    }
  },

  addLiquidity: async (tokenA, tokenB, amountA, amountB) => {
    const { wallet } = get();
    if (!wallet.xrplWallet) {
      throw new Error('Wallet not connected');
    }

    set({ isLoading: true, error: null });
    try {
      const result = await crowdLiftXRPL.trading.addLiquidity(wallet.xrplWallet, {
        tokenA,
        tokenB,
        amountA,
        amountB,
        userAddress: wallet.address!
      });

      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add liquidity',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Pool Stats
  poolStats: {},
  setPoolStats: (poolId, stats) => set({
    poolStats: { ...get().poolStats, [poolId]: stats }
  }),

  refreshPoolStats: async (tokenPair) => {
    try {
      const priceData = await crowdLiftXRPL.trading.getRealTimePrices(tokenPair);
      
      const poolStats: PoolStats = {
        price: priceData.price,
        volume24h: priceData.volume24h,
        tvl: 100000, // Mock TVL
        apr: 12.5,   // Mock APR
        priceChange24h: priceData.priceChange24h,
        priceHistory: [] // Would be populated with historical data
      };

      set({
        poolStats: { ...get().poolStats, [tokenPair]: poolStats }
      });
    } catch (error) {
      console.error('Failed to refresh pool stats:', error);
    }
  },
  
  // Milestones
  submitMilestoneProof: async (campaignId, milestoneId, photoProof) => {
    const { wallet } = get();
    if (!wallet.xrplWallet) {
      throw new Error('Wallet not connected');
    }

    set({ isLoading: true, error: null });
    try {
      const result = await crowdLiftXRPL.milestones.processPhotoProof(
        wallet.xrplWallet,
        {
          imageData: photoProof.imageData,
          geoTag: photoProof.geoTag,
          metadata: {
            campaignId,
            milestoneId,
            description: photoProof.description,
            capturedAt: Date.now()
          }
        }
      );

      set({ isLoading: false });
      return result.txHash;
    } catch (error) {
      console.error('Failed to submit milestone proof:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to submit milestone proof',
        isLoading: false 
      });
      throw error;
    }
  },

  verifyMilestone: async (milestoneId, proofHash, approved) => {
    const { wallet } = get();
    if (!wallet.xrplWallet) {
      throw new Error('Wallet not connected');
    }

    set({ isLoading: true, error: null });
    try {
      const result = await crowdLiftXRPL.milestones.verifyMilestoneCompletion(
        wallet.xrplWallet,
        milestoneId,
        proofHash,
        approved
      );

      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error('Failed to verify milestone:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to verify milestone',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // UI State
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));