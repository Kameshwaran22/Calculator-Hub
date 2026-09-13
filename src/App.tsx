import React, { useState, useMemo, useEffect } from 'react';
import {
  AppCalculatorsState,
  CalculatorType,
  CalculationResult,
  Currency,
  MainAppTab,
  CalcHistoryEntry,
  ThemeMode,
} from './types';
import {
  calculateSip,
  calculateSwp,
  calculateFixedIncome,
  calculateGold,
  calculateBonds,
  calculateRetirement,
  calculateChild,
  calculateBuyVsRent,
  calculateDebt,
  calculateAllocator,
  calculateFinHealth,
  calculateSmartIdeas,
} from './utils/calculators';
import { Navbar } from './components/Navbar';
import { StandardCalculator } from './components/StandardCalculator';
import { ConverterSuite } from './components/ConverterSuite';
import { SettingsTab } from './components/SettingsTab';
import { InvestmentHubView } from './components/InvestmentHubView';
import { NumberSliderInput, InflationSection } from './components/InputsPanel';
import { ChartViewer } from './components/ChartViewer';
import { AmortizationTable } from './components/AmortizationTable';
import { MultiLoanEngine } from './components/MultiLoanEngine';
import { LoanCalculatorSuite } from './components/LoanCalculatorSuite';
import { AssetAllocatorAdvanced } from './components/AssetAllocatorAdvanced';
import { FinHealthDiagnostics } from './components/FinHealthDiagnostics';
import { PortfolioTracker } from './components/PortfolioTracker';
import { OtherCalculators } from './components/OtherCalculators';
import { SmartIdeasEngine } from './components/SmartIdeasEngine';
import { InvestmentShortcutBar } from './components/InvestmentShortcutBar';
import { SipCalculatorView } from './components/SipCalculatorView';
import { FdCalculatorView } from './components/FdCalculatorView';
import { RdCalculatorView } from './components/RdCalculatorView';
import { GoldReturnsCalculatorView } from './components/GoldReturnsCalculatorView';
import { BondsCalculatorView } from './components/BondsCalculatorView';
import { SwpCalculatorView } from './components/SwpCalculatorView';
import { RetirementEngineView } from './components/RetirementEngineView';
import { ChildLegacyEngineView } from './components/ChildLegacyEngineView';
import { BuyVsRentEngineView } from './components/BuyVsRentEngineView';
import { CompareEnginesView } from './components/CompareEnginesView';
import { IncomeTaxCalculatorView } from './components/IncomeTaxCalculatorView';
import { CalculatorHistoryView } from './components/CalculatorHistoryView';
import { Sidebar } from './components/Sidebar';
import { SavedPresetsModal } from './components/SavedPresetsModal';
import {
  TrendingUp,
  PieChart,
  ShieldCheck,
  Building2,
  Coins,
  Receipt,
  GraduationCap,
  Sparkles,
  Flame,
  Award,
  CircleDollarSign,
  Briefcase,
  Layers,
  ArrowLeft,
  FolderKanban,
  Calculator as CalculatorIcon,
  Settings,
  RefreshCw,
  Wallet,
  History as HistoryIcon,
  Bookmark,
  WifiOff,
} from 'lucide-react';

