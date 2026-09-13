import React from 'react';
import { Plus, Trash2, ShieldAlert, Sparkles, TrendingDown } from 'lucide-react';
import { DebtState, IndividualLoan, Currency } from '../types';
import { NumberSliderInput, InflationSection } from './InputsPanel';
import { formatCurrency, formatExactCurrency } from '../utils/formatters';

interface MultiLoanEngineProps {
  state: DebtState;
  onChangeState: (newState: DebtState) => void;
  currency: Currency;
}

export const MultiLoanEngine: React.FC<MultiLoanEngineProps> = ({
  state,
  onChangeState,
  currency,
}) => {
  const addLoan = () => {
    const newLoan: IndividualLoan = {
      id: Date.now().toString(),
      name: `Loan #${state.loans.length + 1}`,
      balance: 200000,
      interestRate: 12,
      minMonthlyPayment: 4000,
    };
    onChangeState({ ...state, loans: [...state.loans, newLoan] });
  };

  const removeLoan = (id: string) => {
    onChangeState({
      ...state,
      loans: state.loans.filter((l) => l.id !== id),
    });
  };

  const updateLoan = (id: string, updatedFields: Partial<IndividualLoan>) => {
    onChangeState({
      ...state,
      loans: state.loans.map((l) => (l.id === id ? { ...l, ...updatedFields } : l)),
    });
  };

  return (
    <div className="space-y-6">
      {/* Debt Acceleration Strategy Selection */}
      <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Select Debt Acceleration Method</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChangeState({ ...state, strategy: 'snowball' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              state.strategy === 'snowball'
                ? 'border-emerald-500 bg-emerald-950/40 text-white'
                : 'border-gray-800 bg-gray-950 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span>Debt Snowball</span>
              {state.strategy === 'snowball' && <span>✓</span>}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Pays smallest loan balance first for rapid psychological wins.
            </div>
          </button>

          <button
            onClick={() => onChangeState({ ...state, strategy: 'avalanche' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              state.strategy === 'avalanche'
                ? 'border-emerald-500 bg-emerald-950/40 text-white'
                : 'border-gray-800 bg-gray-950 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span>Debt Avalanche</span>
              {state.strategy === 'avalanche' && <span>✓</span>}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Pays highest interest rate first for maximum mathematical savings.
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <NumberSliderInput
            label="Extra Monthly Prepayment"
            value={state.extraMonthlyPayment}
            min={0}
            max={100000}
            step={500}
            prefix={currency === 'INR' ? '₹' : '$'}
            onChange={(val) => onChangeState({ ...state, extraMonthlyPayment: val })}
            subtext="Added directly on top of minimum EMIs to crush principal fast"
          />

          <NumberSliderInput
            label="Annual Step-Up Repayment %"
            value={state.annualStepUpPct}
            min={0}
            max={25}
            step={1}
            unit="%"
            onChange={(val) => onChangeState({ ...state, annualStepUpPct: val })}
            subtext="Increase prepayment amount every year as income grows"
          />
        </div>
      </div>

      {/* Individual Loan Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span>Active Debts & Credit Lines ({state.loans.length})</span>
          </h3>
          <button
            onClick={addLoan}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Loan</span>
          </button>
        </div>

        {state.loans.map((loan, idx) => (
          <div
            key={loan.id}
            className="bg-gray-900/80 border border-gray-800 p-4 rounded-2xl space-y-3 relative group"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <input
                type="text"
                value={loan.name}
                onChange={(e) => updateLoan(loan.id, { name: e.target.value })}
                className="bg-transparent font-bold text-sm text-emerald-400 focus:outline-none focus:border-b focus:border-emerald-500"
              />
              {state.loans.length > 1 && (
                <button
                  onClick={() => removeLoan(loan.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  title="Remove loan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NumberSliderInput
                label="Outstanding Balance"
                value={loan.balance}
                min={1000}
                max={10000000}
                step={5000}
                prefix={currency === 'INR' ? '₹' : '$'}
                onChange={(val) => updateLoan(loan.id, { balance: val })}
              />

              <NumberSliderInput
                label="Interest Rate (p.a)"
                value={loan.interestRate}
                min={1}
                max={42}
                step={0.5}
                unit="%"
                onChange={(val) => updateLoan(loan.id, { interestRate: val })}
              />

              <NumberSliderInput
                label="Minimum EMI Payment"
                value={loan.minMonthlyPayment}
                min={100}
                max={100000}
                step={500}
                prefix={currency === 'INR' ? '₹' : '$'}
                onChange={(val) => updateLoan(loan.id, { minMonthlyPayment: val })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
