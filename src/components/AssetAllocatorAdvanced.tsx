import React, { useState } from 'react';
import {
  ArrowLeft,
  PieChart as PieChartIcon,
  Sliders,
  FileText,
  RotateCcw,
  TrendingUp,
  LineChart as LineChartIcon,
  Download,
  Activity,
  Scale,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AllocatorState, Currency } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';
import { QuickScenarioTool } from './QuickScenarioTool';

interface AssetAllocatorAdvancedProps {
  state: AllocatorState;
  onChangeState: (newState: AllocatorState) => void;
  currency: Currency;
  onBack?: () => void;
}

type ChartMode = 'circle' | 'area';

// Reusable Percentage Input Component with Dark Mode Styling
const PercentageInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-medium text-gray-400 block">{label}</label>
    <div className="relative flex items-center bg-black border border-gray-800 rounded-xl px-3 py-2 focus-within:border-emerald-500 transition-colors">
      <input
        type="number"
        value={isNaN(value) ? '' : value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onChange(isNaN(val) ? 0 : val);
        }}
        className="w-full bg-transparent text-xs font-bold text-white focus:outline-none font-mono"
      />
      <span className="text-xs text-gray-500 font-bold ml-1">%</span>
    </div>
  </div>
);

// Reusable Allocation Block for Conservative, Moderate, Aggressive
const ProfileAllocationBlock: React.FC<{
  title: string;
  weights: { equity: number; debt: number; gold: number; silver: number; cash: number };
  onChange: (newWeights: { equity: number; debt: number; gold: number; silver: number; cash: number }) => void;
}> = ({ title, weights, onChange }) => {
  const total =
    (weights.equity || 0) +
    (weights.debt || 0) +
    (weights.gold || 0) +
    (weights.silver || 0) +
    (weights.cash || 0);

  const isHundred = Math.abs(total - 100) < 0.01;

  return (
    <div className="space-y-2.5 bg-black/60 border border-gray-800/80 p-3.5 rounded-xl">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-white">{title}</h5>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
            isHundred
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
              : 'bg-red-950/80 text-red-400 border border-red-800'
          }`}
        >
          Total: {total}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <PercentageInput
          label="Equity"
          value={weights.equity}
          onChange={(val) => onChange({ ...weights, equity: val })}
        />
        <PercentageInput
          label="Debt"
          value={weights.debt}
          onChange={(val) => onChange({ ...weights, debt: val })}
        />
        <PercentageInput
          label="Gold"
          value={weights.gold}
          onChange={(val) => onChange({ ...weights, gold: val })}
        />
        <PercentageInput
          label="Silver"
          value={weights.silver}
          onChange={(val) => onChange({ ...weights, silver: val })}
        />
        <PercentageInput
          label="Cash"
          value={weights.cash}
          onChange={(val) => onChange({ ...weights, cash: val })}
        />
      </div>
    </div>
  );
};

export const AssetAllocatorAdvanced: React.FC<AssetAllocatorAdvancedProps> = ({
  state,
  onChangeState,
  currency,
  onBack,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  // Default chart is 'circle' (donut/pie allocation chart coming first) as requested
  const [chartMode, setChartMode] = useState<ChartMode>('circle');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  // Return Assumptions (% p.a.)
  const [returns, setReturns] = useState({
    equity: 13,
    debt: 6,
    gold: 11,
    silver: 12,
    cash: 3,
  });

  // Allocation Weights for Profiles
  const [weights, setWeights] = useState({
    conservative: { equity: 20, debt: 50, gold: 15, silver: 5, cash: 10 },
    moderate: { equity: 45, debt: 30, gold: 15, silver: 5, cash: 5 },
    aggressive: { equity: 70, debt: 10, gold: 10, silver: 5, cash: 5 },
  });

  const selectedProfile = state.riskProfile === 'custom' ? 'moderate' : state.riskProfile;
  const currentWeights = weights[selectedProfile as keyof typeof weights] || weights.moderate;

  // Calculate blended annual return % for a given weight set
  const getBlendedReturn = (w: typeof currentWeights) => {
    const totalW = w.equity + w.debt + w.gold + w.silver + w.cash;
    if (totalW <= 0) return 0;
    return (
      (w.equity * returns.equity +
        w.debt * returns.debt +
        w.gold * returns.gold +
        w.silver * returns.silver +
        w.cash * returns.cash) /
      totalW
    );
  };

  const blendedReturnPct = getBlendedReturn(currentWeights);
  const conservativeReturnPct = getBlendedReturn(weights.conservative);
  const moderateReturnPct = getBlendedReturn(weights.moderate);
  const aggressiveReturnPct = getBlendedReturn(weights.aggressive);

  // Future value calculation
  const capital = state.capital || 0;
  const years = state.years || 1;
  const inflationRate = state.inflationRate || 0;
  const adjustInflation = state.adjustInflation;

  const calculateFutureVal = (ratePct: number, yr: number) => {
    const nominal = capital * Math.pow(1 + ratePct / 100, yr);
    if (adjustInflation && inflationRate > 0) {
      return nominal / Math.pow(1 + inflationRate / 100, yr);
    }
    return nominal;
  };

  const projectedVal = calculateFutureVal(blendedReturnPct, years);

  // Donut chart data for current selected profile
  const donutData = [
    { name: 'Equity', value: currentWeights.equity, color: '#10b981', amount: (capital * currentWeights.equity) / 100 },
    { name: 'Debt', value: currentWeights.debt, color: '#3b82f6', amount: (capital * currentWeights.debt) / 100 },
    { name: 'Gold', value: currentWeights.gold, color: '#eab308', amount: (capital * currentWeights.gold) / 100 },
    { name: 'Silver', value: currentWeights.silver, color: '#9ca3af', amount: (capital * currentWeights.silver) / 100 },
    { name: 'Cash', value: currentWeights.cash, color: '#06b6d4', amount: (capital * currentWeights.cash) / 100 },
  ].filter((d) => d.value > 0);

  // Chart & Schedule data generation (Yearly vs Monthly)
  const totalMonths = years * 12;
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  if (frequency === 'yearly') {
    for (let yr = 0; yr <= years; yr++) {
      const consVal = calculateFutureVal(conservativeReturnPct, yr);
      const modVal = calculateFutureVal(moderateReturnPct, yr);
      const aggVal = calculateFutureVal(aggressiveReturnPct, yr);

      chartData.push({
        year: `Yr ${yr}`,
        yrNum: yr,
        Conservative: Math.round(consVal),
        Moderate: Math.round(modVal),
        Aggressive: Math.round(aggVal),
      });

      if (yr > 0) {
        tableRows.push([
          `Year ${yr}`,
          formatExactCurrency(consVal, currency),
          formatExactCurrency(modVal, currency),
          formatExactCurrency(aggVal, currency),
        ]);
      }
    }
  } else {
    for (let m = 0; m <= totalMonths; m++) {
      const yr = m / 12;
      const consVal = calculateFutureVal(conservativeReturnPct, yr);
      const modVal = calculateFutureVal(moderateReturnPct, yr);
      const aggVal = calculateFutureVal(aggressiveReturnPct, yr);

      chartData.push({
        year: `M${m}`,
        yrNum: yr.toFixed(1),
        Conservative: Math.round(consVal),
        Moderate: Math.round(modVal),
        Aggressive: Math.round(aggVal),
      });

      if (m > 0) {
        tableRows.push([
          `Month ${m}`,
          formatExactCurrency(consVal, currency),
          formatExactCurrency(modVal, currency),
          formatExactCurrency(aggVal, currency),
        ]);
      }
    }
  }

  const resetDefaults = () => {
    setReturns({ equity: 13, debt: 6, gold: 11, silver: 12, cash: 3 });
    setWeights({
      conservative: { equity: 20, debt: 50, gold: 15, silver: 5, cash: 10 },
      moderate: { equity: 45, debt: 30, gold: 15, silver: 5, cash: 5 },
      aggressive: { equity: 70, debt: 10, gold: 10, silver: 5, cash: 5 },
    });
  };

  const prefix = currency === 'INR' ? '₹' : '$';

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
          <PieChartIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Investment Allocator</h2>
          <p className="text-xs text-gray-400 mt-1">
            Compare Conservative, Moderate & Aggressive allocation profiles and analyze growth over time.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Input Form & Advanced Settings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-5 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-gray-800/80 pb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-gray-200">Investment Details</h3>
            </div>

            {/* Investment Capital */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-1.5">
                <span>Investment Capital ({prefix})</span>
              </div>
              <input
                type="number"
                value={state.capital || ''}
                onChange={(e) => onChangeState({ ...state, capital: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[10px] text-gray-500 mt-1 font-medium">Lump sum capital allocated for multi-asset strategy.</p>
            </div>

            {/* Time Period */}
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-1.5">
                <span>Time Period (Years)</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={state.years || ''}
                  min={1}
                  max={40}
                  onChange={(e) =>
                    onChangeState({
                      ...state,
                      years: Math.max(1, Math.min(40, parseInt(e.target.value) || 1)),
                    })
                  }
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="text-xs font-bold text-gray-400 min-w-max">yrs</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 font-medium">Holding duration for compounding (1 - 40 yrs).</p>
            </div>

            {/* Asset Allocation Profile Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">Asset Allocation Profile</label>
              <div className="space-y-2">
                {[
                  {
                    id: 'conservative',
                    label: 'Conservative',
                    desc: `Debt heavy (${weights.conservative.debt}% Debt, ${weights.conservative.equity}% Equity, ${weights.conservative.gold}% Gold)`,
                  },
                  {
                    id: 'moderate',
                    label: 'Moderate',
                    desc: `Balanced growth (${weights.moderate.equity}% Equity, ${weights.moderate.debt}% Debt, ${weights.moderate.gold}% Gold)`,
                  },
                  {
                    id: 'aggressive',
                    label: 'Aggressive',
                    desc: `Growth focused (${weights.aggressive.equity}% Equity, ${weights.aggressive.debt}% Debt, ${weights.aggressive.gold}% Gold)`,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      onChangeState({ ...state, riskProfile: item.id as AllocatorState['riskProfile'] })
                    }
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      state.riskProfile === item.id
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md'
                        : 'bg-black/50 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className={state.riskProfile === item.id ? 'text-emerald-400' : ''}>
                        {item.label}
                      </span>
                      {state.riskProfile === item.id && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-gray-800/80">
              <div>
                <span className="text-xs font-semibold text-gray-300 block">Adjust for Inflation</span>
                <span className="text-[10px] text-gray-500 block">Show corpus value in today's purchasing power</span>
              </div>
              <button
                onClick={() => onChangeState({ ...state, adjustInflation: !adjustInflation })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  adjustInflation ? 'bg-emerald-500 justify-end' : 'bg-gray-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* ADVANCED SETTINGS COLLAPSIBLE CONTAINER */}
            <div className="border border-gray-800 rounded-2xl overflow-hidden bg-black/40">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-3.5 text-xs font-bold text-white flex items-center justify-between hover:bg-gray-900/60 transition-colors cursor-pointer"
              >
                <span className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-extrabold">Advanced Settings</span>
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="p-4 border-t border-gray-800/80 space-y-5 bg-gray-950/90 text-xs">
                  {/* Expected Annual Returns (%) Section */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-200">Expected Annual Returns (%)</h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      <PercentageInput
                        label="Equity"
                        value={returns.equity}
                        onChange={(val) => setReturns({ ...returns, equity: val })}
                      />
                      <PercentageInput
                        label="Debt"
                        value={returns.debt}
                        onChange={(val) => setReturns({ ...returns, debt: val })}
                      />
                      <PercentageInput
                        label="Gold"
                        value={returns.gold}
                        onChange={(val) => setReturns({ ...returns, gold: val })}
                      />
                      <PercentageInput
                        label="Silver"
                        value={returns.silver}
                        onChange={(val) => setReturns({ ...returns, silver: val })}
                      />
                      <PercentageInput
                        label="Cash"
                        value={returns.cash}
                        onChange={(val) => setReturns({ ...returns, cash: val })}
                      />
                    </div>
                  </div>

                  {/* Custom Allocation Weights (%) Section */}
                  <div className="space-y-3 pt-2 border-t border-gray-800/60">
                    <div>
                      <h4 className="text-xs font-bold text-gray-200">Custom Allocation Weights (%)</h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Weights must sum to 100% for each allocation type
                      </p>
                    </div>

                    {/* Conservative Allocation */}
                    <ProfileAllocationBlock
                      title="Conservative"
                      weights={weights.conservative}
                      onChange={(newW) => setWeights({ ...weights, conservative: newW })}
                    />

                    {/* Moderate Allocation */}
                    <ProfileAllocationBlock
                      title="Moderate"
                      weights={weights.moderate}
                      onChange={(newW) => setWeights({ ...weights, moderate: newW })}
                    />

                    {/* Aggressive Allocation */}
                    <ProfileAllocationBlock
                      title="Aggressive"
                      weights={weights.aggressive}
                      onChange={(newW) => setWeights({ ...weights, aggressive: newW })}
                    />
                  </div>

                  {/* Action Buttons: Compare Scenarios & Reset to Defaults */}
                  <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-800/60">
                    <button
                      onClick={() => setShowCompareModal(true)}
                      className="py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border border-gray-800 transition-all cursor-pointer shadow-md"
                    >
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Compare Scenarios</span>
                    </button>
                    <button
                      onClick={resetDefaults}
                      className="py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border border-gray-800 transition-all cursor-pointer shadow-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Output Metrics & Graph Visualizer Suite */}
        <div className="lg:col-span-7 space-y-6">
          {/* QUICK SCENARIO TOOL */}
          <QuickScenarioTool
            calculatorTitle="Asset Allocator"
            currency={currency}
            currentParams={{
              capital,
              years,
              equityPct: currentWeights.equity,
              debtPct: currentWeights.debt,
              goldPct: currentWeights.gold,
              silverPct: currentWeights.silver,
              cashPct: currentWeights.cash,
              adjustInflation,
              inflationRate,
            }}
            paramLabels={{
              capital: 'Initial Capital',
              years: 'Investment Horizon (Yrs)',
              equityPct: 'Equity Allocation (%)',
              debtPct: 'Debt Allocation (%)',
              goldPct: 'Gold Allocation (%)',
              silverPct: 'Silver Allocation (%)',
              cryptoPct: 'Crypto Allocation (%)',
              cashPct: 'Cash Allocation (%)',
              adjustInflation: 'Adjust Inflation',
              inflationRate: 'Inflation Rate (%)',
            }}
            presetAggressive={{
              capital,
              years,
              equityPct: 75,
              debtPct: 10,
              goldPct: 5,
              silverPct: 0,
              cryptoPct: 5,
              cashPct: 5,
              adjustInflation: false,
              inflationRate: 6,
            }}
            presetConservative={{
              capital,
              years,
              equityPct: 20,
              debtPct: 50,
              goldPct: 20,
              silverPct: 5,
              cryptoPct: 0,
              cashPct: 5,
              adjustInflation: false,
              inflationRate: 6,
            }}
            onApplyParams={(p) => {
              onChangeState({
                ...state,
                capital: p.capital !== undefined ? p.capital : state.capital,
                years: p.years !== undefined ? p.years : state.years,
                riskProfile: 'custom',
                customEquity: p.equityPct !== undefined ? p.equityPct : state.customEquity,
                customDebt: p.debtPct !== undefined ? p.debtPct : state.customDebt,
                customGold: p.goldPct !== undefined ? p.goldPct : state.customGold,
                customSilver: p.silverPct !== undefined ? p.silverPct : state.customSilver,
                customCrypto: p.cryptoPct !== undefined ? p.cryptoPct : state.customCrypto,
                customCash: p.cashPct !== undefined ? p.cashPct : state.customCash,
                adjustInflation: p.adjustInflation !== undefined ? p.adjustInflation : state.adjustInflation,
                inflationRate: p.inflationRate !== undefined ? p.inflationRate : state.inflationRate,
              });
            }}
          />

          {/* Output Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1 shadow-lg">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                BLENDED RETURN
              </span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
                {blendedReturnPct.toFixed(1)}%
              </div>
              <p className="text-[10px] text-gray-500">Weighted annual return</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1 shadow-lg">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                INVESTED
              </span>
              <div className="text-xl md:text-2xl font-bold font-mono text-white">
                {formatExactCurrency(capital, currency)}
              </div>
              <p className="text-[10px] text-gray-500">Total initial capital</p>
            </div>

            <div className="bg-gray-950 border-2 border-emerald-500/80 p-4 rounded-2xl space-y-1 bg-emerald-950/10 shadow-lg shadow-emerald-500/5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tight">
                PROJECTED VALUE
              </span>
              <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
                {formatExactCurrency(projectedVal, currency)}
              </div>
              <p className="text-[10px] text-emerald-500 font-medium">After {years} years</p>
            </div>
          </div>

          {/* Graph Visualizer Suite Card */}
          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-xs font-bold text-gray-300 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Allocation & Growth Visualizer</span>
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

              {/* Chart Mode Switcher: Circle (Donut/Pie) FIRST, then Area */}
              <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
                <button
                  onClick={() => setChartMode('circle')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    chartMode === 'circle'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  <span>Allocation Pie</span>
                </button>
                <button
                  onClick={() => setChartMode('area')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    chartMode === 'area'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Area Graph</span>
                </button>
              </div>
            </div>

            {/* CHART VIEW 1: CIRCLE / DONUT ALLOCATION MIX (FIRST & DEFAULT) */}
            {chartMode === 'circle' && (
              <div className="space-y-4 pt-1">
                <div className="text-center">
                  <h4 className="text-xs font-bold text-gray-200 capitalize">
                    {selectedProfile} Profile Asset Mix Breakdown
                  </h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Blended Return: {blendedReturnPct.toFixed(1)}% p.a.
                  </p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            return (
                              <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                                <div className="font-bold flex items-center space-x-1.5" style={{ color: p.color }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span>{p.name} Allocation</span>
                                </div>
                                <div className="text-white font-bold">
                                  {p.value}% ({formatExactCurrency(p.amount, currency)})
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Chips with exact amount */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {donutData.map((item) => (
                    <div
                      key={item.name}
                      className="bg-black/60 border border-gray-800/80 p-2.5 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-gray-300">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white font-mono block">{item.value}%</span>
                        <span className="text-[10px] text-gray-500 font-mono block">
                          {formatCurrency(item.amount, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHART VIEW 3: AREA CHART */}
            {chartMode === 'area' && (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="year" stroke="#6b7280" fontSize={10} />
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
                              <p className="text-gray-400 font-bold border-b border-gray-800 pb-1">
                                {label}
                              </p>
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
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="Aggressive" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="Moderate" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="Conservative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* SCHEDULE BREAKDOWN TABLE SECTION */}
          <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
              <div>
                <h3 className="text-xs font-bold text-gray-300">Schedule Breakdown Table</h3>
                <p className="text-[10px] text-gray-500">Detailed growth comparison across all profiles</p>
              </div>
              <button
                onClick={() =>
                  generatePdfReport({
                    title: 'Asset Allocation Schedule Breakdown Report',
                    subtitle: `Initial Capital: ${formatExactCurrency(capital, currency)} | Horizon: ${years} Years`,
                    metrics: [
                      { label: 'Initial Investment Capital', value: formatExactCurrency(capital, currency) },
                      { label: 'Investment Tenure', value: `${years} Years` },
                      { label: 'Selected Risk Profile', value: String(state.riskProfile).toUpperCase(), isHighlight: true },
                    ],
                    tableHeaders: ['Timeline', 'Conservative Value', 'Moderate Value', 'Aggressive Value'],
                    tableRows: tableRows.map((row) => [
                      String(row[0]),
                      String(row[1]),
                      String(row[2]),
                      String(row[3]),
                    ]),
                    notes: 'Generated by Calculator Hub Multi-Asset Portfolio Engine.',
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
                    <th className="py-2.5 px-3 text-blue-400">Conservative</th>
                    <th className="py-2.5 px-3 text-emerald-400">Moderate</th>
                    <th className="py-2.5 px-3 text-red-400">Aggressive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 font-mono">
                  {tableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-gray-200">{row[0]}</td>
                      <td className="py-2 px-3 text-blue-400">{row[1]}</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{row[2]}</td>
                      <td className="py-2 px-3 text-red-400">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* RESET TO DEFAULTS BUTTON */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={() => {
            onChangeState({
              capital: 5000000,
              years: 10,
              riskProfile: 'moderate',
              customEquity: 50,
              customDebt: 30,
              customGold: 10,
              customSilver: 5,
              customCrypto: 0,
              customCash: 5,
              adjustInflation: false,
              inflationRate: 6,
              advanced: {
                equityCagr: 12,
                debtCagr: 7,
                goldCagr: 9,
                silverCagr: 8,
                cryptoCagr: 25,
                cashCagr: 3.5,
                rebalanceAnnually: true,
                taxDragPct: 10,
              },
            });
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#121215] hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-800 shadow-lg cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* COMPARE SCENARIOS MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-950 border border-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Compare Allocation Scenarios</h3>
                  <p className="text-xs text-gray-400 font-medium">
                    {years}-Year projection for {formatExactCurrency(capital, currency)} capital
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl bg-gray-900 border border-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Conservative',
                  retPct: conservativeReturnPct,
                  weights: weights.conservative,
                  color: 'text-blue-400',
                  borderColor: 'border-blue-500/40',
                  bgColor: 'bg-blue-950/20',
                },
                {
                  title: 'Moderate',
                  retPct: moderateReturnPct,
                  weights: weights.moderate,
                  color: 'text-emerald-400',
                  borderColor: 'border-emerald-500/40',
                  bgColor: 'bg-emerald-950/20',
                },
                {
                  title: 'Aggressive',
                  retPct: aggressiveReturnPct,
                  weights: weights.aggressive,
                  color: 'text-red-400',
                  borderColor: 'border-red-500/40',
                  bgColor: 'bg-red-950/20',
                },
              ].map((p) => {
                const fVal = calculateFutureVal(p.retPct, years);
                const wealthGain = fVal - capital;
                const multiplier = capital > 0 ? (fVal / capital).toFixed(2) : '1.0';

                return (
                  <div
                    key={p.title}
                    className={`border ${p.borderColor} ${p.bgColor} p-4 rounded-2xl space-y-4 shadow-lg`}
                  >
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <span className={`text-sm font-black ${p.color}`}>{p.title}</span>
                      <span className="text-xs font-mono font-bold text-gray-300">
                        {p.retPct.toFixed(1)}% p.a.
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Projected Value
                      </span>
                      <div className={`text-xl font-mono font-bold ${p.color}`}>
                        {formatExactCurrency(fVal, currency)}
                      </div>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        +{formatExactCurrency(wealthGain, currency)} gain ({multiplier}x)
                      </p>
                    </div>

                    {/* Weight Badges */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
                      <span className="text-[10px] font-bold text-gray-400 block">Asset Breakdown</span>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                        <span className="text-gray-300">Equity: {p.weights.equity}%</span>
                        <span className="text-gray-300">Debt: {p.weights.debt}%</span>
                        <span className="text-gray-300">Gold: {p.weights.gold}%</span>
                        <span className="text-gray-300">Silver: {p.weights.silver}%</span>
                        <span className="text-gray-300">Cash: {p.weights.cash}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Bar Comparison Chart */}
            <div className="bg-black/60 border border-gray-800 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-gray-300">Total Projected Corpus Comparison</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Conservative',
                        Value: Math.round(calculateFutureVal(conservativeReturnPct, years)),
                      },
                      {
                        name: 'Moderate',
                        Value: Math.round(calculateFutureVal(moderateReturnPct, years)),
                      },
                      {
                        name: 'Aggressive',
                        Value: Math.round(calculateFutureVal(aggressiveReturnPct, years)),
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={10}
                      tickFormatter={(val) => formatCurrency(val, currency)}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl text-xs font-mono">
                              <span className="text-gray-400 font-bold">{payload[0].payload.name}: </span>
                              <span className="text-emerald-400 font-bold ml-1">
                                {formatExactCurrency(payload[0].value, currency)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Value" radius={[8, 8, 0, 0]} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCompareModal(false)}
                className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
