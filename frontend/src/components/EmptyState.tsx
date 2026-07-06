import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-8">
      <div className="rounded-2xl bg-slate-50 p-4 text-slate-400 border border-slate-100 shadow-inner">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-indigo-600/10 transition-all duration-150"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
