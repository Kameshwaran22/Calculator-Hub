import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { CalculationResult, Currency } from '../types';
import { formatExactCurrency } from '../utils/formatters';

interface ChartViewerProps {
  result: CalculationResult;
  currency: Currency;
  inflationRate?: number;
}

export const ChartViewer: React.FC<ChartViewerProps> = ({
  result,
  currency,
}) => {
  const [selectedChartType, setSelectedChartType] = useState<'area' | 'line' | 'bar' | 'doughnut'>('area');
  
  // Dynamic theme detection for chart styling
  const [isLight, setIsLight] = useState<boolean>(() => {
    return document.documentElement.getAttribute('data-theme') === 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (result?.chartType) {
      const type = result.chartType as string;
      if (type === 'doughnut') {
        setSelectedChartType('doughnut');
      } else if (type === 'line') {
        setSelectedChartType('line');
      } else if (type === 'bar') {
        setSelectedChartType('bar');
      } else {
        setSelectedChartType('area');
      }
    }
  }, [result?.chartType]);

  if (!result || !result.chartData || result.chartData.length === 0) {
    return (
      <div className="h-64 bg-gray-900/50 border border-gray-800 rounded-2xl flex items-center justify-center text-gray-500 text-xs font-mono">
        No graphical projection data available
      </div>
    );
  }

  // Check if chartData is formatted for pie/doughnut vs time-series
  const isDoughnutData = result.chartData.length > 0 && 'value' in result.chartData[0];

  // Derived doughnut data if chartType is doughnut/circle but data is time-series
  const circleChartData = useMemo(() => {
    if (isDoughnutData) return result.chartData;

    // Use summary metrics if available
    if (result.summary) {
      const inv = result.summary.totalInvestment ?? result.summary.investedAmount ?? 0;
      const gain = result.summary.totalReturns ?? result.summary.interestEarned ?? result.summary.totalGain ?? 0;
      if (inv > 0 || gain > 0) {
        return [
          { name: 'Total Invested', value: Math.round(inv) },
          { name: 'Total Returns / Gain', value: Math.max(0, Math.round(gain)) },
        ];
      }
    }

    // Fallback: take last point of time-series data
    if (result.chartData && result.chartData.length > 0 && result.chartKeys) {
      const lastPoint = result.chartData[result.chartData.length - 1];
      const items = result.chartKeys
        .map((k) => ({
          name: k.label,
          value: typeof lastPoint[k.key] === 'number' ? Math.round(lastPoint[k.key] as number) : 0,
        }))
        .filter((item) => item.value > 0);

      if (items.length > 0) return items;
    }

    return [{ name: 'Growth Corpus', value: 100 }];
  }, [result, isDoughnutData]);

  // Theme-Matched Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono z-50 border ${
            isLight
              ? 'bg-white border-gray-200 text-slate-900 shadow-slate-300/50'
              : 'bg-gray-950 border-gray-800 text-gray-100'
          }`}
        >
          {label && (
            <div className={`font-bold border-b pb-1 ${isLight ? 'border-gray-200 text-slate-600' : 'border-gray-800 text-gray-400'}`}>
              {label}
            </div>
          )}
          {payload.map((entry: any, index: number) => {
            return (
              <div key={index} className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color || entry.fill }}
                  />
                  <span className={isLight ? 'text-slate-700' : 'text-gray-300'}>
                    {`${entry.name}:`}
                  </span>
                </div>
                <span className={`font-bold ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>
                  {typeof entry.value === 'number' ? formatExactCurrency(entry.value, currency) : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const COLORS = isLight
    ? ['#ea580c', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0d9488', '#4f46e5']
    : ['#f97316', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#6366f1'];

  const gridColor = isLight ? '#e2e8f0' : '#1f2937';
  const axisColor = isLight ? '#475569' : '#9ca3af';

  return (
    <div className={`p-4 rounded-2xl space-y-3 shadow-xl border transition-colors ${
      isLight ? 'bg-slate-50 border-gray-200/90' : 'bg-black/90 border-gray-800/90'
    }`}>
      {/* Chart View Switcher Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${
        isLight ? 'border-gray-200' : 'border-gray-800/80'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>Growth Trajectory</span>
          </span>
        </div>

        {/* 4 Graph Modes: Area, Line, Bar, Circle */}
        <div className={`flex items-center space-x-1 p-1 rounded-xl border ${
          isLight ? 'bg-white border-gray-200' : 'bg-gray-900/90 border-gray-800'
        }`}>
          <button
            onClick={() => setSelectedChartType('area')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              selectedChartType === 'area'
                ? 'bg-orange-500 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Area</span>
          </button>
          <button
            onClick={() => setSelectedChartType('line')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              selectedChartType === 'line'
                ? 'bg-orange-500 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LineChartIcon className="w-3 h-3" />
            <span>Line</span>
          </button>
          <button
            onClick={() => setSelectedChartType('bar')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              selectedChartType === 'bar'
                ? 'bg-orange-500 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📶 Bar</span>
          </button>
          <button
            onClick={() => setSelectedChartType('doughnut')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              selectedChartType === 'doughnut'
                ? 'bg-orange-500 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <PieChartIcon className="w-3 h-3" />
            <span>Circle</span>
          </button>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {selectedChartType === 'doughnut' ? (
            <PieChart>
              <Pie
                data={circleChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {circleChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={result.chartKeys?.[index]?.color || COLORS[index % COLORS.length]}
                    stroke={isLight ? '#ffffff' : '#000000'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px', color: axisColor }} />
            </PieChart>
          ) : selectedChartType === 'line' ? (
            <LineChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis
                stroke={axisColor}
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) =>
                  typeof val === 'number'
                    ? val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}k`
                      : val
                    : val
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
              {result.chartKeys.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: item.color }}
                  activeDot={{ r: 5 }}
                  name={item.label}
                />
              ))}
            </LineChart>
          ) : selectedChartType === 'area' ? (
            <AreaChart data={result.chartData}>
              <defs>
                {result.chartKeys.map((item, idx) => (
                  <linearGradient key={idx} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={item.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={item.color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis
                stroke={axisColor}
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) =>
                  typeof val === 'number'
                    ? val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}k`
                      : val
                    : val
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
              {result.chartKeys.map((item, idx) => (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#grad-${idx})`}
                  name={item.label}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis
                stroke={axisColor}
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) =>
                  typeof val === 'number'
                    ? val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}k`
                      : val
                    : val
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
              {result.chartKeys.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  fill={item.color}
                  radius={[4, 4, 0, 0]}
                  name={item.label}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

