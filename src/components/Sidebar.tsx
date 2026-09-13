import React from 'react';
import { CalculatorType } from '../types';
import {
  TrendingUp,
  CreditCard,
  Building2,
  Coins,
  FileCheck,
  ShieldAlert,
  GraduationCap,
  Home,
  Link,
  PieChart,
  Activity,
  Lightbulb,
  Receipt,
} from 'lucide-react';

interface SidebarProps {
  currentCalc: CalculatorType;
  onSelectCalc: (calc: CalculatorType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface CalcItem {
  key: CalculatorType;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

const CALCULATORS: CalcItem[] = [
  { key: 'sip', label: 'SIP Calculator', icon: TrendingUp },
  { key: 'swp', label: 'SWP Withdrawal Engine', icon: CreditCard },
  { key: 'fd_rd_nsc', label: 'Fixed Returns (FD / RD / NSC)', icon: Building2 },
  { key: 'gold', label: 'Gold Returns Engine', icon: Coins },
  { key: 'bonds', label: 'Bonds & Debt Yields', icon: FileCheck },
  { key: 'retirement', label: 'Retirement (EPF/NPS/SIP)', icon: ShieldAlert, badge: 'Multi-Asset' },
  { key: 'child', label: 'Child Legacy Engine', icon: GraduationCap },
  { key: 'buy_vs_rent', label: 'Buy vs Rent Simulator', icon: Home, badge: 'Popular' },
  { key: 'debt', label: 'Debt & Multi-Loan Escape', icon: Link },
  { key: 'allocator', label: 'Smart Asset Allocator', icon: PieChart },
  { key: 'finhealth', label: 'FinHealth Diagnostics', icon: Activity, badge: 'Score 0-100' },
  { key: 'smart_ideas', label: 'Smart Ideas & FD Laddering', icon: Lightbulb },
  { key: 'income_tax', label: 'Income Tax Calculator', icon: Receipt, badge: 'FY 25-26' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentCalc,
  onSelectCalc,
  isOpenMobile,
  onCloseMobile,
}) => {
  const content = (
    <aside className="w-full lg:w-72 bg-card rounded-2xl p-4 flex-shrink-0 flex flex-col gap-1.5 shadow-xl border border-gray-800/80">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Calculators & Engines
        </h3>
        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
          {CALCULATORS.length} Engines
        </span>
      </div>

      <nav className="flex flex-col gap-1 custom-scrollbar max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
        {CALCULATORS.map((item) => {
          const Icon = item.icon;
          const isActive = currentCalc === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onSelectCalc(item.key);
                onCloseMobile();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition flex items-center justify-between group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5 font-semibold'
                  : 'text-gray-400 hover:bg-gray-800/70 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-gray-800 text-gray-400 group-hover:text-gray-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:block">{content}</div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-4/5 max-w-sm bg-card h-full p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
              <span className="font-bold text-white text-base">Select Financial Engine</span>
              <button
                onClick={onCloseMobile}
                className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800"
              >
                ✕
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
