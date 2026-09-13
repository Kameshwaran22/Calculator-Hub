import React from 'react';
import {
  TrendingUp,
  Landmark,
  PiggyBank,
  CircleDollarSign,
  Coins,
  Briefcase,
  Flame,
  Heart,
  Building2,
  Receipt,
  PieChart,
  Layers,
  ChevronRight,
  Calculator,
  FolderKanban,
  Activity,
  Scale,
  Download,
  ArrowUpRight,
} from 'lucide-react';
import { CalculatorType, Currency } from '../types';
import { formatExactCurrency } from '../utils/formatters';
import { generatePdfReport } from '../utils/pdfExport';
import { GoalProgressTracker } from './GoalProgressTracker';

interface InvestmentHubViewProps {
  onSelectCalculator: (type: CalculatorType) => void;
  currency?: Currency | string;
}

export const InvestmentHubView: React.FC<InvestmentHubViewProps> = ({
  onSelectCalculator,
  currency = 'INR',
}) => {
  const curr = typeof currency === 'string' ? (currency as Currency) : 'INR';

  const handleExportPDF = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    generatePdfReport({
      title: 'Investment Hub Master Summary Report',
      subtitle: `Generated on ${timestamp} | Currency: ${curr}`,
      metrics: [
        { label: 'Featured Tool', value: 'Compare Engines (SIP vs FD)' },
        { label: 'Primary SIP Benchmark', value: `${formatExactCurrency(10000, curr)}/mo @ 12% CAGR` },
        { label: 'FD Benchmark', value: `${formatExactCurrency(100000, curr)} @ 7.2% Quarterly` },
        { label: 'Retirement Target (25x)', value: `${formatExactCurrency(15000000, curr)} Base Corpus`, isHighlight: true },
      ],
      tableHeaders: ['Category', 'Calculator Tool', 'Key Parameters', 'Default Rate / Assumption', 'Purpose / Target'],
      tableRows: [
        ['Featured', 'Compare Engines', 'Tenure: 15 Yrs, Engine A vs B', 'SIP 12% vs FD 7.2%', 'Side-by-side growth assessment'],
        ['Grow & Withdraw', 'SIP Calculator', 'Monthly: 10,000, Return: 12%, Step-up: 10%', '12% CAGR', 'Wealth accumulation'],
        ['Grow & Withdraw', 'FD Calculator', 'Lumpsum: 100,000, Rate: 7.2%, Tenure: 5 Yrs', '7.2% Compounded Quarterly', 'Fixed income guaranteed return'],
        ['Grow & Withdraw', 'RD Calculator', 'Monthly: 5,000, Rate: 7.0%, Tenure: 3 Yrs', '7.0% Compounded Quarterly', 'Disciplined short-term savings'],
        ['Grow & Withdraw', 'SWP Calculator', 'Corpus: 5,000,000, Monthly SWP: 30,000', '8.0% Portfolio Yield', 'Monthly post-retirement income'],
        ['Grow & Withdraw', 'Gold Calculator', 'Investment: 100,000, Tenure: 8 Yrs', '9.0% CAGR + 2.5% SGB Interest', 'Hedge against inflation'],
        ['Grow & Withdraw', 'Bonds Calculator', 'Face Value: 1,000, Coupon: 8.5%', '8.5% Annual Coupon', 'Stable cash flow'],
        ['Plan Ahead', 'Retirement Engine', 'Current Age: 30, Retire: 60, Monthly Exp: 50,000', 'Inflation: 6%, Returns: 12%', 'Retirement corpus calculation'],
        ['Plan Ahead', 'Child Legacy Engine', 'Child Age: 0, Target: 21 Yrs, Monthly: 10,000', 'SSY 8.2%, PPF 7.1%, SIP 13%', 'Higher education fund'],
        ['Plan Ahead', 'Buy vs Rent Engine', 'Property: 8,000/sqft, Salary: 100k/mo', 'Equity 12% vs Prop 6%', 'Home purchase decision'],
        ['Health & Debt', 'FinHealth Score', 'Savings %, Debt Ratio, Emergency Fund', 'Benchmark 0-100 Score', 'Financial fitness diagnostic'],
        ['Health & Debt', 'Debt Payoff Engine', 'Loans Balance & Interest Rates', 'Snowball / Avalanche', 'Fast loan payoff strategy'],
      ],
      notes: 'Master financial utility summary report covering wealth accumulation, retirement, and portfolio allocation.',
    });
  };

  const sections = [
    {
      category: 'FEATURED TOOLS',
      items: [
        {
          id: 'compare' as CalculatorType,
          title: 'Compare Engines',
          desc: 'Side-by-side growth projection chart for any two investment calculators',
          icon: <Scale className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/20 dark:bg-emerald-500/20 border-orange-500/50 dark:border-emerald-500/50 shadow-orange-500/10 dark:shadow-emerald-500/10',
        },
      ],
    },
    {
      category: 'GROW & WITHDRAW MONEY',
      items: [
        {
          id: 'sip' as CalculatorType,
          title: 'SIP Calculator',
          desc: 'Grow wealth monthly with compounding',
          icon: <TrendingUp className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'fd' as CalculatorType,
          title: 'FD Calculator',
          desc: 'Fixed deposit maturity & compound interest',
          icon: <Landmark className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'rd' as CalculatorType,
          title: 'RD Calculator',
          desc: 'Recurring deposit piggy-bank compounding',
          icon: <PiggyBank className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'swp' as CalculatorType,
          title: 'SWP Calculator',
          desc: 'Plan monthly withdrawals from a corpus',
          icon: <CircleDollarSign className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'gold' as CalculatorType,
          title: 'Gold Calculator',
          desc: 'Physical vs Digital vs Sovereign Gold Bonds',
          icon: <Coins className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'bonds' as CalculatorType,
          title: 'Bonds Calculator',
          desc: 'Coupon income & yield to maturity',
          icon: <Briefcase className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
      ],
    },
    {
      category: 'PLAN AHEAD',
      items: [
        {
          id: 'retirement' as CalculatorType,
          title: 'Retirement Engine',
          desc: 'EPF vs NPS vs SIP, head-to-head',
          icon: <Flame className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'child' as CalculatorType,
          title: 'Child Legacy Engine',
          desc: 'PPF vs SSY vs SIP for your child',
          icon: <Heart className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'buy_vs_rent' as CalculatorType,
          title: 'Buy vs Rent Engine',
          desc: '20-year net worth: own home vs rent + invest',
          icon: <Building2 className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
      ],
    },
    {
      category: 'HEALTH & DEBT',
      items: [
        {
          id: 'finhealth' as CalculatorType,
          title: 'FinHealth Score',
          desc: 'A 0–100 complete diagnostic of your finances',
          icon: <Activity className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'debt' as CalculatorType,
          title: 'Debt Payoff Engine',
          desc: 'Single loan payoff or multi-loan snowball / avalanche',
          icon: <Receipt className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
      ],
    },
    {
      category: 'TAX PLANNING',
      items: [
        {
          id: 'income_tax' as CalculatorType,
          title: 'Income Tax Calculator',
          desc: 'Compare New vs Old regime and find which saves more (FY 2025-26)',
          icon: <Receipt className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
      ],
    },
    {
      category: 'TRACK & STRATEGIZE',
      items: [
        {
          id: 'allocator' as CalculatorType,
          title: 'Investment Allocator',
          desc: 'Conservative, Moderate & Aggressive asset allocation growth',
          icon: <PieChart className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'portfolio' as CalculatorType,
          title: 'Portfolio Tracker',
          desc: 'Track all holdings in one place with live profit/loss',
          icon: <FolderKanban className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'smart_ideas' as CalculatorType,
          title: 'Smart Ideas',
          desc: 'FD laddering, tax saving, and wealth multiplier hacks',
          icon: <Layers className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
        {
          id: 'other_calcs' as CalculatorType,
          title: 'Other Calculators',
          desc: 'NSC, Lumpsum growth, CAGR, and Inflation impact',
          icon: <Calculator className="w-5 h-5 text-orange-500 dark:text-emerald-400" />,
          badgeStyle: 'bg-orange-500/10 dark:bg-emerald-500/10 border-orange-500/30 dark:border-emerald-500/30',
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-2 pt-2 pb-2 max-w-md mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Investment Hub</h1>
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
          One home for every financial decision — SIPs to retirement, gold to debt payoff.
        </p>
      </div>

      {/* Categorized Lists */}
      <div className="space-y-6">
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-2.5">
            <h3 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase px-1">
              {sec.category}
            </h3>

            <div className="bg-[#121215] border border-gray-800/90 rounded-2xl divide-y divide-gray-800/80 overflow-hidden shadow-xl">
              {sec.items.map((item, iIdx) => (
                <button
                  key={`${sIdx}-${iIdx}`}
                  onClick={() => onSelectCalculator(item.id)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-gray-900/90 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2.5 rounded-xl border ${item.badgeStyle} group-hover:scale-105 transition-transform flex items-center justify-center shadow-md`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-500 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-orange-500 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-[11px] text-gray-500 font-medium">
          Estimates only · Not investment advice · Assumed rates are editable
        </p>
      </div>
    </div>
  );
};


