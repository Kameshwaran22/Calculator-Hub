import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Trophy,
  Activity,
  Download,
  AlertTriangle,
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
import { formatExactCurrency, exportToCSV } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';

interface BuyVsRentEngineViewProps {
  currency?: Currency;
  onBack: () => void;
}

export const BuyVsRentEngineView: React.FC<BuyVsRentEngineViewProps> = ({
  currency = 'INR' as Currency,
  onBack,
}) => {
  const [city, setCity] = useState<string>('Chennai');
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [monthlySalary, setMonthlySalary] = useState<number>(100000);

  const CITIES = [
    'Chennai',
    'Mumbai',
    'Bengaluru',
    'Delhi NCR',
    'Hyderabad',
    'Pune',
    'Kolkata',
    'Other Tier 1 or Tier 2',
  ];
  const [propertySize, setPropertySize] = useState<number>(1000);
  const [pricePerSqft, setPricePerSqft] = useState<number>(8000);
  const [currentRent, setCurrentRent] = useState<number>(25000);
  const [propertyType, setPropertyType] = useState<'resale' | 'under_construction' | 'affordable'>('resale');

  // Assumptions
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [homeLoanRate, setHomeLoanRate] = useState<number>(8.5);
  const [tenureYrs, setTenureYrs] = useState<number>(20);
  const [horizonYrs, setHorizonYrs] = useState<number>(20);
  const [equityReturn, setEquityReturn] = useState<number>(12);
  const [appreciationRate, setAppreciationRate] = useState<number>(6);
  const [rentInflation, setRentInflation] = useState<number>(7);

  // Auto-calculated Property Price
  const propertyPrice = propertySize * pricePerSqft;

  // Taxes and Extras
  const stampDutyPct = 5;
  const registrationPct = 1;
  const gstPct = propertyType === 'under_construction' ? 5 : 0;
  const interiorsPct = 4;

  const stampDuty = (propertyPrice * stampDutyPct) / 100;
  const registration = (propertyPrice * registrationPct) / 100;
  const gst = (propertyPrice * gstPct) / 100;
  const interiors = (propertyPrice * interiorsPct) / 100;

  const totalActualCost = propertyPrice + stampDuty + registration + gst + interiors;
  const downPaymentAmt = (propertyPrice * downPaymentPct) / 100;
  const cashNeededUpfront = downPaymentAmt + stampDuty + registration + gst + interiors;
  const loanAmount = propertyPrice - downPaymentAmt;

  // EMI Calculation: P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyLoanRate = homeLoanRate / 12 / 100;
  const totalLoanMonths = tenureYrs * 12;
  const emi =
    monthlyLoanRate > 0 && totalLoanMonths > 0
      ? (loanAmount *
          monthlyLoanRate *
          Math.pow(1 + monthlyLoanRate, totalLoanMonths)) /
        (Math.pow(1 + monthlyLoanRate, totalLoanMonths) - 1)
      : loanAmount / totalLoanMonths;

  const emiToSalaryPct = monthlySalary > 0 ? (emi / monthlySalary) * 100 : 0;
  const safeEmi = monthlySalary * 0.3;
  const emiShortfall = emi - safeEmi;

  // Simulation over Horizon
  const chartData: any[] = [];
  const tableRows: (string | number)[][] = [];

  // Year-by-Year calculation
  let buyPropertyVal = propertyPrice;
  let rentInvestCorpus = cashNeededUpfront; // Renter invests upfront cash instead of buying
  let totalRentPaidCum = 0;

  // Monthly Loan Amortization balance tracker
  let remainingLoanPrincipal = loanAmount;
  const monthlyEqRate = equityReturn / 12 / 100;

  chartData.push({
    year: 0,
    name: 'Y0',
    BuyNetWorth: Math.round(propertyPrice - loanAmount),
    RentNetWorth: Math.round(cashNeededUpfront),
  });

  for (let yr = 1; yr <= horizonYrs; yr++) {
    // 1. Property value grows by appreciation rate
    buyPropertyVal = buyPropertyVal * (1 + appreciationRate / 100);

    // 2. Loan amortization for 12 months
    for (let m = 1; m <= 12; m++) {
      if (remainingLoanPrincipal > 0) {
        const mInterest = remainingLoanPrincipal * monthlyLoanRate;
        const mPrincipal = Math.min(remainingLoanPrincipal, emi - mInterest);
        remainingLoanPrincipal = Math.max(0, remainingLoanPrincipal - mPrincipal);
      }
    }

    const buyNetWorth = Math.max(0, buyPropertyVal - remainingLoanPrincipal);

    // 3. Rent simulation for 12 months of year 'yr'
    const yrRentMonthly = currentRent * Math.pow(1 + rentInflation / 100, yr - 1);

    for (let m = 1; m <= 12; m++) {
      totalRentPaidCum += yrRentMonthly;
      // Monthly savings = EMI - Rent (or maintenance if EMI finished)
      const monthlyOutflowBuy = yr <= tenureYrs ? emi : 0;
      const monthlyOutflowRent = yrRentMonthly;
      const surplusToInvest = Math.max(0, monthlyOutflowBuy - monthlyOutflowRent);

      // Renter corpus compounding
      rentInvestCorpus = (rentInvestCorpus + surplusToInvest) * (1 + monthlyEqRate);
    }

    const rentNetWorth = rentInvestCorpus;

    chartData.push({
      year: yr,
      name: `Y${yr}`,
      BuyNetWorth: Math.round(buyNetWorth),
      RentNetWorth: Math.round(rentNetWorth),
    });

    tableRows.push([
      `Year ${yr}`,
      formatExactCurrency(buyNetWorth, currency),
      formatExactCurrency(rentNetWorth, currency),
      formatExactCurrency(remainingLoanPrincipal, currency),
      formatExactCurrency(totalRentPaidCum, currency),
    ]);
  }

  const finalBuyNetWorth = chartData[chartData.length - 1].BuyNetWorth;
  const finalRentNetWorth = chartData[chartData.length - 1].RentNetWorth;
  const deltaNetWorth = Math.abs(finalRentNetWorth - finalBuyNetWorth);
  const renterWins = finalRentNetWorth >= finalBuyNetWorth;

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
            Year {label.replace('Y', '')}
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
      {/* Back button & Header matching Screenshot 10 */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All calculators</span>
        </button>

        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1 shadow-lg">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Buy vs Rent Engine
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Compare your net worth over time: pay EMI and own the home, or rent cheap and invest the difference.
            </p>
          </div>
        </div>
      </div>

      {/* Main Property & Salary Inputs Card */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
        {/* City Selection matching Image 3 */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">City</label>
          <button
            type="button"
            onClick={() => setIsCityModalOpen(true)}
            className="w-full bg-[#1a1a1e] border border-gray-800 hover:border-gray-700 rounded-xl px-3.5 py-3 text-white text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{city}</span>
            <span className="text-xs text-emerald-400 font-bold">Change</span>
          </button>
        </div>

        {/* Net Monthly Salary */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Net Monthly In-Hand Salary ({currency === 'INR' ? '₹' : '$'})
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={isNaN(monthlySalary) ? '' : monthlySalary}
                min={10000}
                max={5000000}
                step={5000}
                onChange={(e) => setMonthlySalary(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Size & Price/sqft */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Property Size (sqft)</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5">
              <input
                type="number"
                value={isNaN(propertySize) ? '' : propertySize}
                min={100}
                max={20000}
                step={50}
                onChange={(e) => setPropertySize(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-xs ml-2">sqft</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">
              Price per sqft ({currency === 'INR' ? '₹' : '$'})
            </label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5">
              <span className="text-gray-400 font-mono text-sm mr-2">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={isNaN(pricePerSqft) ? '' : pricePerSqft}
                min={500}
                max={100000}
                step={500}
                onChange={(e) => setPricePerSqft(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Auto-calculated Property Price */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-300">Property Price</label>
          <div className="bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 font-mono font-bold text-white text-base opacity-90">
            {formatExactCurrency(propertyPrice, currency)}
          </div>
          <span className="text-[11px] text-gray-400 block">Auto-calculated from size × price/sqft</span>
        </div>

        {/* Current Monthly Rent */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Current Monthly Rent ({currency === 'INR' ? '₹' : '$'})
          </label>
          <div className="relative">
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-3.5 py-2.5 focus-within:border-emerald-500/70 transition-colors">
              <span className="text-gray-400 font-mono text-sm mr-2">
                {currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={isNaN(currentRent) ? '' : currentRent}
                min={1000}
                max={500000}
                step={1000}
                onChange={(e) => setCurrentRent(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-transparent text-white font-mono font-bold text-sm sm:text-base focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Property Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300">Property Type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPropertyType('resale')}
              className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                propertyType === 'resale'
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-[#1a1a1e] text-gray-300 border-gray-800 hover:bg-gray-800'
              }`}
            >
              Ready / Resale
            </button>
            <button
              type="button"
              onClick={() => setPropertyType('under_construction')}
              className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                propertyType === 'under_construction'
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-[#1a1a1e] text-gray-300 border-gray-800 hover:bg-gray-800'
              }`}
            >
              Under-construction
            </button>
            <button
              type="button"
              onClick={() => setPropertyType('affordable')}
              className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                propertyType === 'affordable'
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-[#1a1a1e] text-gray-300 border-gray-800 hover:bg-gray-800'
              }`}
            >
              Affordable
            </button>
          </div>
          <span className="text-[11px] text-gray-400 block">GST applies only to under-construction property</span>
        </div>
      </div>

      {/* Affordability Reality Check section matching Screenshot 11 */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-white border-b border-gray-800/80 pb-2">
          Affordability Reality Check
        </h3>
        <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
          Property Cost: {formatExactCurrency(propertyPrice, currency)} · +Stamp Duty ({stampDutyPct}%): {formatExactCurrency(stampDuty, currency)} · +Registration ({registrationPct}%): {formatExactCurrency(registration, currency)} · +GST ({gstPct}%): {formatExactCurrency(gst, currency)} · +Interiors & misc ({interiorsPct}%): {formatExactCurrency(interiors, currency)}
        </p>

        {/* Breakdown Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-[#1a1a1e] border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">TOTAL ACTUAL COST</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white block">
              {formatExactCurrency(totalActualCost, currency)}
            </span>
          </div>

          <div className="bg-[#1a1a1e] border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">CASH NEEDED UPFRONT</span>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 block">
              {formatExactCurrency(cashNeededUpfront, currency)}
            </span>
          </div>

          <div className="bg-[#1a1a1e] border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">LOAN AMOUNT</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white block">
              {formatExactCurrency(loanAmount, currency)}
            </span>
          </div>

          <div className="bg-[#1a1a1e] border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">EMI</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white block">
              {formatExactCurrency(emi, currency)}/mo
            </span>
          </div>
        </div>

        {/* EMI Anxiety Zone Warning (if EMI/Salary > 30%) */}
        {emiToSalaryPct > 30 && (
          <div className="bg-red-950/30 border border-red-800/80 rounded-2xl p-4 space-y-1.5 animate-in fade-in">
            <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>⚠️ EMI Anxiety Zone</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-200">
              Your salary: {formatExactCurrency(monthlySalary, currency)} → EMI = {emiToSalaryPct.toFixed(1)}% of income
            </div>
            <p className="text-[11px] text-red-300/80">
              Keep EMI ≤ 30% of income to sleep peacefully. Shortfall: {formatExactCurrency(Math.max(0, emiShortfall), currency)}/mo
            </p>
          </div>
        )}
      </div>

      {/* Loan & Investment Assumptions Card matching Screenshot 12 */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold text-white border-b border-gray-800/80 pb-2">
          Loan & Investment Assumptions
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Down Payment %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(downPaymentPct) ? '' : downPaymentPct}
                onChange={(e) => setDownPaymentPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Home Loan Rate %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(homeLoanRate) ? '' : homeLoanRate}
                step={0.1}
                onChange={(e) => setHomeLoanRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Tenure (yrs)</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(tenureYrs) ? '' : tenureYrs}
                onChange={(e) => setTenureYrs(parseInt(e.target.value) || 1)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">yrs</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Horizon (yrs)</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(horizonYrs) ? '' : horizonYrs}
                onChange={(e) => setHorizonYrs(parseInt(e.target.value) || 1)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">yrs</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Equity SIP Return %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(equityReturn) ? '' : equityReturn}
                step={0.5}
                onChange={(e) => setEquityReturn(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Property Appreciation %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(appreciationRate) ? '' : appreciationRate}
                step={0.5}
                onChange={(e) => setAppreciationRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-400">Rent Inflation %</label>
            <div className="flex items-center bg-[#1a1a1e] border border-gray-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                value={isNaN(rentInflation) ? '' : rentInflation}
                step={0.5}
                onChange={(e) => setRentInflation(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
              />
              <span className="text-gray-400 font-mono text-[10px]">%</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
          • Rent path invests down payment + hidden costs upfront, then EMI surplus every month. • Selling costs, brokerage and taxes ignored for clarity.
        </p>
      </div>

      {/* Result Cards */}
      <div className="space-y-3">
        {/* Buy Net Worth */}
        <div className="bg-[#121215] border border-cyan-900/60 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            BUY — NET WORTH
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 tracking-tight">
            {formatExactCurrency(finalBuyNetWorth, currency)}
          </div>
          <span className="text-[11px] text-gray-400 block font-mono">
            Property: {formatExactCurrency(buyPropertyVal, currency)} · Loan left: {formatExactCurrency(remainingLoanPrincipal, currency)}
          </span>
        </div>

        {/* Rent + Invest Net Worth */}
        <div className="bg-[#121215] border border-emerald-900/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-lg">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-gray-400 uppercase block">
            RENT + INVEST — NET WORTH
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatExactCurrency(finalRentNetWorth, currency)}
          </div>
          <span className="text-[11px] text-gray-400 block font-mono">
            Rent paid: {formatExactCurrency(totalRentPaidCum, currency)}
          </span>
        </div>

        {/* Verdict Highlight Card */}
        <div className="bg-[#121215] border border-emerald-500/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xl">
          <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>🏆 Verdict</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
            {renterWins ? 'Renting & Investing wins' : 'Buying property wins'}
          </div>
          <div className="text-xs font-mono text-gray-300">
            Δ {formatExactCurrency(deltaNetWorth, currency)} · EMI/Salary ratio: {emiToSalaryPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Net Worth Over Time Chart */}
      <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Net Worth Over Time</span>
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
                dataKey="BuyNetWorth"
                name="Buy Net Worth"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="RentNetWorth"
                name="Rent + Invest Net Worth"
                stroke="#10b981"
                fill="#10b981"
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
            <TableIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Buy vs Rent Yearly Comparison Schedule</h3>
          </div>

          <button
            onClick={() =>
              generatePdfReport({
                title: 'Buy vs Rent Net Worth Report',
                subtitle: `Property Price: ${formatExactCurrency(propertyPrice, currency)} (${city}) | Horizon: ${horizonYrs} Years | EMI: ${formatExactCurrency(emi, currency)}/mo`,
                metrics: [
                  { label: 'Property Price', value: formatExactCurrency(propertyPrice, currency) },
                  { label: 'Upfront Cash Required', value: formatExactCurrency(cashNeededUpfront, currency) },
                  { label: 'Monthly Home Loan EMI', value: formatExactCurrency(emi, currency) },
                  { label: 'Current Monthly Rent', value: formatExactCurrency(currentRent, currency) },
                  { label: 'Buy Path 20-Yr Net Worth', value: formatExactCurrency(finalBuyNetWorth, currency) },
                  { label: 'Rent Path 20-Yr Net Worth', value: formatExactCurrency(finalRentNetWorth, currency), isHighlight: true },
                  { label: 'Final Winner', value: renterWins ? 'Rent & Invest Wins' : 'Buying Property Wins', isHighlight: true },
                ],
                tableHeaders: ['Year', 'Buy Net Worth', 'Rent Net Worth', 'Loan Left', 'Total Rent Paid'],
                tableRows: tableRows.map((r) => [
                  String(r[0]),
                  String(r[1]),
                  String(r[2]),
                  String(r[3]),
                  String(r[4]),
                ]),
                notes: '20-year net worth projection comparing homeownership equity vs renting and investing the surplus into equity mutual funds.',
              })
            }
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/40 px-3 py-1.5 rounded-xl border border-emerald-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Export Buy vs Rent Report as PDF"
            aria-label="Export Buy vs Rent Report as PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>PDF Report</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-80 rounded-xl border border-gray-800/80 custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#1a1a1e] text-gray-400 font-semibold sticky top-0 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-cyan-400">Buy Net Worth</th>
                <th className="py-2.5 px-3 text-emerald-400">Rent Net Worth</th>
                <th className="py-2.5 px-3">Loan Remaining</th>
                <th className="py-2.5 px-3 text-amber-400">Total Rent Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 font-mono">
              {tableRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-gray-200">{row[0]}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{row[1]}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{row[2]}</td>
                  <td className="py-2.5 px-3 text-gray-400">{row[3]}</td>
                  <td className="py-2.5 px-3 text-amber-400">{row[4]}</td>
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
            setCity('Chennai');
            setMonthlySalary(100000);
            setPropertySize(1000);
            setPricePerSqft(8000);
            setCurrentRent(25000);
            setPropertyType('resale');
            setDownPaymentPct(20);
            setHomeLoanRate(8.5);
            setTenureYrs(20);
            setHorizonYrs(20);
            setEquityReturn(12);
            setAppreciationRate(6);
            setRentInflation(7);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#121215] hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-800 shadow-lg cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset to Defaults</span>
        </button>
      </div>
      {/* City Selection Modal matching Image 3 */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#211A18] border border-gray-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            <div className="p-5 border-b border-gray-800/80 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select City</h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 bg-gray-900 rounded-lg border border-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="divide-y divide-gray-800/80">
              {CITIES.map((c) => {
                const isSelected = city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setIsCityModalOpen(false);
                    }}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2A221F] transition-colors cursor-pointer text-left"
                  >
                    <span className="text-base sm:text-lg font-semibold text-white tracking-wide">
                      {c}
                    </span>
                    <div className="flex items-center justify-center">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full border-2 border-[#E08253] flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-[#E08253]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
