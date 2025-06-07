import { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';

interface SwapWidgetProps {
  tokenSymbol: string;
  tokenPrice: number;
  priceChange24h: number;
  onSwap?: (fromToken: string, toToken: string, amount: number) => void;
}

export function SwapWidget({ tokenSymbol, tokenPrice, priceChange24h, onSwap }: SwapWidgetProps) {
  const [swapDirection, setSwapDirection] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const { wallet } = useStore();

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && !isNaN(Number(value))) {
      const numValue = Number(value);
      if (swapDirection === 'buy') {
        setEstimatedOutput((numValue / tokenPrice).toFixed(6));
      } else {
        setEstimatedOutput((numValue * tokenPrice).toFixed(2));
      }
    } else {
      setEstimatedOutput('');
    }
  };

  const handleSwap = () => {
    if (amount && estimatedOutput && onSwap) {
      const fromToken = swapDirection === 'buy' ? 'RLUSD' : tokenSymbol;
      const toToken = swapDirection === 'buy' ? tokenSymbol : 'RLUSD';
      onSwap(fromToken, toToken, Number(amount));
    }
  };

  const flipDirection = () => {
    setSwapDirection(swapDirection === 'buy' ? 'sell' : 'buy');
    setAmount('');
    setEstimatedOutput('');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trade {tokenSymbol}</CardTitle>
          <Badge variant={priceChange24h >= 0 ? 'default' : 'destructive'} className="gap-1">
            {priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(priceChange24h).toFixed(2)}%
          </Badge>
        </div>
        <div className="text-2xl font-bold text-primary-600">
          ${tokenPrice.toFixed(4)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">From</span>
            <span className="text-gray-500">
              Balance: {wallet.isConnected ? '10,000' : '--'} {swapDirection === 'buy' ? 'RLUSD' : tokenSymbol}
            </span>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 bg-gray-50">
              <span className="font-medium text-sm">
                {swapDirection === 'buy' ? 'RLUSD' : tokenSymbol}
              </span>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={flipDirection}
            className="rounded-full h-8 w-8 p-0"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">To</span>
            <span className="text-gray-500">
              Balance: {wallet.isConnected ? '0.00' : '--'} {swapDirection === 'buy' ? tokenSymbol : 'RLUSD'}
            </span>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="0.00"
              value={estimatedOutput}
              readOnly
              className="flex-1 bg-gray-50"
            />
            <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 bg-gray-50">
              <span className="font-medium text-sm">
                {swapDirection === 'buy' ? tokenSymbol : 'RLUSD'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Transaction Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Rate</span>
            <span>1 {tokenSymbol} = ${tokenPrice.toFixed(4)} RLUSD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Network Fee</span>
            <span>~0.00001 XRP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price Impact</span>
            <span className="text-green-600">{'<0.01%'}</span>
          </div>
        </div>

        <Button
          onClick={handleSwap}
          disabled={!wallet.isConnected || !amount || !estimatedOutput}
          className="w-full bg-primary-600 hover:bg-primary-700"
        >
          {!wallet.isConnected 
            ? 'Connect Wallet' 
            : swapDirection === 'buy' 
              ? `Buy ${tokenSymbol}` 
              : `Sell ${tokenSymbol}`
          }
        </Button>
      </CardContent>
    </Card>
  );
}