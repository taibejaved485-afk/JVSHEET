import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../lib/utils';

interface FinancialChartsProps {
  data: {
    name: string;
    value: number;
  }[];
}

export default function FinancialCharts({ data }: FinancialChartsProps) {
  return (
    <div className="h-[300px] w-full bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
          />
          <YAxis 
            axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
            tickFormatter={(value) => `Rs. ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              fontWeight: '600',
              color: '#0f172a'
            }}
            formatter={(value: number) => [formatCurrency(value), 'Volume']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
