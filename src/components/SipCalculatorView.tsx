import React, { useState } from 'react';
import {
  ArrowLeft,
  TrendingUp,
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

interface SipCalculatorViewProps {
  currency: Currency;
  onBack: () => void;
}

type ChartMode = 'area' | 'line' | 'circle';

export const SipCalculatorView: React.FC<SipCalculatorViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(10000);
  const [returnRate, setReturnRate] = useState<number>(13);
  const [years, setYears] = useState<number>(15);
  const [stepUpRate, setStepUpRate] = useState<number>(0);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  // Compute SIP Values with optional Step-Up
  const totalMonths = Math.max(1, Math.round(years * 12));
  const monthlyRate = returnRate / 12 / 100;

  let investedAmountRaw = 0;
  let maturityValueRaw = 0;

  if (stepUpRate <= 0) {
    investedAmountRaw = monthlyInvestment * totalMonths;
    if (monthlyRate > 0) {
      maturityValueRaw =
        monthlyInvestment *
        ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
        (1 + monthlyRate);
    } else {
      maturityValueRaw = investedAmountRaw;
    }
  } else {
    for (let m = 1; m <= totalMonths; m++) {
      const yrIndex = Math.floor((m - 1) / 12);
      const curMonthly = monthlyInvestment * Math.pow(1 + stepUpRate / 100, yrIndex);
      investedAmountRaw += curMonthly;
      if (monthlyRate > 0) {
        const remainingMonths = totalMonths - m + 1;
        maturityValueRaw += curMonthly * Math.pow(1 + monthlyRate, remainingMonths);
      } else {
        maturityValueRaw += curMonthly;
      }
    }
  }

  // Inflation adjustment helper
  const getInflationAdjusted = (val: number, yr: number) => {
    if (!adjustInflation || inflationRate <= 0) return val;
    return val / Math.pow(1 + inflationRate / 100, yr);
  };

  const finalInvested = adjustInflation
    ? getInflationAdjusted(investedAmountRaw, years)
    : investedAmountRaw;
  const finalMaturity = adjustInflation
    ? getInflationAdjusted(maturityValueRaw, years)
    : maturityValueRaw;
  const finalReturns = Math.max(0, finalMaturity - finalInvested);

  // Generate Schedule Data for Charts & Table
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  // Add 0 initial state
  chartData.push({
    step: 0,
    name: frequency === 'yearly' ? '0' : 'M0',
    'Invested Amount': 0,
    'Maturity Value': 0,
    'Est. Returns': 0,
  });

  let accumInv = 0;
  let accumMat = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const yrIndex = Math.floor((m - 1) / 12);
    const curMonthly = monthlyInvestment * Math.pow(1 + stepUpRate / 100, yrIndex);
    accumInv += curMonthly;

    if (monthlyRate > 0) {
      accumMat = (accumMat + curMonthly) * (1 + monthlyRate);
    } else {
      accumMat += curMonthly;
    }

    const isYearEnd = m % 12 === 0 || m === totalMonths;
    if (frequency === 'monthly' || isYearEnd) {
      const yr = m / 12;

      const dispInv = adjustInflation ? getInflationAdjusted(accumInv, yr) : accumInv;
      const dispMat = adjustInflation ? getInflationAdjusted(accumMat, yr) : accumMat;
      const dispGains = Math.max(0, dispMat - dispInv);

      const label = frequency === 'yearly' ? `Yr ${Math.ceil(yr)}` : `M${m}`;

      chartData.push({
        step: m,
        name: label,
        'Invested Amount': Math.round(dispInv),
        'Maturity Value': Math.round(dispMat),
        'Est. Returns': Math.round(dispGains),
      });

      if (isYearEnd) {
        tableRows.push([
          `Year ${Math.ceil(yr)}`,
          formatExactCurrency(dispInv, currency),
          formatExactCurrency(dispGains, currency),
          formatExactCurrency(dispMat, currency),
        ]);
      }
    }
  }

  // Pie/Donut Chart Data
  const pieData = [
    { name: 'Invested Amount', value: Math.round(finalInvested), color: '#64748b' },
    { name: 'Est. Returns', value: Math.round(finalReturns), color: '#10b981' },
  ];

  // Y-Axis formatting in Lakhs/Millions
  const formatYAxis = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return `${val}`;
  };

  // Custom Dark Mode Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono">
          <div className="text-gray-400 font-bold border-b border-gray-800 pb-1">Year {label}</div>
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
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All calculators</span>
        </button>

        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 mt-1 shadow-lg">
            <TrendingUp className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SIP Calculator
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              See how a monthly SIP grows into a corpus, with the power of compounding over time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
        {/* Group 1: Core Investment Parameters */}
        <div className="investment-group p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Investment Plan
          </div>

          {/* Monthly Investment */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
              <span>Monthly Investment ({currency === 'INR' ? '₹' : '$'})</span>
              <InfoTooltip term="Monthly Investment" text={getTooltipForLabel('monthly deposit')} />
            </label>
            <div className="relative">
              <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
                <span className="text-gray-400 font-mono text-sm mr-2">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={isNaN(monthlyInvestment) ? '' : monthlyInvestment}
                  min={500}
                  max={500000}
                  step={500}
                  onChange={(e) => setMonthlyInvestment(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={500}
              max={200000}
              step={500}
              value={isNaN(monthlyInvestment) ? 500 : monthlyInvestment}
              onChange={(e) => {
                triggerSliderHaptic(8, 30);
                setMonthlyInvestment(parseFloat(e.target.value) || 500);
              }}
              onInput={() => triggerSliderHaptic(8, 30)}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Expected Annual Return */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
              <span>Expected Annual Return (%)</span>
              <InfoTooltip term="Expected Annual Return" text={getTooltipForLabel('expected return')} />
            </label>
            <div className="relative">
              <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
                <input
                  type="number"
                  value={isNaN(returnRate) ? '' : returnRate}
                  min={1}
                  max={30}
                  step={0.5}
                  onChange={(e) => setReturnRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
                />
                <span className="text-gray-400 font-mono text-xs ml-2">%</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={0.5}
              value={isNaN(returnRate) ? 1 : returnRate}
              onChange={(e) => {
                triggerSliderHaptic(8, 30);
                setReturnRate(parseFloat(e.target.value) || 1);
              }}
              onInput={() => triggerSliderHaptic(8, 30)}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Time Period */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
              <span>Time Period (Years)</span>
              <InfoTooltip term="Time Period" text={getTooltipForLabel('tenure')} />
            </label>
            <div className="relative">
              <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
                <input
                  type="number"
                  value={isNaN(years) ? '' : years}
                  min={1}
                  max={40}
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
              max={40}
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
        </div>

        {/* Group 2: Growth Step-Up & Inflation */}
        <div className="investment-group p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Growth & Inflation Adjustments
          </div>

          {/* Annual Step-Up Percentage */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
              <span>Annual Step-Up (%)</span>
              <InfoTooltip term="Step-up Percentage" text={getTooltipForLabel('step-up percentage')} />
            </label>
            <div className="relative">
              <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
                <input
                  type="number"
                  value={isNaN(stepUpRate) ? '' : stepUpRate}
                  min={0}
                  max={25}
                  step={1}
                  onChange={(e) => setStepUpRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
                />
                <span className="text-gray-400 font-mono text-xs ml-2">% / yr</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={isNaN(stepUpRate) ? 0 : stepUpRate}
              onChange={(e) => {
                triggerSliderHaptic(8, 30);
                setStepUpRate(parseFloat(e.target.value) || 0);
              }}
              onInput={() => triggerSliderHaptic(8, 30)}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
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
      </div>

      {/* QUICK SCENARIO COMPARISON TOOL */}
      <QuickScenarioTool
        calculatorTitle="SIP Calculator"
        currency={currency}
        currentParams={{
          monthlyInvestment,
          returnRate,
          years,
          adjustInflation,
          inflationRate,
        }}
        paramLabels={{
          monthlyInvestment: 'Monthly Deposit',
          returnRate: 'Expected Return (%)',
          years: 'Time Period (Yrs)',
          adjustInflation: 'Adjust Inflation',
          inflationRate: 'Inflation Rate (%)',
        }}
        presetAggressive={{
          monthlyInvestment: 25000,
          returnRate: 15,
          years: 20,
          adjustInflation: false,
          inflationRate: 6,
        }}
        presetConservative={{
          monthlyInvestment: 10000,
          returnRate: 9,
          years: 10,
          adjustInflation: false,
          inflationRate: 6,
        }}
        onApplyParams={(p) => {
          if (p.monthlyInvestment !== undefined) setMonthlyInvestment(p.monthlyInvestment);
          if (p.returnRate !== undefined) setReturnRate(p.returnRate);
          if (p.years !== undefined) setYears(p.years);
          if (p.adjustInflation !== undefined) setAdjustInflation(p.adjustInflation);
          if (p.inflationRate !== undefined) setInflationRate(p.inflationRate);
        }}
      />

      {/* Result Cards */}
      <div className="space-y-3">
        {/* Top 2 Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Invested Amount */}
          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              INVESTED AMOUNT
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatExactCurrency(finalInvested, currency)}
            </div>
          </div>

          {/* Card 2: Est. Returns */}
          <div className="bg-[#121215] border border-emerald-900/60 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              EST. RETURNS
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatExactCurrency(finalReturns, currency)}
            </div>
          </div>
        </div>

        {/* Card 3: Maturity Value (Full Width with Download PDF Report Button) */}
        <div className="bg-[#121215] border border-emerald-500/60 rounded-2xl p-5 space-y-3 shadow-lg bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-emerald-400 uppercase block">
              MATURITY VALUE
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatExactCurrency(finalMaturity, currency)}
            </div>
          </div>

          {/* Download Report PDF Button */}
          <button
            onClick={() =>
              generatePdfReport({
                title: 'SIP Investment Plan Summary Report',
                subtitle: `Monthly Investment: ${formatExactCurrency(monthlyInvestment, currency)} | Expected Return: ${returnRate}% p.a. | Tenure: ${years} Years`,
                metrics: [
                  { label: 'Monthly SIP Deposit', value: formatExactCurrency(monthlyInvestment, currency) },
                  { label: 'Expected Annual Return', value: `${returnRate}% p.a.` },
                  { label: 'Investment Horizon', value: `${years} Years` },
                  { label: 'Annual Step-Up Rate', value: `${stepUpRate}%` },
                  { label: 'Total Invested Capital', value: formatExactCurrency(finalInvested, currency) },
                  { label: 'Estimated Wealth Returns', value: formatExactCurrency(finalReturns, currency), isHighlight: true },
                  { label: 'Total Maturity Portfolio', value: formatExactCurrency(finalMaturity, currency), isHighlight: true },
                ],
                tableHeaders: ['Period', 'Total Invested', 'Est. Returns', 'Maturity Corpus'],
                tableRows: tableRows.map((row) => [
                  String(row[0]),
                  String(row[1]),
                  String(row[2]),
                  String(row[3]),
                ]),
                notes: 'Generated by Calculator Hub Investment Engine. Values are compounding estimates based on your input criteria.',
              })
            }
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg cursor-pointer shrink-0"
            title="Download Clean Branded PDF Report"
            aria-label="Download Clean Branded PDF Report"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Growth Over Time Chart & Visualizer with Area, Line, Bar & Circle */}
      <ChartViewer
        result={{
          chartData: chartData.map((d) => ({
            name: d.name,
            'Invested Amount': d['Invested Amount'],
            'Maturity Value': d['Maturity Value'],
          })),
          chartKeys: [
            { key: 'Invested Amount', label: 'Invested Amount', color: '#3b82f6' },
            { key: 'Maturity Value', label: 'Maturity Value', color: '#10b981' },
          ],
          summary: {
            totalInvestment: finalInvested,
            totalReturns: finalReturns,
            maturityValue: finalMaturity,
          },
        }}
        currency={currency}
        inflationRate={inflationRate}
      />

      {/* Standalone Schedule Breakdown Table Section */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <TableIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">SIP Breakdown Schedule</h3>

            {/* Frequency Switcher: Yearly vs Monthly */}
            <div className="flex items-center bg-[#1a1a1e] p-0.5 rounded-lg border border-gray-800">
              <button
                onClick={() => setFrequency('yearly')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'yearly'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setFrequency('monthly')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                generatePdfReport({
                  title: 'SIP Wealth Growth Report',
                  subtitle: `Monthly Investment: ${formatExactCurrency(monthlyInvestment, currency)} | Return: ${returnRate}% p.a. | Tenure: ${years} Years`,
                  metrics: [
                    { label: 'Monthly SIP', value: formatExactCurrency(monthlyInvestment, currency) },
                    { label: 'Expected Return', value: `${returnRate}% p.a.` },
                    { label: 'Tenure', value: `${years} Years` },
                    { label: 'Total Amount Invested', value: formatExactCurrency(finalInvested, currency) },
                    { label: 'Estimated Wealth Gain', value: formatExactCurrency(finalReturns, currency), isHighlight: true },
                    { label: 'Maturity Portfolio Value', value: formatExactCurrency(finalMaturity, currency), isHighlight: true },
                  ],
                  tableHeaders: ['Period', 'Invested', 'Est. Gain', 'Maturity Value'],
                  tableRows: tableRows.map((row) => [
                    String(row[0]),
                    String(row[1]),
                    String(row[2]),
                    String(row[3]),
                  ]),
                  notes: 'Projections are estimates based on compounding return parameters.',
                })
              }
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/40 px-3 py-1.5 rounded-xl border border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Export SIP Report as PDF Document"
              aria-label="Export SIP Report as PDF Document"
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
                <th className="py-2.5 px-3">{frequency === 'yearly' ? 'Year' : 'Month'}</th>
                <th className="py-2.5 px-3">Invested Amount</th>
                <th className="py-2.5 px-3 text-emerald-400">Est. Returns</th>
                <th className="py-2.5 px-3 text-emerald-400">Maturity Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2.5 px-3">{row[1]}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">{row[2]}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{row[3]}</td>
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
            setMonthlyInvestment(10000);
            setReturnRate(13);
            setYears(15);
            setAdjustInflation(false);
            setInflationRate(6);
            setChartMode('line');
            setFrequency('yearly');
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
