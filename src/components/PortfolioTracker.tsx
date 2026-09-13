import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  PieChart as PieChartIcon,
  Briefcase,
  ArrowLeft,
  TrendingUp,
  LineChart as LineChartIcon,
  Download,
  Activity,
  Sliders,
  RotateCcw,
  FolderKanban,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Currency } from '../types';
import { formatCurrency, formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';

interface Holding {
  id: string;
  name: string;
  invested: number;
  current: number;
}

interface PortfolioTrackerProps {
  currency: Currency;
  onBack?: () => void;
}

type ChartMode = 'area' | 'circle';

export const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({ currency, onBack }) => {
  const [holdings, setHoldings] = useState<Holding[]>([
    { id: '1', name: 'Nifty 50 Index Fund', invested: 150000, current: 195000 },
    { id: '2', name: 'Gold ETF', invested: 50000, current: 58000 },
  ]);

  const [projectedReturnRate, setProjectedReturnRate] = useState<number>(12);
  const [projectedYears, setProjectedYears] = useState<number>(10);
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [frequency, setFrequency] = useState<'yearly' | 'monthly'>('yearly');

  const addHolding = () => {
    const newH: Holding = {
      id: Date.now().toString(),
      name: `Asset #${holdings.length + 1}`,
      invested: 100000,
      current: 110000,
    };
    setHoldings([...holdings, newH]);
  };

  const removeHolding = (id: string) => {
    if (holdings.length <= 1) return;
    setHoldings(holdings.filter((h) => h.id !== id));
  };

  const updateHolding = (id: string, field: keyof Holding, value: string | number) => {
    setHoldings(
      holdings.map((h) => {
        if (h.id === id) {
          return { ...h, [field]: value };
        }
        return h;
      })
    );
  };

  const totalInvested = holdings.reduce((sum, h) => sum + (Number(h.invested) || 0), 0);
  const currentValue = holdings.reduce((sum, h) => sum + (Number(h.current) || 0), 0);
  const gainLoss = currentValue - totalInvested;
  const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

  const COLORS = [
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#ec4899',
    '#8b5cf6',
    '#06b6d4',
    '#f97316',
    '#14b8a6',
  ];

  const donutData = holdings.map((h) => ({
    name: h.name || 'Unnamed Asset',
    value: Math.max(0, Number(h.current) || 0),
  }));

  // Generate Growth projection data over time (Yearly vs Monthly)
  const totalMonths = projectedYears * 12;
  const monthlyRate = projectedReturnRate / 12 / 100;

  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  if (frequency === 'yearly') {
    for (let yr = 0; yr <= projectedYears; yr++) {
      const projectedVal = currentValue * Math.pow(1 + projectedReturnRate / 100, yr);
      const gains = projectedVal - totalInvested;

      chartData.push({
        timeline: `Yr ${yr}`,
        Invested: Math.round(totalInvested),
        'Current Value': Math.round(projectedVal),
        Gains: Math.round(gains),
      });

      if (yr > 0) {
        tableRows.push([
          `Year ${yr}`,
          formatExactCurrency(totalInvested, currency),
          formatExactCurrency(gains, currency),
          formatExactCurrency(projectedVal, currency),
        ]);
      }
    }
  } else {
    for (let m = 0; m <= totalMonths; m++) {
      const yr = m / 12;
      const projectedVal = currentValue * Math.pow(1 + monthlyRate, m);
      const gains = projectedVal - totalInvested;

      chartData.push({
        timeline: `M${m}`,
        Invested: Math.round(totalInvested),
        'Current Value': Math.round(projectedVal),
        Gains: Math.round(gains),
      });

      if (m > 0) {
        tableRows.push([
          `Month ${m}`,
          formatExactCurrency(totalInvested, currency),
          formatExactCurrency(gains, currency),
          formatExactCurrency(projectedVal, currency),
        ]);
      }
    }
  }

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

      {/* Hero Header with small description */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl flex items-start space-x-4 shadow-xl">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-400">
          <FolderKanban className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Portfolio Tracker</h2>
          <p className="text-xs text-gray-400 mt-1">
            Track all your active investments in one place and project portfolio wealth accumulation over time.
          </p>
        </div>
      </div>

      {/* Holdings List Card */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
          <div>
            <span className="text-xs font-bold text-gray-300">Your Holdings</span>
            <p className="text-[10px] text-gray-500">Enter purchase cost and current value for each asset.</p>
          </div>
          <button
            onClick={addHolding}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holding</span>
          </button>
        </div>

        {/* Input Headers */}
        <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
          <div className="col-span-5">Name</div>
          <div className="col-span-3">Invested ({currency === 'INR' ? '₹' : '$'})</div>
          <div className="col-span-3">Current ({currency === 'INR' ? '₹' : '$'})</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        <div className="space-y-3">
          {holdings.map((h) => (
            <div
              key={h.id}
              className="bg-gray-900 border border-gray-800/90 p-3 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:border-gray-700 transition-all"
            >
              <div className="col-span-1 sm:col-span-5">
                <label className="text-[10px] text-gray-400 font-semibold block sm:hidden">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={h.name}
                  onChange={(e) => updateHolding(h.id, 'name', e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Asset Name"
                />
              </div>

              <div className="col-span-1 sm:col-span-3">
                <label className="text-[10px] text-gray-400 font-semibold block sm:hidden">
                  Invested
                </label>
                <input
                  type="number"
                  value={h.invested}
                  onChange={(e) => updateHolding(h.id, 'invested', parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-1 sm:col-span-3">
                <label className="text-[10px] text-gray-400 font-semibold block sm:hidden">
                  Current
                </label>
                <input
                  type="number"
                  value={h.current}
                  onChange={(e) => updateHolding(h.id, 'current', parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-1 text-right sm:text-center">
                {holdings.length > 1 && (
                  <button
                    onClick={() => removeHolding(h.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Remove asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Projection Controls */}
        <div className="pt-3 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">
              Projected Annual Return (% p.a.)
            </label>
            <input
              type="number"
              value={projectedReturnRate}
              onChange={(e) => setProjectedReturnRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">Assumed CAGR for future projections</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">
              Projection Horizon (Years)
            </label>
            <input
              type="number"
              value={projectedYears}
              min={1}
              max={30}
              onChange={(e) => setProjectedYears(parseInt(e.target.value) || 1)}
              className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">Duration for growth visualizer</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">TOTAL INVESTED</span>
          <div className="text-xl md:text-2xl font-bold font-mono text-white">
            {formatExactCurrency(totalInvested, currency)}
          </div>
          <p className="text-[10px] text-gray-500">Principal capital</p>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">CURRENT VALUE</span>
          <div className="text-xl md:text-2xl font-bold font-mono text-white">
            {formatExactCurrency(currentValue, currency)}
          </div>
          <p className="text-[10px] text-gray-500">Current market worth</p>
        </div>

        <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">GAIN / LOSS</span>
          <div
            className={`text-xl md:text-2xl font-bold font-mono ${
              gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {gainLoss >= 0 ? '+' : ''}
            {formatExactCurrency(gainLoss, currency)}
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            {gainLossPct >= 0 ? '+' : ''}
            {gainLossPct.toFixed(1)}% total returns
          </p>
        </div>
      </div>

      {/* Graph Visualizer Suite Card */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-xs font-bold text-gray-300 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Portfolio Growth & Allocation Graph</span>
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

          {/* Chart Mode Switcher Buttons: Area -> Circle */}
          <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
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

        {/* CHART VIEW 2: AREA CHART */}
        {chartMode === 'area' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="timeline" stroke="#6b7280" fontSize={10} />
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
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Current Value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Area type="monotone" dataKey="Invested" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* CHART VIEW 3: CIRCLE / DONUT CHART */}
        {chartMode === 'circle' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="#000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-950 border border-gray-800 p-2.5 rounded-xl shadow-xl text-xs font-mono">
                          <span className="text-gray-300">{payload[0].name}: </span>
                          <span className="font-bold text-emerald-400 ml-1">
                            {formatExactCurrency(payload[0].value, currency)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SEPARATE TABLE SECTION BELOW */}
      <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-3 shadow-xl">
        <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
          <div>
            <h3 className="text-xs font-bold text-gray-300">Portfolio Schedule Table</h3>
            <p className="text-[10px] text-gray-500">Detailed periodic breakdown of capital vs projected corpus</p>
          </div>
          <button
            onClick={() =>
              generatePdfReport({
                title: 'Portfolio Schedule Breakdown Report',
                subtitle: `Holdings Count: ${holdings.length} | Total Investment Summary`,
                metrics: [
                  { label: 'Total Capital Invested', value: formatExactCurrency(totalInvested, currency) },
                  { label: 'Current Portfolio Value', value: formatExactCurrency(currentValue, currency) },
                  { label: 'Total Unrealized Gain/Loss', value: formatExactCurrency(gainLoss, currency), isHighlight: true },
                ],
                tableHeaders: ['Timeline', 'Invested Amount', 'Est. Returns', 'Projected Corpus'],
                tableRows: tableRows.map((row) => [
                  String(row[0]),
                  String(row[1]),
                  String(row[2]),
                  String(row[3]),
                ]),
                notes: 'Generated by Calculator Hub Portfolio Tracker Engine.',
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
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3">Invested Amount</th>
                <th className="py-2.5 px-3 text-emerald-400">Est. Returns</th>
                <th className="py-2.5 px-3 text-amber-400">Projected Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2 px-3">{row[1]}</td>
                  <td className="py-2 px-3 text-emerald-400">{row[2]}</td>
                  <td className="py-2 px-3 text-amber-400 font-bold">{row[3]}</td>
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
            setHoldings([
              { id: '1', name: 'Nifty 50 Index Fund', invested: 150000, current: 195000 },
              { id: '2', name: 'Gold ETF', invested: 50000, current: 58000 },
            ]);
            setProjectedReturnRate(12);
            setProjectedYears(10);
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

