import React from 'react';

type StatusType = 
  | 'PENDING' 
  | 'PARTIAL' 
  | 'PAID' 
  | 'OVERPAID' 
  | 'CANCELLED' 
  | 'MATCHED' 
  | 'UNMATCHED' 
  | 'REVIEW' 
  | 'ACTIVE' 
  | 'INERT'
  | 'SYSTEM'
  | 'INVOICE_PAID'
  | 'PARTIAL_PAYMENT'
  | 'PAYMENT_RECEIVED'
  | 'UNMATCHED_PAYMENT';

interface StatusBadgeProps {
  status: StatusType | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  const config: Record<string, { label: string; classes: string }> = {
    PENDING: {
      label: 'Pending',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    PARTIAL: {
      label: 'Partial',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    PAID: {
      label: 'Paid',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    OVERPAID: {
      label: 'Overpaid',
      classes: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    CANCELLED: {
      label: 'Cancelled',
      classes: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    MATCHED: {
      label: 'Reconciled',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    UNMATCHED: {
      label: 'Unmatched',
      classes: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
    },
    REVIEW: {
      label: 'In Review',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    ACTIVE: {
      label: 'Active',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    INERT: {
      label: 'Inactive',
      classes: 'bg-slate-100 text-slate-500 border-slate-200',
    },
    SYSTEM: {
      label: 'System',
      classes: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    INVOICE_PAID: {
      label: 'Invoice Paid',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    PARTIAL_PAYMENT: {
      label: 'Partial Payment',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    PAYMENT_RECEIVED: {
      label: 'Payment Received',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    UNMATCHED_PAYMENT: {
      label: 'Unmatched Payment',
      classes: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
    },
  };

  const current = config[normalized] || {
    label: status,
    classes: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${current.classes}`}
    >
      {current.label}
    </span>
  );
}
