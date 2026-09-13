import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
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
  LineChart,
  Line,
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
import { formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';
import { NumberSliderInput } from './InputsPanel';
import { QuickScenarioTool } from './QuickScenarioTool';
import { ChartViewer } from './ChartViewer';

interface ChildLegacyEngineViewProps {
  currency?: Currency;
  onBack: () => void;
}

type ChartMode = 'area' | 'circle' | 'table';

export const ChildLegacyEngineView: React.FC<ChildLegacyEngineViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [childAge, setChildAge] = useState<number>(0);
  const [targetAge, setTargetAge] = useState<number>(21);
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(10000);

  const [ppfRate, setPpfRate] = useState<number>(7.1);
  const [ssyRate, setSsyRate] = useState<number>(8.2);
  const [sipRate, setSipRate] = useState<number>(13);

  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);

  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  const years = Math.max(1, targetAge - childAge);
  const totalMonths = years * 12;

  // PPF & SSY capped at 1.5 Lakhs per year (₹12,500/month)
  const ppfMonthlyEffective = Math.min(monthlyInvestment, 12500);
  const ssyMonthlyEffective = Math.min(monthlyInvestment, 12500);

  // Total Invested
  const totalInvestedPPF = ppfMonthlyEffective * 12 * years;
  const totalInvestedSSY = ssyMonthlyEffective * 12 * Math.min(years, 15); // SSY deposit allowed max 15 yrs
  const totalInvestedSIP = monthlyInvestment * 12 * years;

  // Calculation engines
  const calculatePPFCorpus = (yrCount: number) => {
    let corpus = 0;
    const r = ppfRate / 100;
    for (let y = 1; y <= yrCount; y++) {
      const yearlyContrib = ppfMonthlyEffective * 12;
      corpus = (corpus + yearlyContrib) * (1 + r);
    }
    return corpus;
  };

  const calculateSSYCorpus = (yrCount: number) => {
    let corpus = 0;
    const r = ssyRate / 100;
    const depositYears = Math.min(yrCount, 15);
    for (let y = 1; y <= depositYears; y++) {
      const yearlyContrib = ssyMonthlyEffective * 12;
      corpus = (corpus + yearlyContrib) * (1 + r);
    }
    for (let y = depositYears + 1; y <= yrCount; y++) {
      corpus = corpus * (1 + r);
    }
    return corpus;
  };

  const calculateSIPCorpus = (yrCount: number) => {
    const months = yrCount * 12;
    if (sipRate <= 0) return monthlyInvestment * months;
    const r = sipRate / 12 / 100;
    return monthlyInvestment * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  };

  const rawPPF = calculatePPFCorpus(years);
  const rawSSY = calculateSSYCorpus(years);
  const rawSIP = calculateSIPCorpus(years);

  const getInflationAdjusted = (val: number, yr: number) => {
    if (!adjustInflation || inflationRate <= 0) return val;
    return val / Math.pow(1 + inflationRate / 100, yr);
  };

  const finalPPF = adjustInflation ? getInflationAdjusted(rawPPF, years) : rawPPF;
  const finalSSY = adjustInflation ? getInflationAdjusted(rawSSY, years) : rawSSY;
  const finalSIP = adjustInflation ? getInflationAdjusted(rawSIP, years) : rawSIP;

  const dispInvestedPPF = adjustInflation ? getInflationAdjusted(totalInvestedPPF, years) : totalInvestedPPF;
  const dispInvestedSSY = adjustInflation ? getInflationAdjusted(totalInvestedSSY, years) : totalInvestedSSY;
  const dispInvestedSIP = adjustInflation ? getInflationAdjusted(totalInvestedSIP, years) : totalInvestedSIP;

  // Winner
  const options = [
    { name: 'SIP', value: finalSIP },
    { name: 'SSY', value: finalSSY },
    { name: 'PPF', value: finalPPF },
  ];
  options.sort((a, b) => b.value - a.value);
  const bestOption = options[0];

  // Schedule Data (Yearly vs Monthly)
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  if (frequency === 'yearly') {
    for (let yr = 0; yr <= years; yr++) {
      const ageAtYr = childAge + yr;

      const ppfAtYr = yr === 0 ? 0 : calculatePPFCorpus(yr);
      const ssyAtYr = yr === 0 ? 0 : calculateSSYCorpus(yr);
      const sipAtYr = yr === 0 ? 0 : calculateSIPCorpus(yr);

      const dispPpf = adjustInflation ? getInflationAdjusted(ppfAtYr, yr) : ppfAtYr;
      const dispSsy = adjustInflation ? getInflationAdjusted(ssyAtYr, yr) : ssyAtYr;
      const dispSip = adjustInflation ? getInflationAdjusted(sipAtYr, yr) : sipAtYr;

      chartData.push({
        age: ageAtYr,
        name: `Age ${ageAtYr}`,
        PPF: Math.round(dispPpf),
        SSY: Math.round(dispSsy),
        SIP: Math.round(dispSip),
      });

      if (yr > 0) {
        tableRows.push([
          `Age ${ageAtYr}`,
          formatExactCurrency(dispPpf, currency),
          formatExactCurrency(dispSsy, currency),
          formatExactCurrency(dispSip, currency),
        ]);
      }
    }
  } else {
    // Monthly points
    for (let m = 0; m <= totalMonths; m++) {
      const yr = m / 12;
      const ageAtStep = (childAge + yr).toFixed(1);

      const ppfAtStep = m === 0 ? 0 : calculatePPFCorpus(yr);
      const ssyAtStep = m === 0 ? 0 : calculateSSYCorpus(yr);
      const sipAtStep = m === 0 ? 0 : calculateSIPCorpus(yr);

      const dispPpf = adjustInflation ? getInflationAdjusted(ppfAtStep, yr) : ppfAtStep;
      const dispSsy = adjustInflation ? getInflationAdjusted(ssyAtStep, yr) : ssyAtStep;
      const dispSip = adjustInflation ? getInflationAdjusted(sipAtStep, yr) : sipAtStep;

      const label = `M${m} (${ageAtStep}y)`;

      chartData.push({
        step: m,
        name: label,
        PPF: Math.round(dispPpf),
        SSY: Math.round(dispSsy),
        SIP: Math.round(dispSip),
      });

      if (m > 0) {
        tableRows.push([
          label,
          formatExactCurrency(dispPpf, currency),
          formatExactCurrency(dispSsy, currency),
          formatExactCurrency(dispSip, currency),
        ]);
      }
    }
  }

  // Pie chart data
  const pieData = [
    { name: 'PPF Corpus', value: Math.round(finalPPF), color: '#3b82f6' },
    { name: 'SSY Corpus', value: Math.round(finalSSY), color: '#ec4899' },
    { name: 'SIP Corpus', value: Math.round(finalSIP), color: '#10b981' },
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
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
            <Heart className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Child Legacy Engine
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Compare PPF vs SSY vs Equity SIP for your child's higher education or wedding fund.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberSliderInput
            label="Child Current Age"
            value={childAge}
            min={0}
            max={17}
            step={1}
            unit="Years"
            onChange={setChildAge}
          />

          <NumberSliderInput
            label="Target Goal Age"
            value={targetAge}
            min={18}
            max={25}
            step={1}
            unit="Years"
            onChange={setTargetAge}
          />

          <NumberSliderInput
            label="Monthly Investment"
            value={monthlyInvestment}
            min={1000}
            max={100000}
            step={1000}
            prefix={currency === 'INR' ? '₹' : '$'}
            onChange={setMonthlyInvestment}
          />
        </div>

        {/* Expected Rates Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-800/80">
          <NumberSliderInput
            label="PPF Interest Rate"
            value={ppfRate}
            min={4}
            max={12}
            step={0.1}
            unit="%"
            onChange={setPpfRate}
          />

          <NumberSliderInput
            label="SSY Interest Rate"
            value={ssyRate}
            min={4}
            max={12}
            step={0.1}
            unit="%"
            onChange={setSsyRate}
          />

          <NumberSliderInput
            label="Equity SIP Return"
            value={sipRate}
            min={5}
            max={25}
            step={0.5}
            unit="%"
            onChange={setSipRate}
          />
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
              <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {adjustInflation && (
            <div className="pt-2 space-y-1.5 animate-in fade-in">
              <NumberSliderInput
                label="Inflation Rate"
                value={inflationRate}
                min={1}
                max={15}
                step={0.5}
                unit="%"
                onChange={setInflationRate}
              />
            </div>
          )}
        </div>
      </div>

      {/* QUICK SCENARIO COMPARISON TOOL */}
      <QuickScenarioTool
        calculatorTitle="Child Legacy Engine"
        currency={currency}
        currentParams={{
          childAge,
          targetAge,
          monthlyInvestment,
          ppfRate,
          ssyRate,
          sipRate,
          adjustInflation,
          inflationRate,
        }}
        paramLabels={{
          childAge: 'Child Age',
          targetAge: 'Target Age',
          monthlyInvestment: 'Monthly Deposit',
          ppfRate: 'PPF Rate (%)',
          ssyRate: 'SSY Rate (%)',
          sipRate: 'SIP Rate (%)',
          adjustInflation: 'Adjust Inflation',
          inflationRate: 'Inflation Rate (%)',
        }}
        presetAggressive={{
          childAge: 2,
          targetAge: 21,
          monthlyInvestment: 25000,
          ppfRate: 7.1,
          ssyRate: 8.2,
          sipRate: 14.5,
          adjustInflation: false,
          inflationRate: 6,
        }}
        presetConservative={{
          childAge: 5,
          targetAge: 18,
          monthlyInvestment: 10000,
          ppfRate: 7.1,
          ssyRate: 8.2,
          sipRate: 11.0,
          adjustInflation: false,
          inflationRate: 6,
        }}
        onApplyParams={(p) => {
          if (p.childAge !== undefined) setChildAge(p.childAge);
          if (p.targetAge !== undefined) setTargetAge(p.targetAge);
          if (p.monthlyInvestment !== undefined) setMonthlyInvestment(p.monthlyInvestment);
          if (p.ppfRate !== undefined) setPpfRate(p.ppfRate);
          if (p.ssyRate !== undefined) setSsyRate(p.ssyRate);
          if (p.sipRate !== undefined) setSipRate(p.sipRate);
          if (p.adjustInflation !== undefined) setAdjustInflation(p.adjustInflation);
          if (p.inflationRate !== undefined) setInflationRate(p.inflationRate);
        }}
      />

      {/* Result Cards */}
      <div className="space-y-3">
        {/* PPF vs SSY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              PPF CORPUS
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400 tracking-tight">
              {formatExactCurrency(finalPPF, currency)}
            </div>
            <span className="text-[11px] text-gray-400 block font-mono">
              Total Invested: {formatExactCurrency(dispInvestedPPF, currency)}
            </span>
          </div>

          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              SSY CORPUS
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-pink-400 tracking-tight">
              {formatExactCurrency(finalSSY, currency)}
            </div>
            <span className="text-[11px] text-gray-400 block font-mono">
              Total Invested: {formatExactCurrency(dispInvestedSSY, currency)}
            </span>
          </div>
        </div>

        {/* SIP Corpus */}
        <div className="bg-[#121215] border border-emerald-900/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            SIP CORPUS
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatExactCurrency(finalSIP, currency)}
          </div>
          <span className="text-[11px] text-gray-400 block font-mono">
            Total Invested: {formatExactCurrency(dispInvestedSIP, currency)}
          </span>
        </div>

        {/* Winner Card */}
        <div className="bg-[#121215] border border-emerald-500/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xl">
          <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Highest Projected Wealth Strategy</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
            {bestOption.name} — {formatExactCurrency(bestOption.value, currency)}
          </div>
        </div>
      </div>

      {/* Corpus Growth Over Time Chart with Area, Line, Bar & Circle */}
      <ChartViewer
        result={{
          chartData: chartData,
          chartKeys: [
            { key: 'SIP', label: 'SIP Portfolio', color: '#10b981' },
            { key: 'SSY', label: 'SSY Portfolio', color: '#ec4899' },
            { key: 'PPF', label: 'PPF Portfolio', color: '#3b82f6' },
          ],
          summary: {
            totalInvestment: dispInvestedSIP,
            interestEarned: finalSIP - dispInvestedSIP,
            maturityValue: finalSIP,
          },
        }}
        currency={currency}
      />

      {/* Standalone Schedule Breakdown Table Section */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <TableIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Child Legacy Growth Schedule</h3>
          </div>

          <button
            onClick={() =>
              generatePdfReport({
                title: 'Child Legacy Wealth Engine Statement',
                subtitle: `Monthly Investment: ${formatExactCurrency(monthlyInvestment, currency)} | Child's Current Age: ${childAge} | Target Age: ${targetAge}`,
                metrics: [
                  { label: 'Monthly Contribution', value: formatExactCurrency(monthlyInvestment, currency) },
                  { label: 'Investment Horizon', value: `${years} Years` },
                  { label: 'PPF Maturity Value', value: formatExactCurrency(finalPPF, currency) },
                  { label: 'SSY Maturity Value', value: formatExactCurrency(finalSSY, currency) },
                  { label: 'Equity SIP Maturity Value', value: formatExactCurrency(finalSIP, currency), isHighlight: true },
                ],
                tableHeaders: ['Timeline', 'PPF Corpus', 'SSY Corpus', 'SIP Corpus'],
                tableRows: tableRows.map((r) => [
                  String(r[0]),
                  String(r[1]),
                  String(r[2]),
                  String(r[3]),
                ]),
                notes: 'Comparative projection for child legacy instruments (PPF, SSY, Equity SIP).',
              })
            }
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/40 px-3 py-1.5 rounded-xl border border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Export Child Legacy Report as PDF"
            aria-label="Export Child Legacy Report as PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>PDF Report</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-80 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1e] text-gray-400 font-semibold sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3 text-blue-400">PPF</th>
                <th className="py-2.5 px-3 text-pink-400">SSY</th>
                <th className="py-2.5 px-3 text-emerald-400">SIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2.5 px-3 text-blue-400">{row[1]}</td>
                  <td className="py-2.5 px-3 text-pink-400">{row[2]}</td>
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
            setChildAge(0);
            setTargetAge(21);
            setMonthlyInvestment(10000);
            setPpfRate(7.1);
            setSsyRate(8.2);
            setSipRate(13);
            setAdjustInflation(false);
            setInflationRate(6);
            setChartMode('area');
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
