import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ChevronRight,
  Sparkles,
  Layers,
  ArrowLeft,
  TrendingUp,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { Currency, CalculatorType } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';

interface SmartIdeasEngineProps {
  currency: Currency;
  onNavigate: (type: CalculatorType) => void;
  onBack?: () => void;
}

type ChartMode = 'line' | 'area' | 'circle';

export const SmartIdeasEngine: React.FC<SmartIdeasEngineProps> = ({ currency, onNavigate, onBack }) => {
  const [corpus, setCorpus] = useState<number>(500000);
  const [tranches, setTranches] = useState<number>(5);
  const [rate, setRate] = useState<number>(7.2);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  const trancheAmount = corpus / Math.max(1, tranches);

  // Generate Schedule for Laddering
  const rows = Array.from({ length: Math.min(12, Math.max(1, tranches)) }, (_, i) => {
    const year = i + 1;
    const nominalMaturity = trancheAmount * Math.pow(1 + rate / 100, year);
    const realMaturity = adjustInflation
      ? nominalMaturity / Math.pow(1 + inflationRate / 100, year)
      : nominalMaturity;

    return {
      ladderNum: i + 1,
      maturesIn: `${year} yr`,
      amount: trancheAmount,
      maturityValue: Math.round(realMaturity),
    };
  });

  const totalMaturity = rows.reduce((sum, r) => sum + r.maturityValue, 0);

  // Chart & Table schedule generation (Yearly vs Monthly)
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  rows.forEach((r) => {
    if (frequency === 'yearly') {
      chartData.push({
        name: `Ladder #${r.ladderNum}`,
        timeline: `${r.ladderNum} Yr`,
        Principal: Math.round(r.amount),
        'Maturity Value': r.maturityValue,
      });
      tableRows.push([
        `Ladder #${r.ladderNum} (${r.ladderNum} Yr)`,
        formatExactCurrency(r.amount, currency),
        formatExactCurrency(r.maturityValue - r.amount, currency),
        formatExactCurrency(r.maturityValue, currency),
      ]);
    } else {
      // Monthly steps for each ladder tranche
      for (let m = 1; m <= r.ladderNum * 12; m += 3) {
        const mVal = r.amount * Math.pow(1 + rate / 100, m / 12);
        const dispVal = adjustInflation ? mVal / Math.pow(1 + inflationRate / 100, m / 12) : mVal;

        if (r.ladderNum === 1 || m % 6 === 0) {
          chartData.push({
            name: `L#${r.ladderNum} (M${m})`,
            timeline: `M${m}`,
            Principal: Math.round(r.amount),
            'Maturity Value': Math.round(dispVal),
          });
          tableRows.push([
            `Ladder #${r.ladderNum} Month ${m}`,
            formatExactCurrency(r.amount, currency),
            formatExactCurrency(dispVal - r.amount, currency),
            formatExactCurrency(dispVal, currency),
          ]);
        }
      }
    }
  });

  const pieData = rows.map((r) => ({
    name: `Ladder #${r.ladderNum}`,
    value: r.maturityValue,
  }));

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];
  const prefix = currency === 'INR' ? '₹' : '$';

  const strategies = [
    {
      id: 'sip' as CalculatorType,
      title: 'SIP + SWP combo',
      desc: 'Build a corpus with SIP through your career, then switch to SWP after retirement for a steady income.',
    },
    {
      id: 'buy_vs_rent' as CalculatorType,
      title: 'Buy vs Rent, run the numbers first',
      desc: 'Before signing a home loan, check the Buy vs Rent Engine — renting and investing the difference sometimes wins.',
    },
    {
      id: 'debt' as CalculatorType,
      title: 'Debt first, then goals',
      desc: 'Clear high-interest debt via the Debt Engine before ramping up SIPs — the guaranteed return beats most markets.',
    },
    {
      id: 'child' as CalculatorType,
      title: 'Separate child & retirement pots',
      desc: 'Never mix the Child Legacy Engine and Retirement Engine — each goal deserves its own dedicated investment.',
    },
    {
      id: 'allocator' as CalculatorType,
      title: 'Rebalance yearly',
      desc: 'Use the Investment Allocator once a year to bring equity/debt/gold back to your target mix.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Navigation Back Header */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold text-orange-400 hover:text-orange-300 bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All calculators</span>
        </button>
      )}

      {/* Hero Header */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl flex items-start space-x-4 shadow-xl">
        <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-orange-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Smart Ideas Engine</h2>
          <p className="text-xs text-gray-400 mt-1">
            FD laddering and strategic wealth frameworks to optimize liquidity, interest, and risk management.
          </p>
        </div>
      </div>

      {/* FD Ladder Builder Card */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="border-b border-gray-800/80 pb-3">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">FD Ladder Builder</h3>
          <p className="text-[10px] text-gray-500">Break a lump sum into staggered maturity tranches for continuous liquidity.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">
              Total Amount to Ladder ({prefix})
            </label>
            <input
              type="number"
              value={corpus}
              onChange={(e) => setCorpus(parseFloat(e.target.value) || 0)}
              className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">Total capital to split across tranches</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">
              Number of Ladders (steps)
            </label>
            <input
              type="number"
              value={tranches}
              min={1}
              max={12}
              onChange={(e) => setTranches(parseInt(e.target.value) || 1)}
              className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">Number of staggered FDs (1-12 yrs)</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">
              Interest Rate (% p.a.)
            </label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">Fixed deposit annual return rate</p>
          </div>
        </div>

        {/* Adjust for Inflation Toggle */}
        <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-gray-800/80">
          <div>
            <span className="text-xs font-semibold text-gray-300 block">Show value in today's {prefix}</span>
            <span className="text-[10px] text-gray-500 block">Adjust future maturity values for inflation</span>
          </div>
          <button
            onClick={() => setAdjustInflation(!adjustInflation)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              adjustInflation ? 'bg-amber-500 justify-end' : 'bg-gray-800 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {adjustInflation && (
          <div className="bg-amber-950/20 border border-amber-900/40 p-3 rounded-xl flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Assumed Inflation Rate:</span>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                step="0.5"
                value={inflationRate}
                onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                className="w-16 bg-black border border-gray-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-400 text-center"
              />
              <span className="text-xs text-amber-300">%</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Card */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-1 shadow-xl">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">TOTAL MATURITY VALUE</span>
        <div className="text-2xl md:text-3xl font-bold font-mono text-amber-400">
          {formatExactCurrency(totalMaturity, currency)}
        </div>
        <p className="text-[10px] text-gray-500">Combined value across all {tranches} ladder tranches</p>
      </div>

      {/* Graph Visualizer Suite Card */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-xs font-bold text-gray-300 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Ladder Schedule Graph</span>
            </h3>

            {/* Frequency Switcher: Yearly vs Monthly */}
            <div className="flex items-center bg-gray-900 p-0.5 rounded-lg border border-gray-800">
              <button
                onClick={() => setFrequency('yearly')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'yearly'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setFrequency('monthly')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Chart Mode Switcher Buttons: Order Line -> Area -> Circle */}
          <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setChartMode('line')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                chartMode === 'line'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              onClick={() => setChartMode('area')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                chartMode === 'area'
                  ? 'bg-amber-500 text-black shadow-md'
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
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>
          </div>
        </div>

        {/* CHART VIEW 1: LINE CHART */}
        {chartMode === 'line' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
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
                <Line type="monotone" dataKey="Maturity Value" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="Principal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CHART VIEW 2: AREA CHART */}
        {chartMode === 'area' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
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
                <Area type="monotone" dataKey="Maturity Value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Area type="monotone" dataKey="Principal" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
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
                          <span className="font-bold text-amber-400 ml-1">
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
            <h3 className="text-xs font-bold text-gray-300">FD Ladder Schedule Table</h3>
            <p className="text-[10px] text-gray-500">Tranche-by-tranche breakdown of principal and maturity values</p>
          </div>
          <button
            onClick={() =>
              generatePdfReport({
                title: 'FD Ladder Schedule Breakdown Report',
                subtitle: `FD Ladder Strategy: ${tranches} Ladders | Rate: ${rate}% p.a.`,
                metrics: [
                  { label: 'Total Principal Invested', value: formatExactCurrency(corpus, currency) },
                  { label: 'Number of FD Tranches', value: String(tranches) },
                  { label: 'Annual Fixed Interest Rate', value: `${rate}% p.a.` },
                  { label: 'Total Portfolio Maturity', value: formatExactCurrency(totalMaturity, currency), isHighlight: true },
                ],
                tableHeaders: ['Ladder Tranche', 'Tranche Amount', 'Est. Returns', 'Maturity Value'],
                tableRows: tableRows.map((row) => [
                  String(row[0]),
                  String(row[1]),
                  String(row[2]),
                  String(row[3]),
                ]),
                notes: 'Generated by Calculator Hub Smart Ideas Engine.',
              })
            }
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-64 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 font-semibold sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Tranche</th>
                <th className="py-2.5 px-3">Tranche Principal</th>
                <th className="py-2.5 px-3 text-orange-400">Est. Returns</th>
                <th className="py-2.5 px-3 text-amber-400">Maturity Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2 px-3">{row[1]}</td>
                  <td className="py-2 px-3 text-orange-400">{row[2]}</td>
                  <td className="py-2 px-3 text-amber-400 font-bold">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategy Cards List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase px-1">
          Wealth Strategies
        </h3>

        <div className="space-y-3">
          {strategies.map((st, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(st.id)}
              className="w-full bg-gray-950 border border-gray-800 p-4 rounded-2xl flex items-center justify-between text-left hover:border-amber-500/50 hover:bg-gray-900/80 transition-all group cursor-pointer"
            >
              <div className="space-y-1 max-w-xl">
                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  {st.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">{st.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* RESET TO DEFAULTS BUTTON */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={() => {
            setCorpus(500000);
            setTranches(5);
            setRate(7.2);
            setAdjustInflation(false);
            setInflationRate(6);
            setChartMode('line');
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
