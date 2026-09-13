import React, { useState } from 'react';
import {
  ArrowLeft,
  Coins,
  Trophy,
  Activity,
  Download,
  RotateCcw,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Currency } from '../types';
import { formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';
import { triggerSliderHaptic } from '../utils/haptics';

interface GoldReturnsCalculatorViewProps {
  currency?: Currency;
  onBack: () => void;
}

export const GoldReturnsCalculatorView: React.FC<GoldReturnsCalculatorViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [capital, setCapital] = useState<number>(100000);
  const [expectedReturn, setExpectedReturn] = useState<number>(10);
  const [years, setYears] = useState<number>(10);
  const [etfExpenseRatio, setEtfExpenseRatio] = useState<number>(0.8);
  const [etfTrackingError, setEtfTrackingError] = useState<number>(0.25);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);

  const r = expectedReturn / 100;

  // Physical Gold: 6% making + GST upfront -> Net capital = capital * 0.94
  const physicalNetCapital = capital * 0.94;
  const physicalMaturityRaw = physicalNetCapital * Math.pow(1 + r, years);

  // Digital Gold: 3% GST upfront -> Net capital = capital * 0.97
  const digitalNetCapital = capital * 0.97;
  const digitalMaturityRaw = digitalNetCapital * Math.pow(1 + r, years);

  // Gold ETF: Fee = Expense ratio + Tracking error -> Net annual return
  const etfNetReturnRate = Math.max(0, r - (etfExpenseRatio + etfTrackingError) / 100);
  const etfMaturityRaw = capital * Math.pow(1 + etfNetReturnRate, years);

  const getInflationAdjusted = (val: number, yr: number) => {
    if (!adjustInflation || inflationRate <= 0) return val;
    return val / Math.pow(1 + inflationRate / 100, yr);
  };

  const finalPhysical = adjustInflation
    ? getInflationAdjusted(physicalMaturityRaw, years)
    : physicalMaturityRaw;
  const finalDigital = adjustInflation
    ? getInflationAdjusted(digitalMaturityRaw, years)
    : digitalMaturityRaw;
  const finalEtf = adjustInflation
    ? getInflationAdjusted(etfMaturityRaw, years)
    : etfMaturityRaw;

  // Determine Best Winner
  const options = [
    { name: 'Digital Gold', value: finalDigital },
    { name: 'Physical Gold', value: finalPhysical },
    { name: 'Gold ETF', value: finalEtf },
  ];

  options.sort((a, b) => b.value - a.value);
  const bestOption = options[0];

  // Year-by-Year Growth Schedule Data
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  for (let yr = 0; yr <= years; yr++) {
    const physAtYr = physicalNetCapital * Math.pow(1 + r, yr);
    const digAtYr = digitalNetCapital * Math.pow(1 + r, yr);
    const etfAtYr = capital * Math.pow(1 + etfNetReturnRate, yr);

    const dispPhys = adjustInflation ? getInflationAdjusted(physAtYr, yr) : physAtYr;
    const dispDig = adjustInflation ? getInflationAdjusted(digAtYr, yr) : digAtYr;
    const dispEtf = adjustInflation ? getInflationAdjusted(etfAtYr, yr) : etfAtYr;

    chartData.push({
      year: yr,
      name: `${yr}`,
      Physical: Math.round(dispPhys),
      Digital: Math.round(dispDig),
      ETF: Math.round(dispEtf),
    });

    if (yr > 0) {
      tableRows.push([
        `Year ${yr}`,
        formatExactCurrency(dispPhys, currency),
        formatExactCurrency(dispDig, currency),
        formatExactCurrency(dispEtf, currency),
      ]);
    }
  }

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
                  style={{ backgroundColor: entry.color }}
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
          <div className="p-3 rounded-2xl bg-orange-950/40 border border-orange-800/60 flex items-center justify-center shrink-0 mt-1">
            <Coins className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gold Returns Calculator
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Compare Physical, Digital & ETF gold returns with fees built in.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        {/* Investment Capital */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Investment Capital ({currency === 'INR' ? '₹' : '$'})
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={isNaN(capital) ? '' : capital}
                min={1000}
                max={5000000}
                step={5000}
                onChange={(e) => setCapital(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={10000}
            max={1000000}
            step={10000}
            value={isNaN(capital) ? 10000 : capital}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setCapital(parseFloat(e.target.value) || 10000);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Expected Returns */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Expected Returns (% p.a.)
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <input
                type="number"
                value={isNaN(expectedReturn) ? '' : expectedReturn}
                min={1}
                max={30}
                step={0.5}
                onChange={(e) => setExpectedReturn(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs ml-2">%</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={25}
            step={0.5}
            value={isNaN(expectedReturn) ? 1 : expectedReturn}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setExpectedReturn(parseFloat(e.target.value) || 1);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Time Period */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Time Period (Years)
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
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

        {/* ETF Expense Ratio & Tracking Error side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">
              ETF Expense Ratio (%)
            </label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2">
              <input
                type="number"
                value={isNaN(etfExpenseRatio) ? '' : etfExpenseRatio}
                min={0}
                max={5}
                step={0.05}
                onChange={(e) => setEtfExpenseRatio(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-xs sm:text-sm focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">
              ETF Tracking Error (%)
            </label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2">
              <input
                type="number"
                value={isNaN(etfTrackingError) ? '' : etfTrackingError}
                min={0}
                max={5}
                step={0.05}
                onChange={(e) => setEtfTrackingError(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-xs sm:text-sm focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs">%</span>
            </div>
          </div>
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

      {/* Result Cards */}
      <div className="space-y-3">
        {/* Top 2 Cards: Physical vs Digital */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Physical Gold */}
          <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              PHYSICAL GOLD
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatExactCurrency(finalPhysical, currency)}
            </div>
            <p className="text-[11px] text-gray-400">6% making + GST charged upfront</p>
          </div>

          {/* Digital Gold */}
          <div className="bg-[#121215] border border-orange-900/60 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
              DIGITAL GOLD
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-orange-400 tracking-tight">
              {formatExactCurrency(finalDigital, currency)}
            </div>
            <p className="text-[11px] text-gray-400">3% GST charged upfront</p>
          </div>
        </div>

        {/* Card 3: Gold ETF */}
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            GOLD ETF
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {formatExactCurrency(finalEtf, currency)}
          </div>
          <p className="text-[11px] text-gray-400">
            Net return {(etfNetReturnRate * 100).toFixed(2)}% after fees
          </p>
        </div>

        {/* Card 4: Best Winner Highlight */}
        <div className="bg-[#121215] border border-orange-500/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xl">
          <div className="flex items-center space-x-1.5 text-orange-400 text-xs font-bold">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span>Best after fees</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-orange-400 font-mono">
            {bestOption.name} — {formatExactCurrency(bestOption.value, currency)}
          </div>
        </div>
      </div>

      {/* Growth Comparison Chart */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <span>Growth Comparison</span>
          </h3>
        </div>

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
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="Physical"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Digital"
                stroke="#a855f7"
                fill="#a855f7"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="ETF"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Standalone Schedule Breakdown Table Section */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <TableIcon className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Gold Investment Growth Schedule</h3>
          </div>

          <button
            onClick={() =>
              generatePdfReport({
                title: 'Gold Investment Comparison Statement',
                subtitle: `Capital: ${formatExactCurrency(capital, currency)} | Expected Return: ${expectedReturn}% p.a. | Tenure: ${years} Years`,
                metrics: [
                  { label: 'Initial Capital', value: formatExactCurrency(capital, currency) },
                  { label: 'Physical Gold Final Value', value: formatExactCurrency(finalPhysical, currency) },
                  { label: 'Digital Gold Final Value', value: formatExactCurrency(finalDigital, currency) },
                  { label: 'Gold ETF Final Value', value: formatExactCurrency(finalEtf, currency) },
                  { label: 'Best Option After Fees', value: `${bestOption.name} (${formatExactCurrency(bestOption.value, currency)})`, isHighlight: true },
                ],
                tableHeaders: ['Year', 'Physical Gold', 'Digital Gold', 'Gold ETF'],
                tableRows: tableRows.map((r) => [
                  String(r[0]),
                  String(r[1]),
                  String(r[2]),
                  String(r[3]),
                ]),
                notes: 'Projections account for initial GST/making charges and ongoing ETF expense ratios.',
              })
            }
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white hover:text-white bg-orange-600/60 hover:bg-orange-600/80 px-3 py-1.5 rounded-xl border border-orange-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Export Gold Report as PDF"
            aria-label="Export Gold Report as PDF"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>PDF Report</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-80 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1e] text-gray-400 font-semibold sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-blue-400">Physical Gold</th>
                <th className="py-2.5 px-3 text-purple-400">Digital Gold</th>
                <th className="py-2.5 px-3 text-orange-400">Gold ETF</th>
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
            setCapital(100000);
            setExpectedReturn(10);
            setYears(10);
            setEtfExpenseRatio(0.8);
            setEtfTrackingError(0.25);
            setAdjustInflation(false);
            setInflationRate(6);
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
