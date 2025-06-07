import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PricePoint } from '@/types';

interface PriceChartProps {
  data: PricePoint[];
  tokenSymbol: string;
}

export function PriceChart({ data, tokenSymbol }: PriceChartProps) {
  const formatXAxis = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'price') {
      return [`$${Number(value).toFixed(4)}`, 'Price'];
    }
    return [value, name];
  };

  const formatTooltipLabel = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{tokenSymbol}/RLUSD Price Chart</span>
          <span className="text-sm font-normal text-gray-500">24H</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="#666"
                fontSize={12}
              />
              <YAxis
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => `$${value.toFixed(3)}`}
                stroke="#666"
                fontSize={12}
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}