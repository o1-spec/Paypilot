import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 bg-slate-100 rounded" />
          <div className="h-9 w-9 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-7 w-36 bg-slate-100 rounded" />
          <div className="h-3 w-48 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">{title}</span>
        <div className="rounded-xl bg-slate-50 p-2.5 text-slate-500 border border-slate-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
          {trend && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
        {description && (
          <span className="block text-xs text-slate-400 font-medium mt-1.5 leading-normal">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
