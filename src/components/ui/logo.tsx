import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className={cn(
          'rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 p-2',
          sizeClasses[size]
        )}>
          <TrendingUp className="h-full w-full text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 opacity-80" />
      </div>
      {showText && (
        <span className={cn(
          'font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent',
          textSizeClasses[size]
        )}>
          CrowdLift
        </span>
      )}
    </div>
  );
}