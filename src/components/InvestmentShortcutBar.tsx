import React from 'react';
import {
  ArrowLeft,
  Scale,
  TrendingUp,
  Landmark,
  PiggyBank,
  CircleDollarSign,
  Coins,
  Briefcase,
  Flame,
  Heart,
  Building2,
  Activity,
  Receipt,
  PieChart,
  FolderKanban,
  Layers,
  Calculator,
} from 'lucide-react';
import { CalculatorType } from '../types';

interface InvestmentShortcutBarProps {
  activeEngine: CalculatorType;
  onSelectCalculator: (type: CalculatorType) => void;
  onBack: () => void;
}

export const INVESTMENT_CALCULATORS_LIST = [
  {
    id: 'compare' as CalculatorType,
    name: 'Compare Engines',
    icon: <Scale className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'sip' as CalculatorType,
    name: 'SIP Calculator',
    icon: <TrendingUp className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'fd' as CalculatorType,
    name: 'FD Calculator',
    icon: <Landmark className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'rd' as CalculatorType,
    name: 'RD Calculator',
    icon: <PiggyBank className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'swp' as CalculatorType,
    name: 'SWP Calculator',
    icon: <CircleDollarSign className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'gold' as CalculatorType,
    name: 'Gold Calculator',
    icon: <Coins className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'bonds' as CalculatorType,
    name: 'Bonds Calculator',
    icon: <Briefcase className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'retirement' as CalculatorType,
    name: 'Retirement Engine',
    icon: <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'child' as CalculatorType,
    name: 'Child Legacy Engine',
    icon: <Heart className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'buy_vs_rent' as CalculatorType,
    name: 'Buy vs Rent Engine',
    icon: <Building2 className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'finhealth' as CalculatorType,
    name: 'FinHealth Score',
    icon: <Activity className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'debt' as CalculatorType,
    name: 'Debt Engine',
    icon: <Receipt className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'allocator' as CalculatorType,
    name: 'Investment Allocator',
    icon: <PieChart className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'portfolio' as CalculatorType,
    name: 'Portfolio',
    icon: <FolderKanban className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'smart_ideas' as CalculatorType,
    name: 'Smart Ideas',
    icon: <Layers className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'other_calcs' as CalculatorType,
    name: 'Other Calculators',
    icon: <Calculator className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
  {
    id: 'income_tax' as CalculatorType,
    name: 'Income Tax',
    icon: <Receipt className="w-3.5 h-3.5 text-orange-500 dark:text-emerald-400" />,
  },
];

export const InvestmentShortcutBar: React.FC<InvestmentShortcutBarProps> = ({
  activeEngine,
  onSelectCalculator,
  onBack,
}) => {
  return (
    <div className="space-y-2.5 pb-2 border-b border-gray-800/80 mb-4 animate-in fade-in">
      {/* Top row: All calculators back pill */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="all-calculators-back-btn inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-orange-300 dark:text-emerald-300 bg-orange-950/70 dark:bg-emerald-950/70 border border-orange-800/80 dark:border-emerald-800/80 hover:bg-orange-900/90 dark:hover:bg-emerald-900/90 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All calculators</span>
        </button>
      </div>

      {/* Second row: Horizontal scrollable shortcut pills for switching between calculators */}
      <div className="overflow-x-auto pb-1.5 max-w-full custom-scrollbar">
        <div className="flex items-center space-x-2 min-w-max pr-2">
          {INVESTMENT_CALCULATORS_LIST.map((calc) => {
            const isActive = activeEngine === calc.id;
            return (
              <button
                key={calc.id}
                onClick={() => onSelectCalculator(calc.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'shortcut-pill-active bg-orange-500 dark:bg-emerald-500 text-white dark:text-black border-orange-400 dark:border-emerald-400 shadow-md shadow-orange-500/30 dark:shadow-emerald-500/30 scale-102 [&_svg]:text-white dark:[&_svg]:text-black'
                    : 'shortcut-pill-inactive bg-[#18181c] text-gray-200 border-gray-800 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{calc.icon}</span>
                <span>{calc.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
