import { Wallet } from 'xrpl';
import { xrplClient } from './client';
import { XRPLTokenService } from './tokens';

export interface CampaignMonitoring {
  campaignId: string;
  smeWalletAddress: string;
  lastActivity: number;
  escrowHashes: string[];
  milestoneDeadlines: Date[];
  status: 'active' | 'dormant' | 'defaulted' | 'completed';
}

export interface SafetyFundTransaction {
  campaignId: string;
  amount: number;
  type: 'collection' | 'payout' | 'refund';
  timestamp: number;
  txHash: string;
}

export class WatchTowerService {
  private tokenService: XRPLTokenService;
  private monitoringInterval: number = 10 * 60 * 1000; // 10 minutes
  private dormancyThreshold: number = 7 * 24 * 60 * 60 * 1000; // 7 days
  private isRunning: boolean = false;

  constructor() {
    this.tokenService = new XRPLTokenService();
  }

  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      console.log('Watch-tower already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting watch-tower monitoring...');

    // Start monitoring loop
    this.monitoringLoop();
  }

  async stopMonitoring(): Promise<void> {
    this.isRunning = false;
    console.log('Stopping watch-tower monitoring...');
  }

  private async monitoringLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.scanCampaigns();
        await this.checkMilestoneDeadlines();
        await this.monitorSafetyFund();
        
        // Wait for next monitoring cycle
        await new Promise(resolve => setTimeout(resolve, this.monitoringInterval));
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        // Continue monitoring even if there's an error
        await new Promise(resolve => setTimeout(resolve, this.monitoringInterval));
      }
    }
  }

  async scanCampaigns(): Promise<void> {
    try {
      await xrplClient.connect();

      // Get list of active campaigns (this would come from your database)
      const activeCampaigns = await this.getActiveCampaigns();

      for (const campaign of activeCampaigns) {
        await this.checkCampaignActivity(campaign);
      }
    } catch (error) {
      console.error('Error scanning campaigns:', error);
    }
  }

  async checkCampaignActivity(campaign: CampaignMonitoring): Promise<void> {
    try {
      // Get recent account activity
      const lastActivity = await this.getLastAccountActivity(campaign.smeWalletAddress);
      const now = Date.now();
      
      // Check if SME wallet has been dormant
      if (now - lastActivity > this.dormancyThreshold) {
        console.log(`Campaign ${campaign.campaignId} appears dormant. Last activity: ${new Date(lastActivity)}`);
        
        // Trigger auto-refund process
        await this.triggerAutoRefund(campaign);
      }
    } catch (error) {
      console.error(`Error checking campaign activity for ${campaign.campaignId}:`, error);
    }
  }

  async triggerAutoRefund(campaign: CampaignMonitoring): Promise<void> {
    try {
      console.log(`Triggering auto-refund for campaign ${campaign.campaignId}`);

      // Cancel all pending escrows for this campaign
      for (const escrowHash of campaign.escrowHashes) {
        await this.cancelEscrow(escrowHash);
      }

      // Update campaign status
      campaign.status = 'defaulted';
      
      // Notify stakeholders
      await this.notifyStakeholders(campaign, 'auto_refund_triggered');
      
    } catch (error) {
      console.error(`Error triggering auto-refund for ${campaign.campaignId}:`, error);
    }
  }

  async checkMilestoneDeadlines(): Promise<void> {
    try {
      const activeCampaigns = await this.getActiveCampaigns();
      const now = new Date();

      for (const campaign of activeCampaigns) {
        for (let i = 0; i < campaign.milestoneDeadlines.length; i++) {
          const deadline = campaign.milestoneDeadlines[i];
          
          // Check if milestone deadline has passed
          if (now > deadline) {
            console.log(`Milestone deadline passed for campaign ${campaign.campaignId}, milestone ${i + 1}`);
            
            // Check if milestone was completed
            const milestoneCompleted = await this.checkMilestoneCompletion(campaign.campaignId, i);
            
            if (!milestoneCompleted) {
              // Trigger penalty or refund process
              await this.handleMissedMilestone(campaign, i);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking milestone deadlines:', error);
    }
  }

  async handleMissedMilestone(campaign: CampaignMonitoring, milestoneIndex: number): Promise<void> {
    try {
      console.log(`Handling missed milestone for campaign ${campaign.campaignId}, milestone ${milestoneIndex + 1}`);
      
      // Cancel the specific escrow for this milestone
      if (campaign.escrowHashes[milestoneIndex]) {
        await this.cancelEscrow(campaign.escrowHashes[milestoneIndex]);
      }
      
      // Notify investors about missed milestone
      await this.notifyStakeholders(campaign, 'milestone_missed', { milestoneIndex });
      
    } catch (error) {
      console.error(`Error handling missed milestone:`, error);
    }
  }

  async monitorSafetyFund(): Promise<void> {
    try {
      // Monitor safety fund balance and transactions
      const safetyFundBalance = await this.getSafetyFundBalance();
      const recentTransactions = await this.getSafetyFundTransactions();
      
      console.log(`Safety fund balance: ${safetyFundBalance} RLUSD`);
      
      // Check if safety fund needs to be used for any defaulted campaigns
      const defaultedCampaigns = await this.getDefaultedCampaigns();
      
      for (const campaign of defaultedCampaigns) {
        await this.processSafetyFundClaim(campaign);
      }
      
    } catch (error) {
      console.error('Error monitoring safety fund:', error);
    }
  }

  async processSafetyFundClaim(campaign: CampaignMonitoring): Promise<void> {
    try {
      // Calculate refund amount needed
      const refundAmount = await this.calculateRefundAmount(campaign.campaignId);
      const safetyFundBalance = await this.getSafetyFundBalance();
      
      if (safetyFundBalance >= refundAmount) {
        console.log(`Processing safety fund claim for campaign ${campaign.campaignId}: ${refundAmount} RLUSD`);
        
        // Distribute refunds to investors
        await this.distributeRefunds(campaign.campaignId, refundAmount);
        
        // Record safety fund transaction
        await this.recordSafetyFundTransaction({
          campaignId: campaign.campaignId,
          amount: refundAmount,
          type: 'refund',
          timestamp: Date.now(),
          txHash: 'pending'
        });
      } else {
        console.log(`Insufficient safety fund balance for campaign ${campaign.campaignId}`);
        // Partial refund or wait for more funds
      }
      
    } catch (error) {
      console.error(`Error processing safety fund claim:`, error);
    }
  }

  async collectTradingFees(swapFees: number): Promise<void> {
    try {
      // Collect 10% of swap fees for safety fund
      const safetyFundContribution = swapFees * 0.1;
      
      console.log(`Collecting ${safetyFundContribution} RLUSD for safety fund`);
      
      // Record the transaction
      await this.recordSafetyFundTransaction({
        campaignId: 'system',
        amount: safetyFundContribution,
        type: 'collection',
        timestamp: Date.now(),
        txHash: 'pending'
      });
      
    } catch (error) {
      console.error('Error collecting trading fees:', error);
    }
  }

  private async getLastAccountActivity(address: string): Promise<number> {
    try {
      await xrplClient.connect();
      
      const response = await xrplClient.getClient().request({
        command: 'account_tx',
        account: address,
        limit: 1,
        ledger_index_min: -1,
        ledger_index_max: -1
      });

      if (response.result.transactions.length > 0) {
        const lastTx = response.result.transactions[0];
        return lastTx.tx.date ? lastTx.tx.date * 1000 : Date.now();
      }
      
      return Date.now() - this.dormancyThreshold - 1; // Force dormant status if no transactions
    } catch (error) {
      console.error('Error getting last account activity:', error);
      return Date.now();
    }
  }

  private async cancelEscrow(escrowHash: string): Promise<void> {
    try {
      // This would use the token service to cancel the escrow
      console.log(`Canceling escrow: ${escrowHash}`);
      // await this.tokenService.cancelEscrow(watchTowerWallet, escrowHash);
    } catch (error) {
      console.error(`Error canceling escrow ${escrowHash}:`, error);
    }
  }

  private async checkMilestoneCompletion(campaignId: string, milestoneIndex: number): Promise<boolean> {
    try {
      // Check if milestone has been verified on-chain
      // This would query for milestone verification transactions
      return false; // Simplified for now
    } catch (error) {
      console.error('Error checking milestone completion:', error);
      return false;
    }
  }

  private async notifyStakeholders(
    campaign: CampaignMonitoring, 
    eventType: string, 
    data?: any
  ): Promise<void> {
    try {
      console.log(`Notifying stakeholders for campaign ${campaign.campaignId}: ${eventType}`);
      
      // This would send notifications via email, push notifications, etc.
      // For now, just log the event
      const notification = {
        campaignId: campaign.campaignId,
        eventType,
        timestamp: Date.now(),
        data
      };
      
      console.log('Notification:', JSON.stringify(notification, null, 2));
    } catch (error) {
      console.error('Error notifying stakeholders:', error);
    }
  }

  private async getActiveCampaigns(): Promise<CampaignMonitoring[]> {
    // Mock implementation - would fetch from database
    return [
      {
        campaignId: 'campaign_1',
        smeWalletAddress: 'rSMEAddress123...',
        lastActivity: Date.now() - (6 * 24 * 60 * 60 * 1000), // 6 days ago
        escrowHashes: ['escrow_1', 'escrow_2'],
        milestoneDeadlines: [
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)  // 60 days from now
        ],
        status: 'active'
      }
    ];
  }

  private async getDefaultedCampaigns(): Promise<CampaignMonitoring[]> {
    // Mock implementation - would fetch defaulted campaigns from database
    return [];
  }

  private async getSafetyFundBalance(): Promise<number> {
    // Mock implementation - would check actual safety fund wallet balance
    return 50000; // 50,000 RLUSD
  }

  private async getSafetyFundTransactions(): Promise<SafetyFundTransaction[]> {
    // Mock implementation - would fetch from database
    return [];
  }

  private async calculateRefundAmount(campaignId: string): Promise<number> {
    // Calculate how much needs to be refunded to investors
    // This would query the campaign's funding amount and current token holders
    return 10000; // Mock amount
  }

  private async distributeRefunds(campaignId: string, totalAmount: number): Promise<void> {
    // Distribute refunds proportionally to token holders
    console.log(`Distributing ${totalAmount} RLUSD in refunds for campaign ${campaignId}`);
  }

  private async recordSafetyFundTransaction(transaction: SafetyFundTransaction): Promise<void> {
    // Record transaction in database
    console.log('Recording safety fund transaction:', transaction);
  }
} 