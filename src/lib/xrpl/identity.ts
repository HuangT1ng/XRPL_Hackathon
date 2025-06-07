import { Wallet } from 'xrpl';
import CryptoJS from 'crypto-js';
import { xrplClient } from './client';

export interface KYCData {
  companyName: string;
  registrationNumber: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  businessType: string;
  documents: {
    registrationCertificate: string;
    taxCertificate: string;
    bankStatement: string;
  };
}

export interface CreditScoreData {
  revenue: number;
  cashFlow: number;
  assets: number;
  liabilities: number;
  paymentHistory: number;
  businessAge: number;
}

export class XRPLIdentityService {
  async createSMEDID(wallet: Wallet, kycData: KYCData): Promise<string> {
    try {
      await xrplClient.connect();
      
      // Create DID document structure
      const didDocument = {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: `did:xrpl:${wallet.classicAddress}`,
        verificationMethod: [{
          id: `did:xrpl:${wallet.classicAddress}#keys-1`,
          type: 'Ed25519VerificationKey2020',
          controller: `did:xrpl:${wallet.classicAddress}`,
          publicKeyMultibase: wallet.publicKey
        }],
        service: [{
          id: `did:xrpl:${wallet.classicAddress}#sme-service`,
          type: 'SMEService',
          serviceEndpoint: 'https://crowdlift.platform/sme'
        }]
      };

      // Create a hash of the KYC data to store on-chain
      const kycHash = this.hashKYCData(kycData);
      
      // Create an AccountSet transaction to anchor the DID.
      // We use a Memo to store the hash, as it's a standard field.
      const accountSetTransaction = {
        TransactionType: 'AccountSet' as const,
        Account: wallet.classicAddress,
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from('did:kyc', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(kycHash, 'utf8').toString('hex').toUpperCase(),
              MemoFormat: Buffer.from('text/plain', 'utf8').toString('hex').toUpperCase()
            }
          }
        ]
      };

      const result = await xrplClient.submitTransaction(accountSetTransaction, wallet);
      
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return `did:xrpl:${wallet.classicAddress}`;
      } else {
        throw new Error(`DID creation failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error creating SME DID:', error);
      throw error;
    }
  }

  async computeCreditScore(financialData: CreditScoreData): Promise<{ score: number; hash: string }> {
    // Simplified credit scoring algorithm
    const weights = {
      revenue: 0.25,
      cashFlow: 0.20,
      assets: 0.15,
      liabilities: -0.10,
      paymentHistory: 0.25,
      businessAge: 0.15
    };

    // Normalize values (simplified)
    const normalizedData = {
      revenue: Math.min(financialData.revenue / 1000000, 1), // Cap at 1M
      cashFlow: Math.max(Math.min(financialData.cashFlow / 100000, 1), -1), // Cap at 100K, floor at -100K
      assets: Math.min(financialData.assets / 500000, 1), // Cap at 500K
      liabilities: Math.min(financialData.liabilities / 500000, 1), // Cap at 500K
      paymentHistory: financialData.paymentHistory / 100, // Percentage
      businessAge: Math.min(financialData.businessAge / 10, 1) // Cap at 10 years
    };

    // Calculate weighted score
    let score = 0;
    score += normalizedData.revenue * weights.revenue;
    score += normalizedData.cashFlow * weights.cashFlow;
    score += normalizedData.assets * weights.assets;
    score += normalizedData.liabilities * weights.liabilities;
    score += normalizedData.paymentHistory * weights.paymentHistory;
    score += normalizedData.businessAge * weights.businessAge;

    // Convert to 0-1000 scale
    const finalScore = Math.max(0, Math.min(1000, Math.round(score * 1000)));

    // Create hash for privacy
    const dataString = JSON.stringify({
      ...financialData,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 60 * 24)) // Daily granularity
    });
    const hash = CryptoJS.SHA256(dataString).toString();

    return { score: finalScore, hash };
  }

  async verifyIdentityCredential(did: string, credential: any): Promise<boolean> {
    try {
      // Verify credential signature and validity
      // This would integrate with actual credential verification logic
      return true; // Simplified for now
    } catch (error) {
      console.error('Error verifying credential:', error);
      return false;
    }
  }

  private hashKYCData(kycData: KYCData): string {
    const dataString = JSON.stringify({
      companyName: kycData.companyName,
      registrationNumber: kycData.registrationNumber,
      businessType: kycData.businessType,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 60 * 24)) // Daily granularity
    });
    return CryptoJS.SHA256(dataString).toString();
  }

  async fetchXeroData(credentials: any): Promise<CreditScoreData> {
    // Mock implementation - would integrate with actual Xero API
    return {
      revenue: 500000,
      cashFlow: 50000,
      assets: 200000,
      liabilities: 100000,
      paymentHistory: 85,
      businessAge: 3
    };
  }

  async fetchPayNowData(credentials: any): Promise<Partial<CreditScoreData>> {
    // Mock implementation - would integrate with PayNow API
    return {
      paymentHistory: 90
    };
  }
} 