'use client';

import { useEffect, useState, useMemo } from 'react';
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

interface TotalVolumeData {
  time: string;
  coin: string;
  total_volume: number;
}

interface NonHlpVolumeData {
  time: string;
  coin: string;
  daily_usd_volume: number;
}

interface ChartData {
  date: string;
  totalVolume: number;
  nonHlpVolume: number;
  nonHlpPercentage: number;
}

export default function VolumeChart() {
  const [allData, setAllData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const [totalRes, nonHlpRes] = await Promise.all([
          fetch('/data/total_volume.json'),
          fetch('/data/daily_nonhlp_usd_volume.json')
        ]);

        const totalData = await totalRes.json();
        const nonHlpData = await nonHlpRes.json();

        const totalByDate = new Map<string, number>();
        totalData.chart_data.forEach((item: TotalVolumeData) => {
          const date = item.time.split('T')[0];
          totalByDate.set(date, (totalByDate.get(date) || 0) + item.total_volume);
        });

        const nonHlpByDate = new Map<string, number>();
        nonHlpData.chart_data.forEach((item: NonHlpVolumeData) => {
          const date = item.time.split('T')[0];
          // Divide by 2 to account for double counting (maker + taker)
          nonHlpByDate.set(date, (nonHlpByDate.get(date) || 0) + item.daily_usd_volume / 2);
        });

        const dates = Array.from(new Set([...totalByDate.keys(), ...nonHlpByDate.keys()]))
          .sort();

        const combined = dates.map(date => {
          const total = totalByDate.get(date) || 0;
          const nonHlp = nonHlpByDate.get(date) || 0;
          let nonHlpPct = total > 0 ? (nonHlp / total) * 100 : 0;
          // Cap percentage at 100%
          nonHlpPct = Math.min(nonHlpPct, 100);
          return {
            date,
            totalVolume: Math.round(total),
            nonHlpVolume: Math.round(nonHlp),
            nonHlpPercentage: nonHlpPct
          };
        });

        setAllData(combined);
        if (combined.length > 0) {
          setStartDate(combined[0].date);
          setEndDate(combined[combined.length - 1].date);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (dateRange === 'all') {
      return allData;
    }
    
    let filteredData = allData;
    const now = new Date();
    
    switch (dateRange) {
      case '7d':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = allData.filter(d => new Date(d.date) >= sevenDaysAgo);
        break;
      case '30d':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = allData.filter(d => new Date(d.date) >= thirtyDaysAgo);
        break;
      case '90d':
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredData = allData.filter(d => new Date(d.date) >= ninetyDaysAgo);
        break;
      case '1y':
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredData = allData.filter(d => new Date(d.date) >= oneYearAgo);
        break;
      case 'custom':
        if (startDate && endDate) {
          filteredData = allData.filter(d => d.date >= startDate && d.date <= endDate);
        }
        break;
    }
    
    return filteredData;
  }, [allData, dateRange, startDate, endDate]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="w-full h-full p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Daily Volume Analysis</h1>
      
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded ${dateRange === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDateRange('all')}
          >
            All Time
          </button>
          <button
            className={`px-4 py-2 rounded ${dateRange === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </button>
          <button
            className={`px-4 py-2 rounded ${dateRange === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </button>
          <button
            className={`px-4 py-2 rounded ${dateRange === '90d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDateRange('90d')}
          >
            90 Days
          </button>
          <button
            className={`px-4 py-2 rounded ${dateRange === '1y' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDateRange('1y')}
          >
            1 Year
          </button>
          <button
            className={`px-4 py-2 rounded ${dateRange === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setDateRange('custom')}
          >
            Custom
          </button>
        </div>
        
        {dateRange === 'custom' && (
          <div className="flex gap-2 items-center">
            <label>From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border rounded"
              min={allData[0]?.date}
              max={allData[allData.length - 1]?.date}
            />
            <label>To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border rounded"
              min={allData[0]?.date}
              max={allData[allData.length - 1]?.date}
            />
          </div>
        )}
      </div>
      
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-center">Volume Comparison</h2>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              tickFormatter={formatValue}
              label={{ value: 'Volume (USD)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => formatValue(value)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalVolume" 
              stroke="#8884d8" 
              name="Total Volume"
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="nonHlpVolume" 
              stroke="#82ca9d" 
              name="Non-HLP Volume"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-center">Non-HLP Volume as % of Total Volume</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              tickFormatter={formatPercentage}
              label={{ value: 'Non-HLP / Total Volume (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
              scale="linear"
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip 
              formatter={(value: number) => formatPercentage(value)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="nonHlpPercentage" 
              stroke="#ff7300" 
              name="Non-HLP Volume / Total Volume"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}