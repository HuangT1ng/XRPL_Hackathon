import { Wallet, convertStringToHex } from 'xrpl';
import { xrplClient } from './client';
import { SMECampaign, Milestone } from '@/types';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  totalSupply: number;
  decimals: number;
}

export class XRPLTokenService {
  async mintPITTokens(
    wallet: Wallet, 
    campaignData: SMECampaign, 
    metadata: TokenMetadata
  ): Promise<string> {
    try {
      await xrplClient.connect();

      // Create NFToken for PIT tokens (semi-fungible)
      const mintTransaction = {
        TransactionType: 'NFTokenMint',
        Account: wallet.classicAddress,
        NFTokenTaxon: 0,
        Flags: 8, // tfTransferable flag
        URI: convertStringToHex(JSON.stringify({
          name: metadata.name,
          symbol: metadata.symbol,
          description: metadata.description,
          image: metadata.image,
          totalSupply: metadata.totalSupply,
          decimals: metadata.decimals,
          campaignId: campaignData.id,
          type: 'PIT_TOKEN'
        }))
      };

      const result = await xrplClient.submitTransaction(mintTransaction, wallet);
      
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        // Extract NFTokenID from transaction metadata
        const nftokenId = this.extractNFTokenID(result.result.meta);
        return nftokenId;
      } else {
        throw new Error(`Token minting failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error minting PIT tokens:', error);
      throw error;
    }
  }

  async createAMMPool(
    wallet: Wallet,
    pitTokenId: string,
    rlusdAmount: number,
    pitTokenAmount: number
  ): Promise<string> {
    try {
      await xrplClient.connect();

      // Create AMM pool for PIT/RLUSD pair
      const ammCreateTransaction = {
        TransactionType: 'AMMCreate',
        Account: wallet.classicAddress,
        Amount: {
          currency: 'RLUSD',
          issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De', // RLUSD issuer on testnet
          value: rlusdAmount.toString()
        },
        Amount2: {
          currency: pitTokenId.substring(0, 3).toUpperCase(),
          issuer: wallet.classicAddress,
          value: pitTokenAmount.toString()
        },
        TradingFee: 500 // 0.5% trading fee
      };

      const result = await xrplClient.submitTransaction(ammCreateTransaction, wallet);
      
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        // Extract AMM ID from transaction metadata
        const ammId = this.extractAMMID(result.result.meta);
        return ammId;
      } else {
        throw new Error(`AMM creation failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error creating AMM pool:', error);
      throw error;
    }
  }

  async setupMilestoneEscrows(
    wallet: Wallet,
    milestones: Milestone[],
    totalFunding: number,
    campaignEndDate: Date
  ): Promise<string[]> {
    const escrowHashes: string[] = [];

    try {
      await xrplClient.connect();

      for (const milestone of milestones) {
        const escrowAmount = Math.floor((milestone.fundingPercentage / 100) * totalFunding);
        
        const escrowTransaction = {
          TransactionType: 'EscrowCreate',
          Account: wallet.classicAddress,
          Destination: wallet.classicAddress, // SME receives the funds
          Amount: (escrowAmount * 1000000).toString(), // Convert to drops
          FinishAfter: Math.floor(milestone.targetDate.getTime() / 1000),
          CancelAfter: Math.floor(campaignEndDate.getTime() / 1000),
          Condition: this.generateMilestoneCondition(milestone.id),
          Memos: [{
            Memo: {
              MemoType: convertStringToHex('milestone'),
              MemoData: convertStringToHex(JSON.stringify({
                milestoneId: milestone.id,
                campaignId: milestone.id.split('-')[0], // Extract campaign ID
                fundingPercentage: milestone.fundingPercentage
              }))
            }
          }]
        };

        const result = await xrplClient.submitTransaction(escrowTransaction, wallet);
        
        if (result.result.meta.TransactionResult === 'tesSUCCESS') {
          escrowHashes.push(result.result.hash);
        } else {
          throw new Error(`Escrow creation failed for milestone ${milestone.id}: ${result.result.meta.TransactionResult}`);
        }
      }

      return escrowHashes;
    } catch (error) {
      console.error('Error setting up milestone escrows:', error);
      throw error;
    }
  }

  async finishMilestoneEscrow(
    wallet: Wallet,
    escrowHash: string,
    fulfillment: string
  ): Promise<boolean> {
    try {
      await xrplClient.connect();

      const finishTransaction = {
        TransactionType: 'EscrowFinish',
        Account: wallet.classicAddress,
        Owner: wallet.classicAddress,
        OfferSequence: await this.getEscrowSequence(escrowHash),
        Fulfillment: fulfillment
      };

      const result = await xrplClient.submitTransaction(finishTransaction, wallet);
      return result.result.meta.TransactionResult === 'tesSUCCESS';
    } catch (error) {
      console.error('Error finishing milestone escrow:', error);
      throw error;
    }
  }

  async cancelEscrow(
    wallet: Wallet,
    escrowHash: string
  ): Promise<boolean> {
    try {
      await xrplClient.connect();

      const cancelTransaction = {
        TransactionType: 'EscrowCancel',
        Account: wallet.classicAddress,
        Owner: wallet.classicAddress,
        OfferSequence: await this.getEscrowSequence(escrowHash)
      };

      const result = await xrplClient.submitTransaction(cancelTransaction, wallet);
      return result.result.meta.TransactionResult === 'tesSUCCESS';
    } catch (error) {
      console.error('Error canceling escrow:', error);
      throw error;
    }
  }

  async getTokenInfo(tokenId: string): Promise<any> {
    try {
      await xrplClient.connect();
      
      const response = await xrplClient.getClient().request({
        command: 'nft_info',
        nft_id: tokenId
      });

      return response.result;
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  async getAMMInfo(ammId: string): Promise<any> {
    try {
      await xrplClient.connect();
      
      const response = await xrplClient.getClient().request({
        command: 'amm_info',
        amm_account: ammId
      });

      return response.result;
    } catch (error) {
      console.error('Error getting AMM info:', error);
      throw error;
    }
  }

  private extractNFTokenID(meta: any): string {
    // Extract NFTokenID from transaction metadata
    if (meta.CreatedNode && meta.CreatedNode.NewFields && meta.CreatedNode.NewFields.NFTokens) {
      return meta.CreatedNode.NewFields.NFTokens[0].NFToken.NFTokenID;
    }
    throw new Error('Could not extract NFTokenID from transaction metadata');
  }

  private extractAMMID(meta: any): string {
    // Extract AMM ID from transaction metadata
    if (meta.CreatedNode && meta.CreatedNode.NewFields && meta.CreatedNode.NewFields.Account) {
      return meta.CreatedNode.NewFields.Account;
    }
    throw new Error('Could not extract AMM ID from transaction metadata');
  }

  private generateMilestoneCondition(milestoneId: string): string {
    // Generate a condition hash for milestone completion
    // This would be fulfilled when milestone proof is verified
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`milestone_${milestoneId}`).digest('hex').toUpperCase();
  }

  private async getEscrowSequence(escrowHash: string): Promise<number> {
    // Get the sequence number for an escrow transaction
    const txResponse = await xrplClient.getClient().request({
      command: 'tx',
      transaction: escrowHash
    });
    
    return txResponse.result.Sequence;
  }
} 