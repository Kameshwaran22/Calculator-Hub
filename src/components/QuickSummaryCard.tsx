import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, PiggyBank, Sparkles } from 'lucide-react';
import { Currency } from '../types';
import { formatExactCurrency } from '../utils/formatters';

interface QuickSummaryCardProps {
  title?: string;
  invested: number;
  interest: number;
  finalCorpus: number;
  currency?: Currency;
  subtitle?: string;
  investedLabel?: string;
  interestLabel?: string;
  finalLabel?: string;
}

export const QuickSummaryCard: React.FC<QuickSummaryCardProps> = ({
  title = 'Quick Summary',
  invested,
  interest,
  finalCorpus,
  currency = 'INR',
  subtitle,
  investedLabel = 'Total Invested',
  interestLabel = 'Interest / Gain Earned',
  finalLabel = 'Final Corpus Value',
}) => {
  const [isLight, setIsLight] = useState<boolean>(() => {
    return document.documentElement.getAttribute('data-theme') === 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => observer.disconnect();
  }, []);

  const gainPercent = invested > 0 ? ((interest / invested) * 100).toFixed(1) : '0.0';
  const multiplier = invested > 0 ? (finalCorpus / invested).toFixed(2) : '1.0';

  return (
    <div
      className={`quick-summary-card p-4 sm:p-5 space-y-3.5 rounded-2xl sm:rounded-3xl border shadow-xl transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-200/50'
          : 'bg-gradient-to-br from-[#16161a] via-[#121215] to-[#1a1a22] border-gray-800/90 text-white'
      }`}
    >
      <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-gray-800/80'}`}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-xl border ${isLight ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-extrabold tracking-tight flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>{title}</span>
            </h3>
            {subtitle && <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            isLight
              ? 'bg-orange-100 text-orange-800 border-orange-300'
              : 'bg-orange-500/15 text-orange-300 border-orange-500/30'
          }`}>
            {multiplier}x Wealth Multiplier
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Invested */}
        <div className={`p-3 sm:p-3.5 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-gray-900/80 border-gray-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold flex items-center space-x-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              <Wallet className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
              <span>{investedLabel}</span>
            </span>
          </div>
          <p className={`text-base sm:text-xl font-mono font-black tracking-tight ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
            {formatExactCurrency(invested, currency)}
          </p>
          <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Principal Outlay</p>
        </div>

        {/* Interest / Wealth Earned */}
        <div className={`p-3 sm:p-3.5 rounded-xl border space-y-1 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-gray-900/80 border-gray-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold flex items-center space-x-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              <TrendingUp className={`w-3.5 h-3.5 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
              <span>{interestLabel}</span>
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
              isLight ? 'text-orange-800 bg-orange-100' : 'text-orange-400 bg-orange-500/10'
            }`}>
              +{gainPercent}%
            </span>
          </div>
          <p className={`text-base sm:text-xl font-mono font-black tracking-tight ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>
            +{formatExactCurrency(interest, currency)}
          </p>
          <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Compounded Return</p>
        </div>

        {/* Final Corpus / Maturity Value */}
        <div className={`p-3 sm:p-3.5 rounded-xl border space-y-1 shadow-inner ${
          isLight
            ? 'bg-orange-50 border-orange-300'
            : 'bg-orange-950/40 border-orange-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold flex items-center space-x-1 ${isLight ? 'text-orange-900' : 'text-orange-300'}`}>
              <PiggyBank className={`w-3.5 h-3.5 ${isLight ? 'text-orange-700' : 'text-orange-300'}`} />
              <span>{finalLabel}</span>
            </span>
          </div>
          <p className={`text-base sm:text-2xl font-mono font-black tracking-tight ${isLight ? 'text-orange-800' : 'text-orange-300'}`}>
            {formatExactCurrency(finalCorpus, currency)}
          </p>
          <p className={`text-[10px] font-mono font-semibold ${isLight ? 'text-orange-700' : 'text-orange-400/80'}`}>Total Portfolio Value</p>
        </div>
      </div>
    </div>
  );
};

