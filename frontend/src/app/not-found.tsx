'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft, Zap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans relative">
      {/* Spotlight Gradients */}
      <div className="absolute top-[-10%] left-[-20%] h-[600px] w-[600px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] h-[600px] w-[600px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <Zap className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Pay<span className="text-indigo-500">Pilot</span></span>
            <span className="block text-[9px] font-semibold text-slate-500 tracking-widest uppercase">Nomba Partner</span>
          </div>
        </div>
      </header>

      {/* Main 404 Block */}
      <main className="container mx-auto px-6 py-20 flex flex-col items-center justify-center text-center z-10 flex-grow max-w-md space-y-6 animate-in fade-in duration-300">
        <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-indigo-400 shadow-inner">
          <HelpCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Error 404</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Resource Not Found</h1>
          <p className="text-xs text-slate-450 leading-relaxed font-semibold">
            The page you are looking for does not exist, has been moved, or belongs to another scoped merchant account.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-605 hover:bg-indigo-550 text-xs font-bold text-white py-3 px-6 shadow-md transition-all active:scale-98"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-slate-900/60 z-10 text-center text-[10px] text-slate-500 font-semibold">
        PayPilot Platform &copy; 2026. Scoped multi-tenant ledger verification.
      </footer>
    </div>
  );
}
