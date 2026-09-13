export type MainAppTab = 'engines' | 'calculator' | 'converter' | 'history' | 'settings';

export type CalculatorType =
  | 'sip'
  | 'swp'
  | 'fd_rd_nsc'
  | 'fd'
  | 'rd'
  | 'gold'
  | 'bonds'
  | 'retirement'
  | 'child'
  | 'buy_vs_rent'
  | 'debt'
  | 'allocator'
  | 'finhealth'
  | 'smart_ideas'
  | 'portfolio'
  | 'other_calcs'
  | 'compare'
  | 'income_tax';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';

export type ThemeMode = 'dark' | 'light';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
  formatMode: 'IN' | 'US';
}

export interface MetricCardData {
  label: string;
  value: string;
  subtext?: string;
  color?: string; // e.g. 'text-emerald-400', 'text-gray-300', 'text-red-500'
  badge?: string;
}

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface CalculationResult {
  metrics: MetricCardData[];
  chartType: 'doughnut' | 'area' | 'bar' | 'stacked_bar' | 'line';
  chartData: ChartDataPoint[];
  chartKeys: { key: string; color: string; label: string }[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  summaryText?: string;
  insights?: string[];
}

// ------------------------------------
// Multi-Loan Types
// ------------------------------------
export interface IndividualLoan {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minMonthlyPayment: number;
}

export type DebtStrategy = 'snowball' | 'avalanche' | 'standard';

export interface DebtState {
  loans: IndividualLoan[];
  extraMonthlyPayment: number;
  strategy: DebtStrategy;
  annualStepUpPct: number;
  inflationRate: number;
}

// ------------------------------------
// Asset Allocator Types
// ------------------------------------
export interface AllocatorAdvancedSettings {
  equityCagr: number;
  debtCagr: number;
  goldCagr: number;
  silverCagr: number;
  cryptoCagr: number;
  cashCagr: number;
  rebalanceAnnually: boolean;
  taxDragPct: number;
}

export interface AllocatorState {
  capital: number;
  years: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive' | 'custom';
  customEquity: number;
  customDebt: number;
  customGold: number;
  customSilver: number;
  customCrypto: number;
  customCash: number;
  adjustInflation: boolean;
  inflationRate: number;
  advanced: AllocatorAdvancedSettings;
}

// ------------------------------------
// State Models for all Calculators
// ------------------------------------
export interface SipState {
  monthly: number;
  returnRate: number;
  years: number;
  stepUpPct: number;
  adjustInflation: boolean;
  inflationRate: number;
}

export interface SwpState {
  totalCorpus: number;
  annualReturn: number;
  monthlyWithdrawal: number;
  durationYears: number;
  withdrawalInflation: number;
  adjustInflation: boolean;
  inflationRate: number;
}

export interface FixedIncomeState {
  mode: 'FD' | 'RD' | 'NSC';
  principal: number;
  rate: number;
  years: number;
  compoundingFrequency: 1 | 2 | 4 | 12;
  adjustInflation: boolean;
  inflationRate: number;
}

export interface GoldState {
  capital: number;
  expectedAppreciation: number;
  years: number;
  physicalMakingChargesPct: number;
  digitalGstPct: number;
  sgbInterestRate: number;
  adjustInflation: boolean;
  inflationRate: number;
}

export interface BondsState {
  investment: number;
  couponRate: number;
  tenureYears: number;
  payoutFrequency: 'Monthly' | 'Quarterly' | 'Annual';
  reinvestInterest: boolean;
  taxBracketPct: number;
  adjustInflation: boolean;
  inflationRate: number;
}

export interface RetirementState {
  currentAge: number;
  retireAge: number;
  currentMonthlyExpense: number;
  inflationRate: number;
  epfMonthly: number;
  npsMonthly: number;
  sipMonthly: number;
  epfRate: number;
  npsRate: number;
  sipRate: number;
}

export interface ChildState {
  currentAge: number;
  targetAge: number;
  targetCostToday: number;
  inflationRate: number;
  monthlyInvest: number;
  ppfRate: number;
  ssyRate: number;
  sipRate: number;
}

export interface BuyVsRentState {
  homePrice: number;
  downPaymentPct: number;
  loanRate: number;
  loanTenureYears: number;
  propertyAppreciationPct: number;
  monthlyRent: number;
  rentInflationPct: number;
  sipReturnPct: number;
  maintenanceAnnualPct: number;
  generalInflationRate: number;
}

export interface FinHealthState {
  monthlyIncome: number;
  monthlyEmi: number;
  monthlyExpenses: number;
  monthlyInvestments: number;
  emergencyFundCorpus: number;
  termInsuranceCover: number;
  healthInsuranceCover: number;
}

export interface SmartIdeasState {
  ladderCorpus: number;
  numTranches: number;
  avgFdRate: number;
  taxBracketPct: number;
  adjustInflation: boolean;
  inflationRate: number;
}

export interface AppCalculatorsState {
  sip: SipState;
  swp: SwpState;
  fd_rd_nsc: FixedIncomeState;
  gold: GoldState;
  bonds: BondsState;
  retirement: RetirementState;
  child: ChildState;
  buy_vs_rent: BuyVsRentState;
  debt: DebtState;
  allocator: AllocatorState;
  finhealth: FinHealthState;
  smart_ideas: SmartIdeasState;
}

export interface SavedPreset {
  id: string;
  name: string;
  date: string;
  calcType: CalculatorType;
  state: any;
}

export interface CalcHistoryEntry {
  id: string;
  type?: string;
  timestamp: string;
  expression: string;
  result: string;
}
