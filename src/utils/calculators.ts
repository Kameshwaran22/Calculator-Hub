import {
  AppCalculatorsState,
  CalculationResult,
  Currency,
  DebtState,
  AllocatorState,
  IndividualLoan,
} from '../types';
import { formatCurrency, formatExactCurrency, formatPercent } from './formatters';

// ----------------------------------------------------
// Helper for real vs nominal values
// ----------------------------------------------------
function getRealValue(nominal: number, inflationRate: number, years: number): number {
  if (inflationRate <= 0 || years <= 0) return nominal;
  return nominal / Math.pow(1 + inflationRate / 100, years);
}

// ----------------------------------------------------
// 1. SIP CALCULATOR (with inflation & step-up)
// ----------------------------------------------------
export function calculateSip(
  state: AppCalculatorsState['sip'],
  currency: Currency
): CalculationResult {
  const { monthly, returnRate, years, stepUpPct, adjustInflation, inflationRate } = state;

  let totalInvested = 0;
  let currentMonthly = monthly;
  let futureValue = 0;
  const monthlyRate = returnRate / 12 / 100;
  const totalMonths = Math.max(1, Math.round(years * 12));

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  for (let month = 1; month <= totalMonths; month++) {
    // Interest on existing wealth + new monthly contribution
    futureValue = (futureValue + currentMonthly) * (1 + monthlyRate);
    totalInvested += currentMonthly;

    if (month % 12 === 0 || month === totalMonths) {
      const year = Math.ceil(month / 12);
      const yearReturn = futureValue - totalInvested;

      const displayInvested = adjustInflation
        ? getRealValue(totalInvested, inflationRate, year)
        : totalInvested;
      const displayValue = adjustInflation
        ? getRealValue(futureValue, inflationRate, year)
        : futureValue;
      const displayGain = displayValue - displayInvested;

      chartData.push({
        name: `Yr ${year}`,
        'Invested Capital': Math.round(displayInvested),
        'Est. Returns': Math.round(Math.max(0, displayGain)),
        'Total Wealth': Math.round(displayValue),
      });

      tableRows.push([
        `Year ${year}`,
        formatExactCurrency(displayInvested, currency),
        formatExactCurrency(Math.max(0, displayGain), currency),
        formatExactCurrency(displayValue, currency),
      ]);

      // Apply annual step-up
      currentMonthly += currentMonthly * (stepUpPct / 100);
    }
  }

  const estGains = Math.max(0, futureValue - totalInvested);
  const realValueFinal = adjustInflation
    ? getRealValue(futureValue, inflationRate, years)
    : futureValue;

  return {
    metrics: [
      {
        label: 'Total Invested',
        value: formatCurrency(totalInvested, currency),
        subtext: stepUpPct > 0 ? `With ${stepUpPct}% annual step-up` : 'Flat contribution',
      },
      {
        label: 'Estimated Returns',
        value: formatCurrency(estGains, currency),
        color: 'text-orange-400',
        subtext: `@ ${returnRate}% p.a. expected CAGR`,
      },
      {
        label: adjustInflation ? 'Real Value (Inflation Adjusted)' : 'Total Wealth Accumulated',
        value: formatCurrency(realValueFinal, currency),
        color: 'text-white',
        badge: adjustInflation ? `Adjusted @ ${inflationRate}% Inflation` : 'Nominal Value',
      },
    ],
    chartType: 'doughnut',
    chartData: [
      { name: 'Invested Capital', value: Math.round(totalInvested) },
      { name: 'Estimated Wealth Gain', value: Math.round(estGains) },
    ],
    chartKeys: [
      { key: 'Invested Capital', color: '#6366f1', label: 'Invested Capital' },
      { key: 'Estimated Wealth Gain', color: '#10b981', label: 'Estimated Returns' },
    ],
    tableHeaders: ['Year', 'Invested Amount', 'Wealth Gain', 'End Corpus'],
    tableRows,
    summaryText: `By investing starting with ${formatExactCurrency(monthly, currency)}/month for ${years} years, your total outlay of ${formatCurrency(totalInvested, currency)} grows to ${formatCurrency(futureValue, currency)}.`,
    insights: [
      `Compounding generates ${totalInvested > 0 ? ((estGains / totalInvested) * 100).toFixed(0) : '0'}% additional returns over your invested capital.`,
      adjustInflation
        ? `In purchasing power terms (taking ${inflationRate}% annual inflation), your corpus equals ${formatCurrency(realValueFinal, currency)} in today's money.`
        : `Enable inflation adjustment to see the real future purchasing power.`,
    ],
  };
}

// ----------------------------------------------------
// 2. SWP CALCULATOR (Systematic Withdrawal Plan)
// ----------------------------------------------------
export function calculateSwp(
  state: AppCalculatorsState['swp'],
  currency: Currency
): CalculationResult {
  const { totalCorpus, annualReturn, monthlyWithdrawal, durationYears, withdrawalInflation, adjustInflation, inflationRate } = state;

  let balance = totalCorpus;
  let totalWithdrawn = 0;
  let currentWithdrawal = monthlyWithdrawal;
  const monthlyRate = annualReturn / 12 / 100;
  const totalMonths = durationYears * 12;

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  for (let month = 1; month <= totalMonths; month++) {
    const interest = balance * monthlyRate;
    balance = balance + interest - currentWithdrawal;
    totalWithdrawn += currentWithdrawal;

    if (balance < 0) {
      balance = 0;
    }

    if (month % 12 === 0 || month === totalMonths) {
      const year = Math.ceil(month / 12);
      const displayBalance = adjustInflation
        ? getRealValue(balance, inflationRate, year)
        : balance;
      const displayWithdrawn = adjustInflation
        ? getRealValue(totalWithdrawn, inflationRate, year)
        : totalWithdrawn;

      chartData.push({
        name: `Yr ${year}`,
        'Remaining Corpus': Math.round(displayBalance),
        'Cumulative Withdrawn': Math.round(displayWithdrawn),
      });

      tableRows.push([
        `Year ${year}`,
        formatExactCurrency(displayWithdrawn, currency),
        formatExactCurrency(displayBalance, currency),
      ]);

      // Inflate withdrawal annually if specified
      if (withdrawalInflation > 0) {
        currentWithdrawal += currentWithdrawal * (withdrawalInflation / 100);
      }
    }
  }

  return {
    metrics: [
      {
        label: 'Initial Corpus',
        value: formatCurrency(totalCorpus, currency),
        subtext: 'Lump sum deployed',
      },
      {
        label: 'Total Payouts Received',
        value: formatCurrency(totalWithdrawn, currency),
        color: 'text-orange-400',
        subtext: `Over ${durationYears} years`,
      },
      {
        label: 'Final Remaining Balance',
        value: formatCurrency(balance, currency),
        color: balance > 0 ? 'text-white' : 'text-red-400',
        badge: balance === 0 ? 'Corpus Depleted Early' : 'Sustained Portfolio',
      },
    ],
    chartType: 'area',
    chartData,
    chartKeys: [
      { key: 'Remaining Corpus', color: '#10b981', label: 'Remaining Corpus' },
      { key: 'Cumulative Withdrawn', color: '#6366f1', label: 'Cumulative Withdrawn' },
    ],
    tableHeaders: ['Year', 'Total Withdrawn So Far', 'Remaining Corpus'],
    tableRows,
    insights: [
      balance > 0
        ? `Your portfolio survived ${durationYears} years and still leaves a capital reserve of ${formatCurrency(balance, currency)}.`
        : `Caution: Your corpus depletes before ${durationYears} years. Consider reducing initial withdrawals or lowering withdrawal inflation.`,
    ],
  };
}

