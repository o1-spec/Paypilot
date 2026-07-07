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
    <div className="rounded-2xl border border-dashed border-[#E5E2DC] bg-[#FAFAF8] p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-8 shadow-sm">
      <div className="rounded-2xl bg-[#F0EDE8] p-4 text-[#94A3B8] border border-[#E5E2DC]">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">{title}</h3>
        <p className="text-xs text-[#64748B] max-w-sm leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white py-2.5 px-5 shadow-sm transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
