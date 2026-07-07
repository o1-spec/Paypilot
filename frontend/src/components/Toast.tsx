'use client';

import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────── */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number; // ms, default 4000
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

/* ─── Context ────────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ─── Individual Toast Item ─────────────────────────────────────── */
const VARIANTS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-white border-emerald-200',
    icon_color: 'text-emerald-500',
    bar: 'bg-emerald-400',
    label: 'bg-emerald-50 text-emerald-700',
  },
  error: {
    icon: XCircle,
    bg: 'bg-white border-rose-200',
    icon_color: 'text-rose-500',
    bar: 'bg-rose-400',
    label: 'bg-rose-50 text-rose-700',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-white border-amber-200',
    icon_color: 'text-amber-500',
    bar: 'bg-amber-400',
    label: 'bg-amber-50 text-amber-700',
  },
  info: {
    icon: Info,
    bg: 'bg-white border-slate-200',
    icon_color: 'text-slate-500',
    bar: 'bg-slate-400',
    label: 'bg-slate-50 text-slate-600',
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const v = VARIANTS[toast.variant];
  const Icon = v.icon;
  const duration = toast.duration ?? 4000;

  // animate out then remove
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dismiss, duration]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        animation: exiting
          ? 'toast-out 0.3s cubic-bezier(0.22,1,0.36,1) forwards'
          : 'toast-in 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
      }}
      className={`relative flex w-full max-w-sm overflow-hidden rounded-2xl border shadow-lg shadow-neutral-900/8 ${v.bg}`}
    >
      {/* progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${v.bar} rounded-full`}
        style={{
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />

      <div className="flex items-start gap-3 px-4 py-3.5 w-full">
        <div className={`mt-0.5 shrink-0 ${v.icon_color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="flex-1 text-[11px] font-semibold text-[#0F172A] leading-normal">
          {toast.message}
        </p>
        <button
          onClick={dismiss}
          className="mt-0.5 shrink-0 text-[#94A3B8] hover:text-[#64748B] transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Provider ───────────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    []
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast portal */}
      <div
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2.5 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
