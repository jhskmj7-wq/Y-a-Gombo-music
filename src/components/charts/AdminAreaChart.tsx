import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface AdminAreaChartProps {
  data: any[];
}

export default function AdminAreaChart({ data }: AdminAreaChartProps) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#ffffff40" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#ffffff40" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => typeof value === 'number' ? `${Math.round(value / 1000)}k` : String(value || '')}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #D4AF3730',
              borderRadius: '12px',
              fontSize: '11px'
            }}
            itemStyle={{ color: '#D4AF37' }}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#D4AF37" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
