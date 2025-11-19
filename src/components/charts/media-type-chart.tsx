"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface MediaTypeChartProps {
  data: Array<{
    type: string;
    count: number;
    avgEngagement: number;
  }>;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];

const MEDIA_TYPE_LABELS: Record<string, string> = {
  'IMAGE': 'Imágenes',
  'VIDEO': 'Videos',
  'CAROUSEL_ALBUM': 'Carruseles',
  'REELS': 'Reels',
};

export function MediaTypeChart({ data }: MediaTypeChartProps) {
  const chartData = data.map(item => ({
    name: MEDIA_TYPE_LABELS[item.type] || item.type,
    value: item.count,
    engagement: item.avgEngagement.toFixed(2),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Distribución por Tipo de Contenido</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} posts (${props.payload.engagement}% eng.)`,
              props.payload.name
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
