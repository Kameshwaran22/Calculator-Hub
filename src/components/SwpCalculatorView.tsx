import React, { useState } from 'react';
import {
  ArrowLeft,
  CircleDollarSign,
  Activity,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
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
import { InfoTooltip, getTooltipForLabel } from './InfoTooltip';
import { ChartViewer } from './ChartViewer';
import { NumberSliderInput } from './InputsPanel';
import { QuickScenarioTool } from './QuickScenarioTool';

interface SwpCalculatorViewProps {
  currency?: Currency;
  onBack: () => void;
}

type ChartMode = 'area' | 'circle' | 'table';

export const SwpCalculatorView: React.FC<SwpCalculatorViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [totalInvestment, setTotalInvestment] = useState<number>(5000000);
  const [annualReturn, setAnnualReturn] = useState<number>(8);
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState<number>(30000);
  const [years, setYears] = useState<number>(20);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  const totalMonths = Math.max(1, Math.round(years * 12));
  const monthlyRate = annualReturn / 12 / 100;

  const getInflationFactor = (monthIndex: number) => {
    if (!adjustInflation || inflationRate <= 0) return 1;
    const yr = monthIndex / 12;
    return Math.pow(1 + inflationRate / 100, yr);
  };

  // Month-by-Month Calculation Engine
  let currentCorpus = totalInvestment;
  let totalWithdrawnRaw = 0;
  let totalWithdrawnDisp = 0;
  let depletionMonth: number | null = null;

  interface MonthRow {
    month: number;
    year: number;
    opening: number;
    withdrawal: number;
    interest: number;
    closing: number;
  }

  const allMonths: MonthRow[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    const opening = currentCorpus;
    if (opening <= 0) {
      if (depletionMonth === null) depletionMonth = m - 1;
      allMonths.push({
        month: m,
        year: Math.ceil(m / 12),
        opening: 0,
        withdrawal: 0,
        interest: 0,
        closing: 0,
      });
      continue;
    }

    const inflationFactor = getInflationFactor(m);
    // Effective withdrawal for the month (optionally adjusted for inflation)
    const effectiveWithdrawal = adjustInflation
      ? monthlyWithdrawal * (Math.pow(1 + inflationRate / 100, Math.floor((m - 1) / 12)))
      : monthlyWithdrawal;

    const actualWithdrawal = Math.min(opening, effectiveWithdrawal);
    const corpusAfterWithdrawal = opening - actualWithdrawal;
    const monthInterest = corpusAfterWithdrawal * monthlyRate;
    const closing = Math.max(0, corpusAfterWithdrawal + monthInterest);

    totalWithdrawnRaw += actualWithdrawal;
    totalWithdrawnDisp += actualWithdrawal / (adjustInflation ? getInflationFactor(m) : 1);

    allMonths.push({
      month: m,
      year: Math.ceil(m / 12),
      opening: adjustInflation ? opening / inflationFactor : opening,
      withdrawal: adjustInflation ? actualWithdrawal / inflationFactor : actualWithdrawal,
      interest: adjustInflation ? monthInterest / inflationFactor : monthInterest,
      closing: adjustInflation ? closing / inflationFactor : closing,
    });

    currentCorpus = closing;
  }

  const finalCorpusDisp = adjustInflation
    ? currentCorpus / getInflationFactor(totalMonths)
    : currentCorpus;

  const totalInvestedDisp = adjustInflation
    ? totalInvestment / getInflationFactor(years)
    : totalInvestment;

  const totalInterestEarned = allMonths.reduce((sum, m) => sum + m.interest, 0);
  const totalWithdrawn = totalWithdrawnDisp;
  const finalCorpus = finalCorpusDisp;
  const timePeriodYears = years;
  const finalTotalWithdrawn = totalWithdrawnDisp;
  const finalRemainingCorpus = finalCorpusDisp;

  // Chart Data Generation (Yearly vs Monthly)
  const chartData: any[] = [];

  if (frequency === 'yearly') {
    chartData.push({
      step: 0,
      name: 'Y0',
      'Corpus Value': Math.round(totalInvestedDisp),
      'Total Withdrawn': 0,
    });

    let runningWithdrawn = 0;
    for (let y = 1; y <= years; y++) {
      const targetMonthIndex = Math.min(y * 12 - 1, allMonths.length - 1);
      const monthData = allMonths[targetMonthIndex];
      // sum withdrawals up to this year
      runningWithdrawn = allMonths.slice(0, targetMonthIndex + 1).reduce((acc, curr) => acc + curr.withdrawal, 0);

      chartData.push({
        step: y,
        name: `Y${y}`,
        'Corpus Value': Math.round(monthData ? monthData.closing : 0),
        'Total Withdrawn': Math.round(runningWithdrawn),
      });
    }
  } else {
    // Monthly chart points
    chartData.push({
      step: 0,
      name: 'M0',
      'Corpus Value': Math.round(totalInvestedDisp),
      'Total Withdrawn': 0,
    });

    let runningWithdrawn = 0;
    allMonths.forEach((m) => {
      runningWithdrawn += m.withdrawal;
      chartData.push({
        step: m.month,
        name: `M${m.month}`,
        'Corpus Value': Math.round(m.closing),
        'Total Withdrawn': Math.round(runningWithdrawn),
      });
    });
  }

  // Pie/Circle chart data
  const pieData = [
    { name: 'Total Withdrawn', value: Math.round(totalWithdrawnDisp), color: '#f59e0b' },
    { name: 'Final Corpus', value: Math.round(finalCorpusDisp), color: '#10b981' },
  ];

  // Yearly Schedule Calculation
  interface YearRow {
    year: number;
    opening: number;
    withdrawal: number;
    interest: number;
    closing: number;
  }

  const yearlyScheduleRows: YearRow[] = [];
  for (let y = 1; y <= years; y++) {
    const monthsInYear = allMonths.filter((m) => m.year === y);
    if (monthsInYear.length > 0) {
      const opening = monthsInYear[0].opening;
      const withdrawal = monthsInYear.reduce((acc, m) => acc + m.withdrawal, 0);
      const interest = monthsInYear.reduce((acc, m) => acc + m.interest, 0);
      const closing = monthsInYear[monthsInYear.length - 1].closing;
      yearlyScheduleRows.push({ year: y, opening, withdrawal, interest, closing });
    }
  }

  // Pagination for Month-by-Month breakdown (12 months per page)
  const pageSize = 12;
  const totalPages = Math.ceil(
    frequency === 'yearly' ? yearlyScheduleRows.length / pageSize : allMonths.length / pageSize
  );
  const paginatedMonths = allMonths.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedYears = yearlyScheduleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const tableRowsExport =
    frequency === 'yearly'
      ? yearlyScheduleRows.map((y) => [
          `Year ${y.year}`,
          formatExactCurrency(y.opening, currency),
          formatExactCurrency(y.withdrawal, currency),
          formatExactCurrency(y.interest, currency),
          formatExactCurrency(y.closing, currency),
        ])
      : allMonths.map((m) => [
          `Month ${m.month}`,
          formatExactCurrency(m.opening, currency),
          formatExactCurrency(m.withdrawal, currency),
          formatExactCurrency(m.interest, currency),
          formatExactCurrency(m.closing, currency),
        ]);

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
            <CircleDollarSign className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SWP Calculator
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Plan a Systematic Withdrawal Plan — see how long your corpus lasts and how much you can withdraw each month.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberSliderInput
            label="Total Investment Corpus"
            value={totalInvestment}
            min={100000}
            max={50000000}
            step={50000}
            prefix={currency === 'INR' ? '₹' : '$'}
            onChange={setTotalInvestment}
          />

          <NumberSliderInput
            label="Expected Annual Return"
            value={annualReturn}
            min={1}
            max={25}
            step={0.5}
            unit="%"
            onChange={setAnnualReturn}
          />

          <NumberSliderInput
            label="Monthly Withdrawal Amount"
            value={monthlyWithdrawal}
            min={1000}
            max={500000}
            step={1000}
            prefix={currency === 'INR' ? '₹' : '$'}
            onChange={setMonthlyWithdrawal}
          />

          <NumberSliderInput
            label="Withdrawal Tenure"
            value={years}
            min={1}
            max={40}
            step={1}
            unit="Years"
            onChange={setYears}
            themeColor="teal"
          />
        </div>

        {/* Inflation Adjustment Toggle */}
        <div className="pt-2 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-gray-200 block">
                Adjust for Inflation
              </span>
              <span className="text-[11px] text-gray-400 block">
                Recalculate purchasing power with annual inflation
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
        calculatorTitle="SWP Calculator"
        currency={currency}
        currentParams={{
          totalInvestment,
          annualReturn,
          monthlyWithdrawal,
          years,
          adjustInflation,
          inflationRate,
        }}
        paramLabels={{
          totalInvestment: 'Total Investment',
          annualReturn: 'Expected Return (%)',
          monthlyWithdrawal: 'Monthly Withdrawal',
          years: 'Tenure (Yrs)',
          adjustInflation: 'Adjust Inflation',
          inflationRate: 'Inflation Rate (%)',
        }}
        presetAggressive={{
          totalInvestment: 10000000,
          annualReturn: 10,
          monthlyWithdrawal: 60000,
          years: 25,
          adjustInflation: false,
          inflationRate: 6,
        }}
        presetConservative={{
          totalInvestment: 5000000,
          annualReturn: 7.5,
          monthlyWithdrawal: 25000,
          years: 20,
          adjustInflation: false,
          inflationRate: 6,
        }}
        onApplyParams={(p) => {
          if (p.totalInvestment !== undefined) setTotalInvestment(p.totalInvestment);
          if (p.annualReturn !== undefined) setAnnualReturn(p.annualReturn);
          if (p.monthlyWithdrawal !== undefined) setMonthlyWithdrawal(p.monthlyWithdrawal);
          if (p.years !== undefined) setYears(p.years);
          if (p.adjustInflation !== undefined) setAdjustInflation(p.adjustInflation);
          if (p.inflationRate !== undefined) setInflationRate(p.inflationRate);
        }}
      />

      {/* Result Cards */}
      <div className="space-y-3">
        {/* Top 2 Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Total Invested */}
          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              TOTAL INVESTED
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatExactCurrency(totalInvestedDisp, currency)}
            </div>
          </div>

          {/* Card 2: Total Withdrawn */}
          <div className="bg-[#121215] border border-amber-900/60 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              TOTAL WITHDRAWN
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tracking-tight">
              {formatExactCurrency(totalWithdrawnDisp, currency)}
            </div>
          </div>
        </div>

        {/* Card 3: Final Corpus */}
        <div
          className={`bg-[#121215] border rounded-2xl p-5 space-y-2 shadow-lg ${
            depletionMonth !== null ? 'border-red-900/80' : 'border-orange-900/60'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            FINAL CORPUS
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
              depletionMonth !== null ? 'text-red-400' : 'text-orange-400'
            }`}
          >
            {formatExactCurrency(finalCorpusDisp, currency)}
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-gray-400">
            {depletionMonth !== null ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-semibold">
                  Corpus depletes in {Math.floor(depletionMonth / 12)} yrs {depletionMonth % 12} mos
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span className="text-gray-300">Sustains full duration</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Growth Over Time Chart with Area, Line, Bar & Circle */}
      <ChartViewer
        result={{
          chartData: chartData,
          chartKeys: [
            { key: 'Corpus Value', label: 'Corpus Value', color: '#f97316' },
            { key: 'Total Withdrawn', label: 'Total Withdrawn', color: '#f59e0b' },
          ],
          summary: {
            totalInvestment: totalInvestment,
            interestEarned: totalInterestEarned,
            maturityValue: finalCorpus,
          },
        }}
        currency={currency}
      />

      {/* Breakdown Schedule Table Section */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-bold text-white">
              {frequency === 'yearly' ? 'Yearly' : 'Monthly'} Breakdown Schedule
            </h3>

            {/* Frequency Switcher: Yearly vs Monthly */}
            <div className="flex items-center bg-[#1a1a1e] p-0.5 rounded-lg border border-gray-800">
              <button
                onClick={() => {
                  setFrequency('yearly');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'yearly'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => {
                  setFrequency('monthly');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <button
            onClick={() =>
              generatePdfReport({
                title: 'Systematic Withdrawal Plan (SWP) Cash Flow Report',
                subtitle: `Initial Corpus: ${formatExactCurrency(totalInvestment, currency)} | Monthly Withdrawal: ${formatExactCurrency(monthlyWithdrawal, currency)} | Return: ${annualReturn}% p.a.`,
                metrics: [
                  { label: 'Initial Corpus', value: formatExactCurrency(totalInvestment, currency) },
                  { label: 'Monthly Withdrawal', value: formatExactCurrency(monthlyWithdrawal, currency) },
                  { label: 'Expected Return', value: `${annualReturn}% p.a.` },
                  { label: 'Total Withdrawals', value: formatExactCurrency(finalTotalWithdrawn, currency), isHighlight: true },
                  { label: 'Final Remaining Corpus', value: formatExactCurrency(finalRemainingCorpus, currency), isHighlight: true },
                ],
                tableHeaders: ['Period', 'Opening Balance', 'Withdrawal', 'Interest Earned', 'Closing Balance'],
                tableRows: tableRowsExport.map((r) => [
                  String(r[0]),
                  String(r[1]),
                  String(r[2]),
                  String(r[3]),
                  String(r[4]),
                ]),
                notes: 'SWP projection schedule assuming regular monthly withdrawals.',
              })
            }
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-600/30 hover:bg-amber-600/40 px-3 py-1.5 rounded-xl border border-amber-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Export SWP Report as PDF"
            aria-label="Export SWP Report as PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>PDF Report</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1e] text-gray-400 font-semibold border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">{frequency === 'yearly' ? 'Year' : 'Month'}</th>
                <th className="py-2.5 px-3">Opening</th>
                <th className="py-2.5 px-3 text-amber-400">Withdrawal</th>
                <th className="py-2.5 px-3 text-orange-400">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {frequency === 'yearly'
                ? paginatedYears.map((y) => (
                    <tr key={y.year} className="hover:bg-gray-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-gray-200">Year {y.year}</td>
                      <td className="py-2.5 px-3">{formatExactCurrency(y.opening, currency)}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">
                        {formatExactCurrency(y.withdrawal, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-orange-400 font-bold">
                        {formatExactCurrency(y.closing, currency)}
                      </td>
                    </tr>
                  ))
                : paginatedMonths.map((m) => (
                    <tr key={m.month} className="hover:bg-gray-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-gray-200">Month {m.month}</td>
                      <td className="py-2.5 px-3">{formatExactCurrency(m.opening, currency)}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">
                        {formatExactCurrency(m.withdrawal, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-orange-400 font-bold">
                        {formatExactCurrency(m.closing, currency)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1a1e] border border-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="text-xs font-mono text-gray-400">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1a1e] border border-gray-800 text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RESET TO DEFAULTS BUTTON */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={() => {
            setTotalInvestment(5000000);
            setAnnualReturn(8);
            setMonthlyWithdrawal(30000);
            setYears(20);
            setAdjustInflation(false);
            setInflationRate(6);
            setCurrentPage(1);
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
