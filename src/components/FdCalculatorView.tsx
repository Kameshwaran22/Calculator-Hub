import React, { useState } from 'react';
import {
  ArrowLeft,
  Landmark,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Activity,
  Download,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Currency } from '../types';
import { formatExactCurrency, exportToCSV } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';
import { triggerSliderHaptic } from '../utils/haptics';
import { InfoTooltip, getTooltipForLabel } from './InfoTooltip';
import { ChartViewer } from './ChartViewer';
import { QuickScenarioTool } from './QuickScenarioTool';

interface FdCalculatorViewProps {
  currency?: Currency;
  onBack: () => void;
}

type ChartMode = 'area' | 'line' | 'circle' | 'table';
type CompoundingFreq = 'Quarterly' | 'Monthly' | 'Half-Yearly' | 'Yearly';

export const FdCalculatorView: React.FC<FdCalculatorViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [principal, setPrincipal] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(7.1);
  const [years, setYears] = useState<number>(5);
  const [frequency, setFrequency] = useState<CompoundingFreq>('Quarterly');
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [chartMode, setChartMode] = useState<ChartMode>('area');

  // Determine compounding frequency value n
  const getFreqValue = (freq: CompoundingFreq) => {
    switch (freq) {
      case 'Monthly':
        return 12;
      case 'Quarterly':
        return 4;
      case 'Half-Yearly':
        return 2;
      case 'Yearly':
        return 1;
    }
  };

  const n = getFreqValue(frequency);
  const r = interestRate / 100;

  // A = P * (1 + r/n)^(n*t)
  const maturityValueRaw = principal * Math.pow(1 + r / n, n * years);
  const interestEarnedRaw = Math.max(0, maturityValueRaw - principal);

  const getInflationAdjusted = (val: number, yr: number) => {
    if (!adjustInflation || inflationRate <= 0) return val;
    return val / Math.pow(1 + inflationRate / 100, yr);
  };

  const finalPrincipal = adjustInflation
    ? getInflationAdjusted(principal, years)
    : principal;
  const finalMaturity = adjustInflation
    ? getInflationAdjusted(maturityValueRaw, years)
    : maturityValueRaw;
  const finalInterest = Math.max(0, finalMaturity - finalPrincipal);

  // Generate Year-by-Year Schedule
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  chartData.push({
    year: 0,
    name: '0',
    Principal: Math.round(adjustInflation ? principal : principal),
    'Maturity Value': Math.round(adjustInflation ? principal : principal),
    'Interest Earned': 0,
  });

  for (let yr = 1; yr <= years; yr++) {
    const matAtYr = principal * Math.pow(1 + r / n, n * yr);
    const dispP = adjustInflation ? getInflationAdjusted(principal, yr) : principal;
    const dispM = adjustInflation ? getInflationAdjusted(matAtYr, yr) : matAtYr;
    const dispI = Math.max(0, dispM - dispP);

    chartData.push({
      year: yr,
      name: `${yr}`,
      Principal: Math.round(dispP),
      'Maturity Value': Math.round(dispM),
      'Interest Earned': Math.round(dispI),
    });

    tableRows.push([
      `Year ${yr}`,
      formatExactCurrency(dispP, currency),
      formatExactCurrency(dispI, currency),
      formatExactCurrency(dispM, currency),
    ]);
  }

  // Pie Data
  const pieData = [
    { name: 'Principal', value: Math.round(finalPrincipal), color: '#64748b' },
    { name: 'Interest Earned', value: Math.round(finalInterest), color: '#10b981' },
  ];

  const formatYAxis = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono">
          <div className="text-gray-400 font-bold border-b border-gray-800 pb-1">
            Year {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-gray-300">{entry.name}:</span>
              </div>
              <span className="font-bold text-white">
                {formatExactCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header matching Screenshot 1 */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All calculators</span>
        </button>

        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-1 shadow-lg">
            <Landmark className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              FD Calculator
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Calculate the maturity value of your Fixed Deposit based on compounding frequency.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        {/* Principal Amount */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Principal Amount ({currency === 'INR' ? '₹' : '$'})</span>
            <InfoTooltip term="Principal Amount" text={getTooltipForLabel('principal')} />
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={isNaN(principal) ? '' : principal}
                min={1000}
                max={10000000}
                step={5000}
                onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={10000}
            max={2000000}
            step={10000}
            value={isNaN(principal) ? 10000 : principal}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setPrincipal(parseFloat(e.target.value) || 10000);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Interest Rate (% p.a.)</span>
            <InfoTooltip term="Interest Rate" text={getTooltipForLabel('interest rate')} />
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
              <input
                type="number"
                value={isNaN(interestRate) ? '' : interestRate}
                min={1}
                max={20}
                step={0.1}
                onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs ml-2">%</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={0.1}
            value={isNaN(interestRate) ? 1 : interestRate}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setInterestRate(parseFloat(e.target.value) || 1);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Tenure */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Tenure (Years)</span>
            <InfoTooltip term="Tenure" text={getTooltipForLabel('tenure')} />
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
              <input
                type="number"
                value={isNaN(years) ? '' : years}
                min={1}
                max={30}
                step={1}
                onChange={(e) => setYears(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs ml-2">yrs</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={isNaN(years) ? 1 : years}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setYears(parseInt(e.target.value) || 1);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Compounding Frequency Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Compounding Frequency</span>
            <InfoTooltip term="Compounding Frequency" text={getTooltipForLabel('compounding frequency')} />
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as CompoundingFreq)}
            className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Quarterly">Quarterly</option>
            <option value="Monthly">Monthly</option>
            <option value="Half-Yearly">Half-Yearly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>

        {/* Adjust for Inflation Toggle */}
        <div className="pt-2 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-200 block">Adjust for Inflation</span>
              <span className="text-[11px] text-gray-400 block mt-0.5">Show value in today's {currency === 'INR' ? '₹' : '$'}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {adjustInflation && (
            <div className="pt-2 space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Inflation Rate</span>
                <span className="font-mono text-emerald-400 font-bold">{inflationRate}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={0.5}
                value={inflationRate}
                onChange={(e) => {
                  triggerSliderHaptic(8, 30);
                  setInflationRate(parseFloat(e.target.value) || 1);
                }}
                onInput={() => triggerSliderHaptic(8, 30)}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-3">
        {/* Top 2 Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Principal */}
          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              PRINCIPAL
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatExactCurrency(finalPrincipal, currency)}
            </div>
          </div>

          {/* Card 2: Interest Earned */}
          <div className="bg-[#121215] border border-emerald-900/60 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              INTEREST EARNED
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatExactCurrency(finalInterest, currency)}
            </div>
          </div>
        </div>

        {/* Card 3: Maturity Value */}
        <div className="bg-[#121215] border border-emerald-800/80 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            MATURITY VALUE
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatExactCurrency(finalMaturity, currency)}
          </div>
        </div>
      </div>

      {/* Growth Over Time Chart with Area, Line, Bar & Circle */}
      <ChartViewer
        result={{
          chartData: chartData.map((d) => ({
            name: d.name,
            'Principal Invested': finalPrincipal,
            'Maturity Value': d['Maturity Value'],
          })),
          chartKeys: [
            { key: 'Principal Invested', label: 'Principal Invested', color: '#3b82f6' },
            { key: 'Maturity Value', label: 'Maturity Value', color: '#10b981' },
          ],
          summary: {
            totalInvestment: finalPrincipal,
            totalReturns: finalInterest,
            maturityValue: finalMaturity,
          },
        }}
        currency={currency}
      />

      {/* Standalone Schedule Breakdown Table Section */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <TableIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">FD Growth Breakdown Schedule</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                generatePdfReport({
                  title: 'Fixed Deposit (FD) Maturity Statement',
                  subtitle: `Principal: ${formatExactCurrency(principal, currency)} | Rate: ${interestRate}% p.a. | Tenure: ${years} Years (${frequency})`,
                  metrics: [
                    { label: 'Initial Principal Deposit', value: formatExactCurrency(principal, currency) },
                    { label: 'Interest Rate', value: `${interestRate}% p.a.` },
                    { label: 'Compounding Frequency', value: frequency },
                    { label: 'Total Interest Earned', value: formatExactCurrency(finalInterest, currency) },
                    { label: 'Final Maturity Value', value: formatExactCurrency(finalMaturity, currency), isHighlight: true },
                  ],
                  tableHeaders: ['Year', 'Principal Amount', 'Interest Earned', 'Total Maturity Value'],
                  tableRows: tableRows.map((r) => [
                    String(r[0]),
                    String(r[1]),
                    String(r[2]),
                    String(r[3]),
                  ]),
                  notes: `Fixed Deposit schedule generated with ${interestRate}% compounding ${frequency.toLowerCase()}. Values are provided for financial planning purposes.`,
                })
              }
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/40 px-3 py-1.5 rounded-xl border border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Export FD Report as PDF"
              aria-label="Export FD Report as PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1e] text-gray-400 font-semibold sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Principal</th>
                <th className="py-2.5 px-3 text-emerald-400">Interest Earned</th>
                <th className="py-2.5 px-3 text-emerald-300 font-bold">Maturity Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2.5 px-3">{row[1]}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">{row[2]}</td>
                  <td className="py-2.5 px-3 text-emerald-300 font-bold">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESET TO DEFAULTS BUTTON */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={() => {
            setPrincipal(100000);
            setInterestRate(7.1);
            setYears(5);
            setFrequency('Quarterly');
            setAdjustInflation(false);
            setInflationRate(6);
            setChartMode('area');
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#121215] hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-800 shadow-lg cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
};
