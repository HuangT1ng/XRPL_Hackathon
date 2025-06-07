import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { log } from '@/lib/logger';
import { SMECampaign } from '@/types';

export function SupportCampaign() {
  const { id } = useParams<{ id: string }>();
  const { wallet, campaigns, executeSwap, isLoading } = useStore();
  const [campaign, setCampaign] = useState<SMECampaign | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<number>(0);

  useEffect(() => {
    if (id) {
      const foundCampaign = campaigns.find(c => c.id === id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      }
    }
  }, [id, campaigns]);

  const calculateTokenAmount = (rlusdAmount: number) => {
    if (!campaign) return 0;
    return rlusdAmount / campaign.tokenPrice;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    const numValue = parseFloat(value) || 0;
    setTokenAmount(calculateTokenAmount(numValue));
  };

  const handleSupport = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!campaign) {
      toast.error('Campaign not found');
      return;
    }

    const rlusdAmount = parseFloat(amount);
    if (isNaN(rlusdAmount) || rlusdAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      toast.info('Processing your support...');
      await executeSwap('RLUSD', campaign.tokenSymbol, rlusdAmount, 1);
      toast.success('Successfully supported the campaign!');
      setAmount('');
      setTokenAmount(0);
    } catch (error) {
      log.error('SUPPORT', 'Failed to support campaign', error);
      toast.error(error instanceof Error ? error.message : 'Failed to support campaign');
    }
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black">Campaign Not Found</h1>
            <p className="mt-2 text-black/70">The campaign you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const fundingPercentage = (campaign.currentFunding / campaign.fundingGoal) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{campaign.name}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{campaign.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Funding Progress</span>
                    <span className="font-medium">{fundingPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={fundingPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Funding Goal</span>
                    <p className="font-medium">${campaign.fundingGoal.toLocaleString()} RLUSD</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Funding</span>
                    <p className="font-medium">${campaign.currentFunding.toLocaleString()} RLUSD</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Token Price</span>
                    <p className="font-medium">${campaign.tokenPrice} RLUSD</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Token Symbol</span>
                    <p className="font-medium">{campaign.tokenSymbol}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Campaign Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Form */}
            <Card>
              <CardHeader>
                <CardTitle>Support Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (RLUSD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount in RLUSD"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">You will receive:</span>
                      <span className="font-medium">
                        {tokenAmount.toLocaleString()} {campaign.tokenSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token Price:</span>
                      <span className="font-medium">${campaign.tokenPrice} RLUSD</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSupport}
                  disabled={isLoading || !wallet.isConnected || !amount || parseFloat(amount) <= 0}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Support Campaign'}
                </Button>

                {!wallet.isConnected && (
                  <p className="text-sm text-center text-gray-600">
                    Please connect your wallet to support this campaign
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 