const INITIAL_STATE: AppCalculatorsState = {
  sip: {
    monthly: 15000,
    returnRate: 12,
    years: 15,
    stepUpPct: 10,
    adjustInflation: false,
    inflationRate: 6,
  },
  swp: {
    totalCorpus: 10000000,
    annualReturn: 9,
    monthlyWithdrawal: 60000,
    durationYears: 25,
    withdrawalInflation: 5,
    adjustInflation: false,
    inflationRate: 6,
  },
  fd_rd_nsc: {
    mode: 'FD',
    principal: 500000,
    rate: 7.2,
    years: 5,
    compoundingFrequency: 4,
    adjustInflation: false,
    inflationRate: 6,
  },
  gold: {
    capital: 500000,
    expectedAppreciation: 9.5,
    years: 8,
    physicalMakingChargesPct: 12,
    digitalGstPct: 3,
    sgbInterestRate: 2.5,
    adjustInflation: false,
    inflationRate: 6,
  },
  bonds: {
    investment: 1000000,
    couponRate: 9.2,
    tenureYears: 5,
    payoutFrequency: 'Annual',
    reinvestInterest: false,
    taxBracketPct: 20,
    adjustInflation: false,
    inflationRate: 6,
  },
  retirement: {
    currentAge: 30,
    retireAge: 60,
    currentMonthlyExpense: 50000,
    inflationRate: 6,
    epfMonthly: 8000,
    npsMonthly: 5000,
    sipMonthly: 15000,
    epfRate: 8.15,
    npsRate: 10,
    sipRate: 12,
  },
  child: {
    currentAge: 3,
    targetAge: 18,
    targetCostToday: 2500000,
    inflationRate: 8,
    monthlyInvest: 15000,
    ppfRate: 7.1,
    ssyRate: 8.2,
    sipRate: 12,
  },
  buy_vs_rent: {
    homePrice: 8000000,
    downPaymentPct: 20,
    loanRate: 8.7,
    loanTenureYears: 20,
    propertyAppreciationPct: 5,
    monthlyRent: 22000,
    rentInflationPct: 7,
    sipReturnPct: 12,
    maintenanceAnnualPct: 1,
    generalInflationRate: 6,
  },
  debt: {
    loans: [
      {
        id: '1',
        name: 'Home Loan',
        balance: 3500000,
        interestRate: 8.7,
        minMonthlyPayment: 31000,
      },
      {
        id: '2',
        name: 'Credit Card Outstanding',
        balance: 150000,
        interestRate: 36,
        minMonthlyPayment: 7500,
      },
    ],
    extraMonthlyPayment: 15000,
    strategy: 'avalanche',
    annualStepUpPct: 10,
    inflationRate: 6,
  },
  allocator: {
    capital: 5000000,
    years: 10,
    riskProfile: 'moderate',
    customEquity: 50,
    customDebt: 30,
    customGold: 10,
    customSilver: 5,
    customCrypto: 0,
    customCash: 5,
    adjustInflation: false,
    inflationRate: 6,
    advanced: {
      equityCagr: 12,
      debtCagr: 7,
      goldCagr: 9,
      silverCagr: 8,
      cryptoCagr: 25,
      cashCagr: 3.5,
      rebalanceAnnually: true,
      taxDragPct: 10,
    },
  },
  finhealth: {
    monthlyIncome: 120000,
    monthlyEmi: 31000,
    monthlyExpenses: 40000,
    monthlyInvestments: 25000,
    emergencyFundCorpus: 300000,
    termInsuranceCover: 12000000,
    healthInsuranceCover: 1000000,
  },
  smart_ideas: {
    ladderCorpus: 1200000,
    numTranches: 4,
    avgFdRate: 7.5,
    taxBracketPct: 20,
    adjustInflation: false,
    inflationRate: 6,
  },
};

