import { create } from 'zustand';
import { Wallet } from 'xrpl';
import { WalletState, SMECampaign, InvestorPortfolio, PoolStats } from '@/types';
import { crowdLiftXRPL } from '@/lib/xrpl';
import { xrplWalletService } from '@/lib/xrpl/wallet';
import { config } from '@/lib/config';
import { log } from '@/lib/logger';
import { issuerCampaigns } from '@/data/mockData';

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
    log.info('CAMPAIGN', '=== STARTING CAMPAIGN CREATION ===');
    log.debug('CAMPAIGN', 'Input campaign data', campaignData);
    
    const { wallet, campaigns } = get();
    log.debug('CAMPAIGN', 'Current state check', { 
      walletConnected: wallet.isConnected, 
      hasXRPLWallet: !!wallet.xrplWallet,
      walletAddress: wallet.address,
      campaignsCount: campaigns.length 
    });
    
    if (!wallet.isConnected || !wallet.xrplWallet) {
      log.error('CAMPAIGN', 'Wallet not connected properly', { 
        isConnected: wallet.isConnected, 
        hasXRPLWallet: !!wallet.xrplWallet 
      });
      throw new Error('Wallet not connected');
    }

    set({ isLoading: true, error: null });
    try {
      const issuerSecret = config.secrets.issuerSecret;
      if (!issuerSecret) {
        throw new Error("VITE_ISSUER_SECRET is not set in the environment.");
      }
      const issuerWallet = Wallet.fromSecret(issuerSecret);
      log.info('CAMPAIGN', `Using issuer wallet: ${issuerWallet.address}`);

      log.info('CAMPAIGN', 'Campaign creation started with config', { 
        skipRealTransactions: config.dev.skipRealTransactions,
        useMockData: config.dev.useMockData 
      });

      // Create campaign object first
      const campaignId = `campaign-${Date.now()}`;
      log.info('CAMPAIGN', `Generated campaign ID: ${campaignId}`);
      
      let ammId: string | undefined;

      if (!config.dev.skipRealTransactions) {
        log.info('CAMPAIGN', 'Starting real XRPL transactions...');
        
        // 1. Create DID for SME identity
        log.info('CAMPAIGN', 'Step 1: Creating DID for SME identity');
        const kycData = {
          companyName: campaignData.name || '',
          registrationNumber: `REG${Date.now()}`,
          address: 'Singapore',
          contactEmail: 'contact@company.com',
          contactPhone: '+65 1234 5678',
          businessType: campaignData.industry || '',
          documents: {
            registrationCertificate: 'cert_hash',
            taxCertificate: 'tax_hash',
            bankStatement: 'bank_hash'
          }
        };
        log.debug('CAMPAIGN', 'KYC data prepared', kycData);

        try {
          const did = await crowdLiftXRPL.identity.createSMEDID(issuerWallet, kycData);
          log.info('CAMPAIGN', 'DID created successfully', { did });
        } catch (error) {
          log.error('CAMPAIGN', 'Failed to create DID', error);
          throw new Error(`DID creation failed: ${error}`);
        }

        // 2. Issue fungible token
        log.info('CAMPAIGN', 'Step 2: Issuing fungible token from issuer wallet');
        let issuedTokenCurrency;
        try {
          issuedTokenCurrency = await crowdLiftXRPL.tokens.issueFungibleToken(
            issuerWallet,
            campaignData.tokenSymbol || 'PIT',
            campaignData.totalSupply || 1000000
          );
          log.info('CAMPAIGN', 'Fungible token issued successfully', { currency: issuedTokenCurrency });
        } catch (error) {
          log.error('CAMPAIGN', 'Failed to issue fungible token', error);
          throw new Error(`Token issuance failed: ${error}`);
        }

        // 3. Create AMM pool
        log.info('CAMPAIGN', 'Step 3: Creating AMM pool');
        const initialRLUSDLiquidity = Math.floor((campaignData.fundingGoal || 100000) * 0.1);
        const initialTokenLiquidity = Math.floor((campaignData.totalSupply || 1000000) * 0.1);
        
        log.debug('CAMPAIGN', 'AMM liquidity calculations', { 
          initialRLUSDLiquidity, 
          initialTokenLiquidity,
          fundingGoal: campaignData.fundingGoal,
          totalSupply: campaignData.totalSupply 
        });

        try {
          ammId = await crowdLiftXRPL.tokens.createAMMPool(
            issuerWallet,
            issuedTokenCurrency,
            initialRLUSDLiquidity,
            initialTokenLiquidity
          );
          log.info('CAMPAIGN', 'AMM pool created successfully', { ammId });
        } catch (error) {
          log.error('CAMPAIGN', 'Failed to create AMM pool', error);
          throw new Error(`AMM pool creation failed: ${error}`);
        }
      } else {
        log.info('CAMPAIGN', 'Skipping real XRPL transactions (skipRealTransactions=true)');
      }

      // Create campaign object
      log.info('CAMPAIGN', 'Step 4: Creating campaign object');
      const finalAmmId = config.dev.skipRealTransactions ? `pool-${Date.now()}` : ammId;
      if (!finalAmmId) {
        log.error('CAMPAIGN', 'AMM ID is missing after creation attempt.');
        throw new Error('Could not retrieve AMM ID after creation.');
      }
      
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
        founderAddress: issuerWallet.address,
        status: 'active',
        createdAt: new Date(),
        launchDate: campaignData.launchDate || new Date(),
        endDate: campaignData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        milestones: campaignData.milestones || [],
        image: '/api/placeholder/400/300',
        amm: {
          poolId: finalAmmId,
          tvl: 0,
          apr: 0,
          depth: 0
        }
      };
      log.debug('CAMPAIGN', 'Campaign object created', newCampaign);

      // Add to campaigns list
      log.info('CAMPAIGN', 'Step 5: Adding campaign to state');
      set({ 
        campaigns: [...campaigns, newCampaign],
        isLoading: false 
      });
      
      log.info('CAMPAIGN', '=== CAMPAIGN CREATION COMPLETED SUCCESSFULLY ===', { campaignId });
      return campaignId;
    } catch (error) {
      log.error('CAMPAIGN', '=== CAMPAIGN CREATION FAILED ===', error);
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
      if (config.dev.enableLogging) {
        console.log('Refreshing portfolio for wallet:', wallet.address);
      }

      if (config.dev.useMockData) {
        // Use mock data if configured
        const mockPortfolio: InvestorPortfolio = {
          holdings: [],
          liquidityPositions: [],
          pendingRefunds: [],
          totalValue: 0,
          totalPnL: 0
        };
        set({ portfolio: mockPortfolio, isLoading: false });
        return;
      }

      // Fetch real portfolio data from XRPL
      const portfolioData: InvestorPortfolio = {
        holdings: [],
        liquidityPositions: [],
        pendingRefunds: [],
        totalValue: 0,
        totalPnL: 0
      };

      // Get account balance and convert to portfolio value
      const balance = await xrplWalletService.getWalletBalance(wallet.address);
      portfolioData.totalValue = parseFloat(balance);

      // TODO: Query XRPL for:
      // - Token holdings (NFTokens owned by this address)
      // - AMM positions (liquidity provider positions)
      // - Pending escrow releases
      // - Calculate total portfolio value and P&L

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