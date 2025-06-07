import { create } from 'zustand';
import { WalletState, SMECampaign, InvestorPortfolio, PoolStats } from '@/types';

interface AppState {
  // Wallet
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  
  // Campaigns
  campaigns: SMECampaign[];
  selectedCampaign: SMECampaign | null;
  setCampaigns: (campaigns: SMECampaign[]) => void;
  setSelectedCampaign: (campaign: SMECampaign | null) => void;
  
  // Portfolio
  portfolio: InvestorPortfolio | null;
  setPortfolio: (portfolio: InvestorPortfolio) => void;
  
  // Pool Stats
  poolStats: Record<string, PoolStats>;
  setPoolStats: (poolId: string, stats: PoolStats) => void;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
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
    set({ isLoading: true });
    try {
      // Mock wallet connection - replace with actual XRPL wallet integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({
        wallet: {
          address: 'rDemoAddress123...',
          isConnected: true,
          balance: 10000,
          network: 'testnet',
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ isLoading: false });
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
    });
  },
  
  // Campaigns
  campaigns: [],
  selectedCampaign: null,
  setCampaigns: (campaigns) => set({ campaigns }),
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
  
  // Portfolio
  portfolio: null,
  setPortfolio: (portfolio) => set({ portfolio }),
  
  // Pool Stats
  poolStats: {},
  setPoolStats: (poolId, stats) => set({
    poolStats: { ...get().poolStats, [poolId]: stats }
  }),
  
  // UI State
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));