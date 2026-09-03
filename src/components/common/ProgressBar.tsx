import React from 'react';

export interface ProgressBarProps {
  percent: number; // 0 to 100
  statusText?: string;
  color?: 'brand' | 'emerald' | 'blue';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  statusText,
  color = 'brand',
  animated = false,
}) => {
  const boundedPercent = Math.min(100, Math.max(0, percent));

  const colorClasses = {
    brand: 'bg-gradient-to-r from-rose-500 to-rose-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
  };

  return (
    <div className="w-full space-y-1.5">
      {statusText && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="truncate">{statusText}</span>
          <span>{Math.round(boundedPercent)}%</span>
        </div>
      )}
      <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]} ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${boundedPercent}%` }}
        />
      </div>
    </div>
  );
};
