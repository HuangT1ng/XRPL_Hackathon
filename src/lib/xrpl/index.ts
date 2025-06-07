// XRPL Core Services
export { XRPLClient, xrplClient } from './client';
export { XRPLIdentityService } from './identity';
export { XRPLTokenService } from './tokens';
export { XRPLTradingService } from './trading';
export { MilestoneVerificationService } from './milestones';
export { WatchTowerService } from './watchtower';

// Types and Interfaces
export type { KYCData, CreditScoreData } from './identity';
export type { TokenMetadata } from './tokens';
export type { SwapParams, LiquidityParams, PriceData } from './trading';
export type { PhotoProof, MilestoneVerification } from './milestones';
export type { CampaignMonitoring, SafetyFundTransaction } from './watchtower';

// Unified XRPL Service Manager
import { XRPLIdentityService } from './identity';
import { XRPLTokenService } from './tokens';
import { XRPLTradingService } from './trading';
import { MilestoneVerificationService } from './milestones';
import { WatchTowerService } from './watchtower';

export class CrowdLiftXRPLService {
  public identity: XRPLIdentityService;
  public tokens: XRPLTokenService;
  public trading: XRPLTradingService;
  public milestones: MilestoneVerificationService;
  public watchtower: WatchTowerService;

  constructor() {
    this.identity = new XRPLIdentityService();
    this.tokens = new XRPLTokenService();
    this.trading = new XRPLTradingService();
    this.milestones = new MilestoneVerificationService();
    this.watchtower = new WatchTowerService();
  }

  async initialize(): Promise<void> {
    console.log('Initializing CrowdLift XRPL Services...');
    
    // Start watch-tower monitoring
    await this.watchtower.startMonitoring();
    
    console.log('CrowdLift XRPL Services initialized successfully');
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down CrowdLift XRPL Services...');
    
    // Stop watch-tower monitoring
    await this.watchtower.stopMonitoring();
    
    console.log('CrowdLift XRPL Services shut down successfully');
  }
}

// Singleton instance
export const crowdLiftXRPL = new CrowdLiftXRPLService(); 