// ----------------------------------------------------
// 3. FD / RD / NSC CALCULATOR
// ----------------------------------------------------
export function calculateFixedIncome(
  state: AppCalculatorsState['fd_rd_nsc'],
  currency: Currency
): CalculationResult {
  const { mode, principal, rate, years, compoundingFrequency, adjustInflation, inflationRate } = state;

  let totalDeposit = 0;
  let maturityValue = 0;
  const n = compoundingFrequency; // compounding frequency per year
  const r = rate / 100;

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  if (mode === 'FD' || mode === 'NSC') {
    totalDeposit = principal;
    maturityValue = principal * Math.pow(1 + r / n, n * years);

    for (let y = 1; y <= years; y++) {
      const yrVal = principal * Math.pow(1 + r / n, n * y);
      const displayVal = adjustInflation ? getRealValue(yrVal, inflationRate, y) : yrVal;
      const displayDeposit = adjustInflation ? getRealValue(totalDeposit, inflationRate, y) : totalDeposit;

      chartData.push({
        name: `Yr ${y}`,
        'Principal Invested': Math.round(displayDeposit),
        'Interest Earned': Math.round(Math.max(0, displayVal - displayDeposit)),
      });

      tableRows.push([
        `Year ${y}`,
        formatExactCurrency(displayDeposit, currency),
        formatExactCurrency(Math.max(0, yrVal - totalDeposit), currency),
        formatExactCurrency(yrVal, currency),
      ]);
    }
  } else {
    // Recurring Deposit (RD)
    const totalMonths = years * 12;
    totalDeposit = principal * totalMonths;
    let accumulated = 0;

    for (let m = 1; m <= totalMonths; m++) {
      accumulated = (accumulated + principal) * Math.pow(1 + r / n, n / 12);

      if (m % 12 === 0) {
        const y = m / 12;
        const depSoFar = principal * m;
        const displayAcc = adjustInflation ? getRealValue(accumulated, inflationRate, y) : accumulated;
        const displayDep = adjustInflation ? getRealValue(depSoFar, inflationRate, y) : depSoFar;

        chartData.push({
          name: `Yr ${y}`,
          'Principal Invested': Math.round(displayDep),
          'Interest Earned': Math.round(Math.max(0, displayAcc - displayDep)),
        });

        tableRows.push([
          `Year ${y}`,
          formatExactCurrency(depSoFar, currency),
          formatExactCurrency(Math.max(0, accumulated - depSoFar), currency),
          formatExactCurrency(accumulated, currency),
        ]);
      }
    }
    maturityValue = accumulated;
  }

  const totalInterest = Math.max(0, maturityValue - totalDeposit);
  const realValue = adjustInflation ? getRealValue(maturityValue, inflationRate, years) : maturityValue;

  return {
    metrics: [
      {
        label: mode === 'RD' ? 'Total RD Outlay' : 'Principal Deposited',
        value: formatCurrency(totalDeposit, currency),
      },
      {
        label: 'Total Guaranteed Interest',
        value: formatCurrency(totalInterest, currency),
        color: 'text-orange-400',
        subtext: `@ ${rate}% per annum`,
      },
      {
        label: adjustInflation ? 'Real Purchasing Power' : 'Maturity Amount',
        value: formatCurrency(realValue, currency),
        color: 'text-white',
      },
    ],
    chartType: 'doughnut',
    chartData: [
      { name: 'Principal Invested', value: Math.round(totalDeposit) },
      { name: 'Guaranteed Interest', value: Math.round(totalInterest) },
    ],
    chartKeys: [
      { key: 'Principal Invested', color: '#6366f1', label: 'Principal' },
      { key: 'Guaranteed Interest', color: '#10b981', label: 'Interest Earned' },
    ],
    tableHeaders: ['Year', 'Deposit So Far', 'Interest Earned', 'Total Balance'],
    tableRows,
  };
}

