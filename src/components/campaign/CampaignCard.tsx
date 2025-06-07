import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Users, Target } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SMECampaign } from '@/types';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: SMECampaign;
  index?: number;
}

export function CampaignCard({ campaign, index = 0 }: CampaignCardProps) {
  const fundingPercentage = (campaign.currentFunding / campaign.fundingGoal) * 100;
  const nextMilestone = campaign.milestones.find(m => m.status === 'pending' || m.status === 'in-progress');
  const daysLeft = Math.max(0, Math.ceil((campaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="p-0">
          <div className="relative overflow-hidden">
            <img
              src={campaign.image}
              alt={campaign.name}
              className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <Badge className={cn('text-xs font-medium', statusColors[campaign.status])}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
                <Badge variant="secondary" className="bg-white/90 text-gray-900">
                  {campaign.industry}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">{campaign.name}</h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Funding Progress</span>
                <span className="font-semibold text-gray-900">
                  ${campaign.currentFunding.toLocaleString()} / ${campaign.fundingGoal.toLocaleString()}
                </span>
              </div>
              <Progress value={fundingPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{fundingPercentage.toFixed(1)}% funded</span>
                <span>{daysLeft} days left</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-500" />
                <div>
                  <p className="font-medium text-gray-900">${campaign.tokenPrice}</p>
                  <p className="text-gray-500">Token Price</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary-500" />
                <div>
                  <p className="font-medium text-gray-900">{campaign.amm.apr}%</p>
                  <p className="text-gray-500">APR</p>
                </div>
              </div>
            </div>

            {nextMilestone && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-primary-500" />
                  <span className="font-medium text-gray-900">Next Milestone:</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-1">{nextMilestone.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Due {nextMilestone.targetDate.toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button asChild variant="outline" className="w-full">
            <Link to={`/campaign/${campaign.id}`}>
              Invest Now
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}