import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, TrendingUp, Users, Clock, Target, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SwapWidget } from '@/components/trading/SwapWidget';
import { PriceChart } from '@/components/trading/PriceChart';
import { log } from '@/lib/logger';
import { toast } from 'sonner';

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCampaign = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/load-campaigns');
        if (response.ok) {
          const data = await response.json();
          const foundCampaign = data.campaigns.find((c: any) => c.id === id);
          setCampaign(foundCampaign || null);
        } else {
          toast.error('Failed to load campaigns.');
          log.error('Failed to load campaigns', response);
        }
      } catch (error) {
        toast.error('Failed to load campaigns.');
        log.error('Failed to load campaigns', error);
      }
      setIsLoading(false);
    };

    loadCampaign();
  }, [id]);

  if (isLoading) {
    return (
        <div className="container mx-auto px-6 py-24 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Loading campaign...</h1>
        </div>
    );
  }

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

  // Mock data for fields that might be missing in local campaigns to avoid runtime errors
  const currentFunding = campaign.currentFunding ?? 0;
  const fundingGoal = campaign.fundingGoal ?? 1; // Avoid division by zero
  const status = campaign.status ?? 'active';
  const tokenPrice = campaign.tokenPrice ?? 0;
  const totalSupply = campaign.totalSupply ?? 0;
  const tokenSymbol = campaign.tokenSymbol ?? 'TKN';
  const image = campaign.image ?? '/api/placeholder/400/300';
  const launchDate = campaign.launchDate ? new Date(campaign.launchDate) : new Date();
  const endDate = campaign.endDate ? new Date(campaign.endDate) : new Date();
  const fundingPercentage = (currentFunding / fundingGoal) * 100;

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
                src={image}
                alt={campaign.name}
                className="h-64 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-white/90 text-gray-900">{campaign.industry}</Badge>
                  <Badge className="bg-primary-100 text-primary-800">{status}</Badge>
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

          {/* Price Chart - Optional: Could be re-enabled with mock data if needed */}
          {/* <motion.div ...> <PriceChart ... /> </motion.div> */}

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
                    <div className="text-2xl font-bold text-primary-600">${tokenPrice.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Token Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{campaign.amm?.apr ?? 0}%</div>
                    <div className="text-sm text-gray-500">APR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {(campaign.circulatingSupply ?? 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Circulating Supply</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      ${(campaign.amm?.tvl ?? 0).toLocaleString()}
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
              tokenSymbol={tokenSymbol}
              tokenPrice={tokenPrice}
              priceChange24h={0}
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
                    <span>${currentFunding.toLocaleString()}</span>
                    <span>${fundingGoal.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Launch Date</span>
                    <span className="font-medium">{launchDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-medium">{endDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Supply</span>
                    <span className="font-medium">{totalSupply.toLocaleString()}</span>
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

          {/* Pool Stats - Optional: Could be re-enabled with mock data if needed */}
          {/* <motion.div ...> <Card> ... </Card> </motion.div> */}
        </div>
      </div>
    </div>
  );
}