// ----------------------------------------------------
// 4. GOLD & SILVER ENGINE
// ----------------------------------------------------
export function calculateGold(
  state: AppCalculatorsState['gold'],
  currency: Currency
): CalculationResult {
  const { capital, expectedAppreciation, years, physicalMakingChargesPct, digitalGstPct, sgbInterestRate, adjustInflation, inflationRate } = state;

  const physicalNet = capital * (1 - physicalMakingChargesPct / 100);
  const physicalValue = physicalNet * Math.pow(1 + expectedAppreciation / 100, years);

  const digitalNet = capital * (1 - digitalGstPct / 100);
  const digitalValue = digitalNet * Math.pow(1 + expectedAppreciation / 100, years);

  // Sovereign Gold Bond (SGB) enjoys 2.5% p.a. simple interest on capital + zero tax on maturity
  let sgbValue = capital * Math.pow(1 + expectedAppreciation / 100, years);
  const annualSgbInterest = capital * (sgbInterestRate / 100);
  const totalSgbInterest = annualSgbInterest * years;
  const sgbTotalReturn = sgbValue + totalSgbInterest;

  const chartData = [];
  for (let y = 1; y <= years; y++) {
    const pVal = physicalNet * Math.pow(1 + expectedAppreciation / 100, y);
    const dVal = digitalNet * Math.pow(1 + expectedAppreciation / 100, y);
    const sVal = capital * Math.pow(1 + expectedAppreciation / 100, y) + annualSgbInterest * y;

    chartData.push({
      name: `Yr ${y}`,
      'SGB / Sovereign Bonds': Math.round(adjustInflation ? getRealValue(sVal, inflationRate, y) : sVal),
      'Digital Gold / ETFs': Math.round(adjustInflation ? getRealValue(dVal, inflationRate, y) : dVal),
      'Physical Gold Jewelry': Math.round(adjustInflation ? getRealValue(pVal, inflationRate, y) : pVal),
    });
  }

  return {
    metrics: [
      {
        label: 'SGB Final Yield (Best Choice)',
        value: formatCurrency(sgbTotalReturn, currency),
        color: 'text-orange-400',
        subtext: `Includes ${sgbInterestRate}% annual payout bonus`,
        badge: 'Tax-Free Capital Gains',
      },
      {
        label: 'Digital Gold / Sovereign ETF',
        value: formatCurrency(digitalValue, currency),
        subtext: `3% GST deducted upfront`,
      },
      {
        label: 'Physical Jewelry Gold',
        value: formatCurrency(physicalValue, currency),
        color: 'text-red-400',
        subtext: `${physicalMakingChargesPct}% making charge deduction`,
      },
    ],
    chartType: 'area',
    chartData,
    chartKeys: [
      { key: 'SGB / Sovereign Bonds', color: '#10b981', label: 'SGB (Bond + Gold)' },
      { key: 'Digital Gold / ETFs', color: '#6366f1', label: 'Digital Gold / Gold ETF' },
      { key: 'Physical Gold Jewelry', color: '#ef4444', label: 'Physical Jewelry' },
    ],
    tableHeaders: ['Instrument', 'Entry Drag', 'Maturity Value', 'Tax Efficiency'],
    tableRows: [
      ['SGB (Sovereign Gold Bond)', '0%', formatExactCurrency(sgbTotalReturn, currency), 'Exempt on maturity'],
      ['Digital Gold / Sovereign ETF', `${digitalGstPct}% GST`, formatExactCurrency(digitalValue, currency), 'Capital gains tax applies'],
      ['Physical Gold Jewelry', `${physicalMakingChargesPct}% Making & Wastage`, formatExactCurrency(physicalValue, currency), 'Capital gains + Making charges loss'],
    ],
    insights: [
      `SGB outperforms Physical Gold by ${formatCurrency(sgbTotalReturn - physicalValue, currency)} due to zero making charges, zero GST, and additional 2.5% annual interest.`,
    ],
  };
}

// ----------------------------------------------------
// 5. BONDS & FIXED INCOME YIELD ENGINE
// ----------------------------------------------------
export function calculateBonds(
  state: AppCalculatorsState['bonds'],
  currency: Currency
): CalculationResult {
  const { investment, couponRate, tenureYears, reinvestInterest, taxBracketPct, adjustInflation, inflationRate } = state;

  const annualGrossCoupon = investment * (couponRate / 100);
  const netAnnualCoupon = annualGrossCoupon * (1 - taxBracketPct / 100);
  const totalNetCoupon = netAnnualCoupon * tenureYears;

  let totalMaturity = investment + totalNetCoupon;
  if (reinvestInterest) {
    // Compound net returns
    const netRateDecimal = (couponRate * (1 - taxBracketPct / 100)) / 100;
    totalMaturity = investment * Math.pow(1 + netRateDecimal, tenureYears);
  }

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  for (let y = 1; y <= tenureYears; y++) {
    const cumulativePayout = netAnnualCoupon * y;
    const currentTotal = reinvestInterest
      ? investment * Math.pow(1 + (couponRate * (1 - taxBracketPct / 100)) / 100, y)
      : investment + cumulativePayout;

    const displayTotal = adjustInflation ? getRealValue(currentTotal, inflationRate, y) : currentTotal;

    chartData.push({
      name: `Yr ${y}`,
      'Principal Capital': Math.round(investment),
      'Net Payouts': Math.round(displayTotal - investment),
    });

    tableRows.push([
      `Year ${y}`,
      formatExactCurrency(investment, currency),
      formatExactCurrency(netAnnualCoupon * y, currency),
      formatExactCurrency(currentTotal, currency),
    ]);
  }

  return {
    metrics: [
      {
        label: 'Net Annual Cash Flow',
        value: `${formatCurrency(netAnnualCoupon, currency)}/yr`,
        color: 'text-orange-400',
        subtext: `After ${taxBracketPct}% tax deduction`,
      },
      {
        label: 'Total Net Payouts',
        value: formatCurrency(reinvestInterest ? totalMaturity - investment : totalNetCoupon, currency),
        subtext: reinvestInterest ? 'Compounded payout' : 'Regular coupon payouts',
      },
      {
        label: 'Total Capital + Yield',
        value: formatCurrency(totalMaturity, currency),
        color: 'text-white',
      },
    ],
    chartType: 'stacked_bar',
    chartData,
    chartKeys: [
      { key: 'Principal Capital', color: '#6366f1', label: 'Principal' },
      { key: 'Net Payouts', color: '#10b981', label: 'Net After-Tax Yield' },
    ],
    tableHeaders: ['Year', 'Principal', 'Cumulative Coupon', 'Total Wealth'],
    tableRows,
  };
}

