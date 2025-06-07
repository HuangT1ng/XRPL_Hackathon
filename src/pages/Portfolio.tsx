import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building, DollarSign, Target, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Link } from 'react-router-dom';
import { log } from '@/lib/logger';
import { toast } from 'sonner';

export function Portfolio() {
  const { wallet } = useStore();
  const [localCampaigns, setLocalCampaigns] = useState<any[]>([]);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/load-campaigns');
      if (response.ok) {
        const data = await response.json();
        setLocalCampaigns(data.campaigns || []);
      } else if (response.status !== 404) {
        toast.error('Failed to load local campaigns.');
        log.error('Failed to load local campaigns', response);
      }
    } catch (error) {
      toast.error('Failed to load local campaigns.');
      log.error('Failed to load local campaigns', error);
    }
  };

  useEffect(() => {
    if (wallet.isConnected) {
      loadCampaigns();
    }
  }, [wallet.isConnected]);

  const myCampaigns = useMemo(() => {
    if (!wallet.address) return [];
    return localCampaigns.filter(c => c.founderAddress === wallet.address);
  }, [localCampaigns, wallet.address]);

  const otherCampaigns = useMemo(() => {
    if (!wallet.address) return localCampaigns;
    return localCampaigns.filter(c => c.founderAddress !== wallet.address);
  }, [localCampaigns, wallet.address]);


  if (!wallet.isConnected) {
    return (
      <div className="container mx-auto px-6 py-24">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">My Portfolio</h1>
          <p className="text-gray-600">Please connect your wallet to view your portfolio and campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-600 mt-2">Here are the campaigns you have launched and other available campaigns.</p>
        </div>
        <Button asChild>
          <Link to="/onboard">
            <Plus className="mr-2 h-4 w-4" />
            Launch Campaign
          </Link>
        </Button>
      </div>

      <div className="space-y-12">
        {localCampaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle>No Campaigns Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">There are no local campaigns. Start one today!</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {myCampaigns.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Launched Campaigns</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCampaigns.map((campaign, index) => (
                    <CampaignCardItem key={campaign.id} campaign={campaign} index={index} />
                  ))}
                </div>
              </div>
            )}

            {otherCampaigns.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {myCampaigns.length > 0 ? 'Other Available Campaigns' : 'All Available Campaigns'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherCampaigns.map((campaign, index) => (
                    <CampaignCardItem key={campaign.id} campaign={campaign} index={index} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const CampaignCardItem = ({ campaign, index }: { campaign: any, index: number }) => {
  // Mock data for fields that might be missing in local campaigns
  const currentFunding = campaign.currentFunding ?? 0;
  const fundingGoal = campaign.fundingGoal ?? 1; // Avoid division by zero
  const status = campaign.status ?? 'active';
  const tokenPrice = campaign.tokenPrice ?? 0;
  const totalSupply = campaign.totalSupply ?? 0;
  const tokenSymbol = campaign.tokenSymbol ?? 'TKN';
  
  return (
    <motion.div
      key={campaign.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg mb-1">{campaign.name}</CardTitle>
              <Badge variant="outline">{campaign.industry}</Badge>
            </div>
            <Badge className={status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-2" />
            <span>Funding Goal: ${fundingGoal.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Target className="h-4 w-4 mr-2" />
            <span>Raised: ${currentFunding.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-primary-600 h-2.5 rounded-full" 
              style={{ width: `${(currentFunding / fundingGoal) * 100}%` }}
            ></div>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Percent className="h-4 w-4 mr-2" />
            <span>Token Price: ${tokenPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Building className="h-4 w-4 mr-2" />
            <span>Total Supply: {totalSupply.toLocaleString()} {tokenSymbol}</span>
          </div>
        </CardContent>
        <div className="p-4 pt-0">
          <Button asChild className="w-full">
            <Link to={`/campaign/${campaign.id}`}>View Details</Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};