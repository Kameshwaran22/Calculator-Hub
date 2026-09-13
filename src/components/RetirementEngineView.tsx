import React, { useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Activity,
  Download,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import { QuickScenarioTool } from './QuickScenarioTool';

interface RetirementEngineViewProps {
  currency?: Currency;
  onBack: () => void;
}

type ChartMode = 'area' | 'circle';

export const RetirementEngineView: React.FC<RetirementEngineViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [basicSalary, setBasicSalary] = useState<number>(50000);
  const [monthlyNps, setMonthlyNps] = useState<number>(5000);
  const [monthlySip, setMonthlySip] = useState<number>(10000);

  const [epfRate, setEpfRate] = useState<number>(8.25);
  const [npsRate, setNpsRate] = useState<number>(10);
  const [sipRate, setSipRate] = useState<number>(13);

  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);

  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  const years = Math.max(1, retirementAge - currentAge);
  const totalMonths = years * 12;

  // EPF monthly contribution = 24% of Basic (12% Employee + 12% Employer)
  const monthlyEpf = basicSalary * 0.24;

  const calculateCorpus = (monthlyContrib: number, annualRatePct: number, months: number) => {
    if (annualRatePct <= 0) return monthlyContrib * months;
    const r = annualRatePct / 12 / 100;
    return monthlyContrib * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  };

  const epfCorpusRaw = calculateCorpus(monthlyEpf, epfRate, totalMonths);
  const npsCorpusRaw = calculateCorpus(monthlyNps, npsRate, totalMonths);
  const sipCorpusRaw = calculateCorpus(monthlySip, sipRate, totalMonths);

  const getInflationAdjusted = (val: number, yr: number) => {
    if (!adjustInflation || inflationRate <= 0) return val;
    return val / Math.pow(1 + inflationRate / 100, yr);
  };

  const finalEpf = adjustInflation ? getInflationAdjusted(epfCorpusRaw, years) : epfCorpusRaw;
  const finalNps = adjustInflation ? getInflationAdjusted(npsCorpusRaw, years) : npsCorpusRaw;
  const finalSip = adjustInflation ? getInflationAdjusted(sipCorpusRaw, years) : sipCorpusRaw;

  // Determine Best Winner
  const options = [
    { name: 'SIP', value: finalSip },
    { name: 'EPF', value: finalEpf },
    { name: 'NPS', value: finalNps },
  ];
  options.sort((a, b) => b.value - a.value);
  const bestOption = options[0];

  // Schedule Data (Yearly vs Monthly)
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  if (frequency === 'yearly') {
    for (let yr = 0; yr <= years; yr++) {
      const ageAtYr = currentAge + yr;
      const mAtYr = yr * 12;

      const epfAtYr = yr === 0 ? 0 : calculateCorpus(monthlyEpf, epfRate, mAtYr);
      const npsAtYr = yr === 0 ? 0 : calculateCorpus(monthlyNps, npsRate, mAtYr);
      const sipAtYr = yr === 0 ? 0 : calculateCorpus(monthlySip, sipRate, mAtYr);

      const dispEpf = adjustInflation ? getInflationAdjusted(epfAtYr, yr) : epfAtYr;
      const dispNps = adjustInflation ? getInflationAdjusted(npsAtYr, yr) : npsAtYr;
      const dispSip = adjustInflation ? getInflationAdjusted(sipAtYr, yr) : sipAtYr;

      chartData.push({
        age: ageAtYr,
        name: `Age ${ageAtYr}`,
        EPF: Math.round(dispEpf),
        NPS: Math.round(dispNps),
        SIP: Math.round(dispSip),
      });

      if (yr > 0) {
        tableRows.push([
          `Age ${ageAtYr}`,
          formatExactCurrency(dispEpf, currency),
          formatExactCurrency(dispNps, currency),
          formatExactCurrency(dispSip, currency),
        ]);
      }
    }
  } else {
    // Monthly points
    for (let m = 0; m <= totalMonths; m++) {
      const yr = m / 12;
      const ageAtStep = (currentAge + yr).toFixed(1);

      const epfAtStep = m === 0 ? 0 : calculateCorpus(monthlyEpf, epfRate, m);
      const npsAtStep = m === 0 ? 0 : calculateCorpus(monthlyNps, npsRate, m);
      const sipAtStep = m === 0 ? 0 : calculateCorpus(monthlySip, sipRate, m);

      const dispEpf = adjustInflation ? getInflationAdjusted(epfAtStep, yr) : epfAtStep;
      const dispNps = adjustInflation ? getInflationAdjusted(npsAtStep, yr) : npsAtStep;
      const dispSip = adjustInflation ? getInflationAdjusted(sipAtStep, yr) : sipAtStep;

      const label = `M${m} (${ageAtStep}y)`;

      chartData.push({
        step: m,
        name: label,
        EPF: Math.round(dispEpf),
        NPS: Math.round(dispNps),
        SIP: Math.round(dispSip),
      });

      if (m > 0) {
        tableRows.push([
          label,
          formatExactCurrency(dispEpf, currency),
          formatExactCurrency(dispNps, currency),
          formatExactCurrency(dispSip, currency),
        ]);
      }
    }
  }

  // Pie chart data
  const pieData = [
    { name: 'EPF Corpus', value: Math.round(finalEpf), color: '#3b82f6' },
    { name: 'NPS Corpus', value: Math.round(finalNps), color: '#a855f7' },
    { name: 'SIP Corpus', value: Math.round(finalSip), color: '#10b981' },
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
            {label}
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
      {/* Back button & Header */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All calculators</span>
        </button>

        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 mt-1">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Retirement Engine
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Head-to-head: EPF vs NPS vs SIP. See exactly what corpus you retire with at your target age.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        {/* Current Age */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Current Age
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <input
                type="number"
                value={isNaN(currentAge) ? '' : currentAge}
                min={18}
                max={70}
                step={1}
                onChange={(e) => setCurrentAge(Math.max(18, parseInt(e.target.value) || 18))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs ml-2">yrs</span>
            </div>
          </div>
          <input
            type="range"
            min={18}
            max={65}
            step={1}
            value={isNaN(currentAge) ? 18 : currentAge}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setCurrentAge(parseInt(e.target.value) || 18);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Target Retirement Age */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Target Retirement Age</span>
            <InfoTooltip term="Retirement Age" text={getTooltipForLabel('Retirement Age')} />
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <input
                type="number"
                value={isNaN(retirementAge) ? '' : retirementAge}
                min={35}
                max={80}
                step={1}
                onChange={(e) => setRetirementAge(Math.max(35, parseInt(e.target.value) || 35))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs ml-2">yrs</span>
            </div>
          </div>
          <input
            type="range"
            min={35}
            max={80}
            step={1}
            value={isNaN(retirementAge) ? 35 : retirementAge}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setRetirementAge(parseInt(e.target.value) || 35);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Basic Salary */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Basic Monthly Salary ({currency === 'INR' ? '₹' : '$'})</span>
            <InfoTooltip term="Basic Salary" text="Basic monthly salary used to calculate EPF contribution (24% total)." />
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">{currency === 'INR' ? '₹' : '$'}</span>
              <input
                type="number"
                value={isNaN(basicSalary) ? '' : basicSalary}
                min={10000}
                max={500000}
                step={5000}
                onChange={(e) => setBasicSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={10000}
            max={300000}
            step={5000}
            value={isNaN(basicSalary) ? 10000 : basicSalary}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setBasicSalary(parseFloat(e.target.value) || 10000);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Monthly NPS Contribution */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Monthly NPS Contribution ({currency === 'INR' ? '₹' : '$'})</span>
            <InfoTooltip term="Monthly NPS" text="Monthly contribution deposited into National Pension System." />
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">{currency === 'INR' ? '₹' : '$'}</span>
              <input
                type="number"
                value={isNaN(monthlyNps) ? '' : monthlyNps}
                min={500}
                max={100000}
                step={500}
                onChange={(e) => setMonthlyNps(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={isNaN(monthlyNps) ? 500 : monthlyNps}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setMonthlyNps(parseFloat(e.target.value) || 500);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Monthly Equity SIP Savings */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
            <span>Monthly Equity SIP ({currency === 'INR' ? '₹' : '$'})</span>
            <InfoTooltip term="Monthly SIP" text={getTooltipForLabel('Monthly SIP')} />
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">{currency === 'INR' ? '₹' : '$'}</span>
              <input
                type="number"
                value={isNaN(monthlySip) ? '' : monthlySip}
                min={500}
                max={200000}
                step={1000}
                onChange={(e) => setMonthlySip(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={500}
            max={100000}
            step={1000}
            value={isNaN(monthlySip) ? 500 : monthlySip}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setMonthlySip(parseFloat(e.target.value) || 500);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Expected Rates Section */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-gray-800/80">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">EPF Rate %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(epfRate) ? '' : epfRate}
                step={0.05}
                onChange={(e) => setEpfRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">NPS Rate %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(npsRate) ? '' : npsRate}
                step={0.1}
                onChange={(e) => setNpsRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">SIP Rate %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(sipRate) ? '' : sipRate}
                step={0.5}
                onChange={(e) => setSipRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>
        </div>

        {/* Inflation Toggle */}
        <div className="pt-2 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-gray-200 block">
                Adjust for Inflation
              </span>
              <span className="text-[11px] text-gray-400 block">
                Discount final corpus values with benchmark inflation
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adjustInflation}
                onChange={(e) => setAdjustInflation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {adjustInflation && (
            <div className="pt-2 space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Inflation Rate</span>
                <span className="font-mono text-orange-400 font-bold">{inflationRate}%</span>
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
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* QUICK SCENARIO COMPARISON TOOL */}
      <QuickScenarioTool
        calculatorTitle="Retirement Engine"
        currency={currency}
        currentParams={{
          currentAge,
          retirementAge,
          basicSalary,
          monthlyNps,
          monthlySip,
          epfRate,
          npsRate,
          sipRate,
          adjustInflation,
          inflationRate,
        }}
        paramLabels={{
          currentAge: 'Current Age',
          retirementAge: 'Retirement Age',
          basicSalary: 'Basic Salary/mo',
          monthlyNps: 'Monthly NPS',
          monthlySip: 'Monthly SIP',
          epfRate: 'EPF Rate (%)',
          npsRate: 'NPS Rate (%)',
          sipRate: 'SIP Rate (%)',
          adjustInflation: 'Adjust Inflation',
          inflationRate: 'Inflation Rate (%)',
        }}
        presetAggressive={{
          currentAge,
          retirementAge,
          basicSalary,
          monthlyNps: 10000,
          monthlySip: 25000,
          epfRate: 8.25,
          npsRate: 11,
          sipRate: 14,
          adjustInflation: false,
          inflationRate: 6,
        }}
        presetConservative={{
          currentAge,
          retirementAge,
          basicSalary,
          monthlyNps: 3000,
          monthlySip: 5000,
          epfRate: 8.25,
          npsRate: 9,
          sipRate: 10,
          adjustInflation: false,
          inflationRate: 6,
        }}
        onApplyParams={(p) => {
          if (p.currentAge !== undefined) setCurrentAge(p.currentAge);
          if (p.retirementAge !== undefined) setRetirementAge(p.retirementAge);
          if (p.basicSalary !== undefined) setBasicSalary(p.basicSalary);
          if (p.monthlyNps !== undefined) setMonthlyNps(p.monthlyNps);
          if (p.monthlySip !== undefined) setMonthlySip(p.monthlySip);
          if (p.epfRate !== undefined) setEpfRate(p.epfRate);
          if (p.npsRate !== undefined) setNpsRate(p.npsRate);
          if (p.sipRate !== undefined) setSipRate(p.sipRate);
          if (p.adjustInflation !== undefined) setAdjustInflation(p.adjustInflation);
          if (p.inflationRate !== undefined) setInflationRate(p.inflationRate);
        }}
      />

      {/* Result Cards */}
      <div className="space-y-3">
        {/* Top 2 Cards: EPF vs NPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              EPF CORPUS
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatExactCurrency(finalEpf, currency)}
            </div>
            <span className="text-[11px] text-gray-400 block font-mono">
              Monthly: {formatExactCurrency(monthlyEpf, currency)}
            </span>
          </div>

          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              NPS CORPUS
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatExactCurrency(finalNps, currency)}
            </div>
            <span className="text-[11px] text-gray-400 block font-mono">
              Monthly: {formatExactCurrency(monthlyNps, currency)}
            </span>
          </div>
        </div>

        {/* SIP Corpus */}
        <div className="bg-[#121215] border border-orange-900/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            SIP CORPUS
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-orange-400 tracking-tight">
            {formatExactCurrency(finalSip, currency)}
          </div>
          <span className="text-[11px] text-gray-400 block font-mono">
            Monthly: {formatExactCurrency(monthlySip, currency)}
          </span>
        </div>

        {/* Winner Card */}
        <div className="bg-[#121215] border border-orange-500/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xl">
          <div className="flex items-center space-x-1.5 text-orange-400 text-xs font-bold">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span>Best choice for your inputs</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-orange-400 font-mono">
            {bestOption.name} — {formatExactCurrency(bestOption.value, currency)}
          </div>
        </div>
      </div>

      {/* Wealth Gap Over Time Chart & Visualizer with Graph Switcher & Frequency Toggle */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <span>Wealth Gap Over Time</span>
            </h3>

            {/* Frequency Toggle: Yearly vs Monthly */}
            <div className="flex items-center bg-[#1a1a1e] p-0.5 rounded-lg border border-gray-800">
              <button
                onClick={() => setFrequency('yearly')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'yearly'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setFrequency('monthly')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-[#1a1a1e] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setChartMode('area')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                chartMode === 'area'
                  ? 'bg-orange-500 text-white shadow-md'
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
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>
          </div>
        </div>

        {/* Area Chart View */}
        {chartMode === 'area' && (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="SIP" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Area type="monotone" dataKey="NPS" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} />
                <Area type="monotone" dataKey="EPF" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Circle / Pie Chart View */}
        {chartMode === 'circle' && (
          <div className="h-72 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#121215" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Standalone Schedule Breakdown Table Section */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <TableIcon className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Schedule Breakdown</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                generatePdfReport({
                  title: 'Retirement Portfolio Projection Report',
                  subtitle: `Age: ${currentAge} to ${retirementAge} (${years} Yrs) | Basic: ${formatExactCurrency(basicSalary, currency)}`,
                  metrics: [
                    { label: 'EPF Final Corpus', value: formatExactCurrency(finalEpf, currency) },
                    { label: 'NPS Final Corpus', value: formatExactCurrency(finalNps, currency) },
                    { label: 'SIP Final Corpus', value: formatExactCurrency(finalSip, currency), isHighlight: true },
                    { label: 'Best Wealth Creator', value: `${bestOption.name} (${formatExactCurrency(bestOption.value, currency)})`, isHighlight: true },
                  ],
                  tableHeaders: ['Timeline', 'EPF', 'NPS', 'SIP'],
                  tableRows: tableRows.map((r) => [String(r[0]), String(r[1]), String(r[2]), String(r[3])]),
                  notes: 'Retirement corpus projections calculated using EPF, NPS, and SIP compounding rules.',
                })
              }
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-orange-300 hover:text-white bg-orange-600/30 hover:bg-orange-600/40 px-3 py-1.5 rounded-xl border border-orange-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Export Retirement Report as PDF"
              aria-label="Export Retirement Report as PDF"
            >
              <Download className="w-3.5 h-3.5 text-orange-300" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1e] text-gray-400 font-semibold border-b border-gray-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3 text-blue-400">EPF</th>
                <th className="py-2.5 px-3 text-purple-400">NPS</th>
                <th className="py-2.5 px-3 text-orange-400">SIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2.5 px-3 text-blue-400">{row[1]}</td>
                  <td className="py-2.5 px-3 text-purple-400">{row[2]}</td>
                  <td className="py-2.5 px-3 text-orange-400 font-bold">{row[3]}</td>
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
            setCurrentAge(30);
            setRetirementAge(60);
            setBasicSalary(50000);
            setMonthlyNps(5000);
            setMonthlySip(10000);
            setEpfRate(8.25);
            setNpsRate(10);
            setSipRate(13);
            setAdjustInflation(false);
            setInflationRate(6);
            setChartMode('area');
            setFrequency('yearly');
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#121215] hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-800 shadow-lg cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          <span>Reset to Defaults</span>
        </button>
      </div>
    </div>
  );
};