// ----------------------------------------------------
// 6. RETIREMENT FREEDOM ENGINE
// ----------------------------------------------------
export function calculateRetirement(
  state: AppCalculatorsState['retirement'],
  currency: Currency
): CalculationResult {
  const { currentAge, retireAge, currentMonthlyExpense, inflationRate, epfMonthly, npsMonthly, sipMonthly, epfRate, npsRate, sipRate } = state;

  const yearsToRetire = Math.max(1, retireAge - currentAge);
  const futureMonthlyExpense = currentMonthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetire);
  const requiredRetirementCorpus = futureMonthlyExpense * 12 * 25; // Standard 25x safe withdrawal rule

  let accumulatedCorpus = 0;
  const epfMonthlyRate = epfRate / 12 / 100;
  const npsMonthlyRate = npsRate / 12 / 100;
  const sipMonthlyRate = sipRate / 12 / 100;

  const totalMonths = yearsToRetire * 12;
  let epfVal = 0, npsVal = 0, sipVal = 0;

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  for (let m = 1; m <= totalMonths; m++) {
    epfVal = (epfVal + epfMonthly) * (1 + epfMonthlyRate);
    npsVal = (npsVal + npsMonthly) * (1 + npsMonthlyRate);
    sipVal = (sipVal + sipMonthly) * (1 + sipMonthlyRate);

    if (m % 12 === 0) {
      const y = m / 12;
      const age = currentAge + y;

      chartData.push({
        name: `Age ${age}`,
        'EPF Wealth': Math.round(epfVal),
        'NPS Wealth': Math.round(npsVal),
        'SIP / Equity Wealth': Math.round(sipVal),
        'Target Goal': Math.round(requiredRetirementCorpus),
      });

      tableRows.push([
        `Age ${age}`,
        formatExactCurrency(epfVal, currency),
        formatExactCurrency(npsVal, currency),
        formatExactCurrency(sipVal, currency),
        formatExactCurrency(epfVal + npsVal + sipVal, currency),
      ]);
    }
  }

  accumulatedCorpus = epfVal + npsVal + sipVal;
  const targetSurplusDeficit = accumulatedCorpus - requiredRetirementCorpus;

  return {
    metrics: [
      {
        label: `Future Monthly Expense (Age ${retireAge})`,
        value: formatCurrency(futureMonthlyExpense, currency),
        subtext: `Inflated from ${formatCurrency(currentMonthlyExpense, currency)}/mo @ ${inflationRate}% inflation`,
      },
      {
        label: 'Target Retirement Corpus Needed',
        value: formatCurrency(requiredRetirementCorpus, currency),
        color: 'text-amber-400',
        subtext: 'Based on 25x annual rule',
      },
      {
        label: 'Projected Corpus at Retirement',
        value: formatCurrency(accumulatedCorpus, currency),
        color: targetSurplusDeficit >= 0 ? 'text-orange-400' : 'text-red-400',
        badge: targetSurplusDeficit >= 0 ? 'Goal Surpassed! 🎉' : 'Retirement Deficit ⚠️',
      },
    ],
    chartType: 'area',
    chartData,
    chartKeys: [
      { key: 'EPF Wealth', color: '#3b82f6', label: 'EPF Reserve' },
      { key: 'NPS Wealth', color: '#8b5cf6', label: 'NPS Fund' },
      { key: 'SIP / Equity Wealth', color: '#10b981', label: 'SIP / Mutual Funds' },
    ],
    tableHeaders: ['Age', 'EPF Accumulation', 'NPS Accumulation', 'SIP Accumulation', 'Total Corpus'],
    tableRows,
    insights: [
      targetSurplusDeficit >= 0
        ? `Great news! You will achieve retirement freedom at age ${retireAge} with a surplus of ${formatCurrency(targetSurplusDeficit, currency)}.`
        : `Deficit detected: You are short by ${formatCurrency(Math.abs(targetSurplusDeficit), currency)}. Consider increasing monthly SIPs by ~${formatCurrency(Math.abs(targetSurplusDeficit) / (yearsToRetire * 12 * 1.5), currency)}/mo.`,
    ],
  };
}

// ----------------------------------------------------
// 7. CHILD FUTURE PLANNER
// ----------------------------------------------------
export function calculateChild(
  state: AppCalculatorsState['child'],
  currency: Currency
): CalculationResult {
  const { currentAge, targetAge, targetCostToday, inflationRate, monthlyInvest, ppfRate, ssyRate, sipRate } = state;

  const years = Math.max(1, targetAge - currentAge);
  const futureCost = targetCostToday * Math.pow(1 + inflationRate / 100, years);

  // Equal 1/3 split allocation if multiple options checked or blended rate
  const blendedRate = (ppfRate + ssyRate + sipRate) / 3;
  const monthlyRate = blendedRate / 12 / 100;
  const totalMonths = years * 12;

  let projectedCorpus = 0;
  let totalInvested = 0;
  const chartData = [];
  const tableRows: (string | number)[][] = [];

  for (let m = 1; m <= totalMonths; m++) {
    projectedCorpus = (projectedCorpus + monthlyInvest) * (1 + monthlyRate);
    totalInvested += monthlyInvest;

    if (m % 12 === 0) {
      const y = m / 12;
      const childAge = currentAge + y;

      chartData.push({
        name: `Age ${childAge}`,
        'Invested Capital': Math.round(totalInvested),
        'Accumulated Wealth': Math.round(projectedCorpus),
        'Future Target Expense': Math.round(futureCost),
      });

      tableRows.push([
        `Age ${childAge}`,
        formatExactCurrency(totalInvested, currency),
        formatExactCurrency(projectedCorpus, currency),
        formatExactCurrency(futureCost, currency),
      ]);
    }
  }

  const gap = projectedCorpus - futureCost;

  return {
    metrics: [
      {
        label: `Inflated Goal Cost (Age ${targetAge})`,
        value: formatCurrency(futureCost, currency),
        subtext: `Today's cost ${formatCurrency(targetCostToday, currency)} @ ${inflationRate}% inflation`,
      },
      {
        label: 'Projected Portfolio Corpus',
        value: formatCurrency(projectedCorpus, currency),
        color: gap >= 0 ? 'text-orange-400' : 'text-amber-400',
      },
      {
        label: gap >= 0 ? 'Surplus Reserve' : 'Required Funding Shortfall',
        value: formatCurrency(Math.abs(gap), currency),
        color: gap >= 0 ? 'text-orange-400' : 'text-red-400',
        badge: gap >= 0 ? 'Goal Secured' : 'Action Needed',
      },
    ],
    chartType: 'area',
    chartData,
    chartKeys: [
      { key: 'Invested Capital', color: '#6366f1', label: 'Invested Capital' },
      { key: 'Accumulated Wealth', color: '#10b981', label: 'Accumulated Corpus' },
    ],
    tableHeaders: ['Child Age', 'Invested Capital', 'Portfolio Value', 'Future Goal Cost'],
    tableRows,
  };
}

