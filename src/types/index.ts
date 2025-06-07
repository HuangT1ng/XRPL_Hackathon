export interface SMECampaign {
  id: string;
  name: string;
  description: string;
  image: string;
  industry: string;
  fundingGoal: number;
  currentFunding: number;
  tokenSymbol: string;
  tokenPrice: number;
  totalSupply: number;
  circulatingSupply: number;
  milestones: Milestone[];
  status: 'draft' | 'active' | 'completed' | 'failed';
  createdAt: Date;
  launchDate: Date;
  endDate: Date;
  founderAddress: string;
  amm: {
    poolId: string;
    tvl: number;
    apr: number;
    depth: number;
  };
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  fundingPercentage: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  proofDocuments: ProofDocument[];
  escrowAmount: number;
  escrowHash?: string;
}

export interface ProofDocument {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url: string;
  uploadedAt: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface InvestorPortfolio {
  holdings: TokenHolding[];
  liquidityPositions: LiquidityPosition[];
  pendingRefunds: PendingRefund[];
  totalValue: number;
  totalPnL: number;
}

export interface TokenHolding {
  campaignId: string;
  tokenSymbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  totalValue: number;
  pnl: number;
  pnlPercentage: number;
}

export interface LiquidityPosition {
  poolId: string;
  campaignId: string;
  tokenA: string;
  tokenB: string;
  liquidityProvided: number;
  currentValue: number;
  feesEarned: number;
  apr: number;
}

export interface PendingRefund {
  campaignId: string;
  amount: number;
  reason: string;
  availableAt: Date;
  status: 'pending' | 'claimable' | 'claimed';
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: number;
  network: 'mainnet' | 'testnet' | 'devnet';
}

export interface PoolStats {
  price: number;
  volume24h: number;
  tvl: number;
  apr: number;
  priceChange24h: number;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}