export function App() {
  const [activeMainTab, setActiveMainTab] = useState<MainAppTab>('calculator');
  const [activeEngine, setActiveEngine] = useState<CalculatorType>('sip');
  const [isHubView, setIsHubView] = useState<boolean>(true);
  const [isEngineSidebarOpen, setIsEngineSidebarOpen] = useState<boolean>(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  const [currency, setCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('calculator_hub_currency');
      return (saved as Currency) || 'INR';
    } catch {
      return 'INR';
    }
  });
  const [calcState, setCalcState] = useState<AppCalculatorsState>(INITIAL_STATE);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('calculator_hub_theme');
      return (saved as ThemeMode) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    try {
      localStorage.setItem('calculator_hub_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync currency changes to localStorage
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    try {
      localStorage.setItem('calculator_hub_currency', newCurrency);
    } catch {
      // ignore
    }
  };

  // Cross-tab and window synchronizer for theme and currency
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calculator_hub_theme' && e.newValue) {
        setTheme(e.newValue as ThemeMode);
      }
      if (e.key === 'calculator_hub_currency' && e.newValue) {
        setCurrency(e.newValue as Currency);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [calcHistory, setCalcHistory] = useState<CalcHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('calculator_hub_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSaveHistory = (entry: CalcHistoryEntry) => {
    setCalcHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 50); // Keep last 50 entries
      try {
        localStorage.setItem('calculator_hub_calc_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleDeleteHistoryEntries = (ids: string[]) => {
    setCalcHistory((prev) => {
      const next = prev.filter((h) => !ids.includes(h.id));
      try {
        localStorage.setItem('calculator_hub_calc_history', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleClearHistory = () => {
    setCalcHistory([]);
    try {
      localStorage.removeItem('calculator_hub_calc_history');
    } catch {
      // ignore
    }
  };

  // Engine List Options
  const engines = [
    { id: 'sip' as CalculatorType, name: 'SIP Wealth', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'swp' as CalculatorType, name: 'SWP Income', icon: <CircleDollarSign className="w-4 h-4" /> },
    { id: 'fd_rd_nsc' as CalculatorType, name: 'Fixed Income', icon: <Receipt className="w-4 h-4" /> },
    { id: 'gold' as CalculatorType, name: 'Gold & Metals', icon: <Coins className="w-4 h-4" /> },
    { id: 'bonds' as CalculatorType, name: 'Bonds & Yield', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'retirement' as CalculatorType, name: 'Retirement Freedom', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'child' as CalculatorType, name: 'Child Future', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'buy_vs_rent' as CalculatorType, name: 'Buy vs Rent', icon: <Building2 className="w-4 h-4" /> },
    { id: 'debt' as CalculatorType, name: 'Debt Escape', icon: <Flame className="w-4 h-4 text-red-400" /> },
    { id: 'allocator' as CalculatorType, name: 'Asset Allocator', icon: <PieChart className="w-4 h-4 text-orange-400" /> },
    { id: 'portfolio' as CalculatorType, name: 'Portfolio', icon: <FolderKanban className="w-4 h-4 text-amber-400" /> },
    { id: 'finhealth' as CalculatorType, name: 'FinHealth Score', icon: <Award className="w-4 h-4 text-amber-400" /> },
    { id: 'smart_ideas' as CalculatorType, name: 'Smart Ideas', icon: <Layers className="w-4 h-4" /> },
    { id: 'other_calcs' as CalculatorType, name: 'Other Calculators', icon: <CalculatorIcon className="w-4 h-4 text-orange-400" /> },
  ];

  // Dynamically compute result based on active engine state
  const result: CalculationResult = useMemo(() => {
    switch (activeEngine) {
      case 'sip':
        return calculateSip(calcState.sip, currency);
      case 'swp':
        return calculateSwp(calcState.swp, currency);
      case 'fd_rd_nsc':
        return calculateFixedIncome(calcState.fd_rd_nsc, currency);
      case 'gold':
        return calculateGold(calcState.gold, currency);
      case 'bonds':
        return calculateBonds(calcState.bonds, currency);
      case 'retirement':
        return calculateRetirement(calcState.retirement, currency);
      case 'child':
        return calculateChild(calcState.child, currency);
      case 'buy_vs_rent':
        return calculateBuyVsRent(calcState.buy_vs_rent, currency);
      case 'debt':
        return calculateDebt(calcState.debt, currency);
      case 'allocator':
        return calculateAllocator(calcState.allocator, currency);
      case 'finhealth':
        return calculateFinHealth(calcState.finhealth, currency);
      case 'smart_ideas':
        return calculateSmartIdeas(calcState.smart_ideas, currency);
      default:
        return calculateSip(calcState.sip, currency);
    }
  }, [activeEngine, calcState, currency]);

  return (
    <div
      className={`min-h-screen bg-black dark:bg-[#09090b] text-white font-sans flex flex-col overflow-x-hidden transition-colors ${
        activeMainTab === 'calculator' ? 'h-screen max-h-screen overflow-hidden' : ''
      }`}
    >
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/15 text-amber-400 text-xs font-semibold py-1.5 border-b border-amber-500/20">
          <WifiOff className="w-3.5 h-3.5" />
          You're offline — calculators work normally, but currency rates may not be up to date.
        </div>
      )}
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeMainTab}
        onTabChange={(tab) => {
          setActiveMainTab(tab);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 ${
          activeMainTab === 'calculator'
            ? 'h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] pb-18 pt-1 flex flex-col justify-between overflow-hidden'
            : 'py-4 pb-24 space-y-6'
        }`}
      >
        {/* TAB 1: STANDARD & SCIENTIFIC CALCULATOR */}
        {activeMainTab === 'calculator' && (
          <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden animate-in fade-in">
            <StandardCalculator
              history={calcHistory}
              onSaveHistory={handleSaveHistory}
              onClearHistory={handleClearHistory}
              onNavigateTab={(tab) => {
                setActiveMainTab(tab);
                if (tab === 'engines') setIsHubView(true);
              }}
            />
          </div>
        )}

        {/* TAB 2: UNIT CONVERTER SUITE */}
        {activeMainTab === 'converter' && (
          <div className="py-2 animate-in fade-in">
            <ConverterSuite />
          </div>
        )}

        {/* TAB 3: INVESTMENT CALCULATORS */}
        {activeMainTab === 'engines' && (
          <div className="space-y-6 animate-in fade-in">
            {isHubView ? (
              <InvestmentHubView
                onSelectCalculator={(type) => {
                  setActiveEngine(type);
                  setIsHubView(false);
                }}
              />
            ) : (
              <div className="lg:flex lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
                <Sidebar
                  currentCalc={activeEngine}
                  onSelectCalc={(type) => {
                    setActiveEngine(type);
                    setIsHubView(false);
                  }}
                  isOpenMobile={isEngineSidebarOpen}
                  onCloseMobile={() => setIsEngineSidebarOpen(false)}
                />

                <div className="flex-1 min-w-0 space-y-6">
                <InvestmentShortcutBar
                  activeEngine={activeEngine}
                  onSelectCalculator={(type) => {
                    setActiveEngine(type);
                    setIsHubView(false);
                  }}
                  onBack={() => setIsHubView(true)}
                />

                {/* Opens the full calculator list on mobile/tablet, where the
                    sidebar is hidden to save space */}
                <button
                  onClick={() => setIsEngineSidebarOpen(true)}
                  className="lg:hidden w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-gray-800/80 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Browse All Calculators
                </button>

                {(activeEngine === 'allocator' || activeEngine === 'finhealth') && (
                  <button
                    onClick={() => setIsPresetsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-card border border-gray-800/80 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Saved Scenarios
                  </button>
                )}

                {activeEngine === 'compare' ? (
                  <CompareEnginesView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'sip' ? (
                  <SipCalculatorView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'fd' ? (
                  <FdCalculatorView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'rd' ? (
                  <RdCalculatorView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'gold' ? (
                  <GoldReturnsCalculatorView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'bonds' ? (
                  <BondsCalculatorView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'swp' ? (
                  <SwpCalculatorView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'retirement' ? (
                  <RetirementEngineView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'child' ? (
                  <ChildLegacyEngineView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'buy_vs_rent' ? (
                  <BuyVsRentEngineView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'debt' ? (
                  <LoanCalculatorSuite
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'allocator' ? (
                  <AssetAllocatorAdvanced
                    state={calcState.allocator}
                    onChangeState={(newState) => setCalcState({ ...calcState, allocator: newState })}
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'portfolio' ? (
                  <PortfolioTracker currency={currency} onBack={() => setIsHubView(true)} />
                ) : activeEngine === 'other_calcs' ? (
                  <OtherCalculators currency={currency} onBack={() => setIsHubView(true)} />
                ) : activeEngine === 'smart_ideas' ? (
                  <SmartIdeasEngine
                    currency={currency}
                    onNavigate={(type) => {
                      setActiveEngine(type);
                      setIsHubView(false);
                    }}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'finhealth' ? (
                  <FinHealthDiagnostics
                    state={calcState.finhealth}
                    onChangeState={(newState) => setCalcState({ ...calcState, finhealth: newState })}
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : activeEngine === 'income_tax' ? (
                  <IncomeTaxCalculatorView
                    currency={currency}
                    onBack={() => setIsHubView(true)}
                  />
                ) : null}
                {(activeEngine === 'allocator' || activeEngine === 'finhealth') && (
                  <SavedPresetsModal
                    isOpen={isPresetsModalOpen}
                    onClose={() => setIsPresetsModalOpen(false)}
                    currentCalc={activeEngine}
                    currentState={calcState}
                    onLoadPreset={(calcType, state) =>
                      setCalcState({ ...calcState, [calcType]: state })
                    }
                  />
                )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CALCULATION HISTORY */}
        {activeMainTab === 'history' && (
          <div className="py-2 animate-in fade-in">
            <CalculatorHistoryView
              history={calcHistory}
              onBack={() => setActiveMainTab('calculator')}
              onSelectEntry={() => setActiveMainTab('calculator')}
              onDeleteEntries={handleDeleteHistoryEntries}
              onClearAll={handleClearHistory}
            />
          </div>
        )}

        {/* TAB 4: SETTINGS & PREFERENCES */}
        {activeMainTab === 'settings' && (
          <div className="py-2 animate-in fade-in">
            <SettingsTab
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onClearAll={() => {
                try {
                  localStorage.clear();
                } catch {
                  // ignore
                }
                setCalcState(INITIAL_STATE);
                setCalcHistory([]);
              }}
            />
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0d0d10]/95 backdrop-blur-md border-t border-slate-200 dark:border-gray-800/80 py-2.5 px-4 flex justify-around items-center transition-colors">
        <button
          onClick={() => setActiveMainTab('calculator')}
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
            activeMainTab === 'calculator'
              ? 'text-orange-500 dark:text-emerald-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
          }`}
        >
          <CalculatorIcon className="w-5 h-5" />
          <span className="text-[11px]">Calculator</span>
        </button>

        <button
          onClick={() => setActiveMainTab('converter')}
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
            activeMainTab === 'converter'
              ? 'text-orange-500 dark:text-emerald-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-[11px]">Convert</span>
        </button>

        <button
          onClick={() => {
            setActiveMainTab('engines');
            setIsHubView(true);
          }}
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
            activeMainTab === 'engines'
              ? 'text-orange-500 dark:text-emerald-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[11px]">Investment</span>
        </button>

        <button
          onClick={() => setActiveMainTab('history')}
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
            activeMainTab === 'history'
              ? 'text-orange-500 dark:text-emerald-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
          }`}
        >
          <HistoryIcon className="w-5 h-5" />
          <span className="text-[11px]">History</span>
        </button>

        <button
          onClick={() => setActiveMainTab('settings')}
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
            activeMainTab === 'settings'
              ? 'text-orange-500 dark:text-emerald-400 font-extrabold scale-105'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px]">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