// ----------------------------------------------------
// 8. BUY VS RENT ENGINE
// ----------------------------------------------------
export function calculateBuyVsRent(
  state: AppCalculatorsState['buy_vs_rent'],
  currency: Currency
): CalculationResult {
  const { homePrice, downPaymentPct, loanRate, loanTenureYears, propertyAppreciationPct, monthlyRent, rentInflationPct, sipReturnPct, maintenanceAnnualPct } = state;

  const downPayment = homePrice * (downPaymentPct / 100);
  const loanAmount = Math.max(0, homePrice - downPayment);
  const monthlyLoanRate = loanRate / 12 / 100;
  const totalLoanMonths = Math.max(1, loanTenureYears * 12);

  const emi =
    loanAmount > 0 && monthlyLoanRate > 0
      ? (loanAmount * monthlyLoanRate * Math.pow(1 + monthlyLoanRate, totalLoanMonths)) /
        (Math.pow(1 + monthlyLoanRate, totalLoanMonths) - 1)
      : (loanAmount > 0 ? loanAmount / totalLoanMonths : 0);

  let homeValue = homePrice;
  let rentRenter = monthlyRent;
  let renterInvestedCapital = downPayment; // Renter invests down payment in SIP instead!
  let renterCorpus = downPayment;

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  for (let y = 1; y <= loanTenureYears; y++) {
    // Buyer: property appreciates, pays maintenance
    homeValue *= 1 + propertyAppreciationPct / 100;
    const maintenanceFeeAnnual = (homeValue * maintenanceAnnualPct) / 100;

    // Renter: pays annual rent, invests (EMI + Maintenance - Rent) in SIP
    const annualRentTotal = rentRenter * 12;
    const annualEmiAndMaintenanceBuyer = emi * 12 + maintenanceFeeAnnual;
    const annualSavingsRenterToInvest = Math.max(0, annualEmiAndMaintenanceBuyer - annualRentTotal);

    // Compound renter portfolio
    renterCorpus = (renterCorpus + annualSavingsRenterToInvest) * (1 + sipReturnPct / 100);
    renterInvestedCapital += annualSavingsRenterToInvest;

    // Inflate rent for next year
    rentRenter *= 1 + rentInflationPct / 100;

    chartData.push({
      name: `Yr ${y}`,
      'Buyer Home Value (Net Equity)': Math.round(homeValue),
      'Renter SIP Corpus': Math.round(renterCorpus),
    });

    tableRows.push([
      `Year ${y}`,
      formatExactCurrency(homeValue, currency),
      formatExactCurrency(renterCorpus, currency),
      formatExactCurrency(rentRenter, currency),
    ]);
  }

  const buyerWinner = homeValue >= renterCorpus;

  return {
    metrics: [
      {
        label: 'Monthly Home EMI (Buyer)',
        value: `${formatCurrency(emi, currency)}/mo`,
        subtext: `Downpayment: ${formatCurrency(downPayment, currency)}`,
      },
      {
        label: `Home Net Worth after ${loanTenureYears} yrs`,
        value: formatCurrency(homeValue, currency),
        color: buyerWinner ? 'text-orange-400' : 'text-gray-300',
      },
      {
        label: `Renter SIP Portfolio after ${loanTenureYears} yrs`,
        value: formatCurrency(renterCorpus, currency),
        color: !buyerWinner ? 'text-orange-400' : 'text-gray-300',
        badge: buyerWinner ? 'Buying Wins' : 'Renting + SIP Wins 🏆',
      },
    ],
    chartType: 'line',
    chartData,
    chartKeys: [
      { key: 'Buyer Home Value (Net Equity)', color: '#10b981', label: 'Buyer Home Asset' },
      { key: 'Renter SIP Corpus', color: '#6366f1', label: 'Renter SIP Asset' },
    ],
    tableHeaders: ['Year', 'Home Net Asset', 'Renter SIP Portfolio', 'Monthly Rent at Year'],
    tableRows,
    insights: [
      buyerWinner
        ? `Buying is financially superior in this scenario by ${formatCurrency(homeValue - renterCorpus, currency)} due to high property appreciation.`
        : `Renting & investing savings into equity SIP yields ${formatCurrency(renterCorpus - homeValue, currency)} MORE wealth than buying home!`,
    ],
  };
}

