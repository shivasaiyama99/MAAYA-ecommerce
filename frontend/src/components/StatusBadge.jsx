import React from 'react';

export const StatusBadge = ({ label, status, isGood }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white/70 shadow-sm">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            isGood ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <span
          className={`text-xs font-semibold capitalize px-2 py-0.5 rounded ${
            isGood
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default StatusBadge;
