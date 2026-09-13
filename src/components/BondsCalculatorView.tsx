import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Activity,
  Download,
  RotateCcw,
  Table as TableIcon,
} from 'lucide-react';
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
import { triggerSliderHaptic } from '../utils/haptics';
import { ChartViewer } from './ChartViewer';

interface BondsCalculatorViewProps {
  currency?: Currency;
  onBack: () => void;
}

export const BondsCalculatorView: React.FC<BondsCalculatorViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [faceValue, setFaceValue] = useState<number>(1000);
  const [couponRate, setCouponRate] = useState<number>(7.5);
  const [purchasePrice, setPurchasePrice] = useState<number>(980);
  const [years, setYears] = useState<number>(10);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [inflationRate, setInflationRate] = useState<number>(6);

  const annualCouponRaw = faceValue * (couponRate / 100);
  const totalCouponsRaw = annualCouponRaw * years;
  const capitalGainRaw = faceValue - purchasePrice;
  const netReturnRaw = totalCouponsRaw + capitalGainRaw;

  // Approx YTM Formula: (C + (F - P)/N) / ((F + P)/2)
  let approxYtm = 0;
  const avgPrice = (faceValue + purchasePrice) / 2;
  if (avgPrice > 0 && years > 0) {
    approxYtm =
      ((annualCouponRaw + capitalGainRaw / years) / avgPrice) * 100;
  }

  const getInflationAdjusted = (val: number, yr: number) => {
    if (!adjustInflation || inflationRate <= 0) return val;
    return val / Math.pow(1 + inflationRate / 100, yr);
  };

  const finalAnnualCoupon = adjustInflation
    ? getInflationAdjusted(annualCouponRaw, years)
    : annualCouponRaw;
  const finalTotalCoupons = adjustInflation
    ? getInflationAdjusted(totalCouponsRaw, years)
    : totalCouponsRaw;
  const finalNetReturn = adjustInflation
    ? getInflationAdjusted(netReturnRaw, years)
    : netReturnRaw;

  // Year-by-Year Cumulative Cash Flow Data
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  let cumulativeCash = -purchasePrice;

  for (let yr = 1; yr <= years; yr++) {
    cumulativeCash += annualCouponRaw;
    if (yr === years) {
      cumulativeCash += faceValue;
    }

    const dispVal = adjustInflation ? getInflationAdjusted(cumulativeCash, yr) : cumulativeCash;

    chartData.push({
      year: yr,
      name: `${yr}`,
      'Cumulative Value': Math.round(dispVal),
      val: Math.round(dispVal),
    });

    tableRows.push([
      `Year ${yr}`,
      formatExactCurrency(annualCouponRaw, currency),
      yr === years ? formatExactCurrency(faceValue, currency) : formatExactCurrency(0, currency),
      formatExactCurrency(dispVal, currency),
    ]);
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono">
          <div className="text-gray-400 font-bold border-b border-gray-800 pb-1">
            Year {label}
          </div>
          <div className="flex items-center justify-between space-x-3">
            <span className="text-gray-300">value:</span>
            <span className="font-bold text-amber-400">
              {formatExactCurrency(payload[0].value, currency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header matching Screenshot 8 */}
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
            <Briefcase className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bonds Calculator
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Estimate coupon income, maturity value and approximate yield-to-maturity of a bond.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        {/* Face Value */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Face Value ({currency === 'INR' ? '₹' : '$'})
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={isNaN(faceValue) ? '' : faceValue}
                min={100}
                max={1000000}
                step={100}
                onChange={(e) => setFaceValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={100000}
            step={100}
            value={isNaN(faceValue) ? 100 : faceValue}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setFaceValue(parseFloat(e.target.value) || 100);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Coupon Rate */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Coupon Rate (% p.a.)
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <input
                type="number"
                value={isNaN(couponRate) ? '' : couponRate}
                min={1}
                max={30}
                step={0.1}
                onChange={(e) => setCouponRate(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs ml-2">%</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={0.1}
            value={isNaN(couponRate) ? 1 : couponRate}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setCouponRate(parseFloat(e.target.value) || 1);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Purchase Price */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Purchase Price ({currency === 'INR' ? '₹' : '$'})
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={isNaN(purchasePrice) ? '' : purchasePrice}
                min={100}
                max={1000000}
                step={50}
                onChange={(e) => setPurchasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={100}
            max={100000}
            step={50}
            value={isNaN(purchasePrice) ? 100 : purchasePrice}
            onChange={(e) => {
              triggerSliderHaptic(8, 30);
              setPurchasePrice(parseFloat(e.target.value) || 100);
            }}
            onInput={() => triggerSliderHaptic(8, 30)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Years to Maturity */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Years to Maturity
          </label>
          <div className="relative">
            <div className="flex items-center justify-between bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-amber-500/70 transition-colors">
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
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
              <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {adjustInflation && (
            <div className="pt-2 space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Inflation Rate</span>
                <span className="font-mono text-amber-400 font-bold">{inflationRate}%</span>
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
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Result Cards matching Screenshot 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Annual Coupon */}
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            ANNUAL COUPON
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {formatExactCurrency(finalAnnualCoupon, currency)}
          </div>
        </div>

        {/* Card 2: Total Coupons Received */}
        <div className="bg-[#121215] border border-amber-900/60 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            TOTAL COUPONS RECEIVED
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {formatExactCurrency(finalTotalCoupons, currency)}
          </div>
        </div>

        {/* Card 3: Net Return (Cumulative) */}
        <div className="bg-[#121215] border border-orange-900/60 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            NET RETURN (CUMULATIVE)
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-orange-400 tracking-tight">
            {formatExactCurrency(finalNetReturn, currency)}
          </div>
        </div>

        {/* Card 4: Approx. YTM */}
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            APPROX. YTM
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {approxYtm.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Cumulative Value Over Time Chart with Area, Line, Bar & Circle */}
      <ChartViewer
        result={{
          chartData: chartData.map((d) => ({
            name: d.name,
            'Bond Value': d.val,
          })),
          chartKeys: [
            { key: 'Bond Value', label: 'Bond Value', color: '#f59e0b' },
          ],
          summary: {
            totalInvestment: purchasePrice,
            interestEarned: finalNetReturn,
            maturityValue: purchasePrice + finalNetReturn,
          },
        }}
        currency={currency}
      />

      {/* Standalone Schedule Breakdown Table Section */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <TableIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Bond Cash Flow Schedule</h3>
          </div>

          <button
            onClick={() =>
              generatePdfReport({
                title: 'Bond Yield & Cash Flow Report',
                subtitle: `Face Value: ${formatExactCurrency(faceValue, currency)} | Coupon Rate: ${couponRate}% | Purchase Price: ${formatExactCurrency(purchasePrice, currency)} | Tenure: ${years} Years`,
                metrics: [
                  { label: 'Face Value', value: formatExactCurrency(faceValue, currency) },
                  { label: 'Purchase Price', value: formatExactCurrency(purchasePrice, currency) },
                  { label: 'Coupon Rate', value: `${couponRate}% p.a.` },
                  { label: 'Approximate YTM', value: `${approxYtm.toFixed(2)}%` },
                  { label: 'Total Coupons Received', value: formatExactCurrency(finalTotalCoupons, currency) },
                  { label: 'Net Cumulative Return', value: formatExactCurrency(finalNetReturn, currency), isHighlight: true },
                ],
                tableHeaders: ['Year', 'Annual Coupon', 'Principal Returned', 'Cumulative Value'],
                tableRows: tableRows.map((r) => [
                  String(r[0]),
                  String(r[1]),
                  String(r[2]),
                  String(r[3]),
                ]),
                notes: 'Bond yield statement based on annual coupon payments and maturity principal repayment.',
              })
            }
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-600/30 hover:bg-amber-600/40 px-3 py-1.5 rounded-xl border border-amber-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Export Bond Report as PDF"
            aria-label="Export Bond Report as PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>PDF Report</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-80 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1e] text-gray-400 font-semibold sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-amber-400">Annual Coupon</th>
                <th className="py-2.5 px-3 text-orange-400">Principal Returned</th>
                <th className="py-2.5 px-3 font-bold text-white">Cumulative Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2.5 px-3 text-amber-400">{row[1]}</td>
                  <td className="py-2.5 px-3 text-orange-400">{row[2]}</td>
                  <td className="py-2.5 px-3 font-bold text-white">{row[3]}</td>
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
            setFaceValue(1000);
            setCouponRate(7.5);
            setPurchasePrice(980);
            setYears(10);
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