// ----------------------------------------------------
// 9. MULTI-LOAN DEBT ESCAPE ENGINE & BRUTAL REALITY GRAPH
// ----------------------------------------------------
export function calculateDebt(
  state: DebtState,
  currency: Currency
): CalculationResult {
  const { loans, extraMonthlyPayment, strategy, annualStepUpPct, inflationRate } = state;

  if (!loans || loans.length === 0) {
    return {
      metrics: [],
      chartType: 'line',
      chartData: [],
      chartKeys: [],
      tableHeaders: [],
      tableRows: [],
      summaryText: 'Please add at least one loan to compute repayment schedule.',
    };
  }

  // 1) Minimum Payments Only Simulation (The "Brutal Reality")
  let minSimLoans = loans.map(l => ({ ...l }));
  let minTotalInterest = 0;
  let minMonths = 0;

  while (minSimLoans.some(l => l.balance > 0.01) && minMonths < 600) {
    minMonths++;
    for (const loan of minSimLoans) {
      if (loan.balance <= 0) continue;
      const mRate = loan.interestRate / 12 / 100;
      const interest = loan.balance * mRate;
      minTotalInterest += interest;
      const payment = Math.min(loan.balance + interest, Math.max(loan.minMonthlyPayment, interest + 10));
      loan.balance = loan.balance + interest - payment;
    }
  }

  // 2) Accelerated Debt Strategy Simulation (Snowball / Avalanche / Standard)
  let simLoans = loans.map(l => ({ ...l }));
  let currentExtra = extraMonthlyPayment;
  let accelMonths = 0;
  let accelTotalInterest = 0;
  const initialTotalBalance = loans.reduce((acc, l) => acc + l.balance, 0);

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  while (simLoans.some(l => l.balance > 0.01) && accelMonths < 600) {
    accelMonths++;

    // Step up extra payment annually
    if (accelMonths % 12 === 0 && annualStepUpPct > 0) {
      currentExtra *= 1 + annualStepUpPct / 100;
    }

    // Sort active loans according to chosen strategy
    const activeLoans = simLoans.filter(l => l.balance > 0.01);
    if (strategy === 'snowball') {
      activeLoans.sort((a, b) => a.balance - b.balance); // Lowest balance first
    } else if (strategy === 'avalanche') {
      activeLoans.sort((a, b) => b.interestRate - a.interestRate); // Highest interest rate first
    }

    // Distribute payments
    let availableExtra = currentExtra;
    let totalBalThisMonth = 0;

    for (const loan of simLoans) {
      if (loan.balance <= 0) continue;
      const mRate = loan.interestRate / 12 / 100;
      const interest = loan.balance * mRate;
      accelTotalInterest += interest;

      let payment = Math.min(loan.balance + interest, loan.minMonthlyPayment);

      // If top priority loan in active list, attach available extra payment
      if (activeLoans.length > 0 && loan.id === activeLoans[0].id) {
        const extraUsed = Math.min(loan.balance + interest - payment, availableExtra);
        payment += extraUsed;
        availableExtra -= extraUsed;
      }

      loan.balance = loan.balance + interest - payment;
      if (loan.balance < 0.01) loan.balance = 0;
      totalBalThisMonth += loan.balance;
    }

    if (accelMonths % 6 === 0 || !simLoans.some(l => l.balance > 0)) {
      chartData.push({
        name: `Mo ${accelMonths}`,
        'Accelerated Strategy Debt': Math.round(totalBalThisMonth),
        'Minimum Payments Balance': Math.round(
          Math.max(0, initialTotalBalance - (initialTotalBalance / Math.max(1, minMonths)) * accelMonths)
        ),
      });

      tableRows.push([
        `Month ${accelMonths}`,
        formatExactCurrency(totalBalThisMonth, currency),
        formatExactCurrency(accelTotalInterest, currency),
        `${Math.ceil(accelMonths / 12)} Yrs ${accelMonths % 12} Mos`,
      ]);
    }
  }

  const interestSaved = Math.max(0, minTotalInterest - accelTotalInterest);
  const timeSavedMonths = Math.max(0, minMonths - accelMonths);

  return {
    metrics: [
      {
        label: 'Total Initial Loan Balance',
        value: formatCurrency(initialTotalBalance, currency),
        subtext: `Across ${loans.length} active loans`,
      },
      {
        label: 'Total Interest Paid (Accelerated)',
        value: formatCurrency(accelTotalInterest, currency),
        color: 'text-orange-400',
        subtext: `Debt free in ${(accelMonths / 12).toFixed(1)} years`,
      },
      {
        label: 'Brutal Reality Interest Saved',
        value: formatCurrency(interestSaved, currency),
        color: 'text-orange-400',
        badge: `Saved ${(timeSavedMonths / 12).toFixed(1)} Years! 🎉`,
      },
    ],
    chartType: 'line',
    chartData,
    chartKeys: [
      { key: 'Accelerated Strategy Debt', color: '#10b981', label: `${strategy.toUpperCase()} Plan Balance` },
      { key: 'Minimum Payments Balance', color: '#ef4444', label: 'Minimum Payment Drag' },
    ],
    tableHeaders: ['Month', 'Remaining Balance', 'Cumulative Interest Paid', 'Timeline'],
    tableRows,
    insights: [
      `Using the ${strategy.toUpperCase()} method with ${formatCurrency(extraMonthlyPayment, currency)}/mo extra payment eliminates your debt in ${(accelMonths / 12).toFixed(1)} years instead of ${(minMonths / 12).toFixed(1)} years with minimums alone!`,
      `You save ${formatCurrency(interestSaved, currency)} in wasted interest!`,
    ],
  };
}

