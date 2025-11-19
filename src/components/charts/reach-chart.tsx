"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface ReachChartProps {
  data: Array<{
    date: string;
    reach: number;
    likes: number;
  }>;
}

export function ReachChart({ data }: ReachChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Alcance y Likes por Publicación</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar
            dataKey="reach"
            fill="#3b82f6"
            name="Alcance"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="likes"
            fill="#ec4899"
            name="Likes"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
