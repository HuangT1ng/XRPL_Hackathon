import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building, DollarSign, Target, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function Portfolio() {
  const { campaigns, wallet, portfolio, refreshPortfolio, isLoading } = useStore();

  const myCampaigns = useMemo(() => {
    if (!wallet.address) return [];
    return campaigns.filter(c => c.founderAddress === wallet.address);
  }, [campaigns, wallet.address]);

  const otherCampaigns = useMemo(() => {
    if (!wallet.address) return campaigns; // Show all if not connected
    if (myCampaigns.length === 0) {
      return campaigns;
    }
    return campaigns.filter(c => c.founderAddress !== wallet.address);
  }, [campaigns, wallet.address, myCampaigns]);

  // Handler for refreshing portfolio
  const handleRefreshPortfolio = async () => {
    try {
      await refreshPortfolio();
      toast.success('Portfolio refreshed!');
    } catch (error) {
      toast.error('Failed to refresh portfolio.');
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="w-full px-0 py-24">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">My Portfolio</h1>
          <p className="text-gray-600">Please connect your wallet to view your portfolio and campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-black text-white rounded shadow hover:bg-gray-900 disabled:opacity-50"
          onClick={handleRefreshPortfolio}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Portfolio'}
        </button>
      </div>
      <div className="mb-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
        <p className="text-gray-600 mt-2">Here are the campaigns you have launched and other available campaigns.</p>
        <Button asChild className="mt-4">
          <Link to="/onboard">
            <Plus className="mr-2 h-4 w-4" />
            Launch Campaign
          </Link>
        </Button>
      </div>

      {/* Wallet Balance Card */}
      {wallet.isConnected && (
        <div className="mb-8 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg text-center">Wallet Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl font-bold text-green-600">
                  {wallet.balance ?? 0} <span className="text-base text-gray-900 font-normal">XRP</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Holdings Card */}
      {portfolio && portfolio.holdings && portfolio.holdings.length > 0 && (
        <div className="mb-8 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg text-center">My Token Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200">
                {portfolio.holdings.map((holding, idx) => (
                  <li key={holding.tokenSymbol + idx} className="py-2 flex justify-between items-center">
                    <span className="font-medium">{holding.tokenSymbol}</span>
                    <span>{holding.quantity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {myCampaigns.length === 0 && otherCampaigns.length === 0 ? (
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
              <p className="text-gray-600 mb-4">There are no active campaigns. Start one today!</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-12">
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
        </div>
      )}
    </div>
  );
}

const CampaignCardItem = ({ campaign, index }: { campaign: any, index: number }) => (
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
          <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2" />
          <span>Funding Goal: ${campaign.fundingGoal.toLocaleString()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Target className="h-4 w-4 mr-2" />
          <span>Raised: ${campaign.currentFunding.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-primary-600 h-2.5 rounded-full" 
            style={{ width: `${(campaign.currentFunding / campaign.fundingGoal) * 100}%` }}
          ></div>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Percent className="h-4 w-4 mr-2" />
          <span>Token Price: ${campaign.tokenPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Building className="h-4 w-4 mr-2" />
          <span>Total Supply: {campaign.totalSupply.toLocaleString()} {campaign.tokenSymbol}</span>
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