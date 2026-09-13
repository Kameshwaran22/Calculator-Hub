import React from 'react';
import { Calculator, RefreshCw, Wallet, Sun, Moon, Settings } from 'lucide-react';
import { MainAppTab, ThemeMode } from '../types';

interface NavbarProps {
  activeTab: MainAppTab;
  onTabChange: (tab: MainAppTab) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-md border-b border-slate-200 dark:border-gray-800/80 px-3 sm:px-6 py-2.5 shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* App Logo & Title */}
        <div
          className="flex items-center space-x-3 cursor-pointer hover:opacity-95 transition-all group shrink-0"
          onClick={() => onTabChange('calculator')}
        >
          {/* App Icon: Warm Green in Deep Dark, Orange in Bright */}
          <div className="w-10 h-10 rounded-2xl bg-orange-500 dark:bg-emerald-500 flex items-center justify-center shadow-lg shadow-orange-500/30 dark:shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <Calculator className="w-6 h-6 text-white dark:text-black font-black" />
          </div>

          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Calculator
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/15 dark:bg-emerald-500/20 text-orange-600 dark:text-emerald-400 border border-orange-500/40 dark:border-emerald-500/40 px-2 py-0.5 rounded-full">
              HUB
            </span>
          </div>
        </div>

        {/* Quick Nav Switcher & Theme Toggle */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Quick Header Nav Pills */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-100 dark:bg-black/60 p-1 rounded-2xl border border-slate-200 dark:border-gray-800">
            <button
              onClick={() => onTabChange('calculator')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-orange-500 dark:bg-emerald-500 text-white dark:text-black shadow-md shadow-orange-500/20 dark:shadow-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculator</span>
            </button>

            <button
              onClick={() => onTabChange('converter')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'converter'
                  ? 'bg-orange-500 dark:bg-emerald-500 text-white dark:text-black shadow-md shadow-orange-500/20 dark:shadow-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Converter</span>
            </button>

            <button
              onClick={() => onTabChange('engines')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'engines'
                  ? 'bg-orange-500 dark:bg-emerald-500 text-white dark:text-black shadow-md shadow-orange-500/20 dark:shadow-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Investment</span>
            </button>
          </div>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-900/90 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-gray-800 transition-all cursor-pointer shadow-sm active:scale-95"
              title={theme === 'dark' ? 'Switch to Sophisticated Light (Orange & White)' : 'Switch to Deep Dark (Obsidian & Warm Green)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xs:inline text-amber-300">Bright</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden xs:inline text-slate-800 dark:text-emerald-300">Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};




