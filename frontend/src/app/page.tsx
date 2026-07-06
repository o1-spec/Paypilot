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
  Users,
  Check
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
      a: 'PayPilot assigns a unique, persistent Wema Bank or Providus Bank account number to each customer. When they make a standard bank transfer from any banking application, our webhook engine receives the deposit notification in real time, resolves the customer profile, matches the payment to their oldest pending invoice, increments the paid amount, and dispatches dashboard alerts.'
    },
    {
      q: 'Can I simulate bank transfer webhook callbacks inside the sandbox?',
      a: 'Yes. PayPilot includes a built-in webhook payment simulator. From your sandbox dashboard, you can trigger mock bank transfer callbacks, watch the step-by-step auto-reconciliation trace, seed demo invoices, or wipe databases clean.'
    },
    {
      q: 'How are partial payments and overpayments handled?',
      a: 'If a customer transfers less than the total invoice value, the invoice is updated to PARTIAL and continues tracking the outstanding balance. If they transfer more, the target invoice is marked PAID (100% cleared) and the excess credit balance is logged on the customer statement as an overpayment credit.'
    },
    {
      q: 'Is my business dashboard data protected?',
      a: 'Yes. PayPilot is designed with a multi-tenant scoping structure. Every invoice, payment, notification, and customer ledger is isolated securely under your authenticated merchant profile using standard JWT credentials.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between overflow-x-hidden selection:bg-teal-650 selection:text-white font-sans">

      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E] shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#0F172A]">Pay<span className="text-[#0F766E]">Pilot</span></span>
              <span className="block text-[8px] font-bold text-[#64748B] tracking-widest uppercase">Nomba Partner</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#64748B]">
            <a href="#problem" className="hover:text-[#0F766E] transition-colors">The Problem</a>
            <a href="#works" className="hover:text-[#0F766E] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#0F766E] transition-colors">Features</a>
            <a href="#businesses" className="hover:text-[#0F766E] transition-colors">Use Cases</a>
            <a href="#faq" className="hover:text-[#0F766E] transition-colors">FAQ</a>
          </nav>

          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-2 px-4 shadow-sm transition-all"
          >
            Open Demo Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="container mx-auto px-6 pt-16 pb-20 text-center relative z-10 space-y-6 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-150 text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-[#0F766E]" />
          Nomba Virtual Account Infrastructure
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
          Dedicated virtual accounts for <span className="text-[#0F766E]">cleaner business payments</span>
        </h1>

        <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto font-medium">
          PayPilot helps businesses assign account numbers to customers, track transfers, and reconcile payments automatically using Nomba’s virtual account infrastructure.
        </p>

        <div className="flex justify-center gap-3 pt-4">
          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3.5 px-6 shadow-md transition-all"
          >
            Open demo dashboard
          </button>
          <a
            href="#works"
            className="rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-bold text-[#0F172A] py-3.5 px-6 shadow-sm transition-all"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* SUBTLE DASHBOARD PREVIEW */}
      <section className="container mx-auto px-6 pb-24 z-10 relative">
        <div className="w-full max-w-5xl mx-auto rounded-3xl border border-[#E2E8F0] bg-white p-3 shadow-md">
          <div className="rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-6 space-y-6">

            {/* Toolbar */}
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                PayPilot Ledger Sandbox Overview
              </div>
              <span>Grace Foods Enterprises Workspace</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4.5 space-y-1">
                <span className="block text-[8px] font-bold text-[#64748B] uppercase tracking-wider">Reconciled Collections</span>
                <span className="block text-lg font-bold text-[#0F172A]">₦2,850,000.00</span>
                <span className="text-[9px] text-[#047857] font-semibold flex items-center gap-1">
                  <span className="h-1 w-1 bg-emerald-500 rounded-full" /> Auto-matched via webhook
                </span>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4.5 space-y-1">
                <span className="block text-[8px] font-bold text-[#64748B] uppercase tracking-wider">Outstanding Receivables</span>
                <span className="block text-lg font-bold text-amber-600">₦450,000.00</span>
                <span className="block text-[9px] text-[#64748B] font-semibold">Across active billing cycles</span>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4.5 space-y-1">
                <span className="block text-[8px] font-bold text-[#64748B] uppercase tracking-wider">Collection Efficiency</span>
                <span className="block text-lg font-bold text-[#0F766E]">86.2%</span>
                <span className="block text-[9px] text-[#0F766E] font-semibold">Automatic clearings rate</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* THE PROBLEM SECTION */}
      <section id="problem" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0] z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">The Challenge</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">Reconciliation slows down operations</h2>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              When scaling collections, matching bank deposits to invoices manually is highly inefficient. Truncated transfer references (like `TRF BY CHIDI`) fail to clarify who paid what, leading to delays, administrative errors, and compliance headaches.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-600">1</div>
              <h4 className="font-extrabold text-[#0F172A] text-sm">Hours Wasted in Bank Portals</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Downloading statements manually to check references and match invoices drains resource hours.</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-600">2</div>
              <h4 className="font-extrabold text-[#0F172A] text-sm">Truncated Reference Names</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Bank alerts omit references, making it hard to identify the depositor or invoice.</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-600">3</div>
              <h4 className="font-extrabold text-[#0F172A] text-sm">Delayed Customer Credit</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Customers remain pending for hours waiting for manual billing approvals.</p>
            </div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-600">4</div>
              <h4 className="font-extrabold text-[#0F172A] text-sm">Duplicate Webhook Errors</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Without validation, duplicate webhook callbacks trigger double-crediting anomalies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="works" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0] bg-white z-10 relative">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">Automatic reconciliation</span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">How PayPilot Reconciles Payments</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-sm mx-auto">1</div>
            <h3 className="font-extrabold text-sm text-[#0F172A]">Provision Account</h3>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed font-semibold">
              Create customer profiles to provision dedicated bank account numbers via the Nomba API.
            </p>
          </div>

          <div className="space-y-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-[#0F766E]/15 text-[#0F766E] flex items-center justify-center font-bold text-sm mx-auto">2</div>
            <h3 className="font-extrabold text-sm text-[#0F172A]">Receive Bank Deposits</h3>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed font-semibold">
              Customers transfer money via standard mobile banking apps directly to their virtual account.
            </p>
          </div>

          <div className="space-y-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-[#0F766E]/15 text-[#0F766E] flex items-center justify-center font-bold text-sm mx-auto">3</div>
            <h3 className="font-extrabold text-sm text-[#0F172A]">Automatic Reconciliation</h3>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed font-semibold">
              PayPilot matches incoming webhooks, marks the oldest pending invoice as PAID, and logs the statement.
            </p>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0] z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">System Features</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">Reliable Payment Rails</h2>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Designed to process digital cash payments efficiently with strict scoping constraints.
            </p>

            <ul className="space-y-4 text-xs font-bold text-[#64748B]">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#0F766E]" />
                Idempotent Webhook Engine (Blocks double-credit alerts)
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#0F766E]" />
                Manual Unmatched Payment Assignment Drawer
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#0F766E]" />
                Customer Ledgers (Invoices + Payments combined)
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#0F766E]" />
                Real-time collection reports and metrics indicators
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <ShieldCheck className="h-5.5 w-5.5 text-[#0F766E]" />
              <h4 className="font-bold text-[#0F172A] text-sm">Tenant Scoping</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Merchant profiles and collection ledgers are isolated securely using standard JWT scoping rails.</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <Layers className="h-5.5 w-5.5 text-[#0F766E]" />
              <h4 className="font-bold text-[#0F172A] text-sm">Overpayment Resolution</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Excess payments are mapped directly to customer statement balance spreadsheets.</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <Lock className="h-5.5 w-5.5 text-[#0F766E]" />
              <h4 className="font-bold text-[#0F172A] text-sm">Safe Transaction History</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Logs raw payload records to simplify payment disputes.</p>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-2 hover:border-[#0F766E]/20 transition-all shadow-sm">
              <Users className="h-5.5 w-5.5 text-[#0F766E]" />
              <h4 className="font-bold text-[#0F172A] text-sm">Review Queues</h4>
              <p className="text-xs text-[#64748B] leading-normal font-medium">Flag unmatched payments for manual review inside central queues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BUILT FOR NIGERIAN BUSINESSES */}
      <section id="businesses" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0] bg-white z-10 relative">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">Use Cases</span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Built for Nigerian SMEs</h2>
          <p className="text-xs text-[#64748B] font-semibold">
            Flexible collection rails designed for physical and digital business sectors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-2">
            <Building2 className="h-5 w-5 text-[#0F766E]" />
            <h4 className="font-extrabold text-sm text-[#0F172A]">Private Schools</h4>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Assign virtual accounts to parents. Match school fee transfers to students automatically.
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-2">
            <Building2 className="h-5 w-5 text-[#0F766E]" />
            <h4 className="font-extrabold text-sm text-[#0F172A]">Logistics & Delivery</h4>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Reconcile on-demand cash-on-delivery payments from delivery riders in real time.
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-2">
            <Building2 className="h-5 w-5 text-[#0F766E]" />
            <h4 className="font-extrabold text-sm text-[#0F172A]">Distributors & Wholesalers</h4>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Track high-volume bank deposits from retail distributors before shipping warehouse stock.
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-2">
            <Building2 className="h-5 w-5 text-[#0F766E]" />
            <h4 className="font-extrabold text-sm text-[#0F172A]">Professional Agencies</h4>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Clear monthly client retainer invoices automatically without chasing bank receipts.
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-2">
            <Building2 className="h-5 w-5 text-[#0F766E]" />
            <h4 className="font-extrabold text-sm text-[#0F172A]">Pharmacies & Retail</h4>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Allow cashier departments to confirm bank transfers at physical checkouts instantly.
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-2">
            <Building2 className="h-5 w-5 text-[#0F766E]" />
            <h4 className="font-extrabold text-sm text-[#0F172A]">Subscription Services</h4>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Automatically provision customer wallets and activate subscriptions upon payment.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0] z-10 relative max-w-3xl">
        <div className="text-center space-y-4 mb-16">
          <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">Frequently Asked Questions</span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Questions & Answers</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-4.5 flex justify-between items-center gap-4 text-[#0F172A] hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-xs tracking-tight flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#0F766E]" />
                  {faq.q}
                </span>
                {expandedFaq === idx ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>
              {expandedFaq === idx && (
                <div className="px-5 pb-4.5 text-xs text-[#64748B] leading-relaxed font-medium pl-10 border-t border-[#F1F5F9] pt-3 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="container mx-auto px-6 py-16 max-w-4xl z-10 relative">
        <div className="relative rounded-3xl bg-white border border-[#E2E8F0] p-12 text-center space-y-6 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Ready to test automatic bank reconciliation?
          </h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto font-semibold">
            Access the developer sandbox. Sign in with the preset seed credentials to simulate webhook notifications.
          </p>
          <div className="pt-2">
            <button
              onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3.5 px-6 shadow-sm transition-all"
            >
              Open Sandbox Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="container mx-auto px-6 py-8 border-t border-[#E2E8F0] z-20 relative flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] text-[#64748B] font-bold">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#0F766E] flex items-center justify-center font-bold text-[10px] text-white">P</div>
          <span>PayPilot &copy; 2026. Sandbox Payment Verification Ledger.</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-[#0F766E]">Terms of Service</a>
          <span>&bull;</span>
          <a href="#" className="hover:text-[#0F766E]">Privacy Policy</a>
          <span>&bull;</span>
          <a href="mailto:support@paypilot.co" className="hover:text-[#0F766E]">Developer Support</a>
        </div>
      </footer>

      {/* LIGHT AUTH DIALOG MODAL OVERLAY */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] p-8 shadow-xl animate-in zoom-in-95 duration-200 text-left relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-[#64748B] hover:text-[#0F172A] text-xs font-bold bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 rounded-lg transition-colors"
            >
              Close
            </button>

            {/* PayPilot Logo */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E] shadow-sm">
                <Zap className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-[#0F172A]">Pay<span className="text-[#0F766E]">Pilot</span></span>
                <span className="block text-[7px] font-bold text-[#64748B] tracking-wider uppercase">Sandbox Account</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed mb-6 font-semibold border-b border-[#F1F5F9] pb-4">
              Manage customer accounts, invoices, and payment reconciliation from one workspace.
            </p>

            {/* Form Tabs */}
            <div className="flex border-b border-[#E2E8F0] pb-px mb-6 text-xs font-bold">
              <button
                onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                className={`pb-3 px-6 transition-all border-b-2 ${activeTab === 'login' ? 'border-[#0F766E] text-[#0F766E]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
                className={`pb-3 px-6 transition-all border-b-2 ${activeTab === 'register' ? 'border-[#0F766E] text-[#0F766E]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 p-3.5 leading-normal">
                ⚠️ {errorMsg}
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                  <input
                    type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. info@gracefoods.ng"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Password</label>
                  <input
                    type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3 shadow-md disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Logging in...' : 'Sign In Sandbox'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Username</label>
                    <input
                      type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="gracefoods"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Business Name</label>
                    <input
                      type="text" required value={regBusiness} onChange={(e) => setRegBusiness(e.target.value)}
                      placeholder="Grace Foods"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                  <input
                    type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="info@gracefoods.ng"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Phone</label>
                    <input
                      type="text" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Password</label>
                    <input
                      type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3 shadow-md disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                  <ArrowRight className="h-4 w-4 text-white" />
                </button>
              </form>
            )}

            {activeTab === 'login' && (
              <div className="mt-5 text-[9px] text-[#64748B] leading-normal border-t border-[#F1F5F9] pt-4 font-semibold">
                💡 **Demo Quick-Access**:<br />
                Use sandbox email <strong className="text-[#0F172A]">info@gracefoods.ng</strong> and password <strong className="text-[#0F172A]">password</strong> to sign in immediately.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
