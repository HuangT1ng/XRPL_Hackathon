import { xrplClient, XRPLClient } from './client';
import { XRPLTokenService } from './tokens';
import { SMECampaign } from '@/types';
import { log } from '@/lib/logger';
import { Wallet, convertHexToString, Client, TrustSet, xrpToDrops } from 'xrpl';
import { config } from '../config';

export class XRPLCampaignService {
  private tokenService: XRPLTokenService;
  private client: Client;

  constructor() {
    this.tokenService = new XRPLTokenService();
    this.client = new Client(config.xrpl.server);
  }

  async getIssuerCampaigns(issuerAddress: string): Promise<SMECampaign[]> {
    log.info('CAMPAIGN_SERVICE', `Fetching campaigns for issuer: ${issuerAddress}`);
    try {
      const issuedTokens = await this.tokenService.getIssuedTokens(issuerAddress);
      
      const campaigns: SMECampaign[] = [];

      for (const token of issuedTokens) {
        // The token 'currency' is what we use as the campaign identifier
        const currency = token.currency;

        // Fetch AMM info to get price data
        let tokenPrice = 1; // Default price
        try {
            // This is a simplification. A real implementation needs to find the AMM for the token pair.
            // For now, we are assuming a simple naming convention or a single AMM per token.
            const ammInfo = await this.tokenService.getAMMInfo(`pool_${currency.toLowerCase()}_rlusd`);
            if (ammInfo && ammInfo.amount2 && ammInfo.amount) {
                // A very basic price calculation. This is not accurate.
                tokenPrice = parseFloat(ammInfo.amount.value) / parseFloat(ammInfo.amount2.value);
            }
        } catch {
            log.warn('CAMPAIGN_SERVICE', `Could not find or calculate price for AMM of ${currency}`);
        }

        const campaign: SMECampaign = {
          id: currency,
          name: `Campaign ${convertHexToString(currency)}`,
          description: `Live on-chain campaign for token ${convertHexToString(currency)}.`,
          industry: 'On-Chain',
          fundingGoal: 100000, // Placeholder
          currentFunding: parseFloat(token.balance) * -1, // Balance is negative from issuer's perspective
          tokenSymbol: convertHexToString(currency),
          tokenPrice: tokenPrice,
          totalSupply: 1000000, // Placeholder
          circulatingSupply: parseFloat(token.balance) * -1,
          founderAddress: issuerAddress,
          status: 'active',
          createdAt: new Date(), // Placeholder
          launchDate: new Date(), // Placeholder
          endDate: new Date(), // Placeholder
          milestones: [],
          image: '/api/placeholder/400/300',
          amm: {
            poolId: 'unknown', // Placeholder
            tvl: 0, // Placeholder
            apr: 0, // Placeholder
            depth: 0, // Placeholder
          },
        };
        campaigns.push(campaign);
      }

      log.info('CAMPAIGN_SERVICE', `Found and processed ${campaigns.length} campaigns.`);
      return campaigns;

    } catch (error) {
      log.error('CAMPAIGN_SERVICE', 'Error fetching issuer campaigns', { error });
      return []; // Return empty array on error
    }
  }

  async createTrustLine(
    userAddress: string,
    issuerAddress: string,
    currency: string,
    limit: string = '1000000000' // Default limit of 1 billion tokens
  ): Promise<void> {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    const trustSetTx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: userAddress,
      LimitAmount: {
        currency: currency,
        issuer: issuerAddress,
        value: limit
      }
    };

    try {
      const prepared = await this.client.autofill(trustSetTx);
      const signed = await this.client.submit(prepared);

      if (signed.result.engine_result !== 'tesSUCCESS') {
        throw new Error(`Transaction failed: ${signed.result.engine_result_message}`);
      }
    } catch (error) {
      console.error('Error creating trust line:', error);
      throw error;
    }
  }
}

export const xrplCampaignService = new XRPLCampaignService(); 