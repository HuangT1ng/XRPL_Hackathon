import { CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Milestone } from '@/types';
import { cn } from '@/lib/utils';

interface MilestoneProgressProps {
  milestones: Milestone[];
  className?: string;
}

export function MilestoneProgress({ milestones, className }: MilestoneProgressProps) {
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = milestones.length;
  const progressPercentage = (completedMilestones / totalMilestones) * 100;

  const statusIcons = {
    completed: CheckCircle,
    'in-progress': Clock,
    pending: Lock,
    failed: AlertCircle,
  };

  const statusColors = {
    completed: 'text-green-600 bg-green-50 border-green-200',
    'in-progress': 'text-blue-600 bg-blue-50 border-blue-200',
    pending: 'text-gray-600 bg-gray-50 border-gray-200',
    failed: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">Milestone Progress</span>
          <span className="text-gray-600">
            {completedMilestones} of {totalMilestones} completed
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const StatusIcon = statusIcons[milestone.status];
          const isLast = index === milestones.length - 1;

          return (
            <div key={milestone.id} className="relative">
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-6 top-12 h-8 w-0.5',
                    milestone.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                  )}
                />
              )}
              
              <div className="flex gap-4">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full border-2',
                  statusColors[milestone.status]
                )}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {milestone.fundingPercentage}% funding
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Target: {milestone.targetDate.toLocaleDateString()}</span>
                    <span>Escrow: ${milestone.escrowAmount.toLocaleString()}</span>
                    {milestone.escrowHash && (
                      <span className="font-mono">
                        Hash: {milestone.escrowHash.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}