// ----------------------------------------------------
// 10. ASSET ALLOCATOR ENGINE WITH ADVANCED SETTINGS
// ----------------------------------------------------
export function calculateAllocator(
  state: AllocatorState,
  currency: Currency
): CalculationResult {
  const { capital, years, riskProfile, customEquity, customDebt, customGold, customSilver, customCrypto, customCash, adjustInflation, inflationRate, advanced } = state;

  let eqPct = 0, debtPct = 0, goldPct = 0, silvPct = 0, crypPct = 0, cashPct = 0;

  if (riskProfile === 'conservative') {
    eqPct = 20; debtPct = 60; goldPct = 10; silvPct = 0; crypPct = 0; cashPct = 10;
  } else if (riskProfile === 'moderate') {
    eqPct = 50; debtPct = 30; goldPct = 10; silvPct = 5; crypPct = 0; cashPct = 5;
  } else if (riskProfile === 'aggressive') {
    eqPct = 70; debtPct = 15; goldPct = 5; silvPct = 0; crypPct = 5; cashPct = 5;
  } else {
    eqPct = customEquity;
    debtPct = customDebt;
    goldPct = customGold;
    silvPct = customSilver;
    crypPct = customCrypto;
    cashPct = customCash;
  }

  const sumPct = Math.max(1, eqPct + debtPct + goldPct + silvPct + crypPct + cashPct);
  // Normalize
  eqPct = (eqPct / sumPct) * 100;
  debtPct = (debtPct / sumPct) * 100;
  goldPct = (goldPct / sumPct) * 100;
  silvPct = (silvPct / sumPct) * 100;
  crypPct = (crypPct / sumPct) * 100;
  cashPct = (cashPct / sumPct) * 100;

  let eqVal = (capital * eqPct) / 100;
  let debtVal = (capital * debtPct) / 100;
  let goldVal = (capital * goldPct) / 100;
  let silvVal = (capital * silvPct) / 100;
  let crypVal = (capital * crypPct) / 100;
  let cashVal = (capital * cashPct) / 100;

  const chartData = [];
  const tableRows: (string | number)[][] = [];

  for (let y = 1; y <= years; y++) {
    eqVal *= 1 + (advanced.equityCagr * (1 - advanced.taxDragPct / 100)) / 100;
    debtVal *= 1 + (advanced.debtCagr * (1 - advanced.taxDragPct / 100)) / 100;
    goldVal *= 1 + advanced.goldCagr / 100;
    silvVal *= 1 + advanced.silverCagr / 100;
    crypVal *= 1 + advanced.cryptoCagr / 100;
    cashVal *= 1 + advanced.cashCagr / 100;

    const totalPortfolio = eqVal + debtVal + goldVal + silvVal + crypVal + cashVal;

    if (advanced.rebalanceAnnually) {
      eqVal = (totalPortfolio * eqPct) / 100;
      debtVal = (totalPortfolio * debtPct) / 100;
      goldVal = (totalPortfolio * goldPct) / 100;
      silvVal = (totalPortfolio * silvPct) / 100;
      crypVal = (totalPortfolio * crypPct) / 100;
      cashVal = (totalPortfolio * cashPct) / 100;
    }

    const displayTotal = adjustInflation ? getRealValue(totalPortfolio, inflationRate, y) : totalPortfolio;

    chartData.push({
      name: `Yr ${y}`,
      Equity: Math.round(eqVal),
      Debt: Math.round(debtVal),
      Gold: Math.round(goldVal),
      Crypto: Math.round(crypVal),
      'Total Wealth': Math.round(displayTotal),
    });

    tableRows.push([
      `Year ${y}`,
      formatExactCurrency(displayTotal, currency),
      formatExactCurrency(eqVal, currency),
      formatExactCurrency(debtVal, currency),
      formatExactCurrency(goldVal + silvVal, currency),
    ]);
  }

  const finalTotal = eqVal + debtVal + goldVal + silvVal + crypVal + cashVal;
  const netGain = finalTotal - capital;

  return {
    metrics: [
      {
        label: 'Initial Capital',
        value: formatCurrency(capital, currency),
      },
      {
        label: 'Projected Net Gain',
        value: formatCurrency(netGain, currency),
        color: 'text-orange-400',
      },
      {
        label: adjustInflation ? 'Real Purchasing Power' : 'Final Portfolio Wealth',
        value: formatCurrency(adjustInflation ? getRealValue(finalTotal, inflationRate, years) : finalTotal, currency),
        color: 'text-white',
        badge: advanced.rebalanceAnnually ? 'Annual Rebalancing Active' : 'Buy & Hold Mode',
      },
    ],
    chartType: 'doughnut',
    chartData: [
      { name: 'Equity', value: Math.round(eqVal) },
      { name: 'Debt & Fixed Income', value: Math.round(debtVal) },
      { name: 'Gold & Silver', value: Math.round(goldVal + silvVal) },
      { name: 'Crypto & Digital Assets', value: Math.round(crypVal) },
      { name: 'Cash Reserve', value: Math.round(cashVal) },
    ],
    chartKeys: [
      { key: 'Equity', color: '#10b981', label: 'Equity Slices' },
      { key: 'Debt & Fixed Income', color: '#6366f1', label: 'Debt Slices' },
      { key: 'Gold & Silver', color: '#f59e0b', label: 'Precious Metals' },
      { key: 'Crypto & Digital Assets', color: '#ec4899', label: 'Crypto' },
      { key: 'Cash Reserve', color: '#64748b', label: 'Cash Reserve' },
    ],
    tableHeaders: ['Year', 'Total Portfolio', 'Equity Portion', 'Debt Portion', 'Metals Portion'],
    tableRows,
  };
}

