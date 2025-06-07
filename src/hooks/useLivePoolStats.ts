import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { mockPoolStats } from '@/data/mockData';

export const useLivePoolStats = (poolId: string) => {
  const { poolStats, setPoolStats } = useStore();

  useEffect(() => {
    // Initialize with mock data
    if (!poolStats[poolId] && mockPoolStats[poolId]) {
      setPoolStats(poolId, mockPoolStats[poolId]);
    }

    // Set up polling for live data (mock implementation)
    const interval = setInterval(() => {
      const currentStats = poolStats[poolId] || mockPoolStats[poolId];
      if (currentStats) {
        // Simulate price fluctuations
        const priceChange = (Math.random() - 0.5) * 0.02; // ±1% change
        const newPrice = currentStats.price * (1 + priceChange);
        
        const updatedStats = {
          ...currentStats,
          price: newPrice,
          priceChange24h: ((newPrice - currentStats.priceHistory[0].price) / currentStats.priceHistory[0].price) * 100,
          priceHistory: [
            ...currentStats.priceHistory.slice(1),
            {
              timestamp: Date.now(),
              price: newPrice,
              volume: currentStats.volume24h + Math.random() * 10000,
            },
          ],
        };
        
        setPoolStats(poolId, updatedStats);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [poolId, poolStats, setPoolStats]);

  return poolStats[poolId];
};