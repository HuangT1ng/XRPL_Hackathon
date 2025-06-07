import { useState, useEffect } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface SwapWidgetProps {
  tokenSymbol: string;
  tokenPrice: number;
  priceChange24h: number;
}

export function SwapWidget({ tokenSymbol, tokenPrice, priceChange24h }: SwapWidgetProps) {
  const { 
    wallet, 
    executeSwap, 
    executePartialExit, 
    refreshPoolStats,
    isLoading,
    error 
  } = useStore();

  const [fromToken, setFromToken] = useState('RLUSD');
  const [toToken, setToToken] = useState(tokenSymbol);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(2);
  const [priceImpact, setPriceImpact] = useState(0);
  const [showPartialExit, setShowPartialExit] = useState(false);
  const [exitPercentage, setExitPercentage] = useState([25]);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    if (wallet.isConnected) {
      // Fetch user's token balance
      fetchUserBalance();
    }
  }, [wallet.isConnected, tokenSymbol]);

  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      calculateToAmount();
    }
  }, [fromAmount, fromToken, toToken]);

  const fetchUserBalance = async () => {
    try {
      // This would fetch real balance from XRPL
      // For now, using mock data
      setUserBalance(1000);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const calculateToAmount = async () => {
    try {
      const amount = parseFloat(fromAmount);
      if (amount <= 0) return;

      // Calculate expected output and price impact
      // This would use the trading service to get real quotes
      const expectedOutput = amount * tokenPrice;
      const impact = (amount / 100000) * 100; // Mock price impact calculation
      
      setToAmount(expectedOutput.toFixed(6));
      setPriceImpact(impact);
    } catch (error) {
      console.error('Error calculating output:', error);
    }
  };

  const handleSwap = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const result = await executeSwap(
        fromToken,
        toToken,
        parseFloat(fromAmount),
        slippage
      );

      toast.success('Swap executed successfully!');
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      
      // Refresh data
      await refreshPoolStats(`${fromToken}/${toToken}`);
      await fetchUserBalance();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    }
  };

  const handlePartialExit = async () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const percentage = exitPercentage[0];
      const result = await executePartialExit(tokenSymbol, percentage);
      
      toast.success(`Successfully sold ${percentage}% of your ${tokenSymbol} tokens!`);
      
      // Refresh data
      await fetchUserBalance();
      await refreshPoolStats(`${tokenSymbol}/RLUSD`);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Partial exit failed');
    }
  };

  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const isPricePositive = priceChange24h >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trade {tokenSymbol}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isPricePositive ? "default" : "destructive"}>
              {isPricePositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {isPricePositive ? '+' : ''}{priceChange24h.toFixed(2)}%
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPartialExit(!showPartialExit)}
            >
              <Sliders className="h-4 w-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
        <div className="text-2xl font-bold">${tokenPrice.toFixed(4)}</div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {showPartialExit ? (
          // Partial Exit Interface
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium mb-2">Partial Exit</h3>
              <p className="text-sm text-gray-600">
                Sell a percentage of your {tokenSymbol} holdings
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Your Balance:</span>
                <span>{userBalance.toLocaleString()} {tokenSymbol}</span>
              </div>
              
              <div className="space-y-2">
                <Label>Exit Percentage: {exitPercentage[0]}%</Label>
                <Slider
                  value={exitPercentage}
                  onValueChange={setExitPercentage}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Tokens to sell:</span>
                  <span>{((userBalance * exitPercentage[0]) / 100).toFixed(2)} {tokenSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated RLUSD:</span>
                  <span>${((userBalance * exitPercentage[0] * tokenPrice) / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handlePartialExit} 
              disabled={isLoading || !wallet.isConnected}
              className="w-full"
            >
              {isLoading ? 'Processing...' : `Sell ${exitPercentage[0]}% of Holdings`}
            </Button>
          </div>
        ) : (
          // Regular Swap Interface
          <div className="space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <Label htmlFor="from-amount">From</Label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    id="from-amount"
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Button variant="outline" className="w-full h-10">
                    {fromToken}
                  </Button>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={swapTokens}
                className="rounded-full p-2"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <Label htmlFor="to-amount">To</Label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    id="to-amount"
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    readOnly
                  />
                </div>
                <div className="w-20">
                  <Button variant="outline" className="w-full h-10">
                    {toToken}
                  </Button>
                </div>
              </div>
            </div>

            {/* Price Impact & Slippage */}
            {fromAmount && parseFloat(fromAmount) > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Price Impact:</span>
                  <span className={priceImpact > 5 ? 'text-red-600' : 'text-green-600'}>
                    {priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage Tolerance:</span>
                  <span>{slippage}%</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Slippage Settings */}
            <div className="space-y-2">
              <Label>Slippage Tolerance: {slippage}%</Label>
              <div className="flex space-x-2">
                {[0.5, 1, 2, 5].map((value) => (
                  <Button
                    key={value}
                    variant={slippage === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSlippage(value)}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSwap} 
              disabled={isLoading || !wallet.isConnected || !fromAmount}
              className="w-full"
            >
              {isLoading ? 'Swapping...' : 
               !wallet.isConnected ? 'Connect Wallet' : 
               !fromAmount ? 'Enter Amount' : 
               `Swap ${fromToken} for ${toToken}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}