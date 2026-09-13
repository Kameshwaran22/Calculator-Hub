import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Delete,
  History,
  Calculator as CalcIcon,
  Binary,
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  MoreVertical,
  Settings,
  RefreshCw,
  Zap,
  FileCode,
  Download,
} from 'lucide-react';
import { CalcHistoryEntry } from '../types';
import { parseVoiceToMath } from '../utils/voiceMathParser';
import { triggerTapHaptic } from '../utils/haptics';
import { CalculatorHistoryView } from './CalculatorHistoryView';

interface StandardCalculatorProps {
  onSaveHistory: (entry: CalcHistoryEntry) => void;
  history: CalcHistoryEntry[];
  onClearHistory: () => void;
  onNavigateTab?: (tab: 'converter' | 'engines' | 'settings') => void;
}

type Mode = 'standard' | 'scientific';

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({
  onSaveHistory,
  history,
  onClearHistory,
  onNavigateTab,
}) => {
  const [mode, setMode] = useState<Mode>('standard');
  const [expression, setExpression] = useState<string>('0');
  const [cursorPosition, setCursorPosition] = useState<number>(1);
  const [lastEquation, setLastEquation] = useState<string>('');
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [isRad, setIsRad] = useState<boolean>(false);
  const [showHistoryView, setShowHistoryView] = useState<boolean>(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState<boolean>(false);
  const [memoryValue, setMemoryValue] = useState<number>(0);
  const [cursorBlink, setCursorBlink] = useState<boolean>(true);

  // Voice Command States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showVoiceHelp, setShowVoiceHelp] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const historyTapeRef = useRef<HTMLDivElement>(null);
  const displayContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Blinking cursor timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorBlink((prev) => !prev);
    }, 530);
    return () => clearInterval(timer);
  }, []);

  // Ensure cursorPosition stays within valid bounds [0, expression.length]
  useEffect(() => {
    setCursorPosition((prev) => {
      if (prev < 0) return 0;
      if (prev > expression.length) return expression.length;
      return prev;
    });
  }, [expression]);

  // Load / Persist local storage history
  const [localHistory, setLocalHistory] = useState<CalcHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('calculator_hub_calc_history');
      return saved ? JSON.parse(saved) : history;
    } catch {
      return history;
    }
  });

  // Sync local history with props
  useEffect(() => {
    if (history.length > 0) {
      setLocalHistory(history);
    }
  }, [history]);

  // Auto-scroll history tape to the bottom when new calculations are added
  useEffect(() => {
    if (historyTapeRef.current) {
      historyTapeRef.current.scrollTop = historyTapeRef.current.scrollHeight;
    }
  }, [localHistory, isEvaluated, expression]);

  // Click outside to close 3-dots menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false);
      }
    };
    if (showMenuDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuDropdown]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Scientific math evaluation helper
  const evaluateExpression = (rawExpr: string): number => {
    if (!rawExpr.trim()) return 0;

    let s = rawExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/φ/g, '1.618033988749895')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\bmod\b/g, '%')
      .replace(/\^/g, '**');

    // Handle compound percentage in calculations:
    // e.g. "500 + 10%" -> 500 + (500 * 0.10)
    // e.g. "500 - 10%" -> 500 - (500 * 0.10)
    s = s.replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*%/g, '($1 + ($1 * ($2 / 100)))');
    s = s.replace(/(\d+(?:\.\d+)?)\s*\-\s*(\d+(?:\.\d+)?)\s*%/g, '($1 - ($1 * ($2 / 100)))');
    s = s.replace(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)\s*%/g, '($1 * ($2 / 100))');
    s = s.replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*%/g, '($1 / ($2 / 100))');
    s = s.replace(/%/g, '/100');

    const radFactor = isRad ? 1 : Math.PI / 180;

    const sinFn = (x: number) => Math.sin(x * radFactor);
    const cosFn = (x: number) => Math.cos(x * radFactor);
    const tanFn = (x: number) => Math.tan(x * radFactor);
    const sinhFn = (x: number) => Math.sinh(x);
    const coshFn = (x: number) => Math.cosh(x);
    const tanhFn = (x: number) => Math.tanh(x);
    const asinFn = (x: number) => (isRad ? Math.asin(x) : (Math.asin(x) * 180) / Math.PI);
    const acosFn = (x: number) => (isRad ? Math.acos(x) : (Math.acos(x) * 180) / Math.PI);
    const atanFn = (x: number) => (isRad ? Math.atan(x) : (Math.atan(x) * 180) / Math.PI);
    const logFn = (x: number) => Math.log10(x);
    const lnFn = (x: number) => Math.log(x);
    const sqrtFn = (x: number) => Math.sqrt(x);
    const cbrtFn = (x: number) => Math.cbrt(x);
    const absFn = (x: number) => Math.abs(x);
    const floorFn = (x: number) => Math.floor(x);
    const ceilFn = (x: number) => Math.ceil(x);
    const roundFn = (x: number) => Math.round(x);
    const expFn = (x: number) => Math.exp(x);
    const factFn = (n: number) => {
      if (n < 0 || !Number.isInteger(n)) return NaN;
      if (n === 0 || n === 1) return 1;
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    };

    s = s
      .replace(/sinh\(/g, 'sinhFn(')
      .replace(/cosh\(/g, 'coshFn(')
      .replace(/tanh\(/g, 'tanhFn(')
      .replace(/asin\(/g, 'asinFn(')
      .replace(/acos\(/g, 'acosFn(')
      .replace(/atan\(/g, 'atanFn(')
      .replace(/sin\(/g, 'sinFn(')
      .replace(/cos\(/g, 'cosFn(')
      .replace(/tan\(/g, 'tanFn(')
      .replace(/log\(/g, 'logFn(')
      .replace(/ln\(/g, 'lnFn(')
      .replace(/sqrt\(/g, 'sqrtFn(')
      .replace(/cbrt\(/g, 'cbrtFn(')
      .replace(/abs\(/g, 'absFn(')
      .replace(/fact\(/g, 'factFn(')
      .replace(/floor\(/g, 'floorFn(')
      .replace(/ceil\(/g, 'ceilFn(')
      .replace(/round\(/g, 'roundFn(')
      .replace(/exp\(/g, 'expFn(');

    const fn = new Function(
      'sinFn',
      'cosFn',
      'tanFn',
      'sinhFn',
      'coshFn',
      'tanhFn',
      'asinFn',
      'acosFn',
      'atanFn',
      'logFn',
      'lnFn',
      'sqrtFn',
      'cbrtFn',
      'absFn',
      'floorFn',
      'ceilFn',
      'roundFn',
      'expFn',
      'factFn',
      `"use strict"; return (${s});`
    );

    return fn(
      sinFn,
      cosFn,
      tanFn,
      sinhFn,
      coshFn,
      tanhFn,
      asinFn,
      acosFn,
      atanFn,
      logFn,
      lnFn,
      sqrtFn,
      cbrtFn,
      absFn,
      floorFn,
      ceilFn,
      roundFn,
      expFn,
      factFn
    );
  };

  // Fast number and expression formatting with thousands separators (commas)
  const formatExpressionDisplay = (expr: string): string => {
    if (!expr || expr === '0') return '0';
    if (expr === 'Error') return 'Error';

    // Format consecutive digits with standard commas
    return expr.replace(/\b\d+(\.\d*)?/g, (match) => {
      const parts = match.split('.');
      const formattedInt = Number(parts[0]).toLocaleString('en-US');
      return parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
    });
  };

  const formatResultDisplay = (val: string | number): string => {
    if (val === null || val === undefined || val === '') return '0';
    const str = String(val);
    if (str === 'Error' || isNaN(Number(str))) return str;
    const parts = str.split('.');
    try {
      const intPart = Number(parts[0]).toLocaleString('en-US');
      return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
    } catch {
      return str;
    }
  };

  // Dynamic Font Size Scaling
  const getFontSizeClass = (formattedText: string, isScientific: boolean) => {
    const len = formattedText.length;
    if (isScientific) {
      if (len <= 8) return 'text-3xl sm:text-4xl';
      if (len <= 14) return 'text-2xl sm:text-3xl';
      if (len <= 22) return 'text-xl sm:text-2xl';
      if (len <= 32) return 'text-lg sm:text-xl';
      return 'text-base sm:text-lg';
    }

    if (len <= 5) return 'text-5xl sm:text-6xl';
    if (len <= 9) return 'text-4xl sm:text-5xl';
    if (len <= 14) return 'text-3xl sm:text-4xl';
    if (len <= 20) return 'text-2xl sm:text-3xl';
    if (len <= 28) return 'text-xl sm:text-2xl';
    return 'text-lg sm:text-xl';
  };

  // Compute live preview of the current expression
  const livePreview = useMemo(() => {
    if (!expression || expression === '0' || expression === 'Error' || isEvaluated) {
      return null;
    }

    try {
      let clean = expression.trim().replace(/[+\-×÷\^%]+$/, '');
      if (!clean) return null;

      const openParens = (clean.match(/\(/g) || []).length;
      const closeParens = (clean.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        clean += ')'.repeat(openParens - closeParens);
      }

      const res = evaluateExpression(clean);
      if (isNaN(res) || !isFinite(res)) return null;
      return Number(res.toFixed(8)).toString();
    } catch {
      return null;
    }
  }, [expression, isEvaluated, isRad]);

  // Core Calculator Input Actions with in-place middle editing
  const handleDigit = (digit: string) => {
    triggerTapHaptic(8);
    setVoiceError(null);

    if (isEvaluated) {
      setExpression(digit);
      setCursorPosition(digit.length);
      setLastEquation('');
      setIsEvaluated(false);
    } else {
      if (expression === '0' || expression === 'Error') {
        setExpression(digit);
        setCursorPosition(digit.length);
      } else {
        const before = expression.slice(0, cursorPosition);
        const after = expression.slice(cursorPosition);
        const next = before + digit + after;
        setExpression(next);
        setCursorPosition(cursorPosition + digit.length);
      }
    }
  };

  const handleAppendFunction = (str: string) => {
    triggerTapHaptic(8);
    setVoiceError(null);

    if (isEvaluated) {
      setExpression(str);
      setCursorPosition(str.length);
      setLastEquation('');
      setIsEvaluated(false);
    } else {
      if (expression === '0' || expression === 'Error') {
        setExpression(str);
        setCursorPosition(str.length);
      } else {
        const before = expression.slice(0, cursorPosition);
        const after = expression.slice(cursorPosition);
        const next = before + str + after;
        setExpression(next);
        setCursorPosition(cursorPosition + str.length);
      }
    }
  };

  const handleOperator = (op: string) => {
    triggerTapHaptic(10);
    setVoiceError(null);

    if (expression === 'Error') {
      setExpression('0');
      setCursorPosition(1);
      setLastEquation('');
      setIsEvaluated(false);
      return;
    }

    if (isEvaluated) {
      setIsEvaluated(false);
      setLastEquation('');
      const next = expression + op;
      setExpression(next);
      setCursorPosition(next.length);
      return;
    }

    const before = expression.slice(0, cursorPosition);
    const after = expression.slice(cursorPosition);

    // If cursor is at end and ends with operator, replace operator
    const endsWithOpRegex = /[+\-×÷\^%]$/;
    if (cursorPosition === expression.length && endsWithOpRegex.test(expression.trimEnd())) {
      const next = expression.trimEnd().slice(0, -1) + op;
      setExpression(next);
      setCursorPosition(next.length);
    } else {
      const next = before + op + after;
      setExpression(next);
      setCursorPosition(cursorPosition + op.length);
    }
  };

  const handleClear = () => {
    triggerTapHaptic(12);
    setExpression('0');
    setCursorPosition(1);
    setLastEquation('');
    setIsEvaluated(false);
    setVoiceStatus(null);
    setVoiceError(null);
  };

  const handleDelete = () => {
    triggerTapHaptic(8);
    setVoiceError(null);

    if (isEvaluated || expression === 'Error') {
      // When backspace is pressed right after evaluation, restore the equation to edit its end
      if (lastEquation) {
        const restored = lastEquation.replace(/=$/, '');
        setExpression(restored);
        setCursorPosition(restored.length);
        setIsEvaluated(false);
        setLastEquation('');
        return;
      }
      setExpression('0');
      setCursorPosition(1);
      setIsEvaluated(false);
      setLastEquation('');
      return;
    }

    if (cursorPosition <= 0) {
      return;
    }

    const before = expression.slice(0, cursorPosition - 1);
    const after = expression.slice(cursorPosition);
    const next = before + after;

    if (!next) {
      setExpression('0');
      setCursorPosition(1);
    } else {
      setExpression(next);
      setCursorPosition(cursorPosition - 1);
    }
  };

  const handleEqual = () => {
    triggerTapHaptic(14);
    if (!expression || expression === 'Error') return;

    try {
      let exprToEval = expression.trim().replace(/[+\-×÷\^%]+$/, '');
      if (!exprToEval) return;
      const openParens = (exprToEval.match(/\(/g) || []).length;
      const closeParens = (exprToEval.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        exprToEval += ')'.repeat(openParens - closeParens);
      }

      const result = evaluateExpression(exprToEval);
      if (isNaN(result) || !isFinite(result)) {
        setExpression('Error');
        setCursorPosition(5);
        setIsEvaluated(true);
      } else {
        const formattedResult = Number(result.toFixed(8)).toString();
        const fullEqStr = `${exprToEval}=`;
        setLastEquation(fullEqStr);
        setExpression(formattedResult);
        setCursorPosition(formattedResult.length);
        setIsEvaluated(true);

        const newEntry: CalcHistoryEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          expression: exprToEval,
          result: formattedResult,
        };

        onSaveHistory(newEntry);
        const updatedLoc = [newEntry, ...localHistory].slice(0, 100);
        setLocalHistory(updatedLoc);
        try {
          localStorage.setItem('calculator_hub_calc_history', JSON.stringify(updatedLoc));
        } catch {
          // ignore
        }
      }
    } catch {
      setExpression('Error');
      setCursorPosition(5);
      setIsEvaluated(true);
    }
  };

  // Cursor Navigation Helpers
  const moveCursorLeft = () => {
    triggerTapHaptic(6);
    if (isEvaluated && lastEquation) {
      const restored = lastEquation.replace(/=$/, '');
      setExpression(restored);
      setCursorPosition(Math.max(0, restored.length - 1));
      setIsEvaluated(false);
      return;
    }
    setCursorPosition((prev) => Math.max(0, prev - 1));
  };

  const moveCursorRight = () => {
    triggerTapHaptic(6);
    if (isEvaluated && lastEquation) {
      const restored = lastEquation.replace(/=$/, '');
      setExpression(restored);
      setCursorPosition(restored.length);
      setIsEvaluated(false);
      return;
    }
    setCursorPosition((prev) => Math.min(expression.length, prev + 1));
  };

  // Restores equation when clicking past equation in evaluated mode
  const handleRestoreEquationForEdit = (targetPos?: number) => {
    if (lastEquation) {
      const restored = lastEquation.replace(/=$/, '');
      setExpression(restored);
      setIsEvaluated(false);
      setCursorPosition(targetPos !== undefined ? Math.min(targetPos, restored.length) : restored.length);
    } else {
      setIsEvaluated(false);
      setCursorPosition(targetPos !== undefined ? Math.min(targetPos, expression.length) : expression.length);
    }
  };

  // Memory Operations
  const getCurrentValue = (): number => {
    try {
      const res = evaluateExpression(expression);
      return isNaN(res) || !isFinite(res) ? 0 : res;
    } catch {
      return 0;
    }
  };

  const handleMemoryClear = () => {
    triggerTapHaptic(8);
    setMemoryValue(0);
  };
  const handleMemoryRecall = () => {
    triggerTapHaptic(8);
    handleDigit(memoryValue.toString());
  };
  const handleMemoryAdd = () => {
    triggerTapHaptic(8);
    const val = getCurrentValue();
    setMemoryValue((prev) => prev + val);
  };
  const handleMemorySubtract = () => {
    triggerTapHaptic(8);
    const val = getCurrentValue();
    setMemoryValue((prev) => prev - val);
  };
  const handleMemoryStore = () => {
    triggerTapHaptic(8);
    const val = getCurrentValue();
    setMemoryValue(val);
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT'
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDigit('.');
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '^') {
        e.preventDefault();
        handleOperator('^');
      } else if (e.key === '%') {
        e.preventDefault();
        handleOperator('%');
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        handleAppendFunction(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveCursorLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveCursorRight();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCursorPosition(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCursorPosition(expression.length);
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, isEvaluated, cursorPosition, lastEquation]);

  // Voice Command Execution with voiceMathParser
  const executeVoiceCalculation = (transcript: string) => {
    const parsed = parseVoiceToMath(transcript);

    if (parsed.isClearCommand) {
      handleClear();
      setVoiceStatus('Cleared calculator via voice command');
      return;
    }

    if (!parsed.mathExpression) {
      setVoiceError(`Could not detect math from: "${transcript}". Try e.g. "50 plus 20" or "sub 15 from 100"`);
      return;
    }

    try {
      const result = evaluateExpression(parsed.mathExpression);
      if (isNaN(result) || !isFinite(result)) {
        setVoiceError(`Could not evaluate: "${parsed.displayExpression}"`);
      } else {
        const formattedResult = Number(result.toFixed(8)).toString();
        setLastEquation(`${parsed.displayExpression} =`);
        setExpression(formattedResult);
        setIsEvaluated(true);
        setVoiceStatus(`Voice: "${transcript}" ➔ = ${formattedResult}`);

        const newEntry: CalcHistoryEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          expression: parsed.displayExpression,
          result: formattedResult,
        };
        onSaveHistory(newEntry);
        const updatedLoc = [newEntry, ...localHistory].slice(0, 100);
        setLocalHistory(updatedLoc);
        try {
          localStorage.setItem('calculator_hub_calc_history', JSON.stringify(updatedLoc));
        } catch {
          // ignore
        }
      }
    } catch {
      setVoiceError(`Error computing voice calculation: "${transcript}"`);
    }
  };

  const toggleVoiceRecognition = () => {
    triggerTapHaptic(12);
    setVoiceError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser. Use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setVoiceStatus(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('Listening... Speak: "50 plus 20", "18% GST on 5000", "sub 25 from 100", "5 lakh + 2 lakh"');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');

        if (event.results[0].isFinal) {
          setIsListening(false);
          executeVoiceCalculation(transcript);
        } else {
          const parsed = parseVoiceToMath(transcript);
          if (parsed.displayExpression) setExpression(parsed.displayExpression);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission blocked. Please allow mic in browser settings.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Tap Voice and speak clearly.');
        } else {
          setVoiceError(`Voice notice: ${event.error}.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError('Could not start microphone. Check browser permissions.');
    }
  };

  const handleUseHistoryItem = (item: CalcHistoryEntry) => {
    setExpression(item.result);
    setLastEquation(`${item.expression} =`);
    setIsEvaluated(true);
    setShowHistoryView(false);
  };

  const handleDeleteHistoryEntries = (ids: string[]) => {
    const next = localHistory.filter((h) => !ids.includes(h.id));
    setLocalHistory(next);
    try {
      localStorage.setItem('calculator_hub_calc_history', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`w-full mx-auto text-white flex flex-col justify-between h-full max-h-full overflow-hidden select-none ${
        mode === 'scientific' ? 'max-w-3xl' : 'max-w-md sm:max-w-lg'
      }`}
    >
      {/* FULL SCREEN HISTORY VIEW MODAL (Matching Video) */}
      {showHistoryView && (
        <CalculatorHistoryView
          history={localHistory}
          onBack={() => setShowHistoryView(false)}
          onSelectEntry={handleUseHistoryItem}
          onDeleteEntries={handleDeleteHistoryEntries}
          onClearAll={() => {
            onClearHistory();
            setLocalHistory([]);
            try {
              localStorage.removeItem('calculator_hub_calc_history');
            } catch {
              // ignore
            }
          }}
        />
      )}

      {/* TOP HEADER CONTROLS */}
      <div className="flex-none pt-1 pb-1 flex flex-col space-y-1">
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Mode Switcher & Converter Shortcut */}
          <div className="flex items-center space-x-1 bg-black/60 dark:bg-black/80 p-1 rounded-2xl border border-gray-800 shadow-inner">
            <button
              onClick={() => {
                triggerTapHaptic(8);
                setMode('standard');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-transform duration-75 active:scale-95 cursor-pointer touch-manipulation ${
                mode === 'standard'
                  ? 'bg-orange-500 dark:bg-emerald-500 text-white dark:text-black shadow-md shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CalcIcon className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>
            <button
              onClick={() => {
                triggerTapHaptic(8);
                setMode('scientific');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-transform duration-75 active:scale-95 cursor-pointer touch-manipulation ${
                mode === 'scientific'
                  ? 'bg-orange-500 dark:bg-emerald-500 text-white dark:text-black shadow-md shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>Scientific</span>
            </button>
          </div>

          {/* Voice, RAD/DEG, History & 3-Dots Menu */}
          <div className="flex items-center space-x-1.5">
            {memoryValue !== 0 && (
              <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40 px-1.5 py-1 rounded-lg">
                M
              </span>
            )}

            {/* Voice Command Button */}
            <button
              onClick={toggleVoiceRecognition}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-transform duration-75 active:scale-95 cursor-pointer touch-manipulation shadow-sm ${
                isListening
                  ? 'bg-red-500 text-white border-red-400 animate-pulse'
                  : 'bg-orange-950/40 dark:bg-emerald-950/40 text-orange-400 dark:text-emerald-400 border-orange-500/30 dark:border-emerald-500/30 hover:bg-orange-900/50'
              }`}
              title="Speak math problem"
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-orange-400 dark:text-emerald-400" />
              )}
              <span className="hidden xs:inline">{isListening ? 'Listening...' : 'Voice'}</span>
            </button>

            {mode === 'scientific' && (
              <button
                onClick={() => {
                  triggerTapHaptic(8);
                  setIsRad(!isRad);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-transform duration-75 active:scale-95 cursor-pointer touch-manipulation shadow-sm ${
                  isRad
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-orange-950/40 dark:bg-emerald-950/40 text-orange-400 dark:text-emerald-400 border-orange-500/30 dark:border-emerald-500/30'
                }`}
                title="Angle Unit: RAD / DEG"
              >
                {isRad ? 'RAD' : 'DEG'}
              </button>
            )}

            {/* 3-Dots Context Menu (Matching Video Header) */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  triggerTapHaptic(8);
                  setShowMenuDropdown(!showMenuDropdown);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 transition-colors cursor-pointer touch-manipulation"
                title="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenuDropdown && (
                <div className="absolute right-0 top-10 z-50 w-44 bg-[#18181b] border border-gray-800 rounded-2xl p-1.5 shadow-2xl space-y-1 animate-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      triggerTapHaptic(8);
                      setShowMenuDropdown(false);
                      setShowHistoryView(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-colors text-left cursor-pointer touch-manipulation"
                  >
                    <History className="w-4 h-4 text-orange-400" />
                    <span>History</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerTapHaptic(8);
                      setShowMenuDropdown(false);
                      setShowVoiceHelp(!showVoiceHelp);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-colors text-left cursor-pointer touch-manipulation"
                  >
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span>Voice Examples</span>
                  </button>

                  <a
                    href="/Smart_Calculator_Complete_Code.pdf"
                    download="Smart_Calculator_Complete_Code.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerTapHaptic(10);
                      setShowMenuDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors text-left cursor-pointer touch-manipulation"
                  >
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Download Code PDF</span>
                  </a>

                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        triggerTapHaptic(8);
                        setShowMenuDropdown(false);
                        onNavigateTab('settings');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:bg-gray-800 hover:text-white transition-colors text-left cursor-pointer touch-manipulation"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Settings</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voice Status / Error Banner */}
        {(voiceStatus || voiceError) && (
          <div className="text-xs pt-0.5">
            {voiceStatus && (
              <div className="bg-orange-950/80 border border-orange-800/80 text-orange-300 px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span className="truncate">{voiceStatus}</span>
              </div>
            )}
            {voiceError && (
              <div className="bg-red-950/80 border border-red-800/80 text-red-300 px-3 py-1.5 rounded-xl flex items-center space-x-2 shadow-md">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="truncate">{voiceError}</span>
              </div>
            )}
          </div>
        )}

        {/* Interactive Spoken Math Examples Chips */}
        {showVoiceHelp && (
          <div className="bg-[#121215] border border-gray-800 p-2.5 rounded-2xl space-y-1.5 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
              <span>Tap to try complex voice math:</span>
              <button
                onClick={() => setShowVoiceHelp(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                '5000 plus 18 percentage',
                'sub 250 from 1000',
                '80 multiple by 15',
                '2500 div 4',
                '5 lakh + 2.5 lakh',
                '15% of 8400',
                'square root of 625',
                '2 power 10',
              ].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => {
                    executeVoiceCalculation(phrase);
                    setShowVoiceHelp(false);
                  }}
                  className="px-2 py-1 bg-gray-900 hover:bg-orange-950/60 border border-gray-800 hover:border-orange-500/40 text-gray-300 hover:text-orange-400 rounded-lg text-[10px] font-mono transition-colors cursor-pointer"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CALCULATION TAPE & DISPLAY AREA (Exact Match with Screen Recording) */}
      <div
        ref={displayContainerRef}
        className="flex-1 min-h-0 flex flex-col justify-end overflow-hidden px-2 py-2 select-none"
      >
        {/* Past History Scroll Tape (Shown above the active line like in video) */}
        <div
          ref={historyTapeRef}
          className="overflow-y-auto space-y-1.5 max-h-[130px] sm:max-h-[180px] pr-1 scroll-smooth"
        >
          {localHistory.slice(0, 6).reverse().map((entry, idx) => (
            <div
              key={entry.id || idx}
              onClick={() => {
                triggerTapHaptic(8);
                // Load formula directly into editor for instant middle editing!
                setExpression(entry.expression);
                setCursorPosition(entry.expression.length);
                setIsEvaluated(false);
                setLastEquation(`${entry.expression}=`);
              }}
              className="group text-right text-gray-500 hover:text-orange-400 dark:hover:text-emerald-400 transition-colors font-mono text-sm sm:text-base cursor-pointer truncate flex items-center justify-end space-x-1.5"
              title="Tap to load & edit this formula"
            >
              <span className="group-hover:underline underline-offset-2">{entry.expression}</span>
              <span className="text-gray-600">=</span>
              <span className="text-gray-400 font-semibold">{formatResultDisplay(entry.result)}</span>
            </div>
          ))}
        </div>

        {/* Active Expression & Live Result Preview */}
        <div className="pt-2">
          {isEvaluated ? (
            <div className="space-y-1">
              {lastEquation && (
                <div
                  className="text-gray-400 hover:text-orange-300 dark:hover:text-emerald-300 text-sm sm:text-base font-mono text-right truncate cursor-pointer transition-colors flex items-center justify-end group py-0.5"
                  title="Tap to edit formula in middle"
                  onClick={() => handleRestoreEquationForEdit()}
                >
                  <span className="text-[10px] text-gray-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    tap to edit
                  </span>
                  <div className="inline-flex items-center">
                    {lastEquation.replace(/=$/, '').split('').map((char, cIdx) => (
                      <span
                        key={cIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerTapHaptic(6);
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const targetIdx = clickX < rect.width / 2 ? cIdx : cIdx + 1;
                          handleRestoreEquationForEdit(targetIdx);
                        }}
                        className="hover:bg-white/10 active:bg-orange-500/30 rounded px-[1px] py-0.5 cursor-text"
                      >
                        {char}
                      </span>
                    ))}
                    <span className="text-gray-500 ml-1">=</span>
                  </div>
                </div>
              )}
              <div
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleRestoreEquationForEdit()}
                title="Tap to edit"
              >
                <span className="text-gray-400 font-mono text-2xl sm:text-3xl font-light mr-2">=</span>
                <div
                  className={`${getFontSizeClass(
                    formatResultDisplay(expression),
                    mode === 'scientific'
                  )} font-black font-mono text-white text-right tracking-tight break-all leading-tight`}
                >
                  {formatResultDisplay(expression)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Interactive In-Place Editable Formula with Blinking Cursor */}
              <div
                className={`${getFontSizeClass(
                  expression,
                  mode === 'scientific'
                )} font-black font-mono text-white text-right tracking-tight break-all leading-tight min-h-[44px] flex items-center justify-end overflow-x-auto overflow-y-hidden cursor-text py-1 touch-manipulation`}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setCursorPosition(expression.length);
                    setCursorBlink(true);
                  }
                }}
              >
                <div className="inline-flex items-center justify-end flex-wrap leading-tight">
                  {expression.split('').map((char, index) => {
                    const isCursorHere = cursorPosition === index;
                    return (
                      <React.Fragment key={index}>
                        {isCursorHere && (
                          <span
                            className={`inline-block w-[3px] h-[1.15em] bg-orange-500 dark:bg-emerald-400 align-middle rounded-full mx-[0.5px] shadow-[0_0_10px_rgba(249,115,22,0.9)] ${
                              cursorBlink ? 'opacity-100' : 'opacity-0'
                            } transition-opacity duration-75`}
                          />
                        )}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerTapHaptic(6);
                            setCursorBlink(true);
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            if (clickX < rect.width / 2) {
                              setCursorPosition(index);
                            } else {
                              setCursorPosition(index + 1);
                            }
                          }}
                          onTouchStart={() => {
                            setCursorBlink(true);
                          }}
                          className="hover:bg-white/15 active:bg-orange-500/30 rounded px-[2px] py-1 cursor-pointer transition-colors select-none"
                        >
                          {char}
                        </span>
                      </React.Fragment>
                    );
                  })}
                  {cursorPosition >= expression.length && (
                    <span
                      className={`inline-block w-[3px] h-[1.15em] bg-orange-500 dark:bg-emerald-400 align-middle rounded-full ml-[0.5px] shadow-[0_0_10px_rgba(249,115,22,0.9)] ${
                        cursorBlink ? 'opacity-100' : 'opacity-0'
                      } transition-opacity duration-75`}
                    />
                  )}
                </div>
              </div>

              {/* Real-time Evaluated Preview Line */}
              <div className="text-gray-400 text-sm sm:text-base font-mono min-h-[26px] flex items-center justify-end">
                {livePreview !== null ? (
                  <span>
                    <span className="text-gray-500 mr-1.5">=</span>
                    <span className="text-gray-300 font-bold">{formatResultDisplay(livePreview)}</span>
                  </span>
                ) : (
                  expression !== '0' && (
                    <span>
                      <span className="text-gray-500 mr-1.5">=</span>
                      <span className="text-gray-300 font-bold">{formatResultDisplay(expression)}</span>
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KEYPADS CONTAINER */}
      <div className={`flex-none space-y-2 pb-1 ${mode === 'scientific' ? 'pt-1' : 'pt-2'}`}>
        {/* SCIENTIFIC FUNCTION & MEMORY BAR */}
        {mode === 'scientific' && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            {/* Memory Bar */}
            <div className="grid grid-cols-5 gap-1 bg-gray-950/60 p-1 rounded-xl border border-gray-800 text-[11px] font-bold font-mono">
              <button
                onClick={handleMemoryClear}
                className="py-1 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                MC
              </button>
              <button
                onClick={handleMemoryRecall}
                className="py-1 bg-gray-900 hover:bg-gray-800 text-orange-400 rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                MR
              </button>
              <button
                onClick={handleMemoryAdd}
                className="py-1 bg-gray-900 hover:bg-gray-800 text-orange-400 rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                M+
              </button>
              <button
                onClick={handleMemorySubtract}
                className="py-1 bg-gray-900 hover:bg-gray-800 text-orange-400 rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                M-
              </button>
              <button
                onClick={handleMemoryStore}
                className="py-1 bg-gray-900 hover:bg-gray-800 text-amber-400 rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                MS
              </button>
            </div>

            {/* Scientific Function Grid */}
            <div className="grid grid-cols-6 gap-1 bg-gray-950/80 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => handleAppendFunction('sin(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                sin
              </button>
              <button
                onClick={() => handleAppendFunction('cos(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                cos
              </button>
              <button
                onClick={() => handleAppendFunction('tan(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                tan
              </button>
              <button
                onClick={() => handleAppendFunction('asin(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                sin⁻¹
              </button>
              <button
                onClick={() => handleAppendFunction('acos(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                cos⁻¹
              </button>
              <button
                onClick={() => handleAppendFunction('atan(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                tan⁻¹
              </button>

              <button
                onClick={() => handleAppendFunction('sqrt(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-blue-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                √x
              </button>
              <button
                onClick={() => handleAppendFunction('cbrt(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-blue-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                ∛x
              </button>
              <button
                onClick={() => handleOperator('^2')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-blue-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                x²
              </button>
              <button
                onClick={() => handleOperator('^')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-blue-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                xʸ
              </button>
              <button
                onClick={() => handleAppendFunction('log(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-purple-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                log
              </button>
              <button
                onClick={() => handleAppendFunction('ln(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-purple-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                ln
              </button>

              <button
                onClick={() => handleDigit('π')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-emerald-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                π
              </button>
              <button
                onClick={() => handleDigit('e')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-emerald-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                e
              </button>
              <button
                onClick={() => handleAppendFunction('fact(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-purple-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                n!
              </button>
              <button
                onClick={() => handleAppendFunction('(')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                (
              </button>
              <button
                onClick={() => handleAppendFunction(')')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                )
              </button>
              <button
                onClick={() => handleOperator('mod')}
                className="h-8 bg-gray-900 hover:bg-gray-800 text-indigo-400 font-bold text-xs rounded-lg border border-gray-800 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95"
              >
                mod
              </button>
            </div>
          </div>
        )}

        {/* PRIMARY NUMERIC & OPERATOR KEYPAD (Exact Match with Screen Recording) */}
        <div className={`grid grid-cols-4 ${mode === 'scientific' ? 'gap-1.5 sm:gap-2' : 'gap-2.5 sm:gap-3.5'}`}>
          {/* Row 1: C/AC, Backspace, %, ÷ */}
          <button
            onClick={handleClear}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-lg sm:text-xl' : 'h-13 sm:h-16 text-xl sm:text-2xl'
            } bg-gray-900 hover:bg-gray-800 text-red-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            {expression === '0' ? 'AC' : 'C'}
          </button>
          <button
            onClick={handleDelete}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-lg sm:text-xl' : 'h-13 sm:h-16 text-xl sm:text-2xl'
            } bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
            title="Backspace"
          >
            <Delete className={mode === 'scientific' ? 'w-4 h-4' : 'w-6 h-6'} />
          </button>
          <button
            onClick={() => handleOperator('%')}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-lg sm:text-xl' : 'h-13 sm:h-16 text-xl sm:text-2xl'
            } bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-xl sm:text-2xl' : 'h-13 sm:h-16 text-2xl sm:text-3xl'
            } bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            ÷
          </button>

          {/* Row 2: 7, 8, 9, × */}
          {['7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className={`${
                mode === 'scientific' ? 'h-9 sm:h-11 text-base sm:text-lg' : 'h-13 sm:h-16 text-xl sm:text-2xl'
              } bg-gray-900/90 hover:bg-gray-800 text-white font-medium rounded-2xl flex items-center justify-center border border-gray-800/60 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('×')}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-xl sm:text-2xl' : 'h-13 sm:h-16 text-2xl sm:text-3xl'
            } bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            ×
          </button>

          {/* Row 3: 4, 5, 6, - */}
          {['4', '5', '6'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className={`${
                mode === 'scientific' ? 'h-9 sm:h-11 text-base sm:text-lg' : 'h-13 sm:h-16 text-xl sm:text-2xl'
              } bg-gray-900/90 hover:bg-gray-800 text-white font-medium rounded-2xl flex items-center justify-center border border-gray-800/60 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('-')}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-xl sm:text-2xl' : 'h-13 sm:h-16 text-2xl sm:text-3xl'
            } bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            -
          </button>

          {/* Row 4: 1, 2, 3, + */}
          {['1', '2', '3'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className={`${
                mode === 'scientific' ? 'h-9 sm:h-11 text-base sm:text-lg' : 'h-13 sm:h-16 text-xl sm:text-2xl'
              } bg-gray-900/90 hover:bg-gray-800 text-white font-medium rounded-2xl flex items-center justify-center border border-gray-800/60 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('+')}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-xl sm:text-2xl' : 'h-13 sm:h-16 text-2xl sm:text-3xl'
            } bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            +
          </button>

          {/* Row 5: Scientific Toggle / Converter, 0, ., = */}
          <button
            onClick={() => {
              triggerTapHaptic(8);
              setMode(mode === 'standard' ? 'scientific' : 'standard');
            }}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-sm' : 'h-13 sm:h-16 text-base'
            } bg-gray-900 hover:bg-gray-800 text-orange-400 font-bold rounded-2xl flex items-center justify-center border border-gray-800/80 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
            title={mode === 'standard' ? 'Switch to Scientific' : 'Switch to Standard'}
          >
            {mode === 'standard' ? <Binary className="w-5 h-5" /> : <CalcIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => handleDigit('0')}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-base sm:text-lg' : 'h-13 sm:h-16 text-xl sm:text-2xl'
            } bg-gray-900/90 hover:bg-gray-800 text-white font-medium rounded-2xl flex items-center justify-center border border-gray-800/60 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            0
          </button>
          <button
            onClick={() => handleDigit('.')}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-base sm:text-lg' : 'h-13 sm:h-16 text-xl sm:text-2xl'
            } bg-gray-900/90 hover:bg-gray-800 text-white font-medium rounded-2xl flex items-center justify-center border border-gray-800/60 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            .
          </button>
          <button
            onClick={handleEqual}
            className={`${
              mode === 'scientific' ? 'h-9 sm:h-11 text-xl sm:text-2xl' : 'h-13 sm:h-16 text-2xl sm:text-3xl'
            } bg-orange-500 hover:bg-orange-400 text-white font-extrabold rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 cursor-pointer touch-manipulation transition-transform duration-75 active:scale-95`}
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
};
