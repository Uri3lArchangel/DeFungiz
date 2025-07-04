'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  timeLabels: string[];
  volumeData: number[];
  userData: number[];
}

const CustomLineChart = ({ data }: { data: ChartData }) => {
  const chartData = data.timeLabels.map((label, index) => ({
    name: label,
    volume: data.volumeData[index],
    users: data.userData[index]
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#a0aec0' }} 
          tickMargin={10}
        />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          tick={{ fill: '#a0aec0' }}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fill: '#a0aec0' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1a202c',
            borderColor: '#2d3748',
            borderRadius: '0.5rem'
          }}
          formatter={(value, name) => {
            if (name === 'volume') {
              return [`$${Number(value).toLocaleString()}`, 'Volume'];
            }
            return [value, 'Active Users'];
          }}
          labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="volume"
          stroke="#0ea5e9"
          strokeWidth={2}
          activeDot={{ r: 8 }}
          name="Trading Volume"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="users"
          stroke="#10b981"
          strokeWidth={2}
          name="Active Users"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CustomLineChart;