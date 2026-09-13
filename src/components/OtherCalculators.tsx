import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calculator,
  ArrowLeft,
  TrendingUp,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { Currency } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';

interface OtherCalculatorsProps {
  currency: Currency;
  onBack?: () => void;
}

type SubTab = 'nsc' | 'lumpsum' | 'cagr' | 'inflation';
type ChartMode = 'area' | 'circle';

export const OtherCalculators: React.FC<OtherCalculatorsProps> = ({ currency, onBack }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('nsc');
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  // NSC State
  const [nscAmount, setNscAmount] = useState<number>(100000);
  const [nscRate, setNscRate] = useState<number>(7.7);

  // Lumpsum State
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [lumpsumRate, setLumpsumRate] = useState<number>(12);
  const [lumpsumYears, setLumpsumYears] = useState<number>(10);

  // CAGR State
  const [cagrStart, setCagrStart] = useState<number>(100000);
  const [cagrEnd, setCagrEnd] = useState<number>(250000);
  const [cagrYears, setCagrYears] = useState<number>(7);

  // Inflation State
  const [inflationCost, setInflationCost] = useState<number>(100000);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [inflationYears, setInflationYears] = useState<number>(10);

  // Calculations
  // NSC
  const nscMaturity = nscAmount * Math.pow(1 + nscRate / 100, 5);
  const nscInterest = nscMaturity - nscAmount;

  // Lumpsum
  const lumpsumFuture = lumpsumAmount * Math.pow(1 + lumpsumRate / 100, lumpsumYears);
  const lumpsumGain = lumpsumFuture - lumpsumAmount;

  // CAGR
  const cagrValue =
    cagrStart > 0 && cagrEnd > 0 && cagrYears > 0
      ? (Math.pow(cagrEnd / cagrStart, 1 / cagrYears) - 1) * 100
      : 0;

  // Inflation
  const inflationFutureCost = inflationCost * Math.pow(1 + inflationRate / 100, inflationYears);

  const prefix = currency === 'INR' ? '₹' : '$';
  const COLORS = ['#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308'];

  // Helper function to build dynamic data for current subtab
  const getSubtabData = () => {
    const chartData: any[] = [];
    const tableRows: (string | number)[][] = [];

    if (activeTab === 'nsc') {
      const years = 5;
      const steps = frequency === 'yearly' ? years : years * 12;

      for (let i = 0; i <= steps; i++) {
        const yr = frequency === 'yearly' ? i : i / 12;
        const val = nscAmount * Math.pow(1 + nscRate / 100, yr);
        const gain = val - nscAmount;
        const label = frequency === 'yearly' ? `Yr ${i}` : `M${i}`;

        chartData.push({
          label,
          Invested: Math.round(nscAmount),
          'Current Value': Math.round(val),
        });

        if (i > 0) {
          tableRows.push([
            frequency === 'yearly' ? `Year ${i}` : `Month ${i}`,
            formatExactCurrency(nscAmount, currency),
            formatExactCurrency(gain, currency),
            formatExactCurrency(val, currency),
          ]);
        }
      }
    } else if (activeTab === 'lumpsum') {
      const steps = frequency === 'yearly' ? lumpsumYears : lumpsumYears * 12;

      for (let i = 0; i <= steps; i++) {
        const yr = frequency === 'yearly' ? i : i / 12;
        const val = lumpsumAmount * Math.pow(1 + lumpsumRate / 100, yr);
        const gain = val - lumpsumAmount;
        const label = frequency === 'yearly' ? `Yr ${i}` : `M${i}`;

        chartData.push({
          label,
          Invested: Math.round(lumpsumAmount),
          'Current Value': Math.round(val),
        });

        if (i > 0) {
          tableRows.push([
            frequency === 'yearly' ? `Year ${i}` : `Month ${i}`,
            formatExactCurrency(lumpsumAmount, currency),
            formatExactCurrency(gain, currency),
            formatExactCurrency(val, currency),
          ]);
        }
      }
    } else if (activeTab === 'cagr') {
      const steps = frequency === 'yearly' ? cagrYears : cagrYears * 12;
      const rate = cagrValue / 100;

      for (let i = 0; i <= steps; i++) {
        const yr = frequency === 'yearly' ? i : i / 12;
        const val = cagrStart * Math.pow(1 + rate, yr);
        const gain = val - cagrStart;
        const label = frequency === 'yearly' ? `Yr ${i}` : `M${i}`;

        chartData.push({
          label,
          Invested: Math.round(cagrStart),
          'Current Value': Math.round(val),
        });

        if (i > 0) {
          tableRows.push([
            frequency === 'yearly' ? `Year ${i}` : `Month ${i}`,
            formatExactCurrency(cagrStart, currency),
            formatExactCurrency(gain, currency),
            formatExactCurrency(val, currency),
          ]);
        }
      }
    } else if (activeTab === 'inflation') {
      const steps = frequency === 'yearly' ? inflationYears : inflationYears * 12;

      for (let i = 0; i <= steps; i++) {
        const yr = frequency === 'yearly' ? i : i / 12;
        const val = inflationCost * Math.pow(1 + inflationRate / 100, yr);
        const inc = val - inflationCost;
        const label = frequency === 'yearly' ? `Yr ${i}` : `M${i}`;

        chartData.push({
          label,
          'Base Cost': Math.round(inflationCost),
          'Future Cost': Math.round(val),
        });

        if (i > 0) {
          tableRows.push([
            frequency === 'yearly' ? `Year ${i}` : `Month ${i}`,
            formatExactCurrency(inflationCost, currency),
            formatExactCurrency(inc, currency),
            formatExactCurrency(val, currency),
          ]);
        }
      }
    }

    return { chartData, tableRows };
  };

  const { chartData, tableRows } = getSubtabData();

  const pieData = [
    { name: 'Initial Capital', value: activeTab === 'inflation' ? inflationCost : (activeTab === 'cagr' ? cagrStart : (activeTab === 'lumpsum' ? lumpsumAmount : nscAmount)) },
    { name: 'Growth / Gain', value: activeTab === 'inflation' ? inflationFutureCost - inflationCost : (activeTab === 'cagr' ? cagrEnd - cagrStart : (activeTab === 'lumpsum' ? lumpsumGain : nscInterest)) },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Navigation Back Header */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All calculators</span>
        </button>
      )}

      {/* Hero Header */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl flex items-start space-x-4 shadow-xl">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Other Calculators</h2>
          <p className="text-xs text-gray-400 mt-1">
            Quick multi-tool suite for NSC certificates, Lump Sum growth, CAGR annual return rates, and Inflation erosion calculations.
          </p>
        </div>
      </div>

      {/* Subtab Selector */}
      <div className="flex items-center space-x-2 bg-gray-950 border border-gray-800 p-1.5 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('nsc')}
          className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'nsc'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          NSC
        </button>
        <button
          onClick={() => setActiveTab('lumpsum')}
          className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'lumpsum'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Lumpsum
        </button>
        <button
          onClick={() => setActiveTab('cagr')}
          className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cagr'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          CAGR
        </button>
        <button
          onClick={() => setActiveTab('inflation')}
          className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inflation'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Inflation
        </button>
      </div>

      {/* TAB 1: NSC */}
      {activeTab === 'nsc' && (
        <div className="space-y-6">
          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="border-b border-gray-800/80 pb-2">
              <h3 className="text-xs font-bold text-gray-300">National Savings Certificate (NSC)</h3>
              <p className="text-[10px] text-gray-500">Government-backed 5-year fixed maturity investment scheme.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Investment Amount ({prefix})
                </label>
                <input
                  type="number"
                  value={nscAmount}
                  onChange={(e) => setNscAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Principal invested at start</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nscRate}
                  onChange={(e) => setNscRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Annual compounding rate fixed for 5 years</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">MATURITY (5 YRS, FIXED)</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
                {formatExactCurrency(nscMaturity, currency)}
              </div>
              <p className="text-[10px] text-gray-500">Total payout at 5-year completion</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">INTEREST EARNED</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
                {formatExactCurrency(nscInterest, currency)}
              </div>
              <p className="text-[10px] text-gray-500">Net interest compounded over 5 years</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LUMPSUM */}
      {activeTab === 'lumpsum' && (
        <div className="space-y-6">
          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="border-b border-gray-800/80 pb-2">
              <h3 className="text-xs font-bold text-gray-300">Lump Sum Growth Calculator</h3>
              <p className="text-[10px] text-gray-500">Calculate long-term compound growth on one-time investments.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Lump Sum Amount ({prefix})
                </label>
                <input
                  type="number"
                  value={lumpsumAmount}
                  onChange={(e) => setLumpsumAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">One-time initial deposit</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Expected Return (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={lumpsumRate}
                  onChange={(e) => setLumpsumRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Assumed annual rate of return</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Time Period (Years)
                </label>
                <input
                  type="number"
                  value={lumpsumYears}
                  onChange={(e) => setLumpsumYears(parseInt(e.target.value) || 1)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Investment horizon in years</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">FUTURE VALUE</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
                {formatExactCurrency(lumpsumFuture, currency)}
              </div>
              <p className="text-[10px] text-gray-500">Total wealth at end of period</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">ESTIMATED GAIN</span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
                {formatExactCurrency(lumpsumGain, currency)}
              </div>
              <p className="text-[10px] text-gray-500">Net profit generated</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAGR */}
      {activeTab === 'cagr' && (
        <div className="space-y-6">
          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="border-b border-gray-800/80 pb-2">
              <h3 className="text-xs font-bold text-gray-300">Compound Annual Growth Rate (CAGR)</h3>
              <p className="text-[10px] text-gray-500">Calculate the annual growth rate required to get from initial to final value.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Starting Value ({prefix})
                </label>
                <input
                  type="number"
                  value={cagrStart}
                  onChange={(e) => setCagrStart(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Initial investment value</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Ending Value ({prefix})
                </label>
                <input
                  type="number"
                  value={cagrEnd}
                  onChange={(e) => setCagrEnd(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Final value achieved</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Time Period (Years)
                </label>
                <input
                  type="number"
                  value={cagrYears}
                  onChange={(e) => setCagrYears(parseInt(e.target.value) || 1)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Duration between start and end date</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-1 shadow-xl">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">CAGR (ANNUALIZED RETURN)</span>
            <div className="text-2xl md:text-3xl font-bold font-mono text-emerald-400">
              {cagrValue.toFixed(2)}%
            </div>
            <p className="text-[10px] text-gray-500">Effective rate of return compounded per year</p>
          </div>
        </div>
      )}

      {/* TAB 4: INFLATION */}
      {activeTab === 'inflation' && (
        <div className="space-y-6">
          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="border-b border-gray-800/80 pb-2">
              <h3 className="text-xs font-bold text-gray-300">Inflation Erosion Calculator</h3>
              <p className="text-[10px] text-gray-500">Determine how much purchasing power will decline and cost of living rise.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Today's Cost ({prefix})
                </label>
                <input
                  type="number"
                  value={inflationCost}
                  onChange={(e) => setInflationCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Current price of item or expense</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Inflation Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={inflationRate}
                  onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Annual CPI / price rise percentage</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Years Ahead
                </label>
                <input
                  type="number"
                  value={inflationYears}
                  onChange={(e) => setInflationYears(parseInt(e.target.value) || 1)}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">Time horizon in future years</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-1 shadow-xl">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">FUTURE ESTIMATED COST</span>
            <div className="text-2xl md:text-3xl font-bold font-mono text-red-400">
              {formatExactCurrency(inflationFutureCost, currency)}
            </div>
            <p className="text-[10px] text-gray-500">Required budget to buy the same items after {inflationYears} years</p>
          </div>
        </div>
      )}

      {/* GRAPH VISUALIZER SUITE CARD */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-xs font-bold text-gray-300 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{activeTab.toUpperCase()} Projection Graph</span>
            </h3>

            {/* Frequency Switcher: Yearly vs Monthly */}
            <div className="flex items-center bg-gray-900 p-0.5 rounded-lg border border-gray-800">
              <button
                onClick={() => setFrequency('yearly')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'yearly'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setFrequency('monthly')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Chart Mode Switcher Buttons: Area -> Circle */}
          <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setChartMode('area')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                chartMode === 'area'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Area</span>
            </button>
            <button
              onClick={() => setChartMode('circle')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                chartMode === 'circle'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>
          </div>
        </div>

        {/* CHART VIEW 2: AREA CHART */}
        {chartMode === 'area' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={10} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={10}
                  tickFormatter={(val) => formatCurrency(val, currency)}
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                          <p className="text-gray-400 font-bold border-b border-gray-800 pb-1">{label}</p>
                          {payload.map((p: any) => (
                            <div key={p.name} className="flex items-center justify-between space-x-4">
                              <span style={{ color: p.color }} className="font-semibold">
                                {p.name}:
                              </span>
                              <span className="text-white font-bold">
                                {formatExactCurrency(p.value, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {activeTab === 'inflation' ? (
                  <Area type="monotone" dataKey="Future Cost" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                ) : (
                  <Area type="monotone" dataKey="Current Value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CHART VIEW 3: CIRCLE CHART */}
        {chartMode === 'circle' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="#000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl shadow-xl text-xs font-mono">
                          <span className="text-gray-300">{payload[0].name}: </span>
                          <span className="font-bold text-emerald-400 ml-1">
                            {formatExactCurrency(payload[0].value, currency)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SEPARATE TABLE SECTION BELOW */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-3 shadow-xl">
        <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
          <div>
            <h3 className="text-xs font-bold text-gray-300">{activeTab.toUpperCase()} Schedule Table</h3>
            <p className="text-[10px] text-gray-500">Periodic breakdown table</p>
          </div>
          <button
            onClick={() =>
              generatePdfReport({
                title: `${activeTab.toUpperCase()} Investment Schedule Report`,
                subtitle: `Projections for ${activeTab.toUpperCase()} calculator mode`,
                metrics: [
                  { label: 'Calculator Mode', value: activeTab.toUpperCase() },
                  { label: 'Export Date', value: new Date().toLocaleDateString() },
                  { label: 'Primary Currency', value: String(currency), isHighlight: true },
                ],
                tableHeaders: ['Timeline', 'Base Amount', 'Est. Gain / Inflation', 'Final Projected Value'],
                tableRows: tableRows.map((row) => [
                  String(row[0]),
                  String(row[1]),
                  String(row[2]),
                  String(row[3]),
                ]),
                notes: 'Generated by Calculator Hub Utility Engine.',
              })
            }
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-64 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 font-semibold sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3">Initial Base</th>
                <th className="py-2.5 px-3 text-emerald-400">Est. Gain/Erosion</th>
                <th className="py-2.5 px-3 text-emerald-400">Final Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2 px-3">{row[1]}</td>
                  <td className="py-2 px-3 text-emerald-400">{row[2]}</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">{row[3]}</td>
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
            setNscAmount(100000);
            setNscRate(7.7);
            setLumpsumAmount(100000);
            setLumpsumRate(12);
            setLumpsumYears(10);
            setCagrStart(100000);
            setCagrEnd(250000);
            setCagrYears(7);
            setInflationCost(100000);
            setInflationRate(6);
            setInflationYears(10);
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
