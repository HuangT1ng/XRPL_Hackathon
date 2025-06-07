import { Wallet, convertStringToHex } from 'xrpl';
import CryptoJS from 'crypto-js';
import { xrplClient } from './client';

export interface PhotoProof {
  imageData: string; // Base64 encoded image
  geoTag: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  metadata: {
    campaignId: string;
    milestoneId: string;
    description: string;
    capturedAt: number;
  };
}

export interface MilestoneVerification {
  milestoneId: string;
  proofHash: string;
  ipfsHash: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  auditorSignature?: string;
  verifiedAt?: number;
}

export class MilestoneVerificationService {
  async processPhotoProof(
    wallet: Wallet, 
    photoProof: PhotoProof
  ): Promise<{ proofHash: string; ipfsHash: string; txHash: string }> {
    try {
      await xrplClient.connect();

      // Create comprehensive proof data
      const proofData = {
        imageHash: CryptoJS.SHA256(photoProof.imageData).toString(),
        geoTag: photoProof.geoTag,
        metadata: photoProof.metadata,
        timestamp: Date.now()
      };

      // Generate proof hash
      const proofHash = CryptoJS.SHA256(JSON.stringify(proofData)).toString();

      // Store on IPFS (mock implementation)
      const ipfsHash = await this.storeOnIPFS(photoProof);

      // Submit payment transaction with proof hash in memo
      const proofTransaction = {
        TransactionType: 'Payment',
        Account: wallet.classicAddress,
        Destination: wallet.classicAddress, // Self-payment with zero amount
        Amount: '1', // Minimum amount (1 drop)
        Memos: [{
          Memo: {
            MemoType: convertStringToHex('milestone_proof'),
            MemoData: convertStringToHex(JSON.stringify({
              milestoneId: photoProof.metadata.milestoneId,
              campaignId: photoProof.metadata.campaignId,
              proofHash: proofHash,
              ipfsHash: ipfsHash,
              geoTag: photoProof.geoTag,
              timestamp: Date.now()
            }))
          }
        }]
      };

      const result = await xrplClient.submitTransaction(proofTransaction, wallet);
      
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return {
          proofHash,
          ipfsHash,
          txHash: result.result.hash
        };
      } else {
        throw new Error(`Proof submission failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error processing photo proof:', error);
      throw error;
    }
  }

  async verifyMilestoneCompletion(
    auditorWallet: Wallet,
    milestoneId: string,
    proofHash: string,
    approved: boolean
  ): Promise<string> {
    try {
      await xrplClient.connect();

      // Create credential for milestone verification
      const credentialData = {
        milestoneId,
        proofHash,
        approved,
        auditor: auditorWallet.classicAddress,
        verifiedAt: Date.now()
      };

      const credentialTransaction = {
        TransactionType: 'Payment',
        Account: auditorWallet.classicAddress,
        Destination: auditorWallet.classicAddress,
        Amount: '1',
        Memos: [{
          Memo: {
            MemoType: convertStringToHex('milestone_verification'),
            MemoData: convertStringToHex(JSON.stringify(credentialData))
          }
        }]
      };

      const result = await xrplClient.submitTransaction(credentialTransaction, auditorWallet);
      
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        // If approved, trigger escrow finish
        if (approved) {
          await this.triggerEscrowRelease(milestoneId, proofHash);
        }
        return result.result.hash;
      } else {
        throw new Error(`Verification failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error verifying milestone completion:', error);
      throw error;
    }
  }

  async triggerEscrowRelease(milestoneId: string, proofHash: string): Promise<void> {
    try {
      // Find the escrow associated with this milestone
      const escrowInfo = await this.findMilestoneEscrow(milestoneId);
      
      if (!escrowInfo) {
        throw new Error(`No escrow found for milestone ${milestoneId}`);
      }

      // Generate fulfillment from proof hash
      const fulfillment = this.generateFulfillment(proofHash);

      // This would typically be called by a watch-tower service
      console.log(`Triggering escrow release for milestone ${milestoneId}`);
      console.log(`Escrow: ${escrowInfo.hash}, Fulfillment: ${fulfillment}`);
      
      // The actual escrow finish would be handled by the token service
    } catch (error) {
      console.error('Error triggering escrow release:', error);
      throw error;
    }
  }

  async getMilestoneProofs(campaignId: string): Promise<MilestoneVerification[]> {
    try {
      await xrplClient.connect();

      // Query transactions with milestone proof memos
      const response = await xrplClient.getClient().request({
        command: 'account_tx',
        account: campaignId, // This would be the campaign wallet address
        ledger_index_min: -1,
        ledger_index_max: -1
      });

      const proofs: MilestoneVerification[] = [];

      for (const tx of response.result.transactions) {
        if (tx.tx.Memos) {
          for (const memo of tx.tx.Memos) {
            if (memo.Memo.MemoType) {
              const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString();
              
              if (memoType === 'milestone_proof') {
                const memoData = JSON.parse(Buffer.from(memo.Memo.MemoData, 'hex').toString());
                
                proofs.push({
                  milestoneId: memoData.milestoneId,
                  proofHash: memoData.proofHash,
                  ipfsHash: memoData.ipfsHash,
                  verificationStatus: 'pending'
                });
              }
            }
          }
        }
      }

      return proofs;
    } catch (error) {
      console.error('Error getting milestone proofs:', error);
      return [];
    }
  }

  async validateGeoTag(geoTag: PhotoProof['geoTag'], expectedLocation?: { lat: number; lng: number; radius: number }): Promise<boolean> {
    try {
      // Basic validation
      if (!geoTag.latitude || !geoTag.longitude || !geoTag.timestamp) {
        return false;
      }

      // Check if coordinates are valid
      if (geoTag.latitude < -90 || geoTag.latitude > 90 || 
          geoTag.longitude < -180 || geoTag.longitude > 180) {
        return false;
      }

      // Check timestamp is recent (within last 24 hours)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (now - geoTag.timestamp > maxAge) {
        return false;
      }

      // If expected location is provided, check proximity
      if (expectedLocation) {
        const distance = this.calculateDistance(
          geoTag.latitude, 
          geoTag.longitude,
          expectedLocation.lat,
          expectedLocation.lng
        );
        
        return distance <= expectedLocation.radius;
      }

      return true;
    } catch (error) {
      console.error('Error validating geo tag:', error);
      return false;
    }
  }

