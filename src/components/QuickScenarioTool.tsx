import React, { useState } from 'react';
import { Layers, ArrowLeftRight, Check, RotateCcw, Zap, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Currency } from '../types';
import { formatExactCurrency } from '../utils/formatters';

export interface ScenarioData {
  name: string;
  params: Record<string, any>;
  savedAt: string;
}

interface QuickScenarioToolProps {
  currentParams: Record<string, any>;
  onApplyParams: (params: Record<string, any>) => void;
  paramLabels?: Record<string, string>;
  currency?: Currency | string;
  calculatorTitle?: string;
  presetAggressive?: Record<string, any>;
  presetConservative?: Record<string, any>;
}

export const QuickScenarioTool: React.FC<QuickScenarioToolProps> = ({
  currentParams,
  onApplyParams,
  paramLabels = {},
  currency = 'INR',
  calculatorTitle = 'Calculator',
  presetAggressive,
  presetConservative,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scenarioA, setScenarioA] = useState<ScenarioData | null>(
    presetAggressive
      ? { name: 'Aggressive Growth', params: presetAggressive, savedAt: 'Preset' }
      : null
  );
  const [scenarioB, setScenarioB] = useState<ScenarioData | null>(
    presetConservative
      ? { name: 'Conservative Safe', params: presetConservative, savedAt: 'Preset' }
      : null
  );

  const [nameAInput, setNameAInput] = useState('Scenario A (Aggressive)');
  const [nameBInput, setNameBInput] = useState('Scenario B (Conservative)');

  const saveCurrentToA = () => {
    setScenarioA({
      name: nameAInput.trim() || 'Scenario A',
      params: { ...currentParams },
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const saveCurrentToB = () => {
    setScenarioB({
      name: nameBInput.trim() || 'Scenario B',
      params: { ...currentParams },
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const swapScenarios = () => {
    const temp = scenarioA;
    setScenarioA(scenarioB);
    setScenarioB(temp);
  };

  const formatParamDisplay = (key: string, val: any) => {
    if (typeof val === 'number') {
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('pct') || key.toLowerCase().includes('return')) {
        return `${val}%`;
      }
      if (key.toLowerCase().includes('year') || key.toLowerCase().includes('tenure') || key.toLowerCase().includes('age')) {
        return `${val} Yrs`;
      }
      if (val >= 1000) {
        return formatExactCurrency(val, currency);
      }
      return String(val);
    }
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    return String(val || '-');
  };

  // Extract all unique parameter keys present in A or B or currentParams
  const allKeys = Array.from(
    new Set([
      ...Object.keys(currentParams),
      ...(scenarioA ? Object.keys(scenarioA.params) : []),
      ...(scenarioB ? Object.keys(scenarioB.params) : []),
    ])
  ).filter((k) => typeof currentParams[k] !== 'object' && typeof currentParams[k] !== 'function');

  return (
    <div className="bg-[#121215] border border-gray-800/90 rounded-2xl overflow-hidden shadow-xl transition-all">
      {/* Header bar */}
      <div className="p-3.5 flex items-center justify-between bg-gray-900/60 border-b border-gray-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Quick Scenario Comparison</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                A / B Tester
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Save current parameters & assess two strategies side-by-side
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 border border-gray-700"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
          <span>{isOpen ? 'Collapse Panel' : 'Compare Scenarios'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4 animate-in fade-in duration-200">
          {/* Quick Actions to Save Current Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/60 p-3 rounded-xl border border-gray-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Scenario A
                </span>
                {scenarioA && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    Saved: {scenarioA.savedAt}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={nameAInput}
                  onChange={(e) => setNameAInput(e.target.value)}
                  placeholder="Scenario A Name"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={saveCurrentToA}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-md"
                >
                  Save Current
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Scenario B
                </span>
                {scenarioB && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    Saved: {scenarioB.savedAt}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={nameBInput}
                  onChange={(e) => setNameBInput(e.target.value)}
                  placeholder="Scenario B Name"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={saveCurrentToB}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-md"
                >
                  Save Current
                </button>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          {(presetAggressive || presetConservative) && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-900/40 p-2.5 rounded-xl border border-gray-800 text-xs">
              <span className="text-gray-400 font-medium">Quick Strategy Presets:</span>
              <div className="flex items-center space-x-2">
                {presetAggressive && (
                  <button
                    onClick={() => {
                      setScenarioA({
                        name: 'Aggressive Strategy',
                        params: presetAggressive,
                        savedAt: 'Preset',
                      });
                      onApplyParams(presetAggressive);
                    }}
                    className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    🔥 Apply Aggressive Preset
                  </button>
                )}
                {presetConservative && (
                  <button
                    onClick={() => {
                      setScenarioB({
                        name: 'Conservative Strategy',
                        params: presetConservative,
                        savedAt: 'Preset',
                      });
                      onApplyParams(presetConservative);
                    }}
                    className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    🛡️ Apply Conservative Preset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Comparison Side-By-Side Table */}
          {scenarioA || scenarioB ? (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-900 text-gray-400 border-b border-gray-800 font-mono">
                      <th className="p-2.5">Parameter / Metric</th>
                      <th className="p-2.5 text-orange-400 font-bold bg-orange-950/20">
                        {scenarioA?.name || 'Scenario A'}
                      </th>
                      <th className="p-2.5 text-cyan-400 font-bold bg-cyan-950/20">
                        {scenarioB?.name || 'Scenario B'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/80 font-mono">
                    {allKeys.map((key) => {
                      const label = paramLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
                      const valA = scenarioA ? scenarioA.params[key] : undefined;
                      const valB = scenarioB ? scenarioB.params[key] : undefined;

                      const formattedA = formatParamDisplay(key, valA);
                      const formattedB = formatParamDisplay(key, valB);
                      const isDifferent = valA !== valB && valA !== undefined && valB !== undefined;

                      return (
                        <tr
                          key={key}
                          className={isDifferent ? 'bg-amber-950/10' : 'hover:bg-gray-900/40'}
                        >
                          <td className="p-2.5 font-sans font-medium text-gray-300">
                            {label}
                          </td>
                          <td className="p-2.5 text-orange-300 font-bold bg-orange-950/10">
                            {scenarioA ? formattedA : '-'}
                          </td>
                          <td className="p-2.5 text-cyan-300 font-bold bg-cyan-950/10">
                            {scenarioB ? formattedB : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  onClick={swapScenarios}
                  disabled={!scenarioA || !scenarioB}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 border border-gray-700"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Swap A & B</span>
                </button>

                <div className="flex items-center space-x-2">
                  {scenarioA && (
                    <button
                      onClick={() => onApplyParams(scenarioA.params)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-md active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Load Scenario A</span>
                    </button>
                  )}
                  {scenarioB && (
                    <button
                      onClick={() => onApplyParams(scenarioB.params)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 shadow-md active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Load Scenario B</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-900/40 rounded-xl text-center text-xs text-gray-400 border border-gray-800/80">
              Click <strong className="text-orange-400">Save Current</strong> under Scenario A or Scenario B above to store and compare different parameter configurations side-by-side.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
