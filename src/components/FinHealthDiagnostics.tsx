import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Award,
  TrendingUp,
  Wallet,
  PiggyBank,
  Sparkles,
  CheckCircle2,
  FileText,
  Download,
  BarChart3,
  HeartPulse,
  Scale,
  Shield,
  Layers,
} from 'lucide-react';
import { FinHealthState, Currency } from '../types';
import { NumberSliderInput } from './InputsPanel';
import { ChartViewer } from './ChartViewer';
import { calculateFinHealth } from '../utils/calculators';
import { formatExactCurrency, formatCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';

interface FinHealthDiagnosticsProps {
  state: FinHealthState;
  onChangeState: (newState: FinHealthState) => void;
  currency: Currency;
  onBack?: () => void;
}

export const FinHealthDiagnostics: React.FC<FinHealthDiagnosticsProps> = ({
  state,
  onChangeState,
  currency,
  onBack,
}) => {
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

  const result = calculateFinHealth(state, currency);

  // Extract core parameters
  const {
    monthlyIncome,
    monthlyEmi,
    monthlyExpenses,
    monthlyInvestments,
    emergencyFundCorpus,
    termInsuranceCover,
    healthInsuranceCover,
  } = state;

  const symbol = currency === 'INR' ? '₹' : '$';

  // Compute individual pillar scores out of 25
  const dti = monthlyIncome > 0 ? (monthlyEmi / monthlyIncome) * 100 : 0;
  const dtiScore = Math.max(0, Math.min(25, 25 - (dti - 30) * 0.8));

  const savingsRate = monthlyIncome > 0 ? (monthlyInvestments / monthlyIncome) * 100 : 0;
  const savingsScore = Math.min(25, (savingsRate / 30) * 25);

  const monthlyOutflow = monthlyExpenses + monthlyEmi;
  const emergencyMonths = monthlyOutflow > 0 ? emergencyFundCorpus / monthlyOutflow : 0;
  const emergencyScore = Math.min(25, (emergencyMonths / 6) * 25);

  const termRequired = monthlyIncome * 12 * 10;
  const termCoverageRatio = termRequired > 0 ? termInsuranceCover / termRequired : 0;
  const healthCoverageRatio = healthInsuranceCover / 500000;
  const insuranceScore = Math.min(25, (termCoverageRatio * 0.6 + healthCoverageRatio * 0.4) * 25);

  const totalScore = Math.round(dtiScore + savingsScore + emergencyScore + insuranceScore);

  // Status Branding
  let healthBadge = 'Exceptional Resilience';
  let badgeBg = isLight ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-orange-500/15 text-orange-300 border-orange-500/30';
  let scoreColor = isLight ? 'text-orange-700' : 'text-orange-400';

  if (totalScore < 40) {
    healthBadge = 'High Financial Vulnerability 🚨';
    badgeBg = isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    scoreColor = isLight ? 'text-rose-700' : 'text-rose-400';
  } else if (totalScore < 60) {
    healthBadge = 'Needs Immediate Attention ⚠️';
    badgeBg = isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    scoreColor = isLight ? 'text-amber-700' : 'text-amber-400';
  } else if (totalScore < 80) {
    healthBadge = 'Good Financial Stability 👍';
    badgeBg = isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    scoreColor = isLight ? 'text-blue-700' : 'text-blue-400';
  }

  // 5-Year Trajectory & Project Score Progression Calculation
  const projectionData = [];
  let currentAccumulatedWealth = emergencyFundCorpus;
  const annualInvestmentOutlay = monthlyInvestments * 12;
  const annualIncomeBase = monthlyIncome * 12;

  for (let year = 1; year <= 5; year++) {
    // Income grows at 7% p.a.
    const yrIncome = annualIncomeBase * Math.pow(1.07, year - 1);
    // Investments grow at 11% compound return
    currentAccumulatedWealth = (currentAccumulatedWealth + annualInvestmentOutlay) * 1.11;
    // Projected emergency fund improvement ratio
    const yrEmergencyMonths = monthlyOutflow > 0 ? currentAccumulatedWealth / (monthlyOutflow * 12) : 0;
    // Projected Score increment
    const projectedYearScore = Math.min(100, Math.round(totalScore + year * 3.5));

    projectionData.push({
      name: `Yr ${year}`,
      'Accumulated Wealth': Math.round(currentAccumulatedWealth),
      'Projected Health Score': projectedYearScore,
      'Annual Income': Math.round(yrIncome),
      'Emergency Runway (Months)': parseFloat((yrEmergencyMonths || 0).toFixed(1)),
    });
  }

  const handleExportPDF = () => {
    generatePdfReport({
      title: 'Financial Health Diagnostics & Project Score Audit',
      subtitle: `Overall FinHealth Score: ${totalScore}/100 (${healthBadge})`,
      metrics: [
        { label: 'Overall FinHealth Score', value: `${totalScore} / 100 (${healthBadge})`, isHighlight: true },
        { label: 'Debt-to-Income (DTI)', value: `${dti.toFixed(1)}%` },
        { label: 'Emergency Runway', value: `${emergencyMonths.toFixed(1)} Months` },
        { label: 'Savings & Investment Rate', value: `${savingsRate.toFixed(1)}%` },
        { label: 'Monthly Net Income', value: formatExactCurrency(monthlyIncome, currency) },
        { label: 'Monthly Total EMI', value: formatExactCurrency(monthlyEmi, currency) },
        { label: 'Monthly Living Expenses', value: formatExactCurrency(monthlyExpenses, currency) },
        { label: 'Monthly Investments', value: formatExactCurrency(monthlyInvestments, currency) },
        { label: 'Emergency Fund Corpus', value: formatExactCurrency(emergencyFundCorpus, currency) },
        { label: 'Term Life Cover', value: formatExactCurrency(termInsuranceCover, currency) },
        { label: 'Health Insurance Cover', value: formatExactCurrency(healthInsuranceCover, currency) },
      ],
      tableHeaders: result.tableHeaders || [],
      tableRows: (result.tableRows || []).map((row) => row.map((cell) => String(cell))),
      notes: (result.insights || []).join(' | '),
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
              }`}
              title="Return to Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <HeartPulse className="w-6 h-6 text-orange-500" />
              <span>FinHealth Diagnostics & Project Score</span>
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              360° Personal financial risk radar, emergency buffer audit, and 5-year resilience score trajectory.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            isLight
              ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-md'
              : 'bg-orange-500 text-white border-orange-400 hover:bg-orange-400 shadow-lg shadow-orange-500/20'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export Audit PDF</span>
        </button>
      </div>

      {/* FINHEALTH PROJECT SCORE HERO CARD */}
      <div
        className={`p-5 sm:p-7 rounded-2xl sm:rounded-3xl border shadow-xl transition-all ${
          isLight
            ? 'bg-slate-50 border-slate-200 shadow-slate-200/50 text-slate-900'
            : 'bg-gradient-to-br from-[#16161a] via-[#121215] to-[#1a1a22] border-gray-800/90 text-white'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Dial / Score */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-5 rounded-2xl border bg-black/5 dark:bg-black/30 border-black/10 dark:border-white/10 space-y-3">
            <span className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase flex items-center space-x-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span>FinHealth Project Score</span>
            </span>

            <div className="relative flex items-center justify-center">
              <div className={`text-5xl sm:text-6xl font-mono font-black tracking-tighter ${scoreColor}`}>
                {totalScore}
              </div>
              <span className={`text-lg font-mono font-bold ml-1 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>/ 100</span>
            </div>

            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${badgeBg}`}>
              {healthBadge}
            </span>

            <p className={`text-[11px] max-w-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Calculated across 4 pillars: Debt Burden, Wealth Creation, Emergency Cushion, and Risk Protection.
            </p>
          </div>

          {/* 4 Pillar Breakdown Progress Bars */}
          <div className="lg:col-span-7 space-y-3.5">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>Financial Health Pillar Breakdown</span>
            </h4>

            {/* Pillar 1: Debt Burden */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-500" />
                  <span>Debt Burden (DTI: {dti.toFixed(1)}%)</span>
                </span>
                <span className="font-mono font-bold">{Math.round(dtiScore)} / 25</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(dtiScore / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Pillar 2: Wealth Creation */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                  <span>Wealth Creation (Savings: {savingsRate.toFixed(1)}%)</span>
                </span>
                <span className="font-mono font-bold">{Math.round(savingsScore)} / 25</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${(savingsScore / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Pillar 3: Emergency Reserve */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-500" />
                  <span>Emergency Cushion ({emergencyMonths.toFixed(1)} Months)</span>
                </span>
                <span className="font-mono font-bold">{Math.round(emergencyScore)} / 25</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${(emergencyScore / 25) * 100}%` }}
                />
              </div>
            </div>

            {/* Pillar 4: Risk Protection */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-500" />
                  <span>Risk & Insurance Protection</span>
                </span>
                <span className="font-mono font-bold">{Math.round(insuranceScore)} / 25</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${(insuranceScore / 25) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK PARAMETERS INPUT SLIDERS PANEL */}
      <div
        className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xl space-y-5 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#121215] border-gray-800/90 text-white'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <h3 className="text-sm font-bold flex items-center space-x-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <span>Financial Diagnostic Input Parameters</span>
          </h3>
          <span className="text-[11px] font-mono text-gray-500">Real-time Recalculation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberSliderInput
            label="Monthly Net Take-Home Income"
            value={monthlyIncome}
            min={0}
            max={2000000}
            step={5000}
            prefix={symbol}
            onChange={(val) => onChangeState({ ...state, monthlyIncome: val })}
          />

          <NumberSliderInput
            label="Monthly Total EMI Burden"
            value={monthlyEmi}
            min={0}
            max={1000000}
            step={2000}
            prefix={symbol}
            onChange={(val) => onChangeState({ ...state, monthlyEmi: val })}
          />

          <NumberSliderInput
            label="Monthly Living & Rent Expenses"
            value={monthlyExpenses}
            min={0}
            max={1000000}
            step={2000}
            prefix={symbol}
            onChange={(val) => onChangeState({ ...state, monthlyExpenses: val })}
          />

          <NumberSliderInput
            label="Monthly Wealth Investments (SIP/EPF/Stocks)"
            value={monthlyInvestments}
            min={0}
            max={1000000}
            step={2000}
            prefix={symbol}
            onChange={(val) => onChangeState({ ...state, monthlyInvestments: val })}
          />

          <NumberSliderInput
            label="Liquid Emergency Reserve Balance"
            value={emergencyFundCorpus}
            min={0}
            max={10000000}
            step={25000}
            prefix={symbol}
            onChange={(val) => onChangeState({ ...state, emergencyFundCorpus: val })}
          />

          <NumberSliderInput
            label="Term Life Insurance Coverage"
            value={termInsuranceCover}
            min={0}
            max={100000000}
            step={500000}
            prefix={symbol}
            onChange={(val) => onChangeState({ ...state, termInsuranceCover: val })}
          />

          <NumberSliderInput
            label="Health Insurance Coverage"
            value={healthInsuranceCover}
            min={0}
            max={10000000}
            step={100000}
            prefix={symbol}
            onChange={(val) => onChangeState({ ...state, healthInsuranceCover: val })}
          />
        </div>
      </div>

      {/* CASH FLOW BREAKDOWN CHART WITH CHARTVIEWER */}
      <ChartViewer
        result={{
          chartData: result.chartData || [],
          chartKeys: result.chartKeys || [],
          summary: {
            totalInvestment: monthlyExpenses + monthlyEmi,
            interestEarned: monthlyInvestments,
            maturityValue: monthlyIncome,
          },
        }}
        currency={currency}
      />

      {/* 5-YEAR PROJECT SCORE & WEALTH TRAJECTORY PROJECTION */}
      <div
        className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-xl space-y-4 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#121215] border-gray-800/90 text-white'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <h3 className="text-sm font-bold flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>5-Year Financial Health & Wealth Trajectory Projection</span>
          </h3>
          <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Projected Score Growth
          </span>
        </div>

        {/* Chart View for 5-Year Trajectory */}
        <ChartViewer
          result={{
            chartData: projectionData,
            chartKeys: [
              { key: 'Accumulated Wealth', label: 'Accumulated Wealth', color: '#10b981' },
              { key: 'Projected Health Score', label: 'Projected Health Score', color: '#3b82f6' },
            ],
            summary: {
              totalInvestment: monthlyInvestments * 12 * 5,
              interestEarned: currentAccumulatedWealth - emergencyFundCorpus - monthlyInvestments * 12 * 5,
              maturityValue: currentAccumulatedWealth,
            },
          }}
          currency={currency}
        />

        {/* Detailed 5-Year Projection Table */}
        <div className="overflow-x-auto custom-scrollbar pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${isLight ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-gray-800 bg-gray-900/60 text-gray-300'}`}>
                <th className="py-2.5 px-3 font-bold">Timeline</th>
                <th className="py-2.5 px-3 font-bold">Proj. Annual Income</th>
                <th className="py-2.5 px-3 font-bold">Emergency Runway</th>
                <th className="py-2.5 px-3 font-bold">Accumulated Wealth</th>
                <th className="py-2.5 px-3 font-bold">Projected Health Score</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-gray-800/60'}`}>
              {projectionData.map((row, idx) => (
                <tr key={idx} className={isLight ? 'hover:bg-slate-100/60' : 'hover:bg-gray-900/40'}>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-500">{row.name}</td>
                  <td className="py-2.5 px-3 font-mono">{formatExactCurrency(row['Annual Income'], currency)}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-500 font-semibold">{row['Emergency Runway (Months)']} Months</td>
                  <td className="py-2.5 px-3 font-mono text-blue-500 font-bold">{formatExactCurrency(row['Accumulated Wealth'], currency)}</td>
                  <td className="py-2.5 px-3 font-mono font-black text-purple-500">{row['Projected Health Score']} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PILLAR AUDIT BENCHMARK TABLE & AI RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benchmark Audit Table */}
        <div
          className={`p-5 rounded-2xl border shadow-xl space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#121215] border-gray-800/90 text-white'
          }`}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-200 dark:border-gray-800 pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Pillar Benchmark Audit</span>
          </h3>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-600' : 'border-gray-800 text-gray-400'}`}>
                  <th className="py-2 px-2 font-bold">Pillar</th>
                  <th className="py-2 px-2 font-bold">Current Value</th>
                  <th className="py-2 px-2 font-bold">Target Benchmark</th>
                  <th className="py-2 px-2 font-bold">Score</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-gray-800/60'}`}>
                {(result.tableRows || []).map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2 font-semibold">{row[0]}</td>
                    <td className="py-2 px-2 font-mono">{row[1]}</td>
                    <td className="py-2 px-2 font-mono text-gray-500">{row[2]}</td>
                    <td className="py-2 px-2 font-mono font-bold text-emerald-500">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Actionable Recommendations */}
        <div
          className={`p-5 rounded-2xl border shadow-xl space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#121215] border-gray-800/90 text-white'
          }`}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-200 dark:border-gray-800 pb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Actionable Health Improvement Plan</span>
          </h3>

          <div className="space-y-2.5">
            {(result.insights || []).map((tip, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                    : 'bg-gray-900/80 border-gray-800 text-gray-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
