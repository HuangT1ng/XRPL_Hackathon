import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { xrplCampaignService } from '@/lib/xrpl/campaigns';
import { toast } from 'sonner';
import { TrustSet, Wallet, Client, Payment } from 'xrpl';
import type { Payment as PaymentType } from 'xrpl';
import { sendXRPAndTokens, toCurrencyHex } from '@/lib/xrpl/sendXRPAndTokens';

const ISSUER_SECRET = 'sEdVgPVpzRtC3RTZ6kJ4Xa8DFTxhDQb'; // Replace with your testnet issuer secret
const XRPL_WS = 's.altnet.rippletest.net';

export function BrowseCampaigns() {
  const { campaigns: storeCampaigns, wallet } = useStore();
  const navigate = useNavigate();
  const [isCreatingTrustLine, setIsCreatingTrustLine] = useState<string | null>(null);
  const [trustLineCreated, setTrustLineCreated] = useState<string | null>(null);
  const [isSendingXRP, setIsSendingXRP] = useState<string | null>(null);
  const [isReceivingTokens, setIsReceivingTokens] = useState<string | null>(null);
  const [xrpSent, setXrpSent] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Fetch campaigns from server
  useEffect(() => {
    fetch('http://localhost:3000/campaigns')
      .then(res => res.json())
      .then(data => setCampaigns(data))
      .catch(() => setCampaigns([]));
  }, []);

  const allCampaigns = campaigns && campaigns.length > 0 ? campaigns : storeCampaigns;

  const handleSupport = async (campaignId: string) => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!wallet.xrplWallet) {
      toast.error('Wallet not loaded. Please reconnect.');
      return;
    }

    const campaign = allCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    try {
      setIsCreatingTrustLine(campaignId);
      await createTrustLineWithWallet(
        wallet.xrplWallet,
        campaign.founderAddress,
        campaign.tokenSymbol,
        '1000000000'
      );
      setTrustLineCreated(campaignId);
      toast.success('Trust line created successfully!');
    } catch (error) {
      console.error('Error creating trust line:', error);
      toast.error('Failed to create trust line. Please try again.');
    } finally {
      setIsCreatingTrustLine(null);
    }
  };

  const handleSendXRP = async (campaign: any) => {
    if (!wallet.xrplWallet || !wallet.address) {
      toast.error('Wallet not loaded. Please reconnect.');
      return;
    }
    setIsSendingXRP(campaign.id);
    try {
      const xrpl = await import('xrpl');
      const client = new xrpl.Client('wss://testnet.xrpl-labs.com');
      await client.connect();
      const xrpPayment: Payment = {
        TransactionType: 'Payment',
        Account: wallet.xrplWallet.classicAddress,
        Destination: campaign.founderAddress,
        Amount: xrpl.xrpToDrops(1),
      };
      const prepared = await client.autofill(xrpPayment);
      const signed = wallet.xrplWallet.sign(prepared);
      await client.disconnect();
      // Submit via WebSocket
      const ws = new window.WebSocket('wss://testnet.xrpl-labs.com');
      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 1,
          command: 'submit',
          tx_blob: signed.tx_blob,
        }));
      };
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === 1 && data.result && data.result.engine_result === 'tesSUCCESS') {
          setXrpSent(campaign.id);
          toast.success('1 XRP sent!');
        }
        ws.close();
      };
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        toast.error('WebSocket error sending XRP.');
      };
      ws.onclose = (e) => {
        setIsSendingXRP(null);
      };
    } catch (error) {
      console.error('Error sending 1 XRP:', error);
      toast.error('Failed to send 1 XRP. Please try again.');
      setIsSendingXRP(null);
    }
  };

  const handleReceiveTokens = async (campaign: any) => {
    if (!wallet.xrplWallet || !wallet.address) {
      toast.error('Wallet not loaded. Please reconnect.');
      return;
    }
    setIsReceivingTokens(campaign.id);
    try {
      const xrpl = await import('xrpl');
      const XRPL_WS = 'wss://testnet.xrpl-labs.com';
      const issuerWallet = xrpl.Wallet.fromSeed(ISSUER_SECRET);
      const client = new xrpl.Client(XRPL_WS);
      await client.connect();
      const tokenCurrency = campaign.tokenSymbol.length === 3 ? campaign.tokenSymbol : toCurrencyHex(campaign.tokenSymbol);
      const tokenPayment: Payment = {
        TransactionType: 'Payment',
        Account: issuerWallet.classicAddress,
        Destination: wallet.address,
        Amount: {
          currency: tokenCurrency,
          value: '1000',
          issuer: issuerWallet.classicAddress,
        },
      };
      const prepared = await client.autofill(tokenPayment);
      const signed = issuerWallet.sign(prepared);
      await client.disconnect();
      // Submit via WebSocket
      const ws = new window.WebSocket(XRPL_WS);
      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 2,
          command: 'submit',
          tx_blob: signed.tx_blob,
        }));
      };
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id === 2 && data.result && data.result.engine_result === 'tesSUCCESS') {
          toast.success('1000 tokens sent!');
        }
        ws.close();
      };
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        toast.error('WebSocket error sending tokens.');
      };
      ws.onclose = (e) => {
        setIsReceivingTokens(null);
      };
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast.error('Failed to send tokens. Please try again.');
      setIsReceivingTokens(null);
    }
  };

  const handleSendXRPAndTokens = async (campaign: any) => {
    if (!wallet.xrplWallet || !wallet.address) {
      toast.error('Wallet not loaded. Please reconnect.');
      return;
    }
    setIsProcessing(campaign.id);
    try {
      await sendXRPAndTokens(
        wallet.xrplWallet,
        ISSUER_SECRET,
        campaign.founderAddress,
        wallet.address,
        campaign.tokenSymbol,
        '1000'
      );
      toast.success('1 XRP and 1000 tokens sent!');
    } catch (error) {
      console.error('Error sending XRP and tokens:', error);
      toast.error('Failed to send XRP and tokens. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Browse Campaigns</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allCampaigns.map((campaign) => {
              const fundingPercentage = (campaign.currentFunding / campaign.fundingGoal) * 100;
              const isIssuer = wallet.address === campaign.founderAddress;
              return (
                <Card key={campaign.id} className="flex flex-col">
                  <img
                    src={campaign.image}
                    alt={campaign.name}
                    className="h-40 w-full object-cover rounded-t-lg"
                  />
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">{campaign.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-gray-600 mb-4 line-clamp-3">{campaign.description}</p>
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-black h-2 rounded-full transition-all"
                          style={{ width: `${fundingPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Goal</span>
                      <span className="font-medium">${campaign.fundingGoal.toLocaleString()} RLUSD</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Token</span>
                      <span className="font-medium">{campaign.tokenSymbol} @ ${campaign.tokenPrice}</span>
                    </div>
                    <Button
                      className="w-full mt-4 bg-black text-white hover:bg-gray-900 hover:text-white border-none shadow-lg transition-all duration-200"
                      onClick={() => handleSupport(campaign.id)}
                      disabled={isCreatingTrustLine === campaign.id || trustLineCreated === campaign.id}
                    >
                      {isCreatingTrustLine === campaign.id
                        ? 'Creating Trust Line...'
                        : trustLineCreated === campaign.id
                        ? 'Trust Line Created'
                        : 'Support'}
                    </Button>
                    {trustLineCreated === campaign.id && (
                      <Button
                        className="w-full mt-2 bg-black text-white hover:bg-gray-900 hover:text-white border-none shadow-lg transition-all duration-200"
                        onClick={() => handleSendXRP(campaign)}
                        disabled={isSendingXRP === campaign.id || xrpSent === campaign.id}
                      >
                        {isSendingXRP === campaign.id ? 'Sending 1 XRP...' : xrpSent === campaign.id ? '1 XRP Sent' : 'Send 1 XRP'}
                      </Button>
                    )}
                    {xrpSent === campaign.id && (
                      <Button
                        className="w-full mt-2 bg-blue-600 text-white"
                        onClick={() => handleReceiveTokens(campaign)}
                        disabled={isReceivingTokens === campaign.id}
                      >
                        {isReceivingTokens === campaign.id ? 'Recieving 1000 Tokens...' : 'Receive 1000 Tokens'}
                      </Button>
                    )}
                    {isIssuer && trustLineCreated === campaign.id && xrpSent === campaign.id && (
                      <Button
                        className="w-full mt-2 bg-purple-600 text-white"
                        onClick={() => handleSendXRPAndTokens(campaign)}
                        disabled={isProcessing === campaign.id}
                      >
                        {isProcessing === campaign.id ? 'Processing...' : 'Send 1 XRP & Receive 1000 Tokens'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

async function createTrustLineWithWallet(
  userWallet: Wallet,
  issuerAddress: string,
  currency: string,
  limit: string = '1000000000'
) {
  const { Client } = await import('xrpl');
  const { config } = await import('@/lib/config');
  const client = new Client(config.xrpl.server);
  if (!client.isConnected()) {
    await client.connect();
  }

  // Always use hex for custom tokens (length > 3)
  const currencyHex = currency.length === 3 ? currency : toCurrencyHex(currency);

  const trustSetTx: TrustSet = {
    TransactionType: 'TrustSet',
    Account: userWallet.classicAddress,
    LimitAmount: {
      currency: currencyHex,
      issuer: issuerAddress,
      value: limit,
    },
  };

  const prepared = await client.autofill(trustSetTx);
  const signed = userWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  // XRPL v2+ result shape
  if ('engine_result' in result.result && result.result.engine_result !== 'tesSUCCESS') {
    const errMsg = (result.result as any).engine_result_message || 'Transaction failed';
    throw new Error(`Transaction failed: ${errMsg}`);
  }
}

async function sendXRPToIssuer(userWallet: Wallet, issuerAddress: string) {
  const { Client, xrpToDrops } = await import('xrpl');
  const { config } = await import('@/lib/config');
  const client = new Client(config.xrpl.server);
  if (!client.isConnected()) {
    await client.connect();
  }

  const paymentTx: Payment = {
    TransactionType: 'Payment',
    Account: userWallet.classicAddress,
    Destination: issuerAddress,
    Amount: xrpToDrops(1), // 1 XRP
  };

  const prepared = await client.autofill(paymentTx);
  const signed = userWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if ('engine_result' in result.result && result.result.engine_result !== 'tesSUCCESS') {
    const errMsg = (result.result as any).engine_result_message || 'Transaction failed';
    throw new Error(`Transaction failed: ${errMsg}`);
  }
}

async function sendTokensToBuyer(
  issuerWallet: Wallet,
  buyerAddress: string,
  currency: string,
  amount: string
) {
  const { Client } = await import('xrpl');
  const { config } = await import('@/lib/config');
  const client = new Client(config.xrpl.server);
  if (!client.isConnected()) {
    await client.connect();
  }

  const currencyHex = currency.length > 3 ? toCurrencyHex(currency) : currency;

  const paymentTx: Payment = {
    TransactionType: 'Payment',
    Account: issuerWallet.classicAddress,
    Destination: buyerAddress,
    Amount: {
      currency: currencyHex,
      issuer: issuerWallet.classicAddress,
      value: amount,
    },
  };

  const prepared = await client.autofill(paymentTx);
  const signed = issuerWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  if ('engine_result' in result.result && result.result.engine_result !== 'tesSUCCESS') {
    const errMsg = (result.result as any).engine_result_message || 'Transaction failed';
    throw new Error(`Transaction failed: ${errMsg}`);
  }
} 