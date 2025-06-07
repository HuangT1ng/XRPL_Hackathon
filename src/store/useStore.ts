import { create } from 'zustand';
import { Wallet } from 'xrpl';
import { WalletState, SMECampaign, InvestorPortfolio, PoolStats } from '@/types';
import { crowdLiftXRPL } from '@/lib/xrpl';

interface AppState {
  // Wallet
  wallet: WalletState & { xrplWallet?: Wallet };
  connectWallet: () => Promise<void>;
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
  
  connectWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      // Generate a new XRPL wallet for demo purposes
      // In production, this would integrate with actual wallet providers
      const xrplWallet = Wallet.generate();
      
      // Fund the wallet on testnet (this would be done via faucet in real scenario)
      console.log('Generated wallet:', xrplWallet.classicAddress);
      
      set({
        wallet: {
          address: xrplWallet.classicAddress,
          isConnected: true,
          balance: 10000, // Mock balance
          network: 'testnet',
          xrplWallet
        },
        isLoading: false,
      });

      // Initialize XRPL services
      await crowdLiftXRPL.initialize();
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
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
    if (!wallet.isConnected) {
      throw new Error('Wallet not connected');
    }

    set({ isLoading: true, error: null });
    try {
      console.log('Creating campaign with data:', campaignData);
      
      // For now, let's create a simplified campaign without full XRPL integration
      // This allows testing the UI flow while we debug XRPL issues
      
      const newCampaign: SMECampaign = {
        id: `campaign-${Date.now()}`,
        name: campaignData.name || 'Unnamed Campaign',
        description: campaignData.description || '',
        industry: campaignData.industry || '',
        fundingGoal: campaignData.fundingGoal || 0,
        currentFunding: 0,
        tokenSymbol: campaignData.tokenSymbol || 'PIT',
        tokenPrice: campaignData.tokenPrice || 1,
        totalSupply: campaignData.totalSupply || 1000000,
        circulatingSupply: 0,
        founderAddress: wallet.address || '',
        status: 'active',
        createdAt: new Date(),
        launchDate: campaignData.launchDate || new Date(),
        endDate: campaignData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        milestones: campaignData.milestones || [],
        image: '/api/placeholder/400/300',
        amm: {
          poolId: `pool-${Date.now()}`,
          tvl: 0,
          apr: 0,
          depth: 0
        }
      };

      // TODO: Integrate XRPL services once polyfills are working
      // const did = await crowdLiftXRPL.identity.createSMEDID(wallet.xrplWallet, kycData);
      // const tokenId = await crowdLiftXRPL.tokens.mintPITTokens(...);
      // const ammId = await crowdLiftXRPL.tokens.createAMMPool(...);

      // Add to campaigns list
      set({ 
        campaigns: [...campaigns, newCampaign],
        isLoading: false 
      });
      
      console.log('Campaign created successfully:', newCampaign.id);
      return newCampaign.id;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create campaign',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Portfolio
  portfolio: null,
  setPortfolio: (portfolio) => set({ portfolio }),
  
  refreshPortfolio: async () => {
    const { wallet } = get();
    if (!wallet.isConnected || !wallet.address) return;

    set({ isLoading: true });
    try {
      // Fetch real portfolio data from XRPL
      // This would query user's token holdings and LP positions
      
      // Mock implementation for now
      const mockPortfolio: InvestorPortfolio = {
        holdings: [],
        liquidityPositions: [],
        pendingRefunds: [],
        totalValue: 0,
        totalPnL: 0
      };

      set({ portfolio: mockPortfolio, isLoading: false });
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