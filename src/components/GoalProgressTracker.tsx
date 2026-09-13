import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, ShieldCheck, Sparkles, AlertCircle, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Currency } from '../types';
import { formatExactCurrency } from '../utils/formatters';
import { InfoTooltip } from './InfoTooltip';

interface GoalProgressTrackerProps {
  currency?: Currency;
  onNavigateToCalculator?: (calcId: string) => void;
}

const PRESET_GOALS = [
  { name: 'Dream Home Down Payment', target: 5000000, current: 1200000, monthly: 25000, returnRate: 11 },
  { name: 'Child Education Fund', target: 3000000, current: 500000, monthly: 15000, returnRate: 12 },
  { name: 'Retirement Corpus', target: 20000000, current: 3500000, monthly: 40000, returnRate: 12 },
  { name: 'Emergency Liquid Reserve', target: 1000000, current: 400000, monthly: 20000, returnRate: 7 },
];

export const GoalProgressTracker: React.FC<GoalProgressTrackerProps> = ({
  currency = 'INR',
  onNavigateToCalculator,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [goalName, setGoalName] = useState<string>('Dream Home Down Payment');
  const [targetCorpus, setTargetCorpus] = useState<number>(5000000);
  const [currentSavings, setCurrentSavings] = useState<number>(1200000);
  const [monthlyAddition, setMonthlyAddition] = useState<number>(25000);
  const [returnRate, setReturnRate] = useState<number>(11);

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Calculate percentage
  const rawProgress = targetCorpus > 0 ? (currentSavings / targetCorpus) * 100 : 0;
  const progressPercent = Math.min(100, Math.max(0, rawProgress));

  // Shortfall
  const shortfall = Math.max(0, targetCorpus - currentSavings);

  // Time remaining calculation
  const calculateTimeToGoal = () => {
    if (currentSavings >= targetCorpus) return { years: 0, months: 0, totalMonths: 0, reached: true };

    const r = returnRate / 1200; // Monthly return rate
    const pmt = monthlyAddition;
    const pv = currentSavings;
    const fv = targetCorpus;

    if (pmt <= 0 && r <= 0) {
      return { years: 99, months: 0, totalMonths: 1188, reached: false, unreachable: true };
    }

    if (r === 0) {
      const totalMonths = Math.ceil((fv - pv) / pmt);
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      return { years, months, totalMonths, reached: false };
    }

    if (pmt === 0) {
      if (pv <= 0) return { years: 99, months: 0, totalMonths: 1188, reached: false, unreachable: true };
      const totalMonths = Math.ceil(Math.log(fv / pv) / Math.log(1 + r));
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      return { years, months, totalMonths, reached: false };
    }

    const numerator = fv * r + pmt;
    const denominator = pv * r + pmt;

    if (numerator <= 0 || denominator <= 0) {
      return { years: 99, months: 0, totalMonths: 1188, reached: false, unreachable: true };
    }

    const n = Math.log(numerator / denominator) / Math.log(1 + r);
    if (isNaN(n) || n < 0) {
      return { years: 99, months: 0, totalMonths: 1188, reached: false, unreachable: true };
    }

    const totalMonths = Math.ceil(n);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return { years, months, totalMonths, reached: false };
  };

  const timeResult = calculateTimeToGoal();

  // Target Year/Month calculation
  const getTargetCompletionDate = () => {
    if (timeResult.reached) return 'Achieved Today!';
    if (timeResult.unreachable) return 'Needs higher contribution';
    const d = new Date();
    d.setMonth(d.getMonth() + timeResult.totalMonths);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleApplyPreset = (preset: typeof PRESET_GOALS[0]) => {
    setGoalName(preset.name);
    setTargetCorpus(preset.target);
    setCurrentSavings(preset.current);
    setMonthlyAddition(preset.monthly);
    setReturnRate(preset.returnRate);
  };

  return (
    <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl transition-all duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="p-2 sm:p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Goal Progress Tracker
              </h2>
              <span className="text-[10px] font-bold bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30 uppercase tracking-wider">
                {goalName.split(' ')[0]}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {goalName} — {progressPercent.toFixed(1)}% Achieved ({formatExactCurrency(currentSavings, currency)} / {formatExactCurrency(targetCorpus, currency)})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-300 hover:text-white bg-orange-600/20 hover:bg-orange-600/30 px-3 py-1.5 rounded-xl border border-orange-500/40 transition-all cursor-pointer shrink-0"
        >
          <span>{isExpanded ? 'Shrink' : 'Open / View Goal'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Shrunk / Collapsed Compact Bar View */}
      {!isExpanded && (
        <div className="space-y-2 pt-1 animate-in fade-in cursor-pointer" onClick={() => setIsExpanded(true)}>
          <div className="relative w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800/80 shadow-inner p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-md relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-gray-400">
            <span>Target: {formatExactCurrency(targetCorpus, currency)}</span>
            <span>Est. Date: {getTargetCompletionDate()}</span>
          </div>
        </div>
      )}

      {/* Full Expanded Tracker Controls and Dashboard */}
      {isExpanded && (
        <div className="space-y-5 pt-2 border-t border-gray-800/80 animate-in fade-in">
          {/* Preset Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1">
            <span className="text-[11px] font-bold text-gray-400 shrink-0 mr-1">Presets:</span>
            {PRESET_GOALS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                  goalName === p.name
                    ? 'bg-orange-500 text-white font-bold border-orange-400 shadow-sm'
                    : 'bg-gray-900/80 text-gray-300 border-gray-800 hover:text-white hover:bg-gray-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Corpus */}
            <div className="space-y-1.5 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <span>Target Corpus</span>
                  <InfoTooltip term="Target Corpus" text="The final target wealth required to fulfill your goal." />
                </span>
                <span className="text-orange-400 font-mono font-bold text-xs">
                  {formatExactCurrency(targetCorpus, currency)}
                </span>
              </label>
              <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-lg px-2.5 py-1.5 focus-within:border-orange-500 transition-colors">
                <span className="text-xs text-gray-400 font-mono mr-1">{currSymbol}</span>
                <input
                  type="number"
                  value={isNaN(targetCorpus) ? '' : targetCorpus}
                  step={50000}
                  min={100000}
                  onChange={(e) => setTargetCorpus(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Current Savings */}
            <div className="space-y-1.5 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <span>Current Savings</span>
                  <InfoTooltip term="Current Savings" text="Existing capital or investments accumulated today." />
                </span>
                <span className="text-blue-400 font-mono font-bold text-xs">
                  {formatExactCurrency(currentSavings, currency)}
                </span>
              </label>
              <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-lg px-2.5 py-1.5 focus-within:border-blue-500 transition-colors">
                <span className="text-xs text-gray-400 font-mono mr-1">{currSymbol}</span>
                <input
                  type="number"
                  value={isNaN(currentSavings) ? '' : currentSavings}
                  step={10000}
                  min={0}
                  onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Monthly Investment */}
            <div className="space-y-1.5 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <span>Monthly Addition</span>
                  <InfoTooltip term="Monthly Addition" text="Fixed monthly SIP or installment added to this goal." />
                </span>
                <span className="text-purple-400 font-mono font-bold text-xs">
                  {formatExactCurrency(monthlyAddition, currency)}
                </span>
              </label>
              <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-lg px-2.5 py-1.5 focus-within:border-purple-500 transition-colors">
                <span className="text-xs text-gray-400 font-mono mr-1">{currSymbol}</span>
                <input
                  type="number"
                  value={isNaN(monthlyAddition) ? '' : monthlyAddition}
                  step={1000}
                  min={0}
                  onChange={(e) => setMonthlyAddition(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Expected Return Rate */}
            <div className="space-y-1.5 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <span>Expected Return Rate</span>
                  <InfoTooltip term="Return Rate" text="Expected annual growth rate of your portfolio." />
                </span>
                <span className="text-amber-400 font-mono font-bold text-xs">{returnRate}% p.a.</span>
              </label>
              <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500 transition-colors">
                <input
                  type="number"
                  value={isNaN(returnRate) ? '' : returnRate}
                  step={0.5}
                  min={1}
                  max={30}
                  onChange={(e) => setReturnRate(Math.max(0.5, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
                <span className="text-xs text-gray-400 font-mono ml-1">%</span>
              </div>
            </div>
          </div>

          {/* Progress Card Visualizer */}
          <div className="bg-gradient-to-br from-[#18181c] via-[#121215] to-[#1a1a24] p-5 rounded-2xl border border-gray-800/90 space-y-4 shadow-xl">
            {/* Progress Bar Top */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-200 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Goal Progress: {goalName}</span>
                </span>
                <span className="font-mono font-black text-sm text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                  {progressPercent.toFixed(1)}% Completed
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="relative w-full h-4 bg-gray-950 rounded-full overflow-hidden border border-gray-800/80 shadow-inner p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-md relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-gray-400 pt-0.5">
                <span>Saved: {formatExactCurrency(currentSavings, currency)}</span>
                <span>Target: {formatExactCurrency(targetCorpus, currency)}</span>
              </div>
            </div>

            {/* Stats Highlight Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Shortfall Gap */}
              <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800/80 space-y-1">
                <span className="text-[11px] font-medium text-gray-400 flex items-center space-x-1">
                  <span>Shortfall Gap</span>
                </span>
                <p className="text-base sm:text-lg font-mono font-black text-amber-400">
                  {formatExactCurrency(shortfall, currency)}
                </p>
                <p className="text-[10px] text-gray-500">
                  {progressPercent >= 100 ? 'Goal fully funded!' : `${(100 - progressPercent).toFixed(1)}% remaining`}
                </p>
              </div>

              {/* Estimated Time Remaining */}
              <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800/80 space-y-1">
                <span className="text-[11px] font-medium text-gray-400 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Est. Time Remaining</span>
                </span>
                <p className="text-base sm:text-lg font-mono font-black text-blue-400">
                  {timeResult.reached
                    ? '0 Yrs'
                    : timeResult.unreachable
                    ? 'High Gap'
                    : `${timeResult.years} Yrs ${timeResult.months} Mos`}
                </p>
                <p className="text-[10px] text-gray-500">
                  {timeResult.reached ? 'Achieved!' : `Target Date: ${getTargetCompletionDate()}`}
                </p>
              </div>

              {/* Monthly Addition Action */}
              <div className="bg-orange-950/30 p-3.5 rounded-xl border border-orange-500/30 space-y-1">
                <span className="text-[11px] font-medium text-orange-300 flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  <span>Compounding Plan</span>
                </span>
                <p className="text-base sm:text-lg font-mono font-black text-orange-300">
                  {formatExactCurrency(monthlyAddition, currency)}/mo
                </p>
                {onNavigateToCalculator ? (
                  <button
                    onClick={() => onNavigateToCalculator('sip')}
                    className="text-[10px] font-bold text-orange-400 hover:underline inline-flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>Optimize in SIP Calculator</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                ) : (
                  <p className="text-[10px] text-orange-400/80">At {returnRate}% projected return</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

