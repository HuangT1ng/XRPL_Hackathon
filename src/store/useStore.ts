import { create } from 'zustand';
import { Wallet } from 'xrpl';
import { WalletState, SMECampaign, InvestorPortfolio, PoolStats } from '@/types';
import { crowdLiftXRPL } from '@/lib/xrpl';
import { xrplWalletService } from '@/lib/xrpl/wallet';
import { config } from '@/lib/config';
import { log } from '@/lib/logger';
import { xrplClient } from '@/lib/xrpl/client';

// Add type definitions for XRPL objects
interface XRPLAMMObject {
  index: string;
  Amount: {
    currency?: string;
    value?: string;
  };
  Amount2: {
    currency?: string;
    value?: string;
  };
}

interface XRPLEscrowObject {
  index: string;
  Amount: {
    value?: string;
  };
  FinishAfter: number;
}

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
    log.info('WALLET', 'Starting wallet connection process...');
    set({ isLoading: true, error: null });
    try {
      log.debug('WALLET', 'Configuration check', { config: config.xrpl, dev: config.dev });

      // Get existing wallet or create new one
      log.info('WALLET', 'Getting or creating XRPL wallet...');
      const walletInfo = await xrplWalletService.getOrCreateWallet();
      log.info('WALLET', 'Wallet ready', { address: walletInfo.address, balance: walletInfo.balance });
      
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
      log.info('CAMPAIGN', 'Campaign creation started with config', { 
        skipRealTransactions: config.dev.skipRealTransactions,
        useMockData: config.dev.useMockData 
      });

      // Create campaign object first
      const campaignId = `campaign-${Date.now()}`;
      log.info('CAMPAIGN', `Generated campaign ID: ${campaignId}`);
      
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
          const did = await crowdLiftXRPL.identity.createSMEDID(wallet.xrplWallet, kycData);
          log.info('CAMPAIGN', 'DID created successfully', { did });
        } catch (error) {
          log.error('CAMPAIGN', 'Failed to create DID', error);
          throw new Error(`DID creation failed: ${error}`);
        }

        // 2. Mint PIT tokens
        log.info('CAMPAIGN', 'Step 2: Minting PIT tokens');
        const tokenMetadata = {
          name: `${campaignData.name} Token`,
          symbol: campaignData.tokenSymbol || 'PIT',
          description: campaignData.description || '',
          image: '/api/placeholder/400/300',
          totalSupply: campaignData.totalSupply || 1000000,
          decimals: config.app.defaultTokenDecimals
        };
        log.debug('CAMPAIGN', 'Token metadata prepared', tokenMetadata);

        try {
          const tokenId = await crowdLiftXRPL.tokens.mintPITTokens(
            wallet.xrplWallet,
            campaignData as SMECampaign,
            tokenMetadata
          );
          log.info('CAMPAIGN', 'PIT tokens minted successfully', { tokenId });
        } catch (error) {
          log.error('CAMPAIGN', 'Failed to mint PIT tokens', error);
          throw new Error(`Token minting failed: ${error}`);
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
          const ammId = await crowdLiftXRPL.tokens.createAMMPool(
            wallet.xrplWallet,
            'token-id-placeholder', // tokenId from step 2
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
        founderAddress: wallet.address || '',
        status: 'active',
        createdAt: new Date(),
        launchDate: campaignData.launchDate || new Date(),
        endDate: campaignData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        milestones: campaignData.milestones || [],
        image: '/api/placeholder/400/300',
        amm: {
          poolId: config.dev.skipRealTransactions ? `pool-${Date.now()}` : 'real-amm-id',
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
            portfolioData.holdings.push({
              campaignId: line.currency, // Using currency as campaignId for now
              tokenSymbol: line.currency,
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