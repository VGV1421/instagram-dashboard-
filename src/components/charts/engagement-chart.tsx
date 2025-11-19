"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface EngagementChartProps {
  data: Array<{
    date: string;
    engagement: number;
    reach?: number;
  }>;
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Evolución del Engagement Rate</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Engagement']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Engagement Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
