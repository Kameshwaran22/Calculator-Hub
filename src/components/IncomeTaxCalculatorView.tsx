import React, { useMemo, useState } from 'react';
import { ArrowLeft, Receipt, Download, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Currency } from '../types';
import { formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';

interface IncomeTaxCalculatorViewProps {
  currency?: Currency;
  onBack: () => void;
}

// FY 2025-26 (AY 2026-27) slabs — verified against the Union Budget 2025 update.
// New regime is the default regime since FY 2025-26.
const NEW_REGIME_SLABS = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

const OLD_REGIME_SLABS = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

const NEW_REGIME_STANDARD_DEDUCTION = 75000;
const OLD_REGIME_STANDARD_DEDUCTION = 50000;
const CESS_RATE = 0.04; // Health & Education Cess, applies to both regimes

function computeSlabTax(taxableIncome: number, slabs: { upTo: number; rate: number }[]): number {
  let tax = 0;
  let lower = 0;
  for (const slab of slabs) {
    if (taxableIncome > lower) {
      const taxableInSlab = Math.min(taxableIncome, slab.upTo) - lower;
      tax += taxableInSlab * slab.rate;
      lower = slab.upTo;
    } else break;
  }
  return tax;
}

function computeNewRegimeTax(grossIncome: number, isSalaried: boolean) {
  const stdDeduction = isSalaried ? NEW_REGIME_STANDARD_DEDUCTION : 0;
  const taxableIncome = Math.max(0, grossIncome - stdDeduction);
  let tax = computeSlabTax(taxableIncome, NEW_REGIME_SLABS);
  // Section 87A rebate: taxable income up to ₹12,00,000 gets a rebate up to ₹60,000,
  // effectively making tax nil (marginal relief beyond this point is not modeled here).
  const rebateEligible = taxableIncome <= 1200000;
  const rebate = rebateEligible ? Math.min(tax, 60000) : 0;
  tax = Math.max(0, tax - rebate);
  const cess = tax * CESS_RATE;
  return { taxableIncome, taxBeforeCess: tax, cess, totalTax: tax + cess, rebate };
}

function computeOldRegimeTax(grossIncome: number, isSalaried: boolean, deductions80C: number) {
  const stdDeduction = isSalaried ? OLD_REGIME_STANDARD_DEDUCTION : 0;
  const taxableIncome = Math.max(0, grossIncome - stdDeduction - Math.min(deductions80C, 150000));
  let tax = computeSlabTax(taxableIncome, OLD_REGIME_SLABS);
  // Section 87A rebate: taxable income up to ₹5,00,000 gets a rebate up to ₹12,500.
  const rebateEligible = taxableIncome <= 500000;
  const rebate = rebateEligible ? Math.min(tax, 12500) : 0;
  tax = Math.max(0, tax - rebate);
  const cess = tax * CESS_RATE;
  return { taxableIncome, taxBeforeCess: tax, cess, totalTax: tax + cess, rebate };
}

export const IncomeTaxCalculatorView: React.FC<IncomeTaxCalculatorViewProps> = ({
  currency = 'INR',
  onBack,
}) => {
  const [grossIncome, setGrossIncome] = useState<number>(1200000);
  const [isSalaried, setIsSalaried] = useState<boolean>(true);
  const [deductions80C, setDeductions80C] = useState<number>(150000);

  const newRegime = useMemo(
    () => computeNewRegimeTax(grossIncome, isSalaried),
    [grossIncome, isSalaried]
  );
  const oldRegime = useMemo(
    () => computeOldRegimeTax(grossIncome, isSalaried, deductions80C),
    [grossIncome, isSalaried, deductions80C]
  );

  const betterRegime = newRegime.totalTax <= oldRegime.totalTax ? 'New' : 'Old';
  const savings = Math.abs(newRegime.totalTax - oldRegime.totalTax);

  const chartData = [
    { name: 'New Regime', tax: Math.round(newRegime.totalTax) },
    { name: 'Old Regime', tax: Math.round(oldRegime.totalTax) },
  ];

  const handleExport = () => {
    generatePdfReport({
      title: 'Income Tax Estimate — New vs Old Regime',
      subtitle: `FY 2025-26 (AY 2026-27) | Gross Income: ${formatExactCurrency(grossIncome, currency)}`,
      metrics: [
        { label: 'Recommended Regime', value: betterRegime, isHighlight: true },
        { label: 'Estimated Savings', value: formatExactCurrency(savings, currency) },
        { label: 'New Regime Tax (incl. cess)', value: formatExactCurrency(newRegime.totalTax, currency) },
        { label: 'Old Regime Tax (incl. cess)', value: formatExactCurrency(oldRegime.totalTax, currency) },
      ],
      tableHeaders: ['Item', 'New Regime', 'Old Regime'],
      tableRows: [
        ['Taxable Income', formatExactCurrency(newRegime.taxableIncome, currency), formatExactCurrency(oldRegime.taxableIncome, currency)],
        ['Tax before cess', formatExactCurrency(newRegime.taxBeforeCess, currency), formatExactCurrency(oldRegime.taxBeforeCess, currency)],
        ['Section 87A rebate', formatExactCurrency(newRegime.rebate, currency), formatExactCurrency(oldRegime.rebate, currency)],
        ['Health & Education Cess (4%)', formatExactCurrency(newRegime.cess, currency), formatExactCurrency(oldRegime.cess, currency)],
        ['Total Tax Payable', formatExactCurrency(newRegime.totalTax, currency), formatExactCurrency(oldRegime.totalTax, currency)],
      ],
      notes:
        'This is an estimate for individual taxpayers below 60 years, based on FY 2025-26 slab rates. ' +
        'It does not include surcharge on very high incomes, HRA/Section 24(b) home loan interest, or other ' +
        'old-regime deductions beyond Section 80C. This is not tax advice — consult a chartered accountant ' +
        'before filing.',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card hover:bg-gray-800/70 border border-gray-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-500 dark:text-emerald-400" />
          <h1 className="text-lg font-bold">Income Tax Calculator (India)</h1>
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-card rounded-2xl border border-gray-800/80 p-4 space-y-4 shadow-xl">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Gross Annual Income
          </label>
          <input
            type="number"
            value={grossIncome}
            onChange={(e) => setGrossIncome(Math.max(0, Number(e.target.value)))}
            className="mt-1.5 w-full bg-black/30 border border-gray-800 rounded-xl px-3 py-2.5 text-base font-semibold outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Salaried / Pensioner
          </span>
          <button
            onClick={() => setIsSalaried((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              isSalaried ? 'bg-emerald-500' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isSalaried ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 -mt-2">
          Enables the standard deduction (₹75,000 new regime / ₹50,000 old regime).
        </p>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Section 80C Investments (Old Regime only)
          </label>
          <input
            type="number"
            value={deductions80C}
            onChange={(e) => setDeductions80C(Math.max(0, Number(e.target.value)))}
            className="mt-1.5 w-full bg-black/30 border border-gray-800 rounded-xl px-3 py-2.5 text-base font-semibold outline-none focus:border-emerald-500 transition-colors"
          />
          <p className="text-[11px] text-gray-500 mt-1">Capped at ₹1,50,000 by law.</p>
        </div>
      </div>

      {/* Result summary */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-2xl p-4 border ${
            betterRegime === 'New'
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-card border-gray-800/80'
          }`}
        >
          <p className="text-[11px] font-semibold text-gray-400 uppercase">New Regime</p>
          <p className="text-xl font-bold mt-1">{formatExactCurrency(newRegime.totalTax, currency)}</p>
          {betterRegime === 'New' && (
            <span className="text-[10px] font-bold text-emerald-400">Recommended</span>
          )}
        </div>
        <div
          className={`rounded-2xl p-4 border ${
            betterRegime === 'Old'
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-card border-gray-800/80'
          }`}
        >
          <p className="text-[11px] font-semibold text-gray-400 uppercase">Old Regime</p>
          <p className="text-xl font-bold mt-1">{formatExactCurrency(oldRegime.totalTax, currency)}</p>
          {betterRegime === 'Old' && (
            <span className="text-[10px] font-bold text-emerald-400">Recommended</span>
          )}
        </div>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
        <p className="text-sm">
          The <strong>{betterRegime} Regime</strong> saves you{' '}
          <strong>{formatExactCurrency(savings, currency)}</strong> per year.
        </p>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-gray-800/80 p-4 shadow-xl">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Tax Payable Comparison
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={11} tickFormatter={(v) => formatExactCurrency(v, currency)} width={70} />
            <Tooltip formatter={(v: number) => formatExactCurrency(v, currency)} />
            <Legend />
            <Bar dataKey="tax" name="Total Tax Payable" radius={[6, 6, 0, 0]}>
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Export + disclaimer */}
      <button
        onClick={handleExport}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 dark:bg-emerald-500 text-white dark:text-black font-bold cursor-pointer hover:opacity-90 transition-opacity"
      >
        <Download className="w-4 h-4" />
        Export PDF Report
      </button>

      <div className="flex items-start gap-2 text-[11px] text-gray-500 px-1">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          Estimate for individuals under 60, based on FY 2025-26 slabs. Does not include surcharge on
          very high incomes, HRA, or home-loan interest deductions. Not tax advice — please confirm
          with a chartered accountant before filing.
        </p>
      </div>
    </div>
  );
};
