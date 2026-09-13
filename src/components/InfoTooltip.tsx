import React, { useState } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';

export const FINANCIAL_TERMS_DICTIONARY: Record<string, string> = {
  cagr: 'Compounded Annual Growth Rate (CAGR) is the mean annual growth rate of an investment over a period longer than one year.',
  'return rate': 'Expected annual percentage gain or growth earned on your invested capital.',
  'expected return': 'Annualized rate of return projected for your portfolio or asset class.',
  'step-up': 'Annual Step-Up increases your regular contribution by a fixed percentage each year as your salary grows.',
  'annual step-up': 'Increasing your monthly contribution annually (e.g. 5-10%) significantly boosts long-term compounding wealth.',
  'step-up percentage': 'Percentage by which your monthly contribution increases each year, accelerating wealth compounding.',
  'compounding frequency': 'How often interest is calculated and added back to principal (e.g., Monthly, Quarterly, Yearly). Higher frequency yields slightly higher returns.',
  frequency: 'How often interest is added back to your principal balance to generate compound returns.',
  'target corpus': 'The target financial goal amount you wish to accumulate at the end of the investment tenure.',
  'current savings': 'The total existing balance or investments already accumulated toward your goal.',
  'monthly deposit': 'Fixed monthly installment added to your savings or recurring deposit account.',
  'interest rate': 'Annual percentage rate paid on deposits or earned on investment assets.',
  inflation: 'Inflation represents the gradual rise in prices over time, which reduces the purchasing power of money.',
  'inflation rate': 'Annual percentage rate by which purchasing power declines. Factoring this in gives realistic real-world value.',
  'inflation impact': 'Shows how future values translate into equivalent purchasing power in today’s money.',
  tenure: 'Total time duration (in years or months) over which capital remains invested.',
  years: 'Investment duration in years to calculate compound returns over time.',
  horizon: 'The total time frame before you need to access or withdraw your funds.',
  principal: 'The initial lump sum or base sum of money deposited or invested before interest accumulates.',
  lumpsum: 'A single, one-time investment made upfront instead of recurring periodic installments.',
  sip: 'Systematic Investment Plan (SIP) allows investing fixed monthly amounts to benefit from rupee-cost averaging.',
  monthly: 'Recurring monthly contribution made towards accumulating wealth.',
  swp: 'Systematic Withdrawal Plan (SWP) lets you withdraw a fixed monthly amount from a corpus while the remaining balance stays invested.',
  rebalance: 'Portfolio Rebalancing periodically resets asset allocation weights back to target ratios to manage risk.',
  'expense ratio': 'Annual management fee charged by mutual funds or ETFs expressed as a percentage of assets.',
  'coupon rate': 'Fixed annual interest rate paid by a bond issuer relative to its face value.',
  yield: 'Total annual return generated on an investment or bond relative to purchase price.',
  'down payment': 'Initial upfront cash payment made when purchasing real estate or assets with a loan.',
  'appreciation rate': 'Annual percentage rate at which property or asset market values increase.',
  'epf rate': 'Guaranteed annual interest rate provided by Employee Provident Fund (EPF).',
  'nps rate': 'Expected returns from National Pension System (NPS) market-linked equity and bond funds.',
  'basic salary': 'Basic monthly salary used to calculate mandatory employee & employer EPF contributions.',
  'emi burden': 'Total monthly Equated Monthly Installments paid across all active loans.',
  'emergency reserve': 'Liquid risk-free cash set aside to cover 6-12 months of living expenses.',
  'insurance cover': 'Total sum assured paid out in the event of an untimely demise to secure dependents.',
};

export function getTooltipForLabel(label: string): string | undefined {
  const lower = label.toLowerCase();
  for (const [key, desc] of Object.entries(FINANCIAL_TERMS_DICTIONARY)) {
    if (lower.includes(key)) {
      return desc;
    }
  }
  return undefined;
}

interface InfoTooltipProps {
  term?: string;
  text?: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ term, text, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const tooltipContent = text || (term ? getTooltipForLabel(term) : undefined);

  if (!tooltipContent) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-gray-400 hover:text-orange-400 focus:text-orange-400 focus:outline-none transition-colors p-0.5 cursor-pointer"
        aria-label="Financial Term Information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-950 border border-orange-500/40 rounded-xl shadow-2xl text-[11px] text-gray-200 leading-relaxed font-sans pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-1 mb-1 pb-1 border-b border-gray-800">
            <span className="font-bold text-orange-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>{term || 'Financial Concept'}</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-xs font-bold"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-gray-300">{tooltipContent}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-950" />
        </div>
      )}
    </div>
  );
};
