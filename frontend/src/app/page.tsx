'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginMerchant, registerMerchant } from '@/lib/api';
import { 
  Zap, 
  CreditCard, 
  ShieldCheck, 
  RefreshCw, 
  BarChart4, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  Lock,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Users
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const router = useRouter();

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration inputs
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusiness, setRegBusiness] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await loginMerchant({
        email: loginEmail,
        password: loginPassword,
      });

      const sessionData = {
        businessName: data.user.business_name,
        email: data.user.email,
        token: data.access,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('paypilot_demo_session', JSON.stringify(sessionData));
      router.push('/dashboard');
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.response?.data?.error || 'Incorrect email or password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await registerMerchant({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        business_name: regBusiness,
        phone: regPhone,
      });

      const sessionData = {
        businessName: data.user.business_name,
        email: data.user.email,
        token: data.access,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('paypilot_demo_session', JSON.stringify(sessionData));
      router.push('/dashboard');
    } catch (e: any) {
      const data = e.response?.data;
      let msg = 'Failed to register merchant.';
      if (data) {
        if (data.email) msg = `Email: ${data.email[0]}`;
        else if (data.username) msg = `Username: ${data.username[0]}`;
        else if (data.detail) msg = data.detail;
        else if (data.error) msg = data.error;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does Dedicated Virtual Account reconciliation work?',
      a: 'PayPilot provisions a persistent, unique bank account number (via Providus/Wema Bank) for each of your customers. When a customer performs a standard bank transfer, our webhook engine receives the credit notification, automatically resolves the customer ID, matches it to their oldest pending invoice, updates their statement ledger, and broadcasts a merchant notification.'
    },
    {
      q: 'Is there a sandbox to test webhook simulations?',
      a: 'Yes, PayPilot features an embedded Judges Sandbox mode. Inside the dashboard, you can trigger mock bank transfer callbacks, witness the visual auto-reconciliation trace, seed test portfolios, and wipe records clean with single-click actions.'
    },
    {
      q: 'Does it support partial payments and overpayments?',
      a: 'Absolutely. If a customer deposits less than the invoice amount, the invoice status changes to PARTIAL and logs the paid sum. If they pay more, the system logs an OVERPAYMENT notification, increments customer balance statement records, and leaves the remaining cash reconciled as customer credits.'
    },
    {
      q: 'Are transactions isolated securely?',
      a: 'Yes, PayPilot is built on a scoped multi-tenant architecture. All database queries, virtual accounts provisioning logs, invoices, and payments are strictly isolated under the authenticated merchant account using JWT tokens.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* Background radial gradient spotlights */}
      <div className="absolute top-[-10%] left-[-20%] h-[700px] w-[700px] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-15%] h-[650px] w-[650px] rounded-full bg-indigo-950/20 blur-[130px] pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-20 relative">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <Zap className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Pay<span className="text-indigo-500">Pilot</span></span>
            <span className="block text-[9px] font-semibold text-slate-500 tracking-widest uppercase">Nomba Partner</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#problem" className="hover:text-white transition-colors">The Problem</a>
            <a href="#solution" className="hover:text-white transition-colors">Our Solution</a>
            <a href="#works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-950 py-2.5 px-4 shadow-md transition-all active:scale-98"
          >
            Access Sandbox
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="container mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center relative z-10 space-y-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-900/50 text-xs font-semibold text-indigo-400">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          YC-Style Automatic Reconciliation Engine
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
          Eliminate Manual Bank Transfer <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-indigo-500 to-purple-400">Reconciliation</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-450 leading-relaxed max-w-2xl mx-auto font-medium">
          Issue persistent, dedicated Providus or Wema Bank virtual accounts to your customers. Whenever cash lands, PayPilot matches the invoice, updates customer ledgers, and fires dashboard alerts instantly.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-550 text-xs font-bold text-white py-3.5 px-6.5 shadow-lg shadow-indigo-600/15 transition-all"
          >
            Open Developer Sandbox
          </button>
          <a
            href="#works"
            className="rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-semibold text-slate-350 py-3.5 px-6.5 transition-all"
          >
            Learn How It Works
          </a>
        </div>
      </section>

      {/* DASHBOARD PREVIEW PANEL */}
      <section className="container mx-auto px-6 pb-24 z-10 relative">
        <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/30 p-4 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-500">
          <div className="rounded-2xl border border-slate-850 bg-slate-950 p-6 space-y-6">
            
            {/* Header toolbar */}
            <div className="flex justify-between items-center border-b border-slate-900 pb-4 text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-200">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Live Demo Dashboard Preview
              </div>
              <span className="text-slate-500">Workspace scoped</span>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-900 bg-slate-900/25 p-4 space-y-1">
                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Total Revenue</span>
                <span className="block text-base font-bold text-white">₦2,850,000.00</span>
                <span className="block text-[9px] text-emerald-500 font-semibold">+15.4% this month</span>
              </div>
              <div className="rounded-xl border border-slate-900 bg-slate-900/25 p-4 space-y-1">
                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Outstanding Balances</span>
                <span className="block text-base font-bold text-amber-500">₦450,000.00</span>
                <span className="block text-[9px] text-slate-500 font-semibold">Across active billing cycles</span>
              </div>
              <div className="rounded-xl border border-slate-900 bg-slate-900/25 p-4 space-y-1">
                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Collection Rate</span>
                <span className="block text-base font-bold text-indigo-400">86.2%</span>
                <span className="block text-[9px] text-indigo-500 font-semibold">Reconciled efficiency rate</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section id="problem" className="container mx-auto px-6 py-20 border-t border-slate-900/80 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">The Friction</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">Manual payment tracking slows growth</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Merchants in Nigeria lose hours daily matching bank transfer credit alerts to invoice PDFs. Inbound transfer description tags are frequently truncated, resulting in identification failure, delayed customer deliveries, and billing audit mismatches.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-2 hover:border-slate-800 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-bold text-xs text-rose-500">1</div>
              <h4 className="font-extrabold text-slate-200 text-sm">Reconciliation Hell</h4>
              <p className="text-xs text-slate-500 leading-normal">Manually checking bank apps and statements to reconcile customer billing accounts is error-prone.</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-2 hover:border-slate-800 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-bold text-xs text-rose-500">2</div>
              <h4 className="font-extrabold text-slate-200 text-sm">Truncated Sender Tags</h4>
              <p className="text-xs text-slate-500 leading-normal">Alert labels like `TRF FROM BAYO` fail to identify which customer or invoice the payment belongs to.</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-2 hover:border-slate-800 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-bold text-xs text-rose-500">3</div>
              <h4 className="font-extrabold text-slate-200 text-sm">Delayed Customer Credit</h4>
              <p className="text-xs text-slate-500 leading-normal">Customers are kept waiting for admin verification before their subscription balances update.</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 space-y-2 hover:border-slate-800 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-bold text-xs text-rose-500">4</div>
              <h4 className="font-extrabold text-slate-200 text-sm">Double Credit Scams</h4>
              <p className="text-xs text-slate-500 leading-normal">Without idempotent webhook logs, duplicate webhook payloads trigger duplicate invoice clearances.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section id="solution" className="container mx-auto px-6 py-20 border-t border-slate-900/80 bg-slate-950/20 z-10 relative">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">The Solution</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Dedicated Virtual Banking Accounts</h2>
          <p className="text-xs text-slate-400 font-semibold">
            PayPilot leverages Wema and Providus bank routing details to assign unique, persistent destination account numbers per customer, linking transfers directly to ledger accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/20 border border-slate-900 p-8 rounded-3xl space-y-4">
            <div className="h-10 w-10 bg-indigo-500/15 rounded-xl border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Persistent Account Provision</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Generate Wema or Providus bank virtual details dynamically on customer profile creation. No expiration limits.
            </p>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 p-8 rounded-3xl space-y-4">
            <div className="h-10 w-10 bg-indigo-500/15 rounded-xl border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Webhook Processing Engine</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Listen to bank transfer notifications. Automate billing status transitions to PAID or PARTIAL on balance settlement.
            </p>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 p-8 rounded-3xl space-y-4">
            <div className="h-10 w-10 bg-indigo-500/15 rounded-xl border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart4 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Real-Time Statement Audits</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Combine invoices, payments, debits, and credits in chronologically calculated statement ledger tables.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="works" className="container mx-auto px-6 py-20 border-t border-slate-900/80 z-10 relative">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">How it works</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Complete ledger loop in three steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-md">1</div>
            <h3 className="font-extrabold text-sm text-slate-200">Issue Account Details</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Create a customer profile to auto-provision dedicated account numbers via the Nomba API.
            </p>
          </div>

          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-650/40 border border-indigo-900 flex items-center justify-center text-indigo-300 font-bold text-sm mx-auto shadow-md">2</div>
            <h3 className="font-extrabold text-sm text-slate-200">Customer Performs Bank Transfer</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Customer deposits funds into the virtual account via standard banking apps or channels.
            </p>
          </div>

          <div className="space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-650/40 border border-indigo-900 flex items-center justify-center text-indigo-300 font-bold text-sm mx-auto shadow-md">3</div>
            <h3 className="font-extrabold text-sm text-slate-200">Auto-Reconciliation Engine Runs</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Webhooks identify the customer, update invoice paid balances, log statement lines, and dispatch notifications.
            </p>
          </div>
        </div>
      </section>

      {/* CORE FEATURES LIST */}
      <section id="features" className="container mx-auto px-6 py-20 border-t border-slate-900/80 bg-slate-950/20 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">Built for enterprise collections scaling</h2>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
              PayPilot comes loaded with enterprise billing features to support digital banks, logistics companies, retail chains, and subscription SaaS products.
            </p>

            <ul className="space-y-4 text-xs font-semibold text-slate-350">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                Double Credit Protection (Idempotent Webhook Processing)
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                Unmatched Payments Manual Review & Allocation Queue
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                Combined Chronological Balance Statement Ledgers
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                Real-Time dashboard graphs and alerts metrics summary
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-2 hover:border-slate-800 transition-all">
              <Building2 className="h-5.5 w-5.5 text-indigo-400" />
              <h4 className="font-bold text-slate-200 text-sm">Multi-Tenancy Isolation</h4>
              <p className="text-xs text-slate-500 leading-normal">Merchant records are scoped securely using JWT authorization tokens.</p>
            </div>
            <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-2 hover:border-slate-800 transition-all">
              <Layers className="h-5.5 w-5.5 text-indigo-400" />
              <h4 className="font-bold text-slate-200 text-sm">Overpayment Reconciles</h4>
              <p className="text-xs text-slate-500 leading-normal">Excess payments are mapped directly to customer credits statement sheets.</p>
            </div>
            <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-2 hover:border-slate-800 transition-all">
              <Lock className="h-5.5 w-5.5 text-indigo-400" />
              <h4 className="font-bold text-slate-200 text-sm">Strict Security Audits</h4>
              <p className="text-xs text-slate-500 leading-normal">Logs every raw webhook payload transaction for compliance.</p>
            </div>
            <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 space-y-2 hover:border-slate-800 transition-all">
              <Users className="h-5.5 w-5.5 text-indigo-400" />
              <h4 className="font-bold text-slate-200 text-sm">Team Collaboration</h4>
              <p className="text-xs text-slate-500 leading-normal">Resolve unmatched payment items inside shared review queues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="container mx-auto px-6 py-20 border-t border-slate-900/80 z-10 relative max-w-4xl">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Support</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4.5">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex justify-between items-center gap-4 text-slate-200 hover:text-white transition-colors"
              >
                <span className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                  {faq.q}
                </span>
                {expandedFaq === idx ? <ChevronUp className="h-4.5 w-4.5 text-slate-500" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-500" />}
              </button>
              {expandedFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-450 leading-relaxed font-medium pl-11 border-t border-slate-900/50 pt-3 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CALL TO ACTION (CTA) */}
      <section className="container mx-auto px-6 py-16 max-w-5xl z-10 relative">
        <div className="relative rounded-3xl bg-slate-900/35 border border-slate-800 p-12 text-center space-y-6 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-indigo-500/10 blur-[50px] pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to test automatic bank reconciliation?
          </h2>
          <p className="text-xs text-slate-450 max-w-md mx-auto font-semibold">
            Create a demo account or sign in with preset seed parameters to explore the virtual account logs.
          </p>
          <div className="pt-2">
            <button
              onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-950 py-3.5 px-6.5 shadow-md transition-all active:scale-98"
            >
              Enter Sandbox Sandbox
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="container mx-auto px-6 py-10 border-t border-slate-900/80 z-20 relative flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] text-slate-500 font-semibold">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-indigo-650 flex items-center justify-center font-bold text-[10px] text-white">P</div>
          <span>PayPilot &copy; 2026. Built for Dedicated Virtual Account Reconciliation Track.</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-400">Terms of Service</a>
          <span>&bull;</span>
          <a href="#" className="hover:text-slate-400">Privacy Policy</a>
          <span>&bull;</span>
          <a href="mailto:info@paypilot.co" className="hover:text-slate-400">Support</a>
        </div>
      </footer>

      {/* AUTHENTICATION DIALOG MODAL OVERLAY */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-left relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-200 text-xs font-bold bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg"
            >
              Close
            </button>

            {/* Form Tabs */}
            <div className="flex border-b border-slate-800 pb-px mb-6">
              <button
                onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                className={`pb-3 px-6 text-xs font-bold transition-all border-b-2 ${activeTab === 'login' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
                className={`pb-3 px-6 text-xs font-bold transition-all border-b-2 ${activeTab === 'register' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-350'}`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-red-950/40 border border-red-900 text-xs font-semibold text-red-400 p-3 border-l-4 border-l-red-500 leading-normal">
                ⚠️ {errorMsg}
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. info@gracefoods.ng"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs py-2.5 px-3.5 outline-none text-white transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Password</label>
                  <input
                    type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs py-2.5 px-3.5 outline-none text-white transition-all font-semibold"
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-xs font-bold text-white py-3 shadow-md disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Sign In Sandbox'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Username</label>
                    <input
                      type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="gracefoods"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs py-2.5 px-3.5 outline-none text-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Business Name</label>
                    <input
                      type="text" required value={regBusiness} onChange={(e) => setRegBusiness(e.target.value)}
                      placeholder="Grace Foods"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs py-2.5 px-3.5 outline-none text-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="info@gracefoods.ng"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs py-2.5 px-3.5 outline-none text-white transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Phone</label>
                    <input
                      type="text" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs py-2.5 px-3.5 outline-none text-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Password</label>
                    <input
                      type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs py-2.5 px-3.5 outline-none text-white transition-all font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-xs font-bold text-white py-3 shadow-md disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  <ArrowRight className="h-4 w-4 text-white" />
                </button>
              </form>
            )}

            {activeTab === 'login' && (
              <div className="mt-5 text-[9px] text-slate-500 leading-normal border-t border-slate-800/80 pt-4">
                💡 **Quick-Access Sandbox Credentials**:<br />
                Email: `info@gracefoods.ng` &bull; Password: `password`
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