  async storeOnIPFS(photoProof: PhotoProof): Promise<string> {
    try {
      // Mock IPFS storage - in production, this would use actual IPFS client
      const ipfsData = {
        image: photoProof.imageData,
        geoTag: photoProof.geoTag,
        metadata: photoProof.metadata,
        timestamp: Date.now()
      };

      // Generate mock IPFS hash
      const dataString = JSON.stringify(ipfsData);
      const hash = CryptoJS.SHA256(dataString).toString();
      
      // Mock IPFS hash format
      const ipfsHash = `Qm${hash.substring(0, 44)}`;
      
      console.log(`Stored proof on IPFS: ${ipfsHash}`);
      return ipfsHash;
    } catch (error) {
      console.error('Error storing on IPFS:', error);
      throw error;
    }
  }

  async retrieveFromIPFS(ipfsHash: string): Promise<PhotoProof | null> {
    try {
      // Mock IPFS retrieval - in production, this would fetch from IPFS
      console.log(`Retrieving from IPFS: ${ipfsHash}`);
      
      // Return mock data for now
      return null;
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      return null;
    }
  }

  private async findMilestoneEscrow(milestoneId: string): Promise<{ hash: string; sequence: number } | null> {
    try {
      // This would query the ledger for escrows with matching milestone memo
      // Mock implementation for now
      return {
        hash: `escrow_${milestoneId}`,
        sequence: 12345
      };
    } catch (error) {
      console.error('Error finding milestone escrow:', error);
      return null;
    }
  }

  private generateFulfillment(proofHash: string): string {
    // Generate fulfillment that matches the escrow condition
    return CryptoJS.SHA256(`fulfillment_${proofHash}`).toString().toUpperCase();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance * 1000; // Convert to meters
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 