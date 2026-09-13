import React from 'react';
import { MetricCardData } from '../types';

interface MetricCardsProps {
  metrics: MetricCardData[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="bg-card-alt p-4 rounded-2xl border border-gray-800/80 flex flex-col justify-between transition hover:border-gray-700 shadow-sm"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {m.label}
            </span>
            {m.badge && (
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {m.badge}
              </span>
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${m.color || 'text-white'}`}>
            {m.value}
          </div>
          {m.subtext && (
            <p className="text-[11px] font-medium text-gray-400 mt-1">{m.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
};
