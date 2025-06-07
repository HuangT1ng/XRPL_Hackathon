import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import { mockPortfolio } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function Portfolio() {
  const { portfolio, setPortfolio, wallet, connectWallet } = useStore();

  useEffect(() => {
    if (wallet.isConnected) {
      setPortfolio(mockPortfolio);
    }
  }, [wallet.isConnected, setPortfolio]);

  if (!wallet.isConnected) {
    return (
      <div className="container mx-auto px-6 py-24">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Portfolio</h1>
          <p className="text-gray-600">Connect your wallet using the button in the header to view your portfolio</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="container mx-auto px-6 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading Portfolio...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
        <p className="text-gray-600 mt-2">Track your investments and liquidity positions</p>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${portfolio.totalValue.toLocaleString()}
              </div>
              <div className={cn(
                'flex items-center mt-1 text-sm',
                portfolio.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {portfolio.totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                ${Math.abs(portfolio.totalPnL).toLocaleString()} (
                {((portfolio.totalPnL / (portfolio.totalValue - portfolio.totalPnL)) * 100).toFixed(2)}%)
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Token Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {portfolio.holdings.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Active positions
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">LP Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {portfolio.liquidityPositions.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Providing liquidity
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Token Holdings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Token Holdings</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Buy Tokens
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.holdings.map((holding) => (
                <div key={holding.campaignId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary-600">{holding.tokenSymbol}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{holding.tokenSymbol}</div>
                      <div className="text-sm text-gray-500">
                        {holding.quantity.toLocaleString()} tokens
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${holding.totalValue.toLocaleString()}
                    </div>
                    <div className={cn(
                      'text-sm flex items-center',
                      holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {holding.pnl >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {holding.pnlPercentage >= 0 ? '+' : ''}{holding.pnlPercentage.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Avg Cost</div>
                    <div className="font-medium">${holding.averageCost.toFixed(2)}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Current Price</div>
                    <div className="font-medium">${holding.currentPrice.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Liquidity Positions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Liquidity Positions</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Liquidity
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolio.liquidityPositions.map((position) => (
                <div key={position.poolId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600 border-2 border-white">
                        {position.tokenA}
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white">
                        {position.tokenB}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {position.tokenA}/{position.tokenB}
                      </div>
                      <div className="text-sm text-gray-500">Pool ID: {position.poolId}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${position.currentValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Current Value</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      ${position.feesEarned.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Fees Earned</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{position.apr}%</div>
                    <div className="text-sm text-gray-500">APR</div>
                  </div>
                  
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Refunds */}
      {portfolio.pendingRefunds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pending Refunds
                <Badge variant="secondary">{portfolio.pendingRefunds.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.pendingRefunds.map((refund) => (
                  <div key={refund.campaignId} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <div>
                      <div className="font-medium text-gray-900">Campaign #{refund.campaignId}</div>
                      <div className="text-sm text-gray-600">{refund.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">${refund.amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        Available {refund.availableAt.toLocaleDateString()}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      disabled={refund.status !== 'claimable'}
                      variant="outline"
                    >
                      {refund.status === 'claimable' ? 'Claim' : 'Pending'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}