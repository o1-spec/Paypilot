'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, CreditCard, ShieldCheck, RefreshCw, BarChart4, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) return;

    setLoading(true);
    // Simulate a brief authorization network delay
    setTimeout(() => {
      const sessionData = {
        businessName: businessName,
        email: email || 'demo@merchant.com',
        token: 'mock-jwt-token-xyz-123',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('paypilot_demo_session', JSON.stringify(sessionData));
      router.push('/dashboard');
    }, 8000); // 800ms simulation
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-20%] h-[600px] w-[600px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] h-[600px] w-[600px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <Zap className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Pay<span className="text-indigo-500">Pilot</span></span>
            <span className="block text-[9px] font-semibold text-slate-500 tracking-widest uppercase">Nomba Partner</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <span className="hidden sm:inline">Hackathon Track: DRF & Next.js MVP</span>
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          <span className="text-indigo-400">Nomba API Sandbox</span>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-16 z-10 flex-1">
        {/* Left column: Copy */}
        <div className="flex-1 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-900/50 text-xs font-semibold text-indigo-400">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
            DevCareer × Nomba Hackathon MVP
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Automated Virtual Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Reconciliation</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
            Eliminate manual transaction matching. Issue dedicated Wema, Providus, or Nomba Bank virtual accounts to your customers. Whenever a payment arrives, PayPilot automatically identifies the customer, maps the transfer, and marks invoices as paid.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-indigo-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Instant Provisioning</h3>
                <p className="text-xs text-slate-400 mt-1">Generate customer-specific virtual bank details dynamically.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-indigo-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Auto-Reconciliation</h3>
                <p className="text-xs text-slate-400 mt-1">Webhook listener auto-matches payments against pending invoices.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-indigo-400">
                <BarChart4 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Real-time Ledgers</h3>
                <p className="text-xs text-slate-400 mt-1">Track outstanding balances, statements, and unmatched deposits.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">Mock Integration Layer</h3>
                <p className="text-xs text-slate-400 mt-1">Easily switch from mock sandbox responses to real Nomba APIs.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Demo Sign-in */}
        <div className="w-full lg:w-[460px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute top-4 right-4 text-[10px] bg-indigo-900/40 text-indigo-300 px-2.5 py-1 rounded-full font-bold border border-indigo-800/50">
            DEMO
          </div>
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold text-white">Initialize Merchant Sandbox</h2>
            <p className="text-xs text-slate-400">Enter a mock business profile to explore the PayPilot dashboard instantly.</p>
          </div>

          <form onSubmit={handleDemoLogin} className="space-y-5">
            <div>
              <label htmlFor="businessName" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Grace Foods Enterprises"
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm py-3 px-4 outline-none text-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. info@gracefoods.ng"
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm py-3 px-4 outline-none text-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-sm font-semibold py-3.5 px-4 text-white shadow-lg shadow-indigo-600/10 outline-none transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Sandbox Environment...
                </>
              ) : (
                <>
                  Launch PayPilot Demo
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Sandbox seed hint */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block mb-2">Or click to quick-seed:</span>
            <button
              onClick={() => {
                setBusinessName('Nomba Merchant');
                setEmail('merchant@nomba.ng');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              Autofill default sandboxed profile
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} PayPilot. Designed for DevCareer × Nomba Hackathon. Powered by Nomba APIs.
      </footer>
    </div>
  );
}
