import React from 'react';
import { Sliders, Flame } from 'lucide-react';
import { InfoTooltip, getTooltipForLabel } from './InfoTooltip';
import { triggerSliderHaptic, triggerTapHaptic } from '../utils/haptics';

export type ThemeColorName =
  | 'emerald'
  | 'cyan'
  | 'pink'
  | 'teal'
  | 'amber'
  | 'blue'
  | 'orange'
  | 'rose'
  | 'indigo'
  | 'red'
  | 'violet'
  | 'yellow';

const themeColorStyles: Record<
  ThemeColorName,
  { focusBorder: string; text: string; accent: string }
> = {
  emerald: {
    focusBorder: 'focus-within:border-orange-500',
    text: 'text-orange-400',
    accent: 'accent-orange-500 hover:accent-orange-400',
  },
  cyan: {
    focusBorder: 'focus-within:border-cyan-500',
    text: 'text-cyan-400',
    accent: 'accent-cyan-500 hover:accent-cyan-400',
  },
  pink: {
    focusBorder: 'focus-within:border-pink-500',
    text: 'text-pink-400',
    accent: 'accent-pink-500 hover:accent-pink-400',
  },
  teal: {
    focusBorder: 'focus-within:border-teal-500',
    text: 'text-teal-400',
    accent: 'accent-teal-500 hover:accent-teal-400',
  },
  amber: {
    focusBorder: 'focus-within:border-amber-500',
    text: 'text-amber-400',
    accent: 'accent-amber-500 hover:accent-amber-400',
  },
  blue: {
    focusBorder: 'focus-within:border-blue-500',
    text: 'text-blue-400',
    accent: 'accent-blue-500 hover:accent-blue-400',
  },
  orange: {
    focusBorder: 'focus-within:border-orange-500',
    text: 'text-orange-400',
    accent: 'accent-orange-500 hover:accent-orange-400',
  },
  rose: {
    focusBorder: 'focus-within:border-rose-500',
    text: 'text-rose-400',
    accent: 'accent-rose-500 hover:accent-rose-400',
  },
  indigo: {
    focusBorder: 'focus-within:border-indigo-500',
    text: 'text-indigo-400',
    accent: 'accent-indigo-500 hover:accent-indigo-400',
  },
  red: {
    focusBorder: 'focus-within:border-red-500',
    text: 'text-red-400',
    accent: 'accent-red-500 hover:accent-red-400',
  },
  violet: {
    focusBorder: 'focus-within:border-violet-500',
    text: 'text-violet-400',
    accent: 'accent-violet-500 hover:accent-violet-400',
  },
  yellow: {
    focusBorder: 'focus-within:border-yellow-500',
    text: 'text-yellow-400',
    accent: 'accent-yellow-500 hover:accent-yellow-400',
  },
};

interface NumberSliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  prefix?: string;
  onChange: (val: number) => void;
  subtext?: string;
  tooltipText?: string;
  themeColor?: ThemeColorName;
}

export const NumberSliderInput: React.FC<NumberSliderInputProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  prefix = '',
  onChange,
  subtext,
  tooltipText,
  themeColor = 'orange',
}) => {
  const [localText, setLocalText] = React.useState<string>(String(value));
  const [isEditing, setIsEditing] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isEditing) {
      setLocalText(String(value));
    }
  }, [value, isEditing]);

  const autoTooltip = tooltipText || getTooltipForLabel(label);
  const theme = themeColorStyles[themeColor] || themeColorStyles.emerald;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Allow empty string while user is actively typing
    if (raw === '') {
      setLocalText('');
      return;
    }
    // Clean leading zeros if user typed a non-zero digit after 0 (e.g. '05' -> '5')
    if (/^0[0-9]/.test(raw)) {
      raw = raw.replace(/^0+/, '');
    }
    setLocalText(raw);

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(localText);
    if (isNaN(parsed) || localText.trim() === '') {
      const fallback = min <= 0 ? 0 : min;
      setLocalText(String(fallback));
      onChange(fallback);
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      setLocalText(String(clamped));
      onChange(clamped);
    }
  };

  const stepDown = () => {
    triggerTapHaptic();
    const nextVal = Math.max(min, Math.round((value - step) * 100) / 100);
    setLocalText(String(nextVal));
    onChange(nextVal);
  };

  const stepUp = () => {
    triggerTapHaptic();
    const nextVal = Math.min(max, Math.round((value + step) * 100) / 100);
    setLocalText(String(nextVal));
    onChange(nextVal);
  };

  return (
    <div className="space-y-2 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80 investment-input-item">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
          <span>{label}</span>
          <InfoTooltip term={label} text={autoTooltip} />
        </label>

        {/* Dual Input: Manual Typing Box */}
        <div className={`flex items-center space-x-1 bg-black border border-gray-700/80 rounded-lg px-2.5 py-1 ${theme.focusBorder} transition-colors`}>
          {prefix && <span className="text-xs text-gray-400 font-mono">{prefix}</span>}
          <input
            type="text"
            inputMode="decimal"
            value={isEditing ? localText : String(value)}
            onFocus={(e) => {
              setIsEditing(true);
              e.target.select();
            }}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className={`w-20 text-right text-xs font-mono font-bold ${theme.text} bg-transparent focus:outline-none`}
          />
          {unit && <span className="text-xs text-gray-400 font-mono ml-0.5">{unit}</span>}
        </div>
      </div>

      {/* Interactive Slider Line + Stepper Controls */}
      <div className="flex items-center space-x-2 pt-0.5">
        <button
          type="button"
          onClick={stepDown}
          className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 font-mono text-sm font-bold flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer shrink-0 touch-none select-none"
          aria-label="Decrease value"
        >
          -
        </button>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={isNaN(value) ? min : value}
          onChange={(e) => {
            triggerSliderHaptic(8, 30);
            const parsedVal = parseFloat(e.target.value);
            const val = isNaN(parsedVal) ? min : parsedVal;
            setLocalText(String(val));
            onChange(val);
          }}
          onInput={() => triggerSliderHaptic(8, 30)}
          style={{ touchAction: 'pan-y' }}
          className={`w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer ${theme.accent} transition-all`}
        />

        <button
          type="button"
          onClick={stepUp}
          className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 font-mono text-sm font-bold flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer shrink-0 touch-none select-none"
          aria-label="Increase value"
        >
          +
        </button>
      </div>

      {subtext && <p className="text-[11px] text-gray-400 tracking-tight">{subtext}</p>}
    </div>
  );
};

interface InflationSectionProps {
  adjustInflation: boolean;
  inflationRate: number;
  onToggleInflation: (val: boolean) => void;
  onChangeInflationRate: (val: number) => void;
}

export const InflationSection: React.FC<InflationSectionProps> = ({
  adjustInflation,
  inflationRate,
  onToggleInflation,
  onChangeInflationRate,
}) => {
  return (
    <div className="bg-amber-950/20 border border-amber-900/40 p-3.5 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-200">Adjust for Annual Inflation</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={adjustInflation}
            onChange={(e) => onToggleInflation(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {adjustInflation && (
        <NumberSliderInput
          label="Expected Annual Inflation Rate"
          value={inflationRate}
          min={1}
          max={15}
          step={0.5}
          unit="%"
          onChange={onChangeInflationRate}
          subtext="Calculates purchasing power discounting future gains back to present value"
        />
      )}
    </div>
  );
};
