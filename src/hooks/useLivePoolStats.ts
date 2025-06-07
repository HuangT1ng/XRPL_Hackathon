import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { config } from '@/lib/config';

export const useLivePoolStats = (poolId: string) => {
  const { poolStats, setPoolStats, refreshPoolStats } = useStore();

  useEffect(() => {
    // Initial fetch
    refreshPoolStats(poolId);

    // Set up polling for live data
    const interval = setInterval(() => {
      refreshPoolStats(poolId);
    }, config.app.priceUpdateInterval);

    return () => clearInterval(interval);
  }, [poolId, refreshPoolStats]);

  return poolStats[poolId];
};