// ----------------------------------------------------
// 11. FINHEALTH DIAGNOSTIC ENGINE
// ----------------------------------------------------
export function calculateFinHealth(
  state: AppCalculatorsState['finhealth'],
  currency: Currency
): CalculationResult {
  const { monthlyIncome = 0, monthlyEmi = 0, monthlyExpenses = 0, monthlyInvestments = 0, emergencyFundCorpus = 0, termInsuranceCover = 0, healthInsuranceCover = 0 } = state || {};

  const safeIncome = Math.max(0, monthlyIncome);
  const safeEmi = Math.max(0, monthlyEmi);
  const safeExpenses = Math.max(0, monthlyExpenses);
  const safeInvestments = Math.max(0, monthlyInvestments);
  const safeEmergency = Math.max(0, emergencyFundCorpus);
  const safeTerm = Math.max(0, termInsuranceCover);
  const safeHealth = Math.max(0, healthInsuranceCover);

  // 1. Debt-to-Income Ratio (Max recommended 40%)
  const dti = safeIncome > 0 ? (safeEmi / safeIncome) * 100 : 0;
  const dtiScore = safeIncome > 0 ? Math.max(0, Math.min(25, 25 - (dti - 30) * 0.8)) : 0;

  // 2. Savings Rate (Target >= 20%)
  const savingsRate = safeIncome > 0 ? (safeInvestments / safeIncome) * 100 : 0;
  const savingsScore = safeIncome > 0 ? Math.min(25, (savingsRate / 30) * 25) : 0;

  // 3. Emergency Fund Months (Target 6 months of expenses + EMI)
  const monthlyOutflow = safeExpenses + safeEmi;
  const emergencyMonths = monthlyOutflow > 0 ? safeEmergency / monthlyOutflow : (safeEmergency > 0 ? 12 : 0);
  const emergencyScore = Math.min(25, (emergencyMonths / 6) * 25);

  // 4. Insurance Coverage Score (Term = 10x Annual Income, Health >= 5L)
  const termRequired = safeIncome * 12 * 10;
  const termCoverageRatio = termRequired > 0 ? safeTerm / termRequired : (safeTerm > 0 ? 1 : 0);
  const healthCoverageRatio = safeHealth / 500000;
  const insuranceScore = Math.min(25, (termCoverageRatio * 0.6 + healthCoverageRatio * 0.4) * 25);

  const totalScore = Math.round(dtiScore + savingsScore + emergencyScore + insuranceScore);

  let healthStatus = 'Diagnostic Pending / Incomplete';
  let statusColor = 'text-amber-400';
  if (safeIncome > 0) {
    if (totalScore >= 80) {
      healthStatus = 'Exceptional Financial Health 🌟';
      statusColor = 'text-orange-400';
    } else if (totalScore >= 60) {
      healthStatus = 'Good Health 👍';
      statusColor = 'text-amber-400';
    } else if (totalScore >= 40) {
      healthStatus = 'Needs Optimization ⚠️';
      statusColor = 'text-orange-400';
    } else {
      healthStatus = 'High Financial Vulnerability 🚨';
      statusColor = 'text-red-400';
    }
  }

  const recommendations: string[] = [];
  if (safeIncome <= 0) {
    recommendations.push('Enter your monthly take-home income above to generate a complete financial diagnostic report.');
  }
  if (dti > 40) recommendations.push(`High Debt Burden: Your EMI takes up ${dti.toFixed(1)}% of income. Reduce non-essential debt.`);
  if (safeIncome > 0 && savingsRate < 20) recommendations.push(`Low Savings Rate: You invest ${savingsRate.toFixed(1)}% of income. Aim for at least 20-30%.`);
  if (emergencyMonths < 6 && monthlyOutflow > 0) recommendations.push(`Emergency Fund Gap: You have ${emergencyMonths.toFixed(1)} months buffer. Build it up to 6 months (${formatCurrency(monthlyOutflow * 6, currency)}).`);
  if (safeIncome > 0 && safeTerm < termRequired) recommendations.push(`Insurance Shortfall: Term cover is ${formatCurrency(safeTerm, currency)}, recommended is 10x annual income (${formatCurrency(termRequired, currency)}).`);

  return {
    metrics: [
      {
        label: 'Overall FinHealth Score',
        value: `${totalScore} / 100`,
        color: statusColor,
        badge: healthStatus,
      },
      {
        label: 'Debt-to-Income (DTI)',
        value: `${dti.toFixed(1)}%`,
        color: dti <= 40 ? 'text-orange-400' : 'text-red-400',
        subtext: dti <= 40 ? 'Safe EMI Limit' : 'Over-leveraged',
      },
      {
        label: 'Emergency Cushion',
        value: `${emergencyMonths.toFixed(1)} Months`,
        color: emergencyMonths >= 6 ? 'text-orange-400' : 'text-amber-400',
        subtext: `Expenses: ${formatCurrency(monthlyOutflow, currency)}/mo`,
      },
    ],
    chartType: 'doughnut',
    chartData: [
      { name: 'Living Expenses', value: Math.round(safeExpenses) },
      { name: 'EMI Repayments', value: Math.round(safeEmi) },
      { name: 'Monthly Investments', value: Math.round(safeInvestments) },
      { name: 'Unallocated Surplus', value: Math.round(Math.max(0, safeIncome - safeExpenses - safeEmi - safeInvestments)) },
    ],
    chartKeys: [
      { key: 'Living Expenses', color: '#3b82f6', label: 'Living Expenses' },
      { key: 'EMI Repayments', color: '#ef4444', label: 'EMI Repayments' },
      { key: 'Monthly Investments', color: '#10b981', label: 'Investments' },
      { key: 'Unallocated Surplus', color: '#8b5cf6', label: 'Surplus Cash' },
    ],
    tableHeaders: ['Pillar', 'Current Value', 'Recommended Benchmark', 'Status Score'],
    tableRows: [
      ['Debt Burden (DTI)', `${dti.toFixed(1)}%`, '< 40% of Income', `${Math.round(dtiScore)} / 25`],
      ['Investment Rate', `${savingsRate.toFixed(1)}%`, '> 20% of Income', `${Math.round(savingsScore)} / 25`],
      ['Emergency Reserve', `${emergencyMonths.toFixed(1)} Months`, '6 Months Outflow', `${Math.round(emergencyScore)} / 25`],
      ['Risk & Protection', formatCurrency(safeTerm, currency), '10x Annual Income', `${Math.round(insuranceScore)} / 25`],
    ],
    insights: recommendations.length > 0 ? recommendations : ['Your financial health diagnostic looks great across all key pillars!'],
  };
}

// ----------------------------------------------------
// 12. SMART STRATEGIES / LADDERING
// ----------------------------------------------------
export function calculateSmartIdeas(
  state: AppCalculatorsState['smart_ideas'],
  currency: Currency
): CalculationResult {
  const { ladderCorpus, numTranches, avgFdRate, taxBracketPct, adjustInflation, inflationRate } = state;

  const perTranche = ladderCorpus / Math.max(1, numTranches);
  const netRate = avgFdRate * (1 - taxBracketPct / 100);

  const tableRows: (string | number)[][] = [];
  const chartData = [];

  for (let i = 1; i <= numTranches; i++) {
    const tenureMonths = i * 6; // e.g., 6m, 12m, 18m, 24m...
    const maturityVal = perTranche * Math.pow(1 + netRate / 100, tenureMonths / 12);
    const displayVal = adjustInflation ? getRealValue(maturityVal, inflationRate, tenureMonths / 12) : maturityVal;

    chartData.push({
      name: `Tranche ${i} (${tenureMonths}m)`,
      'Tranche Capital': Math.round(perTranche),
      'Maturity Yield': Math.round(displayVal),
    });

    tableRows.push([
      `Tranche ${i}`,
      `${tenureMonths} Months`,
      formatExactCurrency(perTranche, currency),
      formatExactCurrency(maturityVal, currency),
    ]);
  }

  return {
    metrics: [
      {
        label: 'Total Ladder Corpus',
        value: formatCurrency(ladderCorpus, currency),
        subtext: `Split into ${numTranches} staggered tranches`,
      },
      {
        label: 'Liquidity Frequency',
        value: 'Every 6 Months',
        color: 'text-orange-400',
        subtext: 'Continuous liquidity rolling reserve',
      },
      {
        label: 'Effective After-Tax Yield',
        value: formatPercent(netRate),
        color: 'text-white',
      },
    ],
    chartType: 'stacked_bar',
    chartData,
    chartKeys: [
      { key: 'Tranche Capital', color: '#6366f1', label: 'Tranche Principal' },
      { key: 'Maturity Yield', color: '#10b981', label: 'Net Maturity Value' },
    ],
    tableHeaders: ['Tranche No.', 'Lock-in Period', 'Principal Allocated', 'Maturity Payout'],
    tableRows,
  };
}
