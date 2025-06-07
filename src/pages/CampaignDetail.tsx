import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, TrendingUp, Users, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SwapWidget } from '@/components/trading/SwapWidget';
import { PriceChart } from '@/components/trading/PriceChart';
import { useStore } from '@/store/useStore';
import { useLivePoolStats } from '@/hooks/useLivePoolStats';
import { mockCampaigns } from '@/data/mockData';

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { campaigns } = useStore();
  
  // Look for campaign in both store campaigns and mock campaigns
  const [campaign, setCampaign] = useState(() => {
    const storeCampaign = campaigns.find(c => c.id === id);
    const mockCampaign = mockCampaigns.find(c => c.id === id);
    return storeCampaign || mockCampaign;
  });
  
  const poolStats = useLivePoolStats(campaign?.amm.poolId || '');
  
  // Update campaign when store campaigns change
  useEffect(() => {
    const storeCampaign = campaigns.find(c => c.id === id);
    const mockCampaign = mockCampaigns.find(c => c.id === id);
    setCampaign(storeCampaign || mockCampaign);
  }, [campaigns, id]);

  if (!campaign) {
    return (
      <div className="container mx-auto px-6 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Campaign not found</h1>
          <Button asChild className="mt-4">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const fundingPercentage = (campaign.currentFunding / campaign.fundingGoal) * 100;

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Campaign Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={campaign.image}
                alt={campaign.name}
                className="h-64 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-white/90 text-gray-900">{campaign.industry}</Badge>
                  <Badge className="bg-primary-100 text-primary-800">{campaign.status}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
              </div>
            </div>
          </motion.div>

          {/* Campaign Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-7">{campaign.description}</p>
            </CardContent>
          </Card>

          {/* Price Chart */}
          {poolStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PriceChart
                data={poolStats.priceHistory}
                tokenSymbol={campaign.tokenSymbol}
              />
            </motion.div>
          )}

          {/* Campaign Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Campaign Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">${campaign.tokenPrice}</div>
                    <div className="text-sm text-gray-500">Token Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{campaign.amm.apr}%</div>
                    <div className="text-sm text-gray-500">APR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {campaign.circulatingSupply.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Circulating Supply</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      ${campaign.amm.tvl.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">TVL</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Swap Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <SwapWidget
              tokenSymbol={campaign.tokenSymbol}
              tokenPrice={poolStats?.price || campaign.tokenPrice}
              priceChange24h={poolStats?.priceChange24h || 0}
            />
          </motion.div>

          {/* Campaign Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Funding Progress</span>
                    <span className="font-medium">{fundingPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, fundingPercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${campaign.currentFunding.toLocaleString()}</span>
                    <span>${campaign.fundingGoal.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Launch Date</span>
                    <span className="font-medium">{campaign.launchDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-medium">{campaign.endDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Supply</span>
                    <span className="font-medium">{campaign.totalSupply.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <Button asChild variant="outline" className="w-full">
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on XRPL Explorer
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pool Stats */}
          {poolStats && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pool Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">24h Volume</span>
                    <span className="font-medium">${poolStats.volume24h.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value Locked</span>
                    <span className="font-medium">${poolStats.tvl.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">APR</span>
                    <span className="font-medium text-green-600">{poolStats.apr}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}