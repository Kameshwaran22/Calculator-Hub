import React, { useState, useMemo } from 'react';
import {
  Flame,
  Plus,
  Trash2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Calendar,
  Award,
  CircleDollarSign,
  ArrowLeft,
  Receipt,
  Download,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table as TableIcon,
  Trophy,
  CheckCircle2,
  Zap,
  Scissors,
  History,
  Clock,
  ArrowRight,
  ShieldCheck,
  Target,
  RefreshCw,
  Gift,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Currency, IndividualLoan } from '../types';
import { NumberSliderInput } from './InputsPanel';
import { QuickScenarioTool } from './QuickScenarioTool';
import { formatCurrency, formatExactCurrency, exportToCSV } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';

interface LoanCalculatorSuiteProps {
  currency: Currency;
  onBack?: () => void;
}

export const LoanCalculatorSuite: React.FC<LoanCalculatorSuiteProps> = ({
  currency,
  onBack,
}) => {
  const [loanTab, setLoanTab] = useState<'single' | 'ongoing' | 'portfolio'>('single');

  // ----------------------------------------------------
  // SINGLE LOAN STATE & ACCELERATOR CHEAT CODES
  // ----------------------------------------------------
  const [singleLoanAmount, setSingleLoanAmount] = useState<number>(5000000);
  const [singleInterestRate, setSingleInterestRate] = useState<number>(8.5);
  const [singleTenureYears, setSingleTenureYears] = useState<number>(20);

  // Cheat Codes Accelerators
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);
  const [extraEmisPerYear, setExtraEmisPerYear] = useState<number>(0);
  const [annualStepUpPct, setAnnualStepUpPct] = useState<number>(0);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(0);
  const [lumpsumMonth, setLumpsumMonth] = useState<number>(12);
  const [lumpsumMode, setLumpsumMode] = useState<'tenure_reducing' | 'emi_reducing'>('tenure_reducing');

  // Visualization & Table controls
  const [activeChartType, setActiveChartType] = useState<'line' | 'area' | 'bar' | 'pie' | 'table'>('line');
  const [tableFrequency, setTableFrequency] = useState<'yearly' | 'monthly'>('yearly');
  const [tableMode, setTableMode] = useState<'original' | 'accelerated'>('accelerated');

  // ----------------------------------------------------
  // PORTFOLIO LOANS STATE
  // ----------------------------------------------------
  const [portfolioLoans, setPortfolioLoans] = useState<IndividualLoan[]>([
    { id: '1', name: 'Home Loan', balance: 4000000, interestRate: 9.0, minMonthlyPayment: 35989 },
    { id: '2', name: 'Car Loan', balance: 600000, interestRate: 10.0, minMonthlyPayment: 12748 },
    { id: '3', name: 'Credit Card 1', balance: 80000, interestRate: 16.0, minMonthlyPayment: 4000 },
    { id: '4', name: 'Credit Card 2', balance: 150000, interestRate: 18.0, minMonthlyPayment: 7406 },
  ]);
  const [extraCashMonthly, setExtraCashMonthly] = useState<number>(1793);

  // ----------------------------------------------------
  // ONGOING MID-LOAN CHEAT CODE STATE
  // ----------------------------------------------------
  const [ongoingLoanAmount, setOngoingLoanAmount] = useState<number>(5000000);
  const [ongoingInterestRate, setOngoingInterestRate] = useState<number>(8.5);
  const [ongoingTenureYears, setOngoingTenureYears] = useState<number>(20);

  // History (Time already elapsed)
  const [elapsedYears, setElapsedYears] = useState<number>(3);
  const [elapsedMonths, setElapsedMonths] = useState<number>(6);
  const [manualOutstandingToggle, setManualOutstandingToggle] = useState<boolean>(false);
  const [manualOutstandingBalance, setManualOutstandingBalance] = useState<number>(4500000);

  // Ongoing Cheat Codes applied TODAY
  const [ongoingExtraMonthly, setOngoingExtraMonthly] = useState<number>(10000);
  const [ongoingExtraEmisPerYear, setOngoingExtraEmisPerYear] = useState<number>(1);
  const [ongoingStepUpPct, setOngoingStepUpPct] = useState<number>(5);
  const [ongoingLumpsumAmount, setOngoingLumpsumAmount] = useState<number>(300000);
  const [ongoingLumpsumMode, setOngoingLumpsumMode] = useState<'tenure_reducing' | 'emi_reducing'>('tenure_reducing');
  const [ongoingRefiRate, setOngoingRefiRate] = useState<number>(7.8);

  // Preset 1-Click Apply helper
  const applyOngoingPreset = (presetType: 'bonus' | 'stepup' | 'windfall' | 'refi' | 'supercombo' | 'reset') => {
    if (presetType === 'bonus') {
      setOngoingExtraMonthly(5000);
      setOngoingExtraEmisPerYear(1);
      setOngoingStepUpPct(0);
      setOngoingLumpsumAmount(0);
      setOngoingRefiRate(ongoingInterestRate);
    } else if (presetType === 'stepup') {
      setOngoingExtraMonthly(0);
      setOngoingExtraEmisPerYear(0);
      setOngoingStepUpPct(10);
      setOngoingLumpsumAmount(0);
      setOngoingRefiRate(ongoingInterestRate);
    } else if (presetType === 'windfall') {
      setOngoingExtraMonthly(0);
      setOngoingExtraEmisPerYear(0);
      setOngoingStepUpPct(0);
      setOngoingLumpsumAmount(500000);
      setOngoingLumpsumMode('tenure_reducing');
      setOngoingRefiRate(ongoingInterestRate);
    } else if (presetType === 'refi') {
      setOngoingExtraMonthly(0);
      setOngoingExtraEmisPerYear(0);
      setOngoingStepUpPct(0);
      setOngoingLumpsumAmount(0);
      setOngoingRefiRate(Math.max(1, Number((ongoingInterestRate - 1.0).toFixed(1))));
    } else if (presetType === 'supercombo') {
      setOngoingExtraMonthly(10000);
      setOngoingExtraEmisPerYear(1);
      setOngoingStepUpPct(5);
      setOngoingLumpsumAmount(500000);
      setOngoingLumpsumMode('tenure_reducing');
      setOngoingRefiRate(Math.max(1, Number((ongoingInterestRate - 0.7).toFixed(1))));
    } else if (presetType === 'reset') {
      setOngoingExtraMonthly(0);
      setOngoingExtraEmisPerYear(0);
      setOngoingStepUpPct(0);
      setOngoingLumpsumAmount(0);
      setOngoingRefiRate(ongoingInterestRate);
    }
  };

  // ----------------------------------------------------
  // SINGLE LOAN MATH CALCULATIONS
  // ----------------------------------------------------
  const singleMonthlyRate = singleInterestRate / 12 / 100;
  const singleTotalMonths = Math.max(1, Math.round(singleTenureYears * 12));

  const baseEmi = useMemo(() => {
    if (singleMonthlyRate === 0) return singleLoanAmount / singleTotalMonths;
    return (
      (singleLoanAmount * singleMonthlyRate * Math.pow(1 + singleMonthlyRate, singleTotalMonths)) /
      (Math.pow(1 + singleMonthlyRate, singleTotalMonths) - 1)
    );
  }, [singleLoanAmount, singleMonthlyRate, singleTotalMonths]);

  // Original Amortization Schedule
  const originalCalc = useMemo(() => {
    let balance = singleLoanAmount;
    let totalInterest = 0;
    const schedule = [];

    for (let m = 1; m <= singleTotalMonths && balance > 0.01; m++) {
      const interest = balance * singleMonthlyRate;
      const principalPart = Math.min(balance, baseEmi - interest);
      totalInterest += interest;
      const closing = Math.max(0, balance - principalPart);

      schedule.push({
        month: m,
        opening: balance,
        emi: interest + principalPart,
        principal: principalPart,
        interest,
        closing,
      });
      balance = closing;
    }

    return {
      totalInterest,
      totalPaid: singleLoanAmount + totalInterest,
      months: schedule.length,
      schedule,
    };
  }, [singleLoanAmount, singleMonthlyRate, singleTotalMonths, baseEmi]);

  // Accelerated Amortization Schedule (with Cheat Codes)
  const acceleratedCalc = useMemo(() => {
    let balance = singleLoanAmount;
    let totalInterest = 0;
    let currentEmi = baseEmi;
    const schedule = [];
    let month = 0;

    while (balance > 0.01 && month < 600) {
      month++;

      // Annual step up
      if (month > 1 && (month - 1) % 12 === 0 && annualStepUpPct > 0) {
        currentEmi += currentEmi * (annualStepUpPct / 100);
      }

      let interest = balance * singleMonthlyRate;
      let regularPay = Math.min(balance + interest, currentEmi);

      // Extra monthly payment directly towards principal
      let monthlyExtra = extraMonthlyPayment;

      // Extra EMIs per year (added at end of year month 12, 24, 36...)
      let extraYearPay = 0;
      if (extraEmisPerYear > 0 && month % 12 === 0) {
        extraYearPay = baseEmi * extraEmisPerYear;
      }

      // Lumpsum prepayment
      let lumpsumPay = 0;
      if (lumpsumAmount > 0 && month === lumpsumMonth) {
        lumpsumPay = lumpsumAmount;
      }

      let totalPaymentThisMonth = regularPay + monthlyExtra + extraYearPay + lumpsumPay;
      let principalPaid = Math.min(balance, totalPaymentThisMonth - interest);
      if (principalPaid < 0) principalPaid = 0;

      totalInterest += interest;
      let closing = Math.max(0, balance - principalPaid);

      schedule.push({
        month,
        opening: balance,
        emi: regularPay + monthlyExtra + extraYearPay + lumpsumPay,
        principal: principalPaid,
        interest,
        closing,
      });

      balance = closing;

      // EMI Reducing mode after lumpsum
      if (lumpsumAmount > 0 && month === lumpsumMonth && lumpsumMode === 'emi_reducing') {
        const remainingMonths = Math.max(1, singleTotalMonths - month);
        if (singleMonthlyRate > 0) {
          currentEmi =
            (balance * singleMonthlyRate * Math.pow(1 + singleMonthlyRate, remainingMonths)) /
            (Math.pow(1 + singleMonthlyRate, remainingMonths) - 1);
        }
      }
    }

    return {
      totalInterest,
      totalPaid: singleLoanAmount + totalInterest,
      months: month,
      schedule,
      interestSaved: Math.max(0, originalCalc.totalInterest - totalInterest),
      timeSavedMonths: Math.max(0, originalCalc.months - month),
    };
  }, [
    singleLoanAmount,
    singleMonthlyRate,
    singleTotalMonths,
    baseEmi,
    extraMonthlyPayment,
    extraEmisPerYear,
    annualStepUpPct,
    lumpsumAmount,
    lumpsumMonth,
    lumpsumMode,
    originalCalc,
  ]);

  // Comparative Balance Over Time Chart Data
  const lineChartData = useMemo(() => {
    const maxMonths = Math.max(originalCalc.months, acceleratedCalc.months);
    const chartRows = [];

    const isYearly = tableFrequency === 'yearly';
    const step = isYearly ? 12 : 1;

    for (let m = 0; m <= maxMonths; m += step) {
      if (m === 0) {
        chartRows.push({
          label: isYearly ? 'Start' : 'Mo 0',
          'Original Balance': Math.round(singleLoanAmount),
          'Accelerated Balance': Math.round(singleLoanAmount),
        });
        continue;
      }

      const origItem = originalCalc.schedule.find((s) => s.month === m);
      const accelItem = acceleratedCalc.schedule.find((s) => s.month === m);

      const origBal = origItem
        ? Math.round(origItem.closing)
        : m > originalCalc.months
        ? 0
        : Math.round(originalCalc.schedule[originalCalc.schedule.length - 1]?.closing || 0);

      const accelBal = accelItem
        ? Math.round(accelItem.closing)
        : m > acceleratedCalc.months
        ? 0
        : Math.round(acceleratedCalc.schedule[acceleratedCalc.schedule.length - 1]?.closing || 0);

      chartRows.push({
        label: isYearly ? `Yr ${Math.floor(m / 12)}` : `Mo ${m}`,
        'Original Balance': origBal,
        'Accelerated Balance': accelBal,
      });
    }

    return chartRows;
  }, [originalCalc, acceleratedCalc, singleLoanAmount, tableFrequency]);

  // Breakdown Bar Chart Data (Principal vs Interest paid per period)
  const barChartData = useMemo(() => {
    const rawSchedule =
      tableMode === 'accelerated' ? acceleratedCalc.schedule : originalCalc.schedule;

    if (tableFrequency === 'monthly') {
      return rawSchedule.slice(0, 60).map((item) => ({
        label: `Mo ${item.month}`,
        Principal: Math.round(item.principal),
        Interest: Math.round(item.interest),
      }));
    }

    // Yearly Aggregation for Bar Chart
    const yearlyBars = [];
    let currentYear = 1;
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let i = 0; i < rawSchedule.length; i++) {
      const item = rawSchedule[i];
      yearPrincipal += item.principal;
      yearInterest += item.interest;

      if ((i + 1) % 12 === 0 || i === rawSchedule.length - 1) {
        yearlyBars.push({
          label: `Yr ${currentYear}`,
          Principal: Math.round(yearPrincipal),
          Interest: Math.round(yearInterest),
        });
        currentYear++;
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }
    return yearlyBars;
  }, [tableFrequency, tableMode, originalCalc, acceleratedCalc]);

  // Table Schedule Data (Yearly vs Monthly)
  const displaySchedule = useMemo(() => {
    const rawSchedule =
      tableMode === 'accelerated' ? acceleratedCalc.schedule : originalCalc.schedule;
    if (tableFrequency === 'monthly') return rawSchedule;

    const yearlyRows = [];
    let currentYear = 1;
    let yearOpening = rawSchedule[0]?.opening || 0;
    let yearEmiSum = 0;
    let yearPrincipalSum = 0;
    let yearInterestSum = 0;
    let yearClosing = 0;

    for (let i = 0; i < rawSchedule.length; i++) {
      const item = rawSchedule[i];
      yearEmiSum += item.emi;
      yearPrincipalSum += item.principal;
      yearInterestSum += item.interest;
      yearClosing = item.closing;

      if ((i + 1) % 12 === 0 || i === rawSchedule.length - 1) {
        yearlyRows.push({
          period: `Year ${currentYear}`,
          opening: yearOpening,
          emi: yearEmiSum,
          principal: yearPrincipalSum,
          interest: yearInterestSum,
          closing: yearClosing,
        });
        currentYear++;
        yearOpening = yearClosing;
        yearEmiSum = 0;
        yearPrincipalSum = 0;
        yearInterestSum = 0;
      }
    }
    return yearlyRows;
  }, [tableFrequency, tableMode, originalCalc, acceleratedCalc]);

  // Export Table to CSV
  const handleExportCSV = () => {
    const headers = ['Period', 'Opening Balance', 'EMI Paid', 'Principal', 'Interest', 'Closing Balance'];
    const rows = displaySchedule.map((row: any) => [
      row.period || `Month ${row.month}`,
      formatExactCurrency(row.opening, currency),
      formatExactCurrency(row.emi, currency),
      formatExactCurrency(row.principal, currency),
      formatExactCurrency(row.interest, currency),
      formatExactCurrency(row.closing, currency),
    ]);
    exportToCSV(`loan_amortization_${tableMode}_${tableFrequency}.csv`, headers, rows);
  };

  // Export Single Loan PDF Report
  const handleExportPDF = () => {
    const activeAccelCount =
      (extraMonthlyPayment > 0 ? 1 : 0) +
      (extraEmisPerYear > 0 ? 1 : 0) +
      (annualStepUpPct > 0 ? 1 : 0) +
      (lumpsumAmount > 0 ? 1 : 0);
    const isAccel = tableMode === 'accelerated' && activeAccelCount > 0;
    const activeCalc = isAccel ? acceleratedCalc : originalCalc;
    const timeSaved = acceleratedCalc.timeSavedMonths;
    const interestSaved = acceleratedCalc.interestSaved;

    generatePdfReport({
      title: isAccel ? 'Accelerated Loan Payoff Report' : 'Standard Loan Calculation Report',
      subtitle: `Loan Amount: ${formatExactCurrency(singleLoanAmount, currency)} | Interest Rate: ${singleInterestRate}% p.a. | Tenure: ${singleTenureYears} Years`,
      metrics: [
        { label: 'Loan Principal', value: formatExactCurrency(singleLoanAmount, currency) },
        { label: 'Interest Rate', value: `${singleInterestRate}% p.a.` },
        { label: 'Original Tenure', value: `${singleTenureYears} Years` },
        { label: 'Monthly EMI', value: formatExactCurrency(baseEmi, currency) },
        { label: 'Total Interest Payable', value: formatExactCurrency(activeCalc.totalInterest, currency) },
        { label: 'Total Debt Outflow', value: formatExactCurrency(activeCalc.totalPaid, currency) },
        ...(isAccel
          ? [
              { label: 'Time Saved', value: `${Math.floor(timeSaved / 12)} Yrs ${timeSaved % 12} Mos`, isHighlight: true },
              { label: 'Interest Savings', value: formatExactCurrency(interestSaved, currency), isHighlight: true },
            ]
          : []),
      ],
      tableHeaders: ['Period', 'Opening', 'EMI', 'Principal', 'Interest', 'Closing'],
      tableRows: displaySchedule.map((row: any) => [
        String(row.period || `Mo ${row.month}`),
        formatExactCurrency(row.opening, currency),
        formatExactCurrency(row.emi, currency),
        formatExactCurrency(row.principal, currency),
        formatExactCurrency(row.interest, currency),
        formatExactCurrency(row.closing, currency),
      ]),
      notes: 'Generated via Smart Calculator. All figures are estimates based on standard bank amortization schedules.',
    });
  };

  // ----------------------------------------------------
  // ONGOING MID-LOAN MATH CALCULATIONS
  // ----------------------------------------------------
  const ongoingMonthlyRate = ongoingInterestRate / 12 / 100;
  const ongoingTotalMonths = Math.max(1, Math.round(ongoingTenureYears * 12));

  const ongoingBaseEmi = useMemo(() => {
    if (ongoingMonthlyRate === 0) return ongoingLoanAmount / ongoingTotalMonths;
    return (
      (ongoingLoanAmount * ongoingMonthlyRate * Math.pow(1 + ongoingMonthlyRate, ongoingTotalMonths)) /
      (Math.pow(1 + ongoingMonthlyRate, ongoingTotalMonths) - 1)
    );
  }, [ongoingLoanAmount, ongoingMonthlyRate, ongoingTotalMonths]);

  // Elapsed Months
  const totalElapsedMonths = useMemo(() => {
    const raw = elapsedYears * 12 + elapsedMonths;
    return Math.min(ongoingTotalMonths - 1, Math.max(0, raw));
  }, [elapsedYears, elapsedMonths, ongoingTotalMonths]);

  // Past Amortization Schedule (History paid so far)
  const pastCalc = useMemo(() => {
    let balance = ongoingLoanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;
    const schedule = [];

    for (let m = 1; m <= totalElapsedMonths && balance > 0.01; m++) {
      const interest = balance * ongoingMonthlyRate;
      const principalPart = Math.min(balance, ongoingBaseEmi - interest);
      totalInterest += interest;
      totalPrincipal += principalPart;
      const closing = Math.max(0, balance - principalPart);

      schedule.push({
        month: m,
        opening: balance,
        emi: interest + principalPart,
        principal: principalPart,
        interest,
        closing,
      });
      balance = closing;
    }

    const effectiveOutstanding = manualOutstandingToggle
      ? manualOutstandingBalance
      : balance;

    return {
      schedule,
      pastInterestPaid: totalInterest,
      pastPrincipalPaid: totalPrincipal,
      currentOutstandingBalance: effectiveOutstanding,
    };
  }, [
    ongoingLoanAmount,
    ongoingMonthlyRate,
    ongoingBaseEmi,
    totalElapsedMonths,
    manualOutstandingToggle,
    manualOutstandingBalance,
  ]);

  // Future Standard Path (No action taken starting today)
  const ongoingStandardFutureCalc = useMemo(() => {
    let balance = pastCalc.currentOutstandingBalance;
    let totalInterest = 0;
    const schedule = [];
    let month = 0;

    while (balance > 0.01 && month < 600) {
      month++;
      const interest = balance * ongoingMonthlyRate;
      const principalPart = Math.min(balance, ongoingBaseEmi - interest);
      totalInterest += interest;
      const closing = Math.max(0, balance - principalPart);

      schedule.push({
        month: totalElapsedMonths + month,
        opening: balance,
        emi: interest + principalPart,
        principal: principalPart,
        interest,
        closing,
      });
      balance = closing;
    }

    return {
      totalInterest,
      totalPaid: pastCalc.currentOutstandingBalance + totalInterest,
      months: month,
      schedule,
    };
  }, [
    pastCalc.currentOutstandingBalance,
    ongoingMonthlyRate,
    ongoingBaseEmi,
    totalElapsedMonths,
  ]);

  // Future Accelerated Cheat Code Path (Unleashed starting today)
  const ongoingCheatFutureCalc = useMemo(() => {
    const activeInterestRate = ongoingRefiRate > 0 ? ongoingRefiRate : ongoingInterestRate;
    const activeMonthlyRate = activeInterestRate / 12 / 100;

    let balance = pastCalc.currentOutstandingBalance;

    // Apply Lump Sum prepayment TODAY
    let immediateLumpsumApplied = 0;
    if (ongoingLumpsumAmount > 0) {
      immediateLumpsumApplied = Math.min(balance, ongoingLumpsumAmount);
      balance = Math.max(0, balance - immediateLumpsumApplied);
    }

    let currentEmi = ongoingBaseEmi;
    // If EMI reducing mode or rate changed, recompute EMI for remaining tenure
    const remainingTenureMonths = Math.max(1, ongoingTotalMonths - totalElapsedMonths);
    if ((ongoingLumpsumMode === 'emi_reducing' && ongoingLumpsumAmount > 0) || ongoingRefiRate > 0) {
      if (activeMonthlyRate > 0 && remainingTenureMonths > 0) {
        currentEmi =
          (balance * activeMonthlyRate * Math.pow(1 + activeMonthlyRate, remainingTenureMonths)) /
          (Math.pow(1 + activeMonthlyRate, remainingTenureMonths) - 1);
      }
    }

    let totalInterest = 0;
    const schedule = [];
    let month = 0;

    while (balance > 0.01 && month < 600) {
      month++;

      // Annual step up starting year 2 of acceleration
      if (month > 1 && (month - 1) % 12 === 0 && ongoingStepUpPct > 0) {
        currentEmi += currentEmi * (ongoingStepUpPct / 100);
      }

      let interest = balance * activeMonthlyRate;
      let regularPay = Math.min(balance + interest, currentEmi);

      // Extra monthly payment
      let monthlyExtra = ongoingExtraMonthly;

      // Extra bonus EMIs per year
      let extraYearPay = 0;
      if (ongoingExtraEmisPerYear > 0 && month % 12 === 0) {
        extraYearPay = ongoingBaseEmi * ongoingExtraEmisPerYear;
      }

      let totalPaymentThisMonth = regularPay + monthlyExtra + extraYearPay;
      let principalPaid = Math.min(balance, totalPaymentThisMonth - interest);
      if (principalPaid < 0) principalPaid = 0;

      totalInterest += interest;
      let closing = Math.max(0, balance - principalPaid);

      schedule.push({
        month: totalElapsedMonths + month,
        opening: balance,
        emi: regularPay + monthlyExtra + extraYearPay,
        principal: principalPaid,
        interest,
        closing,
      });

      balance = closing;
    }

    const timeSavedMonths = Math.max(0, ongoingStandardFutureCalc.months - month);
    const interestSaved = Math.max(0, ongoingStandardFutureCalc.totalInterest - totalInterest);

    return {
      totalInterest,
      totalPaid: pastCalc.currentOutstandingBalance + totalInterest,
      months: month,
      schedule,
      timeSavedMonths,
      interestSaved,
      immediateLumpsumApplied,
    };
  }, [
    pastCalc.currentOutstandingBalance,
    ongoingLumpsumAmount,
    ongoingLumpsumMode,
    ongoingRefiRate,
    ongoingInterestRate,
    ongoingBaseEmi,
    ongoingTotalMonths,
    totalElapsedMonths,
    ongoingStepUpPct,
    ongoingExtraMonthly,
    ongoingExtraEmisPerYear,
    ongoingStandardFutureCalc,
  ]);

  // Freedom Date helper
  const getFreedomDateStr = (addMonths: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + addMonths);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Export Mid-Loan Cheat Code PDF Report
  const handleExportOngoingPDF = () => {
    generatePdfReport({
      title: 'Mid-Loan Cheat Code Report',
      subtitle: `Original Loan: ${formatExactCurrency(ongoingLoanAmount, currency)} | Paid So Far: ${Math.floor(totalElapsedMonths / 12)} Yrs ${totalElapsedMonths % 12} Mos | Balance Today: ${formatExactCurrency(pastCalc.currentOutstandingBalance, currency)}`,
      metrics: [
        { label: 'Original Loan Principal', value: formatExactCurrency(ongoingLoanAmount, currency) },
        { label: 'Past Interest Paid', value: formatExactCurrency(pastCalc.pastInterestPaid, currency) },
        { label: 'Current Outstanding Today', value: formatExactCurrency(pastCalc.currentOutstandingBalance, currency) },
        { label: 'NEW Freedom Date', value: getFreedomDateStr(ongoingCheatFutureCalc.months), isHighlight: true },
        { label: 'Time Saved Off Sentence', value: `${Math.floor(ongoingCheatFutureCalc.timeSavedMonths / 12)} Yrs ${ongoingCheatFutureCalc.timeSavedMonths % 12} Mos`, isHighlight: true },
        { label: 'Future Interest Saved', value: formatExactCurrency(ongoingCheatFutureCalc.interestSaved, currency), isHighlight: true },
      ],
      tableHeaders: ['Year/Month', 'Past Balance', 'Standard Remaining', 'Cheat Code Remaining'],
      tableRows: ongoingLineChartData.map((d: any) => [
        String(d.label),
        d['Past Balance'] !== null ? formatExactCurrency(d['Past Balance'], currency) : '-',
        d['Standard Remaining'] !== null ? formatExactCurrency(d['Standard Remaining'], currency) : '-',
        d['Cheat Code Remaining'] !== null ? formatExactCurrency(d['Cheat Code Remaining'], currency) : '-',
      ]),
      notes: `Mid-Loan Accelerator Strategy applied starting from Month ${totalElapsedMonths + 1} onwards.`,
    });
  };

  // Ongoing Line Chart Data (Past + Standard Future vs Cheat Code Future)
  const ongoingLineChartData = useMemo(() => {
    const totalMaxMonths = Math.max(
      totalElapsedMonths + ongoingStandardFutureCalc.months,
      totalElapsedMonths + ongoingCheatFutureCalc.months
    );

    const chartRows = [];
    const step = 12; // Yearly points

    for (let m = 0; m <= totalMaxMonths; m += step) {
      const isPast = m <= totalElapsedMonths;
      let pastBal = null;
      let stdBal = null;
      let cheatBal = null;

      if (isPast) {
        if (m === 0) {
          pastBal = Math.round(ongoingLoanAmount);
        } else {
          const pastItem = pastCalc.schedule.find((s) => s.month === m);
          pastBal = pastItem ? Math.round(pastItem.closing) : Math.round(pastCalc.currentOutstandingBalance);
        }
        stdBal = pastBal;
        cheatBal = pastBal;
      } else {
        const stdItem = ongoingStandardFutureCalc.schedule.find((s) => s.month === m);
        const cheatItem = ongoingCheatFutureCalc.schedule.find((s) => s.month === m);

        stdBal = stdItem
          ? Math.round(stdItem.closing)
          : m > totalElapsedMonths + ongoingStandardFutureCalc.months
          ? 0
          : Math.round(
              ongoingStandardFutureCalc.schedule[ongoingStandardFutureCalc.schedule.length - 1]
                ?.closing || 0
            );

        cheatBal = cheatItem
          ? Math.round(cheatItem.closing)
          : m > totalElapsedMonths + ongoingCheatFutureCalc.months
          ? 0
          : Math.round(
              ongoingCheatFutureCalc.schedule[ongoingCheatFutureCalc.schedule.length - 1]
                ?.closing || 0
            );
      }

      chartRows.push({
        label: `Yr ${(m / 12).toFixed(0)}`,
        'Past Balance': pastBal,
        'Standard Remaining': stdBal,
        'Cheat Code Remaining': cheatBal,
      });
    }

    return chartRows;
  }, [
    ongoingLoanAmount,
    totalElapsedMonths,
    pastCalc,
    ongoingStandardFutureCalc,
    ongoingCheatFutureCalc,
  ]);

  // ----------------------------------------------------
  // PORTFOLIO MATH CALCULATIONS (Snowball vs Avalanche)
  // ----------------------------------------------------
  const baseTotalEmi = useMemo(() => {
    return portfolioLoans.reduce((sum, l) => sum + (l.minMonthlyPayment || 0), 0);
  }, [portfolioLoans]);

  const runPortfolioSim = (strategy: 'status_quo' | 'snowball' | 'avalanche') => {
    if (!portfolioLoans || portfolioLoans.length === 0) {
      return { totalInterest: 0, months: 0, graphData: [], killedFirstLoan: 'None' };
    }

    let simLoans = portfolioLoans.map((l) => ({ ...l }));
    let month = 0;
    let totalInterestPaid = 0;
    const graphData: { name: string; balance: number }[] = [];
    let killedFirstLoan = 'None';

    while (simLoans.some((l) => l.balance > 0.01) && month < 600) {
      month++;

      // Sort according to strategy
      const active = simLoans.filter((l) => l.balance > 0.01);
      if (strategy === 'snowball') {
        active.sort((a, b) => a.balance - b.balance);
      } else if (strategy === 'avalanche') {
        active.sort((a, b) => b.interestRate - a.interestRate);
      }

      let extraAvailable = strategy === 'status_quo' ? 0 : extraCashMonthly;
      let monthTotalBal = 0;

      for (const loan of simLoans) {
        if (loan.balance <= 0) continue;
        const mRate = loan.interestRate / 12 / 100;
        const interest = loan.balance * mRate;
        totalInterestPaid += interest;

        let basePayment = Math.min(loan.balance + interest, loan.minMonthlyPayment);

        if (strategy !== 'status_quo' && active.length > 0 && loan.id === active[0].id) {
          const extraUsed = Math.min(loan.balance + interest - basePayment, extraAvailable);
          basePayment += extraUsed;
          extraAvailable -= extraUsed;
        }

        const newBal = loan.balance + interest - basePayment;
        if (loan.balance > 0.01 && newBal <= 0.01 && killedFirstLoan === 'None') {
          const yrs = Math.floor(month / 12);
          const mos = month % 12;
          killedFirstLoan = `${loan.name} · ${yrs > 0 ? `${yrs} Yr${yrs > 1 ? 's' : ''} & ` : ''}${mos} Mo${mos !== 1 ? 's' : ''}`;
        }

        loan.balance = Math.max(0, newBal);
        monthTotalBal += loan.balance;
      }

      if (month % 6 === 0 || !simLoans.some((l) => l.balance > 0)) {
        graphData.push({
          name: `Yr ${(month / 12).toFixed(1)}`,
          balance: Math.round(monthTotalBal),
        });
      }
    }

    return {
      totalInterest: totalInterestPaid,
      months: month,
      graphData,
      killedFirstLoan,
    };
  };

  const statusQuoRes = useMemo(() => runPortfolioSim('status_quo'), [portfolioLoans]);
  const snowballRes = useMemo(() => runPortfolioSim('snowball'), [portfolioLoans, extraCashMonthly]);
  const avalancheRes = useMemo(() => runPortfolioSim('avalanche'), [portfolioLoans, extraCashMonthly]);

  const combinedPortfolioGraph = useMemo(() => {
    const maxLen = Math.max(
      statusQuoRes.graphData.length,
      snowballRes.graphData.length,
      avalancheRes.graphData.length
    );
    const combined = [];

    for (let i = 0; i < maxLen; i++) {
      const name =
        avalancheRes.graphData[i]?.name ||
        snowballRes.graphData[i]?.name ||
        statusQuoRes.graphData[i]?.name ||
        `Point ${i}`;
      combined.push({
        name,
        'Status Quo': statusQuoRes.graphData[i]?.balance ?? 0,
        Snowball: snowballRes.graphData[i]?.balance ?? 0,
        Avalanche: avalancheRes.graphData[i]?.balance ?? 0,
      });
    }
    return combined;
  }, [statusQuoRes, snowballRes, avalancheRes]);

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
      {/* Header & Back Button matching standard style */}
      <div className="space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All calculators</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 mt-1">
              <Receipt className="w-6 h-6 text-orange-400" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Debt Engine
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
                Calculate your true interest cost and build your accelerated escape plan.
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#121215] border border-gray-800/80 p-1.5 rounded-2xl self-start sm:self-auto shadow-lg">
            <button
              onClick={() => setLoanTab('single')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loanTab === 'single'
                  ? 'bg-orange-500 text-white shadow-md font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Single Loan
            </button>
            <button
              onClick={() => setLoanTab('portfolio')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loanTab === 'portfolio'
                  ? 'bg-orange-500 text-white shadow-md font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Loan Portfolio
            </button>
            <button
              onClick={() => setLoanTab('ongoing')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                loanTab === 'ongoing'
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Mid-Loan Cheat Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          TAB 1: SINGLE LOAN VIEW
         ========================================================= */}
      {loanTab === 'single' && (
        <div className="space-y-6">
          {/* Main Parameters Card */}
          <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
              <span className="text-lg">🏛️</span>
              <div>
                <h3 className="text-sm font-bold text-white">Your Loan Parameters</h3>
                <p className="text-xs text-gray-400">Specify principal amount, annual interest rate, and tenure.</p>
              </div>
            </div>

            <NumberSliderInput
              label="Loan Amount"
              value={singleLoanAmount}
              min={10000}
              max={50000000}
              step={50000}
              prefix={currency === 'INR' ? '₹' : '$'}
              onChange={setSingleLoanAmount}
              subtext="Use line slider or type directly in box"
            />

            <NumberSliderInput
              label="Interest Rate (p.a)"
              value={singleInterestRate}
              min={1}
              max={30}
              step={0.1}
              unit="%"
              onChange={setSingleInterestRate}
              subtext="Use line slider or type directly in box"
            />

            <NumberSliderInput
              label="Tenure (Years)"
              value={singleTenureYears}
              min={1}
              max={30}
              step={1}
              unit="Years"
              onChange={setSingleTenureYears}
              subtext="Use line slider or type directly in box"
            />
          </div>

          {/* The Brutal Reality Summary Card */}
          <div className="bg-[#121215] border border-red-900/40 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-bold text-white">The Brutal Reality</h3>
                  <p className="text-xs text-gray-400">Total cost breakdown with current repayment plan.</p>
                </div>
              </div>
              {acceleratedCalc.interestSaved > 0 && (
                <span className="text-xs font-bold text-orange-400 bg-orange-950/80 border border-orange-800 px-3 py-1 rounded-full">
                  🎉 Saved {formatCurrency(acceleratedCalc.interestSaved, currency)}!
                </span>
              )}
            </div>

            {/* MONTHLY EMI Banner */}
            <div className="bg-[#1a1a1e] p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">MONTHLY BASE EMI</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-orange-400">
                {formatExactCurrency(baseEmi, currency)}
              </span>
            </div>

            {/* 3 Stat Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-[#1a1a1e] p-3.5 rounded-2xl border border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">PRINCIPAL</span>
                <span className="text-sm sm:text-base font-bold font-mono text-white block">
                  {formatExactCurrency(singleLoanAmount, currency)}
                </span>
              </div>

              <div className="bg-[#1a1a1e] p-3.5 rounded-2xl border border-red-900/50 space-y-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">INTEREST</span>
                <span className="text-sm sm:text-base font-bold font-mono text-red-400 block">
                  {formatExactCurrency(
                    acceleratedCalc.months < originalCalc.months
                      ? acceleratedCalc.totalInterest
                      : originalCalc.totalInterest,
                    currency
                  )}
                </span>
              </div>

              <div className="bg-[#1a1a1e] p-3.5 rounded-2xl border border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">TOTAL PAID</span>
                <span className="text-sm sm:text-base font-bold font-mono text-gray-200 block">
                  {formatExactCurrency(
                    acceleratedCalc.months < originalCalc.months
                      ? acceleratedCalc.totalPaid
                      : originalCalc.totalPaid,
                    currency
                  )}
                </span>
              </div>
            </div>

            {/* Principal vs Interest Donut Chart */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Principal', value: singleLoanAmount },
                        {
                          name: 'Interest',
                          value: Math.round(
                            acceleratedCalc.months < originalCalc.months
                              ? acceleratedCalc.totalInterest
                              : originalCalc.totalInterest
                          ),
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#71717a" stroke="#121215" strokeWidth={2} />
                      <Cell fill="#ef4444" stroke="#121215" strokeWidth={2} />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center space-x-6 text-xs font-semibold text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-zinc-500 rounded-sm" />
                  <span>Principal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-sm" />
                  <span>Interest</span>
                </div>
              </div>
            </div>

            {/* Acceleration Impact Banner */}
            {acceleratedCalc.timeSavedMonths > 0 && (
              <div className="bg-orange-950/40 border border-orange-800/60 p-3.5 rounded-2xl space-y-1 text-xs text-orange-300 mt-2">
                <div className="font-bold flex items-center space-x-1.5 text-orange-400">
                  <Award className="w-4 h-4" />
                  <span>Cheat Code Active!</span>
                </div>
                <p className="text-xs text-gray-300">
                  You finish this loan in{' '}
                  <strong className="text-white">
                    {Math.floor(acceleratedCalc.months / 12)} Yrs {acceleratedCalc.months % 12} Mos
                  </strong>{' '}
                  instead of {singleTenureYears} Yrs. That saves you{' '}
                  <strong className="text-orange-400">
                    {Math.floor(acceleratedCalc.timeSavedMonths / 12)} Yrs &{' '}
                    {acceleratedCalc.timeSavedMonths % 12} Mos
                  </strong>{' '}
                  of debt!
                </p>
              </div>
            )}
          </div>

          {/* Accelerator Card: The Cheat Codes */}
          <div className="bg-[#121215] border border-orange-900/60 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="text-sm font-bold text-white">The Cheat Codes (Accelerators)</h3>
                <p className="text-xs text-gray-400">
                  Activate these accelerators to see your escape plan.
                </p>
              </div>
            </div>

            {/* Extra Cash Pay Every Month */}
            <NumberSliderInput
              label="Extra Cash Pay Every Month"
              value={extraMonthlyPayment}
              min={0}
              max={200000}
              step={500}
              prefix={currency === 'INR' ? '₹' : '$'}
              onChange={setExtraMonthlyPayment}
              subtext="Extra amount paid directly towards principal every month"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberSliderInput
                label="Extra EMIs Per Year"
                value={extraEmisPerYear}
                min={0}
                max={6}
                step={1}
                unit="EMIs"
                onChange={setExtraEmisPerYear}
                subtext="Pay 1 or 2 bonus EMIs per year"
              />

              <NumberSliderInput
                label="Annual EMI Step-Up %"
                value={annualStepUpPct}
                min={0}
                max={25}
                step={1}
                unit="%"
                onChange={setAnnualStepUpPct}
                subtext="Increase EMI yearly with salary hike"
              />
            </div>

            {/* Lumpsum Prepayment */}
            <div className="pt-3 border-t border-gray-800/80 space-y-3">
              <div className="text-xs font-bold text-orange-400 flex items-center space-x-1.5">
                <CircleDollarSign className="w-4 h-4" />
                <span>Lumpsum Prepayment</span>
              </div>
              <p className="text-xs text-gray-400">
                Got a bonus or windfall? Drop a one-time payment and watch the loan crumble.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberSliderInput
                  label="Lumpsum Amount"
                  value={lumpsumAmount}
                  min={0}
                  max={10000000}
                  step={10000}
                  prefix={currency === 'INR' ? '₹' : '$'}
                  onChange={setLumpsumAmount}
                />

                <NumberSliderInput
                  label="Paid in Month #"
                  value={lumpsumMonth}
                  min={1}
                  max={singleTotalMonths}
                  step={1}
                  unit="Mo"
                  onChange={setLumpsumMonth}
                />
              </div>

              {lumpsumAmount > 0 && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-gray-300">
                    Prepayment Option Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLumpsumMode('tenure_reducing')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        lumpsumMode === 'tenure_reducing'
                          ? 'border-orange-500 bg-orange-950/60 text-orange-400'
                          : 'border-gray-800 bg-[#1a1a1e] text-gray-400 hover:text-white'
                      }`}
                    >
                      Tenure Reducing
                    </button>
                    <button
                      onClick={() => setLumpsumMode('emi_reducing')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        lumpsumMode === 'emi_reducing'
                          ? 'border-orange-500 bg-orange-950/60 text-orange-400'
                          : 'border-gray-800 bg-[#1a1a1e] text-gray-400 hover:text-white'
                      }`}
                    >
                      EMI Reducing
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 italic">
                    {lumpsumMode === 'tenure_reducing'
                      ? 'EMI stays the same — your loan finishes earlier.'
                      : 'Tenure stays the same — your monthly EMI drops.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* QUICK SCENARIO COMPARISON TOOL */}
          <QuickScenarioTool
            calculatorTitle="Single Loan Accelerator"
            currency={currency}
            currentParams={{
              singleLoanAmount,
              singleInterestRate,
              singleTenureYears,
              extraMonthlyPayment,
              extraEmisPerYear,
              annualStepUpPct,
              lumpsumAmount,
            }}
            paramLabels={{
              singleLoanAmount: 'Loan Amount',
              singleInterestRate: 'Interest Rate (%)',
              singleTenureYears: 'Tenure (Yrs)',
              extraMonthlyPayment: 'Extra Monthly Payment',
              extraEmisPerYear: 'Extra EMIs/Yr',
              annualStepUpPct: 'Step-Up %',
              lumpsumAmount: 'Lumpsum Prepay',
            }}
            presetAggressive={{
              singleLoanAmount: 5000000,
              singleInterestRate: 8.5,
              singleTenureYears: 20,
              extraMonthlyPayment: 10000,
              extraEmisPerYear: 1,
              annualStepUpPct: 10,
              lumpsumAmount: 100000,
            }}
            presetConservative={{
              singleLoanAmount: 5000000,
              singleInterestRate: 8.5,
              singleTenureYears: 20,
              extraMonthlyPayment: 2000,
              extraEmisPerYear: 0,
              annualStepUpPct: 5,
              lumpsumAmount: 0,
            }}
            onApplyParams={(p) => {
              if (p.singleLoanAmount !== undefined) setSingleLoanAmount(p.singleLoanAmount);
              if (p.singleInterestRate !== undefined) setSingleInterestRate(p.singleInterestRate);
              if (p.singleTenureYears !== undefined) setSingleTenureYears(p.singleTenureYears);
              if (p.extraMonthlyPayment !== undefined) setExtraMonthlyPayment(p.extraMonthlyPayment);
              if (p.extraEmisPerYear !== undefined) setExtraEmisPerYear(p.extraEmisPerYear);
              if (p.annualStepUpPct !== undefined) setAnnualStepUpPct(p.annualStepUpPct);
              if (p.lumpsumAmount !== undefined) setLumpsumAmount(p.lumpsumAmount);
            }}
          />

          {/* Interactive Amortization Chart Suite */}
          <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Amortization Visualizer Chart</h3>
              </div>

              {/* View Selector Tabs (Line, Area, Bar, Pie) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-[#1a1a1e] p-1 rounded-xl border border-gray-800">
                  <button
                    onClick={() => setActiveChartType('line')}
                    className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChartType === 'line'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Line Chart (Balance Over Time)"
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveChartType('area')}
                    className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChartType === 'area'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Area Chart (Balance Area)"
                  >
                    <TrendingDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveChartType('bar')}
                    className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChartType === 'bar'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Bar Chart (Principal vs Interest)"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveChartType('pie')}
                    className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChartType === 'pie'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Circle Chart (Cost Breakdown)"
                  >
                    <PieChartIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* CHART 1: LINE CHART (Loan Balance Over Time) */}
            {activeChartType === 'line' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 flex justify-between items-center">
                  <span>Loan Balance Paydown Curve</span>
                  <span className="font-mono text-orange-400 font-bold text-[11px]">
                    Original vs Accelerated
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="label" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 10000000
                            ? `${(v / 10000000).toFixed(1)}Cr`
                            : v >= 100000
                            ? `${(v / 100000).toFixed(0)}L`
                            : v >= 1000
                            ? `${(v / 1000).toFixed(0)}k`
                            : `${v}`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="Original Balance"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Accelerated Balance"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 2: AREA CHART (Loan Balance Area) */}
            {activeChartType === 'area' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 flex justify-between items-center">
                  <span>Loan Balance Area Curve</span>
                  <span className="font-mono text-orange-400 font-bold text-[11px]">
                    Original vs Accelerated Area
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="label" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 10000000
                            ? `${(v / 10000000).toFixed(1)}Cr`
                            : v >= 100000
                            ? `${(v / 100000).toFixed(0)}L`
                            : v >= 1000
                            ? `${(v / 1000).toFixed(0)}k`
                            : `${v}`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="Original Balance"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.15}
                      />
                      <Area
                        type="monotone"
                        dataKey="Accelerated Balance"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.25}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 3: BAR CHART (Principal vs Interest) */}
            {activeChartType === 'bar' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 flex justify-between items-center">
                  <span>Payment Component Breakdown</span>
                  <span className="font-mono text-orange-400 font-bold text-[11px]">
                    Principal vs Interest
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="label" stroke="#6b7280" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 10000000
                            ? `${(v / 10000000).toFixed(1)}Cr`
                            : v >= 100000
                            ? `${(v / 100000).toFixed(0)}L`
                            : v >= 1000
                            ? `${(v / 1000).toFixed(0)}k`
                            : `${v}`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="Principal" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Interest" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 4: PIE CHART */}
            {activeChartType === 'pie' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 text-center">
                  Total Loan Outflow Distribution
                </div>
                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Principal Capital', value: singleLoanAmount },
                          {
                            name: 'Interest Charged',
                            value: Math.round(
                              acceleratedCalc.months < originalCalc.months
                                ? acceleratedCalc.totalInterest
                                : originalCalc.totalInterest
                            ),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="#475569" stroke="#000" strokeWidth={2} />
                        <Cell fill="#ef4444" stroke="#000" strokeWidth={2} />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* STANDALONE AMORTIZATION TABLE SECTION */}
          <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <TableIcon className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Amortization Schedule Table</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Plan Mode Toggle: Original vs Accelerated */}
                <div className="flex items-center bg-[#1a1a1e] p-1 rounded-xl border border-gray-800">
                  <button
                    onClick={() => setTableMode('original')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tableMode === 'original'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Original Plan
                  </button>
                  <button
                    onClick={() => setTableMode('accelerated')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tableMode === 'accelerated'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Accelerated Plan
                  </button>
                </div>

                {/* Frequency Toggle: Yearly vs Monthly */}
                <div className="flex items-center bg-[#1a1a1e] p-1 rounded-xl border border-gray-800">
                  <button
                    onClick={() => setTableFrequency('yearly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tableFrequency === 'yearly'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Yearly
                  </button>
                  <button
                    onClick={() => setTableFrequency('monthly')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tableFrequency === 'monthly'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                    title="Export Amortization Table as CSV"
                    aria-label="Export Amortization Table as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 bg-orange-600/30 hover:bg-orange-600/40 text-orange-300 border border-orange-500/50 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                    title="Export Loan Calculation Report as PDF"
                    aria-label="Export Loan Calculation Report as PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-300" />
                    <span>PDF Report</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 custom-scrollbar border border-gray-800/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#1a1a1e] text-gray-300 border-b border-gray-800 sticky top-0 z-10">
                    <th className="p-3 font-bold">PERIOD</th>
                    <th className="p-3 font-bold">OPENING BALANCE</th>
                    <th className="p-3 font-bold">EMI PAID</th>
                    <th className="p-3 font-bold text-orange-400">PRINCIPAL</th>
                    <th className="p-3 font-bold text-red-400">INTEREST</th>
                    <th className="p-3 font-bold">CLOSING BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-black">
                  {displaySchedule.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-900/60 transition-colors">
                      <td className="p-3 text-gray-400 font-bold">
                        {row.period || `Mo ${row.month}`}
                      </td>
                      <td className="p-3 text-gray-300">
                        {formatExactCurrency(row.opening, currency)}
                      </td>
                      <td className="p-3 font-bold text-white">
                        {formatExactCurrency(row.emi, currency)}
                      </td>
                      <td className="p-3 font-bold text-orange-400">
                        {formatExactCurrency(row.principal, currency)}
                      </td>
                      <td className="p-3 text-red-400">
                        {formatExactCurrency(row.interest, currency)}
                      </td>
                      <td className="p-3 text-gray-300">
                        {formatExactCurrency(row.closing, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: ONGOING MID-LOAN CHEAT CODE VIEW
         ========================================================= */}
      {loanTab === 'ongoing' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#121215] border border-amber-900/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-3 border-b border-gray-800 pb-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                  <span>Mid-Loan Cheat Code Engine</span>
                  <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Accelerator Hack
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  Already paying a loan for past years or months? Input your loan history & apply a Cheat Code starting TODAY to crush your remaining debt!
                </p>
              </div>
            </div>

            {/* STEP 1: Loan History & Elapsed Time Parameters */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <History className="w-4 h-4" />
                <span>Step 1: Original Loan & Time Already Paid</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberSliderInput
                  label="Original Loan Amount"
                  value={ongoingLoanAmount}
                  min={100000}
                  max={50000000}
                  step={50000}
                  prefix={currency === 'INR' ? '₹' : '$'}
                  onChange={setOngoingLoanAmount}
                />

                <NumberSliderInput
                  label="Original Interest Rate (p.a)"
                  value={ongoingInterestRate}
                  min={1}
                  max={30}
                  step={0.1}
                  unit="%"
                  onChange={(v) => {
                    setOngoingInterestRate(v);
                    if (ongoingRefiRate === ongoingInterestRate) setOngoingRefiRate(v);
                  }}
                />

                <NumberSliderInput
                  label="Original Tenure"
                  value={ongoingTenureYears}
                  min={1}
                  max={30}
                  step={1}
                  unit="Years"
                  onChange={setOngoingTenureYears}
                />
              </div>

              {/* Time Elapsed Inputs */}
              <div className="bg-[#1a1a1e] p-4 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-2">
                  <span className="text-xs font-bold text-gray-200 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>How Long Have You Been Paying This Loan?</span>
                  </span>

                  <button
                    onClick={() => setManualOutstandingToggle(!manualOutstandingToggle)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
                  >
                    <span>
                      {manualOutstandingToggle
                        ? '← Calculate balance automatically'
                        : 'Enter exact remaining balance directly →'}
                    </span>
                  </button>
                </div>

                {!manualOutstandingToggle ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumberSliderInput
                      label="Years Already Paid"
                      value={elapsedYears}
                      min={0}
                      max={Math.max(0, ongoingTenureYears - 1)}
                      step={1}
                      unit="Years"
                      onChange={setElapsedYears}
                    />

                    <NumberSliderInput
                      label="Additional Months Paid"
                      value={elapsedMonths}
                      min={0}
                      max={11}
                      step={1}
                      unit="Months"
                      onChange={setElapsedMonths}
                    />
                  </div>
                ) : (
                  <NumberSliderInput
                    label="Current Outstanding Principal Today"
                    value={manualOutstandingBalance}
                    min={10000}
                    max={ongoingLoanAmount}
                    step={10000}
                    prefix={currency === 'INR' ? '₹' : '$'}
                    onChange={setManualOutstandingBalance}
                    subtext="Exact balance shown on your loan statement or bank app today"
                  />
                )}

                {/* Past Summary Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-black/60 p-2.5 rounded-xl border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">TIME COMPLETED</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {Math.floor(totalElapsedMonths / 12)} Yrs {totalElapsedMonths % 12} Mos
                    </span>
                  </div>

                  <div className="bg-black/60 p-2.5 rounded-xl border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">PAST INTEREST PAID</span>
                    <span className="text-xs font-bold text-red-400 font-mono">
                      {formatExactCurrency(pastCalc.pastInterestPaid, currency)}
                    </span>
                  </div>

                  <div className="bg-black/60 p-2.5 rounded-xl border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">PRINCIPAL PAID</span>
                    <span className="text-xs font-bold text-orange-400 font-mono">
                      {formatExactCurrency(pastCalc.pastPrincipalPaid, currency)}
                    </span>
                  </div>

                  <div className="bg-black/60 p-2.5 rounded-xl border border-amber-900/50 text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">BALANCE TODAY</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {formatExactCurrency(pastCalc.currentOutstandingBalance, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: One-Click Cheat Code Recipes */}
          <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Select a Mid-Loan Cheat Code Recipe</h3>
                  <p className="text-xs text-gray-400">Tap any recipe to instantly apply a battle-tested debt payoff accelerator.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => applyOngoingPreset('bonus')}
                className="p-3 bg-[#1a1a1e] hover:bg-[#222228] border border-gray-800 hover:border-amber-500/50 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Bonus Crusher</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  1 Extra EMI/year + ₹5k extra monthly
                </div>
              </button>

              <button
                onClick={() => applyOngoingPreset('stepup')}
                className="p-3 bg-[#1a1a1e] hover:bg-[#222228] border border-gray-800 hover:border-amber-500/50 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-400 group-hover:text-orange-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Salary Hike Step-Up</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Increase EMI by 10% every year with appraisal
                </div>
              </button>

              <button
                onClick={() => applyOngoingPreset('windfall')}
                className="p-3 bg-[#1a1a1e] hover:bg-[#222228] border border-gray-800 hover:border-amber-500/50 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  <span>Windfall Prepay</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Inject ₹5 Lakhs lump-sum today
                </div>
              </button>

              <button
                onClick={() => applyOngoingPreset('refi')}
                className="p-3 bg-[#1a1a1e] hover:bg-[#222228] border border-gray-800 hover:border-amber-500/50 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 group-hover:text-rose-300">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Bank Rate Chop</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Refinance / Negotiate -1.0% interest rate
                </div>
              </button>

              <button
                onClick={() => applyOngoingPreset('supercombo')}
                className="p-3 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/80 hover:border-amber-500 rounded-2xl text-left transition-all group cursor-pointer col-span-2 sm:col-span-1"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Freedom Supercombo</span>
                </div>
                <div className="text-[11px] text-gray-300 mt-1">
                  Lump-sum + 1 Extra EMI/yr + 5% Step-Up + Rate Chop
                </div>
              </button>

              <button
                onClick={() => applyOngoingPreset('reset')}
                className="p-3 bg-[#141416] hover:bg-gray-800 border border-gray-800 rounded-2xl text-left transition-all group cursor-pointer flex items-center justify-center space-x-2 text-xs font-bold text-gray-400 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Cheat Codes</span>
              </button>
            </div>
          </div>

          {/* STEP 3: Customize Mid-Loan Cheat Code Controls */}
          <div className="bg-[#121215] border border-orange-900/60 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-5 shadow-2xl">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Customize Your Cheat Codes (Applied Starting Today)</h3>
                <p className="text-xs text-gray-400">
                  Adjust sliders to see real-time payoff acceleration from month {totalElapsedMonths + 1} onwards.
                </p>
              </div>
            </div>

            {/* Lumpsum Prepayment Today */}
            <div className="bg-[#1a1a1e] p-4 rounded-2xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 flex items-center space-x-1.5">
                  <CircleDollarSign className="w-4 h-4" />
                  <span>1. Lump-Sum Prepayment TODAY</span>
                </span>
                {ongoingLumpsumAmount > 0 && (
                  <span className="text-[11px] text-orange-400 font-bold bg-orange-950/80 px-2.5 py-0.5 rounded-full border border-orange-800">
                    Applying {formatCurrency(ongoingLumpsumAmount, currency)} today!
                  </span>
                )}
              </div>

              <NumberSliderInput
                label="Lump-Sum Amount Today"
                value={ongoingLumpsumAmount}
                min={0}
                max={pastCalc.currentOutstandingBalance}
                step={10000}
                prefix={currency === 'INR' ? '₹' : '$'}
                onChange={setOngoingLumpsumAmount}
              />

              {ongoingLumpsumAmount > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-gray-300">
                    Prepayment Option Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOngoingLumpsumMode('tenure_reducing')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        ongoingLumpsumMode === 'tenure_reducing'
                          ? 'border-orange-500 bg-orange-950/60 text-orange-400'
                          : 'border-gray-800 bg-black text-gray-400 hover:text-white'
                      }`}
                    >
                      Reduce Tenure (Finish Faster)
                    </button>
                    <button
                      onClick={() => setOngoingLumpsumMode('emi_reducing')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        ongoingLumpsumMode === 'emi_reducing'
                          ? 'border-orange-500 bg-orange-950/60 text-orange-400'
                          : 'border-gray-800 bg-black text-gray-400 hover:text-white'
                      }`}
                    >
                      Reduce Monthly EMI
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Extra & Bonus Annual EMIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberSliderInput
                label="2. Extra Monthly Payment"
                value={ongoingExtraMonthly}
                min={0}
                max={200000}
                step={500}
                prefix={currency === 'INR' ? '₹' : '$'}
                onChange={setOngoingExtraMonthly}
                subtext="Added to every monthly EMI starting today"
              />

              <NumberSliderInput
                label="3. Extra Bonus EMIs Per Year"
                value={ongoingExtraEmisPerYear}
                min={0}
                max={6}
                step={1}
                unit="EMIs"
                onChange={setOngoingExtraEmisPerYear}
                subtext="Pay 1 or 2 extra EMIs every year"
              />
            </div>

            {/* Salary Step up & Refinance Rate Chop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberSliderInput
                label="4. Annual EMI Step-Up %"
                value={ongoingStepUpPct}
                min={0}
                max={25}
                step={1}
                unit="%"
                onChange={setOngoingStepUpPct}
                subtext="Increase EMI yearly with salary appraisals"
              />

              <NumberSliderInput
                label="5. Refinanced Interest Rate (p.a)"
                value={ongoingRefiRate}
                min={1}
                max={ongoingInterestRate}
                step={0.1}
                unit="%"
                onChange={setOngoingRefiRate}
                subtext={`Original Rate was ${ongoingInterestRate}%. Negotiate lower rate!`}
              />
            </div>
          </div>

          {/* QUICK SCENARIO COMPARISON TOOL */}
          <QuickScenarioTool
            calculatorTitle="Mid-Loan Cheat Code Engine"
            currency={currency}
            currentParams={{
              ongoingLoanAmount,
              ongoingInterestRate,
              ongoingTenureYears,
              elapsedYears,
              ongoingLumpsumAmount,
              ongoingExtraMonthly,
              ongoingExtraEmisPerYear,
              ongoingStepUpPct,
              ongoingRefiRate,
            }}
            paramLabels={{
              ongoingLoanAmount: 'Original Loan',
              ongoingInterestRate: 'Original Rate (%)',
              ongoingTenureYears: 'Original Tenure (Yrs)',
              elapsedYears: 'Elapsed Years',
              ongoingLumpsumAmount: 'Lumpsum Today',
              ongoingExtraMonthly: 'Extra Monthly',
              ongoingExtraEmisPerYear: 'Extra EMIs/Yr',
              ongoingStepUpPct: 'Step-Up %',
              ongoingRefiRate: 'Refinance Rate (%)',
            }}
            presetAggressive={{
              ongoingLoanAmount: 5000000,
              ongoingInterestRate: 9.0,
              ongoingTenureYears: 20,
              elapsedYears: 3,
              ongoingLumpsumAmount: 200000,
              ongoingExtraMonthly: 10000,
              ongoingExtraEmisPerYear: 1,
              ongoingStepUpPct: 10,
              ongoingRefiRate: 8.2,
            }}
            presetConservative={{
              ongoingLoanAmount: 5000000,
              ongoingInterestRate: 9.0,
              ongoingTenureYears: 20,
              elapsedYears: 3,
              ongoingLumpsumAmount: 50000,
              ongoingExtraMonthly: 2000,
              ongoingExtraEmisPerYear: 0,
              ongoingStepUpPct: 5,
              ongoingRefiRate: 8.8,
            }}
            onApplyParams={(p) => {
              if (p.ongoingLoanAmount !== undefined) setOngoingLoanAmount(p.ongoingLoanAmount);
              if (p.ongoingInterestRate !== undefined) setOngoingInterestRate(p.ongoingInterestRate);
              if (p.ongoingTenureYears !== undefined) setOngoingTenureYears(p.ongoingTenureYears);
              if (p.elapsedYears !== undefined) setElapsedYears(p.elapsedYears);
              if (p.ongoingLumpsumAmount !== undefined) setOngoingLumpsumAmount(p.ongoingLumpsumAmount);
              if (p.ongoingExtraMonthly !== undefined) setOngoingExtraMonthly(p.ongoingExtraMonthly);
              if (p.ongoingExtraEmisPerYear !== undefined) setOngoingExtraEmisPerYear(p.ongoingExtraEmisPerYear);
              if (p.ongoingStepUpPct !== undefined) setOngoingStepUpPct(p.ongoingStepUpPct);
              if (p.ongoingRefiRate !== undefined) setOngoingRefiRate(p.ongoingRefiRate);
            }}
          />

          {/* STEP 4: The Freedom Victory Card (Comparison) */}
          <div className="bg-[#121215] border border-orange-900/60 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-3 gap-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Your Freedom Impact (Remaining Loan)</h3>
                  <p className="text-xs text-gray-400">Comparing standard remaining plan vs Cheat Code plan.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {ongoingCheatFutureCalc.timeSavedMonths > 0 && (
                  <span className="text-xs font-bold text-orange-400 bg-orange-950/90 border border-orange-800/80 px-2.5 py-1 rounded-full animate-pulse">
                    ⚡ Cheat Code Active!
                  </span>
                )}

                <button
                  onClick={handleExportOngoingPDF}
                  className="px-3 py-1.5 bg-orange-600/30 hover:bg-orange-600/40 text-orange-300 border border-orange-500/50 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  title="Export Mid-Loan Report as PDF"
                  aria-label="Export Mid-Loan Report as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-orange-300" />
                  <span>PDF Report</span>
                </button>
              </div>
            </div>

            {/* Main Savings Banner */}
            <div className="bg-gradient-to-r from-amber-950/60 via-[#1a1a20] to-orange-950/60 p-4 rounded-2xl border border-amber-800/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    TIME CUT OFF FROM YOUR SENTENCE
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-white pt-0.5">
                    {Math.floor(ongoingCheatFutureCalc.timeSavedMonths / 12)} Yrs & {ongoingCheatFutureCalc.timeSavedMonths % 12} Mos Saved!
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                    FUTURE INTEREST SAVED
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-orange-400 pt-0.5">
                    {formatCurrency(ongoingCheatFutureCalc.interestSaved, currency)}
                  </div>
                </div>
              </div>

              {/* Freedom Dates Comparison */}
              <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between text-xs text-gray-300 font-mono gap-2">
                <div>
                  <span className="text-gray-400">Standard Freedom Date:</span>{' '}
                  <span className="text-red-400 line-through font-bold">
                    {getFreedomDateStr(ongoingStandardFutureCalc.months)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-gray-200 font-bold">NEW Freedom Date:</span>{' '}
                  <span className="text-orange-400 font-black text-sm bg-orange-950/80 px-2 py-0.5 rounded-lg border border-orange-800/80">
                    {getFreedomDateStr(ongoingCheatFutureCalc.months)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-[#1a1a1e] p-3.5 rounded-2xl border border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">REMAINING TENURE</span>
                <div className="text-xs text-gray-400 space-x-1">
                  <span className="line-through">{Math.floor(ongoingStandardFutureCalc.months / 12)}Y {ongoingStandardFutureCalc.months % 12}M</span>
                  <span className="text-amber-400 font-bold font-mono text-sm block">
                    {Math.floor(ongoingCheatFutureCalc.months / 12)} Yrs {ongoingCheatFutureCalc.months % 12} Mos
                  </span>
                </div>
              </div>

              <div className="bg-[#1a1a1e] p-3.5 rounded-2xl border border-red-900/50 space-y-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">FUTURE INTEREST PAYABLE</span>
                <div className="text-xs space-y-0.5">
                  <div className="line-through text-gray-500 font-mono text-[11px]">
                    {formatExactCurrency(ongoingStandardFutureCalc.totalInterest, currency)}
                  </div>
                  <div className="text-sm font-bold font-mono text-orange-400">
                    {formatExactCurrency(ongoingCheatFutureCalc.totalInterest, currency)}
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1e] p-3.5 rounded-2xl border border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">FUTURE TOTAL OUTFLOW</span>
                <div className="text-xs space-y-0.5">
                  <div className="line-through text-gray-500 font-mono text-[11px]">
                    {formatExactCurrency(ongoingStandardFutureCalc.totalPaid, currency)}
                  </div>
                  <div className="text-sm font-bold font-mono text-white">
                    {formatExactCurrency(ongoingCheatFutureCalc.totalPaid, currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 5: Interactive Amortization Chart */}
          <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Mid-Loan Payoff Trajectory Chart</h3>
              </div>
              <span className="text-xs font-mono text-amber-400">Past vs Standard vs Cheat Code</span>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ongoingLineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="label" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 10000000
                        ? `${(v / 10000000).toFixed(1)}Cr`
                        : v >= 100000
                        ? `${(v / 100000).toFixed(0)}L`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : `${v}`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="Past Balance"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Standard Remaining"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Cheat Code Remaining"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: PORTFOLIO VIEW (Snowball vs Avalanche)
         ========================================================= */}
      {loanTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Active Loans Card & Base EMI Box */}
          <div className="bg-[#121215] border border-gray-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>🏛️ Your Loans Portfolio</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Add every loan you currently owe. Sample portfolio is pre-filled.
                </p>
              </div>

              <button
                onClick={() => {
                  const newLoan: IndividualLoan = {
                    id: Date.now().toString(),
                    name: `Loan #${portfolioLoans.length + 1}`,
                    balance: 100000,
                    interestRate: 12,
                    minMonthlyPayment: 2500,
                  };
                  setPortfolioLoans([...portfolioLoans, newLoan]);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Loan</span>
              </button>
            </div>

            {/* List of Individual Loans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {portfolioLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-[#1a1a1e] border border-gray-800 p-4 rounded-2xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                    <input
                      type="text"
                      value={loan.name}
                      onChange={(e) =>
                        setPortfolioLoans(
                          portfolioLoans.map((l) =>
                            l.id === loan.id ? { ...l, name: e.target.value } : l
                          )
                        )
                      }
                      className="bg-transparent font-bold text-xs text-orange-400 focus:outline-none focus:border-b focus:border-orange-500"
                    />
                    {portfolioLoans.length > 1 && (
                      <button
                        onClick={() =>
                          setPortfolioLoans(portfolioLoans.filter((l) => l.id !== loan.id))
                        }
                        className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                        title="Remove loan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 font-semibold block">
                        Balance
                      </label>
                      <input
                        type="number"
                        value={loan.balance}
                        onChange={(e) =>
                          setPortfolioLoans(
                            portfolioLoans.map((l) =>
                              l.id === loan.id
                                ? { ...l, balance: parseFloat(e.target.value) || 0 }
                                : l
                            )
                          )
                        }
                        className="w-full bg-black border border-gray-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-semibold block">
                        Rate %
                      </label>
                      <input
                        type="number"
                        value={loan.interestRate}
                        onChange={(e) =>
                          setPortfolioLoans(
                            portfolioLoans.map((l) =>
                              l.id === loan.id
                                ? { ...l, interestRate: parseFloat(e.target.value) || 0 }
                                : l
                            )
                          )
                        }
                        className="w-full bg-black border border-gray-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-semibold block">
                        Monthly EMI
                      </label>
                      <input
                        type="number"
                        value={loan.minMonthlyPayment}
                        onChange={(e) =>
                          setPortfolioLoans(
                            portfolioLoans.map((l) =>
                              l.id === loan.id
                                ? { ...l, minMonthlyPayment: parseFloat(e.target.value) || 0 }
                                : l
                            )
                          )
                        }
                        className="w-full bg-black border border-gray-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Extra Cash Input & Base Total EMI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <NumberSliderInput
                label="Extra Cash to Deploy Each Month"
                value={extraCashMonthly}
                min={0}
                max={100000}
                step={500}
                prefix={currency === 'INR' ? '₹' : '$'}
                onChange={setExtraCashMonthly}
                subtext="On top of all base EMIs. Funnelled into target loan each month."
              />

              <div className="bg-[#1a1a1e] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  TOTAL BASE EMI (ALL LOANS)
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {formatCurrency(baseTotalEmi, currency)}
                </span>
                <p className="text-xs text-orange-400 font-medium">
                  + {formatCurrency(extraCashMonthly, currency)} extra ={' '}
                  {formatCurrency(baseTotalEmi + extraCashMonthly, currency)} total monthly outflow
                </p>
              </div>
            </div>
          </div>

          {/* 3 Strategy Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Status Quo Card */}
            <div className="bg-[#121215] border border-gray-800/90 p-5 rounded-2xl sm:rounded-3xl space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-gray-800 pb-2">
                <span className="text-lg">🔒</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-300">Status Quo</h4>
                  <p className="text-[10px] text-gray-500">Pay only standard EMIs. Bank wins.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">
                    DEBT-FREE IN
                  </span>
                  <span className="text-base font-bold font-mono text-white block">
                    📅 {Math.floor(statusQuoRes.months / 12)} Yrs & {statusQuoRes.months % 12} Mos
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">
                    TOTAL INTEREST
                  </span>
                  <span className="text-sm font-bold font-mono text-red-400 block">
                    {formatCurrency(statusQuoRes.totalInterest, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Snowball Card */}
            <div className="bg-[#121215] border border-amber-900/40 p-5 rounded-2xl sm:rounded-3xl space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-gray-800 pb-2">
                <span className="text-lg">💛</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Snowball Strategy</h4>
                  <p className="text-[10px] text-gray-400">Smallest balance first. Quick wins.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">
                    DEBT-FREE IN
                  </span>
                  <span className="text-base font-bold font-mono text-white block">
                    📅 {Math.floor(snowballRes.months / 12)} Yrs & {snowballRes.months % 12} Mos
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">
                    TOTAL INTEREST
                  </span>
                  <span className="text-sm font-bold font-mono text-amber-400 block">
                    {formatCurrency(snowballRes.totalInterest, currency)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-800 text-[11px] space-y-1">
                  <div className="text-orange-400 font-bold">
                    VS STATUS QUO: {formatCurrency(statusQuoRes.totalInterest - snowballRes.totalInterest, currency)} saved
                  </div>
                  <div className="text-gray-400">
                    FIRST LOAN KILLED: <span className="text-white font-bold">{snowballRes.killedFirstLoan}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Avalanche Card (Winner) */}
            <div className="bg-[#121215] border border-orange-500/80 p-5 rounded-2xl sm:rounded-3xl space-y-3 shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">
                🏆 Winner
              </div>

              <div className="flex items-center space-x-2 border-b border-gray-800 pb-2">
                <span className="text-lg">🧠</span>
                <div>
                  <h4 className="text-xs font-bold text-orange-400">Avalanche Strategy</h4>
                  <p className="text-[10px] text-gray-400">Highest interest first. Maximum savings.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">
                    DEBT-FREE IN
                  </span>
                  <span className="text-base font-bold font-mono text-white block">
                    📅 {Math.floor(avalancheRes.months / 12)} Yrs & {avalancheRes.months % 12} Mos
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block font-semibold">
                    TOTAL INTEREST
                  </span>
                  <span className="text-sm font-bold font-mono text-orange-400 block">
                    {formatCurrency(avalancheRes.totalInterest, currency)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-800 text-[11px] space-y-1">
                  <div className="text-orange-400 font-bold">
                    VS STATUS QUO: {formatCurrency(statusQuoRes.totalInterest - avalancheRes.totalInterest, currency)} saved
                  </div>
                  <div className="text-gray-400">
                    FIRST LOAN KILLED: <span className="text-white font-bold">{avalancheRes.killedFirstLoan}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Comparison Line Graph */}
          <div className="bg-[#121215] border border-gray-800/90 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 shadow-2xl">
            <h3 className="text-xs font-bold text-gray-300">Total Debt Over Time</h3>
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedPortfolioGraph}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 10000000
                        ? `${(v / 10000000).toFixed(1)}Cr`
                        : v >= 100000
                        ? `${(v / 100000).toFixed(0)}L`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : `${v}`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="Status Quo"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Snowball"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Avalanche"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* RESET TO DEFAULTS BUTTON */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={() => {
            setSingleLoanAmount(5000000);
            setSingleInterestRate(8.5);
            setSingleTenureYears(20);
            setExtraMonthlyPayment(0);
            setExtraEmisPerYear(0);
            setAnnualStepUpPct(0);
            setLumpsumAmount(0);
            setLumpsumMonth(12);
            setLumpsumMode('tenure_reducing');
            setActiveChartType('line');
            setTableFrequency('yearly');
            setTableMode('accelerated');
            setPortfolioLoans([
              { id: '1', name: 'Home Loan', balance: 4000000, interestRate: 9.0, minMonthlyPayment: 35989 },
              { id: '2', name: 'Car Loan', balance: 600000, interestRate: 10.0, minMonthlyPayment: 12748 },
              { id: '3', name: 'Credit Card 1', balance: 80000, interestRate: 16.0, minMonthlyPayment: 4000 },
              { id: '4', name: 'Credit Card 2', balance: 150000, interestRate: 18.0, minMonthlyPayment: 7406 },
            ]);
            setExtraCashMonthly(1793);
            setOngoingLoanAmount(5000000);
            setOngoingInterestRate(8.5);
            setOngoingTenureYears(20);
            setElapsedYears(3);
            setElapsedMonths(6);
            setManualOutstandingToggle(false);
            setManualOutstandingBalance(4500000);
            setOngoingExtraMonthly(10000);
            setOngoingExtraEmisPerYear(1);
            setOngoingStepUpPct(5);
            setOngoingLumpsumAmount(300000);
            setOngoingLumpsumMode('tenure_reducing');
            setOngoingRefiRate(7.8);
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
