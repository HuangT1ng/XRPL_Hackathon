import { Wallet } from 'xrpl';
import { xrplClient } from './client';
import { SMECampaign } from '@/types';

export class XRPLCampaignService {
  async getActiveCampaigns(wallet: Wallet): Promise<SMECampaign[]> {
    try {
      await xrplClient.connect();

      // Query for campaign NFTs
      const response = await xrplClient.getClient().request({
        command: 'account_nfts',
        account: wallet.classicAddress
      });

      const campaigns: SMECampaign[] = [];

      for (const nft of response.result.account_nfts) {
        if (nft.URI) {
          const metadata = JSON.parse(Buffer.from(nft.URI, 'hex').toString());
          if (metadata.type === 'PIT_TOKEN') {
            // Get campaign details from the NFT metadata
            const campaign: SMECampaign = {
              id: metadata.campaignId,
              name: metadata.name,
              description: metadata.description,
              industry: metadata.industry || '',
              fundingGoal: metadata.fundingGoal || 0,
              currentFunding: metadata.currentFunding || 0,
              tokenSymbol: metadata.symbol,
              tokenPrice: metadata.tokenPrice || 0,
              totalSupply: metadata.totalSupply,
              circulatingSupply: metadata.circulatingSupply || 0,
              status: 'active',
              createdAt: new Date(metadata.createdAt),
              launchDate: new Date(metadata.launchDate),
              endDate: new Date(metadata.endDate),
              founderAddress: metadata.founderAddress,
              milestones: metadata.milestones || [],
              image: metadata.image,
              amm: {
                poolId: metadata.ammPoolId || '',
                tvl: metadata.tvl || 0,
                apr: metadata.apr || 0,
                depth: metadata.depth || 0
              }
            };
            campaigns.push(campaign);
          }
        }
      }

      return campaigns;
    } catch (error) {
      console.error('Error getting active campaigns:', error);
      return [];
    }
  }

  async getCampaignDetails(wallet: Wallet, campaignId: string): Promise<SMECampaign | null> {
    try {
      await xrplClient.connect();

      // Query for the specific campaign NFT
      const response = await xrplClient.getClient().request({
        command: 'account_nfts',
        account: wallet.classicAddress
      });

      for (const nft of response.result.account_nfts) {
        if (nft.URI) {
          const metadata = JSON.parse(Buffer.from(nft.URI, 'hex').toString());
          if (metadata.type === 'PIT_TOKEN' && metadata.campaignId === campaignId) {
            // Get campaign details from the NFT metadata
            return {
              id: metadata.campaignId,
              name: metadata.name,
              description: metadata.description,
              industry: metadata.industry || '',
              fundingGoal: metadata.fundingGoal || 0,
              currentFunding: metadata.currentFunding || 0,
              tokenSymbol: metadata.symbol,
              tokenPrice: metadata.tokenPrice || 0,
              totalSupply: metadata.totalSupply,
              circulatingSupply: metadata.circulatingSupply || 0,
              status: 'active',
              createdAt: new Date(metadata.createdAt),
              launchDate: new Date(metadata.launchDate),
              endDate: new Date(metadata.endDate),
              founderAddress: metadata.founderAddress,
              milestones: metadata.milestones || [],
              image: metadata.image,
              amm: {
                poolId: metadata.ammPoolId || '',
                tvl: metadata.tvl || 0,
                apr: metadata.apr || 0,
                depth: metadata.depth || 0
              }
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting campaign details:', error);
      return null;
    }
  }
} 