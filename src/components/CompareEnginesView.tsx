import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Scale,
  TrendingUp,
  Landmark,
  PiggyBank,
  Coins,
  Briefcase,
  Activity,
  Download,
  Sparkles,
  Trophy,
  BarChart3,
  LineChart as LineChartIcon,
  HelpCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Currency } from '../types';
import { formatExactCurrency, exportToCSV } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';
import { triggerSliderHaptic } from '../utils/haptics';

interface CompareEnginesViewProps {
  currency?: Currency;
  onBack: () => void;
}

export type EngineMode = 'sip' | 'fd_lumpsum' | 'rd' | 'gold' | 'bonds';

interface EngineConfig {
  name: string;
  type: EngineMode;
  initialLumpsum: number;
  monthlyDeposit: number;
  expectedRate: number;
  annualStepUp: number;
  compoundingFreq: number; // 1, 2, 4, 12 per year
}

export const CompareEnginesView: React.FC<CompareEnginesViewProps> = ({
  currency = 'INR',
  onBack,
}) => {
  const activeCurrency: Currency = (currency as Currency) || 'INR';
  const symbol = activeCurrency === 'INR' ? '₹' : '$';

  // Shared tenure in years
  const [tenureYears, setTenureYears] = useState<number>(15);

  // Engine A Configuration
  const [engineA, setEngineA] = useState<EngineConfig>({
    name: 'SIP Equity Mutual Fund',
    type: 'sip',
    initialLumpsum: 0,
    monthlyDeposit: 10000,
    expectedRate: 12,
    annualStepUp: 10,
    compoundingFreq: 12,
  });

  // Engine B Configuration
  const [engineB, setEngineB] = useState<EngineConfig>({
    name: 'Bank Fixed Deposit (FD)',
    type: 'fd_lumpsum',
    initialLumpsum: 500000,
    monthlyDeposit: 0,
    expectedRate: 7.2,
    annualStepUp: 0,
    compoundingFreq: 4,
  });

  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

  // Preset Handlers
  const applyPreset = (preset: 'sip_vs_fd' | 'lumpsum_vs_sip' | 'gold_vs_fd' | 'bonds_vs_sip') => {
    if (preset === 'sip_vs_fd') {
      setTenureYears(15);
      setEngineA({
        name: 'Equity SIP (12% CAGR)',
        type: 'sip',
        initialLumpsum: 0,
        monthlyDeposit: 10000,
        expectedRate: 12,
        annualStepUp: 5,
        compoundingFreq: 12,
      });
      setEngineB({
        name: 'Bank RD / FD (7% Rate)',
        type: 'rd',
        initialLumpsum: 0,
        monthlyDeposit: 10000,
        expectedRate: 7.0,
        annualStepUp: 0,
        compoundingFreq: 4,
      });
    } else if (preset === 'lumpsum_vs_sip') {
      setTenureYears(10);
      setEngineA({
        name: 'Lumpsum Mutual Fund',
        type: 'fd_lumpsum',
        initialLumpsum: 500000,
        monthlyDeposit: 0,
        expectedRate: 12.5,
        annualStepUp: 0,
        compoundingFreq: 1,
      });
      setEngineB({
        name: 'Bank FD Compounding',
        type: 'fd_lumpsum',
        initialLumpsum: 500000,
        monthlyDeposit: 0,
        expectedRate: 7.2,
        annualStepUp: 0,
        compoundingFreq: 4,
      });
    } else if (preset === 'gold_vs_fd') {
      setTenureYears(8);
      setEngineA({
        name: 'Gold (SGB 9.5% + 2.5% Bonus)',
        type: 'gold',
        initialLumpsum: 300000,
        monthlyDeposit: 0,
        expectedRate: 12.0, // 9.5% app + 2.5% yield
        annualStepUp: 0,
        compoundingFreq: 1,
      });
      setEngineB({
        name: 'Bank FD (7.2%)',
        type: 'fd_lumpsum',
        initialLumpsum: 300000,
        monthlyDeposit: 0,
        expectedRate: 7.2,
        annualStepUp: 0,
        compoundingFreq: 4,
      });
    } else if (preset === 'bonds_vs_sip') {
      setTenureYears(10);
      setEngineA({
        name: 'High-Yield Bonds (9.5% Yield)',
        type: 'bonds',
        initialLumpsum: 1000000,
        monthlyDeposit: 0,
        expectedRate: 9.5,
        annualStepUp: 0,
        compoundingFreq: 1,
      });
      setEngineB({
        name: 'SIP Wealth (12% CAGR)',
        type: 'sip',
        initialLumpsum: 0,
        monthlyDeposit: 15000,
        expectedRate: 12,
        annualStepUp: 10,
        compoundingFreq: 12,
      });
    }
  };

  // Helper function to project engine wealth over years
  const computeProjection = (cfg: EngineConfig, years: number) => {
    const yearPoints: { year: number; invested: number; value: number }[] = [];

    let currentLumpsum = cfg.initialLumpsum;
    let currentMonthly = cfg.monthlyDeposit;
    let accumulatedValue = currentLumpsum;
    let totalInvested = currentLumpsum;

    const rateDec = cfg.expectedRate / 100;

    for (let y = 1; y <= years; y++) {
      if (cfg.type === 'sip' || cfg.type === 'rd') {
        // Monthly contribution compounding for 12 months
        const monthlyRate = rateDec / 12;
        for (let m = 1; m <= 12; m++) {
          accumulatedValue = (accumulatedValue + currentMonthly) * (1 + monthlyRate);
          totalInvested += currentMonthly;
        }
        // Annual step-up for SIP
        if (cfg.type === 'sip' && cfg.annualStepUp > 0) {
          currentMonthly += currentMonthly * (cfg.annualStepUp / 100);
        }
      } else if (cfg.type === 'fd_lumpsum') {
        // Lumpsum compound interest: A = P * (1 + r/n)^(n*t)
        const n = cfg.compoundingFreq || 4;
        accumulatedValue = currentLumpsum * Math.pow(1 + rateDec / n, n * y);
        totalInvested = currentLumpsum;
      } else if (cfg.type === 'gold') {
        // Gold appreciation + annual yield compounding
        accumulatedValue = accumulatedValue * (1 + rateDec);
        totalInvested = currentLumpsum > 0 ? currentLumpsum : totalInvested;
      } else if (cfg.type === 'bonds') {
        // Fixed coupon compounding or reinvested
        accumulatedValue = accumulatedValue * (1 + rateDec);
        totalInvested = currentLumpsum > 0 ? currentLumpsum : totalInvested;
      }

      yearPoints.push({
        year: y,
        invested: Math.round(totalInvested),
        value: Math.round(accumulatedValue),
      });
    }

    return yearPoints;
  };

  // Compute projections for both engines
  const projA = useMemo(() => computeProjection(engineA, tenureYears), [engineA, tenureYears]);
  const projB = useMemo(() => computeProjection(engineB, tenureYears), [engineB, tenureYears]);

  // Combined Chart Data
  const chartData = useMemo(() => {
    return projA.map((ptA, idx) => {
      const ptB = projB[idx] || { value: 0, invested: 0 };
      const diff = ptA.value - ptB.value;
      return {
        yearName: `Yr ${ptA.year}`,
        year: ptA.year,
        [engineA.name || 'Engine A']: ptA.value,
        [engineB.name || 'Engine B']: ptB.value,
        'Engine A Invested': ptA.invested,
        'Engine B Invested': ptB.invested,
        Difference: diff,
      };
    });
  }, [projA, projB, engineA.name, engineB.name]);

  // Final Metrics Calculation
  const finalA = projA[projA.length - 1] || { value: 0, invested: 0 };
  const finalB = projB[projB.length - 1] || { value: 0, invested: 0 };

  const gainA = Math.max(0, finalA.value - finalA.invested);
  const gainB = Math.max(0, finalB.value - finalB.invested);

  const deltaValue = Math.abs(finalA.value - finalB.value);
  const winnerIsA = finalA.value >= finalB.value;
  const winnerName = winnerIsA ? engineA.name : engineB.name;
  const loserName = winnerIsA ? engineB.name : engineA.name;
  const winnerValue = winnerIsA ? finalA.value : finalB.value;
  const loserValue = winnerIsA ? finalB.value : finalA.value;
  const winnerGainPct = loserValue > 0 ? ((winnerValue - loserValue) / loserValue) * 100 : 0;

  // Table rows for export & breakdown
  const tableRows = useMemo(() => {
    return chartData.map((row) => [
      `Year ${row.year}`,
      formatExactCurrency(row[engineA.name] as number, activeCurrency),
      formatExactCurrency(row[engineB.name] as number, activeCurrency),
      formatExactCurrency(Math.abs(row.Difference as number), activeCurrency),
      (row.Difference as number) >= 0 ? `${engineA.name} Ahead` : `${engineB.name} Ahead`,
    ]);
  }, [chartData, engineA.name, engineB.name, activeCurrency]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in">
      {/* Main Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center space-x-2">
          <span>Compare Investment Engines</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
          Pitting two investment strategies side-by-side to discover which builds superior long-term wealth.
        </p>
      </div>

      {/* Quick Comparison Presets Bar */}
      <div className="bg-[#121215] border border-gray-800 rounded-2xl p-3.5 space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Quick Match Presets</span>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => applyPreset('sip_vs_fd')}
            className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#1a1a1e] hover:bg-emerald-500/20 hover:border-emerald-500/50 text-gray-200 border border-gray-800 transition-all text-left cursor-pointer flex flex-col space-y-0.5"
          >
            <span className="text-emerald-400 font-extrabold text-[11px]">SIP vs Bank FD</span>
            <span className="text-[10px] text-gray-400">Monthly Equity vs Fixed Deposit</span>
          </button>

          <button
            onClick={() => applyPreset('lumpsum_vs_sip')}
            className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#1a1a1e] hover:bg-emerald-500/20 hover:border-emerald-500/50 text-gray-200 border border-gray-800 transition-all text-left cursor-pointer flex flex-col space-y-0.5"
          >
            <span className="text-cyan-400 font-extrabold text-[11px]">Lumpsum vs Bank FD</span>
            <span className="text-[10px] text-gray-400">5L Mutual Fund vs Bank FD</span>
          </button>

          <button
            onClick={() => applyPreset('gold_vs_fd')}
            className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#1a1a1e] hover:bg-emerald-500/20 hover:border-emerald-500/50 text-gray-200 border border-gray-800 transition-all text-left cursor-pointer flex flex-col space-y-0.5"
          >
            <span className="text-amber-400 font-extrabold text-[11px]">Gold SGB vs Bank FD</span>
            <span className="text-[10px] text-gray-400">Gold appreciation + 2.5% yield</span>
          </button>

          <button
            onClick={() => applyPreset('bonds_vs_sip')}
            className="py-2 px-2.5 rounded-xl text-xs font-bold bg-[#1a1a1e] hover:bg-emerald-500/20 hover:border-emerald-500/50 text-gray-200 border border-gray-800 transition-all text-left cursor-pointer flex flex-col space-y-0.5"
          >
            <span className="text-pink-400 font-extrabold text-[11px]">Bonds vs Equity SIP</span>
            <span className="text-[10px] text-gray-400">9.5% Bond yield vs SIP</span>
          </button>
        </div>
      </div>

      {/* Shared Time Horizon Bar */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl p-4 space-y-2 shadow-xl">
        <div className="flex justify-between items-center text-xs font-bold text-gray-300">
          <span className="uppercase text-[10px] tracking-wider text-gray-400">Comparison Investment Horizon</span>
          <span className="font-mono text-emerald-400 text-sm font-black">{tenureYears} Years</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={tenureYears}
          onChange={(e) => {
            triggerSliderHaptic(8, 30);
            setTenureYears(parseInt(e.target.value) || 1);
          }}
          onInput={() => triggerSliderHaptic(8, 30)}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] font-mono text-gray-500">
          <span>1 Year</span>
          <span>15 Years</span>
          <span>30 Years</span>
        </div>
      </div>

      {/* Engine A and Engine B Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ENGINE A PANEL */}
        <div className="bg-[#121215] border border-cyan-800/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-cyan-950 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wide">Engine A</h3>
            </div>
            <select
              value={engineA.type}
              onChange={(e) => {
                const type = e.target.value as EngineMode;
                setEngineA({
                  ...engineA,
                  type,
                  name:
                    type === 'sip'
                      ? 'Equity SIP'
                      : type === 'fd_lumpsum'
                      ? 'Fixed Deposit'
                      : type === 'rd'
                      ? 'Recurring Deposit'
                      : type === 'gold'
                      ? 'Gold Investment'
                      : 'Corporate Bonds',
                });
              }}
              className="bg-[#1a1a1e] border border-cyan-800/60 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="sip">SIP / Systematic</option>
              <option value="fd_lumpsum">FD / Lumpsum</option>
              <option value="rd">RD / Recurring</option>
              <option value="gold">Gold / Metal</option>
              <option value="bonds">Bonds / Yield</option>
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Engine Label</label>
              <input
                type="text"
                value={engineA.name}
                onChange={(e) => setEngineA({ ...engineA, name: e.target.value })}
                className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Inputs based on type */}
            {(engineA.type === 'fd_lumpsum' || engineA.type === 'gold' || engineA.type === 'bonds') && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Initial Lumpsum ({symbol})</label>
                <input
                  type="number"
                  value={engineA.initialLumpsum}
                  onChange={(e) => setEngineA({ ...engineA, initialLumpsum: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {(engineA.type === 'sip' || engineA.type === 'rd') && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Monthly Deposit ({symbol})</label>
                <input
                  type="number"
                  value={engineA.monthlyDeposit}
                  onChange={(e) => setEngineA({ ...engineA, monthlyDeposit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Expected Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={engineA.expectedRate}
                  onChange={(e) => setEngineA({ ...engineA, expectedRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {engineA.type === 'sip' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Annual Step-Up (%)</label>
                  <input
                    type="number"
                    value={engineA.annualStepUp}
                    onChange={(e) => setEngineA({ ...engineA, annualStepUp: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ENGINE B PANEL */}
        <div className="bg-[#121215] border border-amber-800/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-amber-950 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">Engine B</h3>
            </div>
            <select
              value={engineB.type}
              onChange={(e) => {
                const type = e.target.value as EngineMode;
                setEngineB({
                  ...engineB,
                  type,
                  name:
                    type === 'sip'
                      ? 'Equity SIP'
                      : type === 'fd_lumpsum'
                      ? 'Fixed Deposit'
                      : type === 'rd'
                      ? 'Recurring Deposit'
                      : type === 'gold'
                      ? 'Gold Investment'
                      : 'Corporate Bonds',
                });
              }}
              className="bg-[#1a1a1e] border border-amber-800/60 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="sip">SIP / Systematic</option>
              <option value="fd_lumpsum">FD / Lumpsum</option>
              <option value="rd">RD / Recurring</option>
              <option value="gold">Gold / Metal</option>
              <option value="bonds">Bonds / Yield</option>
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Engine Label</label>
              <input
                type="text"
                value={engineB.name}
                onChange={(e) => setEngineB({ ...engineB, name: e.target.value })}
                className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Inputs based on type */}
            {(engineB.type === 'fd_lumpsum' || engineB.type === 'gold' || engineB.type === 'bonds') && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Initial Lumpsum ({symbol})</label>
                <input
                  type="number"
                  value={engineB.initialLumpsum}
                  onChange={(e) => setEngineB({ ...engineB, initialLumpsum: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {(engineB.type === 'sip' || engineB.type === 'rd') && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Monthly Deposit ({symbol})</label>
                <input
                  type="number"
                  value={engineB.monthlyDeposit}
                  onChange={(e) => setEngineB({ ...engineB, monthlyDeposit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">Expected Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={engineB.expectedRate}
                  onChange={(e) => setEngineB({ ...engineB, expectedRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {engineB.type === 'sip' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Annual Step-Up (%)</label>
                  <input
                    type="number"
                    value={engineB.annualStepUp}
                    onChange={(e) => setEngineB({ ...engineB, annualStepUp: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1a1a1e] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Verdict Banner */}
      <div className="bg-[#121215] border-2 border-emerald-500/80 rounded-2xl p-5 space-y-2 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <span>Verdict & Winner</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          <span className={winnerIsA ? 'text-cyan-400' : 'text-amber-400'}>{winnerName}</span> wins by{' '}
          <span className="text-emerald-400 font-mono">{formatExactCurrency(deltaValue, activeCurrency)}</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 font-medium">
          Over <span className="font-bold text-white">{tenureYears} Years</span>, {winnerName} generates{' '}
          <span className="text-emerald-400 font-bold">{winnerGainPct.toFixed(1)}% higher wealth</span> than {loserName}.
        </p>
      </div>

      {/* Side-by-Side Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Engine A Summary Card */}
        <div className="bg-[#121215] border border-cyan-800/80 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
              {engineA.name}
            </span>
            {winnerIsA && (
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                Winner
              </span>
            )}
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300 tracking-tight">
            {formatExactCurrency(finalA.value, activeCurrency)}
          </div>

          <div className="pt-2 border-t border-gray-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Total Invested</span>
              <span className="font-bold text-gray-200">{formatExactCurrency(finalA.invested, activeCurrency)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Total Gain</span>
              <span className="font-bold text-emerald-400">+{formatExactCurrency(gainA, activeCurrency)}</span>
            </div>
          </div>
        </div>

        {/* Engine B Summary Card */}
        <div className="bg-[#121215] border border-amber-800/80 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              {engineB.name}
            </span>
            {!winnerIsA && (
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                Winner
              </span>
            )}
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 tracking-tight">
            {formatExactCurrency(finalB.value, activeCurrency)}
          </div>

          <div className="pt-2 border-t border-gray-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Total Invested</span>
              <span className="font-bold text-gray-200">{formatExactCurrency(finalB.invested, activeCurrency)}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase block">Total Gain</span>
              <span className="font-bold text-emerald-400">+{formatExactCurrency(gainB, activeCurrency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Growth Comparison Chart */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Wealth Growth Trajectory Comparison</span>
          </h3>

          <div className="flex items-center space-x-1.5 bg-[#1a1a1e] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                chartType === 'area'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Area</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                chartType === 'line'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="yearName" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(val) =>
                    val >= 10000000
                      ? `${(val / 10000000).toFixed(1)}Cr`
                      : val >= 100000
                      ? `${(val / 100000).toFixed(1)}L`
                      : `${(val / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any) => [formatExactCurrency(Number(val), activeCurrency), '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey={engineA.name}
                  stroke="#22d3ee"
                  fill="#22d3ee"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey={engineB.name}
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                  strokeWidth={2.5}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="yearName" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(val) =>
                    val >= 10000000
                      ? `${(val / 10000000).toFixed(1)}Cr`
                      : val >= 100000
                      ? `${(val / 100000).toFixed(1)}L`
                      : `${(val / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any) => [formatExactCurrency(Number(val), activeCurrency), '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line type="monotone" dataKey={engineA.name} stroke="#22d3ee" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey={engineB.name} stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Schedule Table */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
          <h3 className="text-sm font-bold text-white">Year-by-Year Comparison Breakdown</h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                exportToCSV(
                  'engine_comparison_schedule',
                  ['Year', engineA.name, engineB.name, 'Difference', 'Leader'],
                  tableRows
                )
              }
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Export Comparison schedule as CSV"
              aria-label="Export Comparison schedule as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={() =>
                generatePdfReport({
                  title: 'Investment Engine Comparison Statement',
                  subtitle: `${engineA.name} vs ${engineB.name} | Tenure: ${tenureYears} Years`,
                  metrics: [
                    { label: `Engine A (${engineA.name}) Final Wealth`, value: formatExactCurrency(finalA.value, activeCurrency) },
                    { label: `Engine B (${engineB.name}) Final Wealth`, value: formatExactCurrency(finalB.value, activeCurrency) },
                    { label: 'Net Wealth Difference', value: formatExactCurrency(deltaValue, activeCurrency), isHighlight: true },
                    { label: 'Winning Engine', value: winnerName, isHighlight: true },
                  ],
                  tableHeaders: ['Year', engineA.name, engineB.name, 'Net Gap', 'Leader'],
                  tableRows: tableRows.map((r) => [
                    String(r[0]),
                    String(r[1]),
                    String(r[2]),
                    String(r[3]),
                    String(r[4]),
                  ]),
                  notes: 'Side-by-side investment engine comparison. Figures represent nominal growth projections.',
                })
              }
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/40 px-3 py-1.5 rounded-xl border border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Export Comparison Report as PDF"
              aria-label="Export Comparison Report as PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a1a1e] text-gray-400 sticky top-0 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-cyan-400">{engineA.name}</th>
                <th className="py-2.5 px-3 text-amber-400">{engineB.name}</th>
                <th className="py-2.5 px-3">Difference</th>
                <th className="py-2.5 px-3 text-emerald-400">Leader</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">{row[1]}</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">{row[2]}</td>
                  <td className="py-2.5 px-3 font-bold text-white">{row[3]}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{row[4]}</td>
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
            setTenureYears(15);
            setEngineA({
              name: 'SIP Equity Mutual Fund',
              type: 'sip',
              initialLumpsum: 0,
              monthlyDeposit: 10000,
              expectedRate: 12,
              annualStepUp: 10,
              compoundingFreq: 12,
            });
            setEngineB({
              name: 'Bank Fixed Deposit (FD)',
              type: 'fd_lumpsum',
              initialLumpsum: 500000,
              monthlyDeposit: 0,
              expectedRate: 7.2,
              annualStepUp: 0,
              compoundingFreq: 4,
            });
            setChartType('area');
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
