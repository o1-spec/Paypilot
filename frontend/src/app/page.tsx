'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loginMerchant, registerMerchant } from '@/lib/api';
import {
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  Lock,
  Layers,
  HelpCircle,
  ChevronDown,
  Users,
  ShieldCheck,
} from 'lucide-react';

/* ── Scroll-reveal hook ──────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function LandingPage() {
  useScrollReveal();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
      const data = await loginMerchant({ email: loginEmail, password: loginPassword });
      const sessionData = {
        businessName: data.user.business_name,
        email: data.user.email,
        token: data.access,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('paypilot_demo_session', JSON.stringify(sessionData));
      router.push('/dashboard');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || e.response?.data?.error || 'Incorrect email or password.');
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

  const toggleFaq = (index: number) =>
    setExpandedFaq(expandedFaq === index ? null : index);

  const faqs = [
    {
      q: 'How does dedicated virtual account reconciliation work?',
      a: 'PayPilot assigns a unique, persistent Wema Bank or Providus Bank account number to each customer. When they make a standard bank transfer, our webhook engine receives the deposit notification in real time, resolves the customer profile, matches the payment to their oldest pending invoice, and dispatches dashboard alerts.',
    },
    {
      q: 'Can I simulate bank transfer webhook callbacks inside the sandbox?',
      a: 'Yes. PayPilot includes a built-in webhook payment simulator. From the sandbox dashboard, you can trigger mock bank transfer callbacks, watch the step-by-step auto-reconciliation trace, seed demo invoices, or wipe the database clean.',
    },
    {
      q: 'How are partial payments and overpayments handled?',
      a: 'If a customer transfers less than the invoice total, the invoice is updated to PARTIAL and continues tracking the outstanding balance. If they transfer more, the invoice is marked PAID and the excess is logged on the customer statement as a credit.',
    },
    {
      q: 'Is my business dashboard data protected?',
      a: 'Yes. Every invoice, payment, notification, and customer ledger is isolated securely under your authenticated merchant profile using standard JWT credentials. Multi-tenant scoping is enforced at the database query level.',
    },
  ];

  const problemCards = [
    { n: '1', title: 'Hours Wasted in Bank Portals', body: 'Downloading statements manually to check references and match invoices drains resource hours daily.' },
    { n: '2', title: 'Truncated Reference Names', body: 'Bank alerts show "TRF BY CHIDI" — not "Invoice #INV-045 from Chidi Enterprises Lagos."' },
    { n: '3', title: 'Delayed Customer Credit', body: 'Customers remain pending for hours waiting for manual billing approvals to clear.' },
    { n: '4', title: 'Duplicate Webhook Errors', body: 'Without validation, duplicate webhook callbacks trigger double-crediting anomalies on live accounts.' },
  ];

  const featureCards = [
    { icon: ShieldCheck, title: 'Tenant Scoping', body: 'Merchant profiles and collection ledgers are isolated securely using standard JWT scoping rails.' },
    { icon: Layers,      title: 'Overpayment Resolution', body: 'Excess payments are mapped directly to customer statement balance spreadsheets automatically.' },
    { icon: Lock,        title: 'Safe Transaction History', body: 'Logs raw payload records to simplify payment disputes and audit trails.' },
    { icon: Users,       title: 'Review Queues', body: 'Flag unmatched payments for manual review inside central queues with one-click assignment.' },
  ];

  const useCases = [
    { title: 'Private Schools',         body: 'Assign virtual accounts to parents. Match school fee transfers to students automatically.' },
    { title: 'Logistics & Delivery',    body: 'Reconcile on-demand cash-on-delivery payments from delivery riders in real time.' },
    { title: 'Distributors & Wholesalers', body: 'Track high-volume bank deposits from retail distributors before shipping warehouse stock.' },
    { title: 'Professional Agencies',   body: 'Clear monthly client retainer invoices automatically without chasing bank receipts.' },
    { title: 'Pharmacies & Retail',     body: 'Allow cashier departments to confirm bank transfers at physical checkouts instantly.' },
    { title: 'Subscription Services',   body: 'Automatically provision customer wallets and activate subscriptions upon payment.' },
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col overflow-x-hidden font-sans">

      {/* ── STICKY HEADER ──────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E] shadow-sm">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#0F172A]">Pay<span className="text-[#0F766E]">Pilot</span></span>
              <span className="block text-[8px] font-bold text-[#64748B] tracking-widest uppercase">Nomba Partner</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#64748B]">
            {['problem','works','features','businesses','faq'].map((id) => (
              <a key={id} href={`#${id}`} className="nav-link hover:text-[#0F766E] transition-colors capitalize">
                {id === 'works' ? 'How It Works' : id === 'businesses' ? 'Use Cases' : id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </nav>

          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-2 px-4 shadow-sm transition-all"
          >
            Open Demo Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 pt-20 pb-16 text-center space-y-6 max-w-4xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-[10px] font-bold text-[#0F766E] uppercase tracking-wider animate-fade-up animate-float">
          <Sparkles className="h-3.5 w-3.5" />
          Nomba Virtual Account Infrastructure
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-tight animate-fade-up delay-150">
          Dedicated virtual accounts for{' '}
          <span className="text-[#0F766E]">cleaner business payments</span>
        </h1>

        <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto font-medium animate-fade-up delay-300">
          PayPilot helps businesses assign account numbers to customers, track transfers, and reconcile payments automatically using Nomba's virtual account infrastructure.
        </p>

        <div className="flex justify-center gap-3 pt-2 animate-fade-up delay-400">
          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="btn-press rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3.5 px-6 shadow-md transition-all"
          >
            Open demo dashboard
          </button>
          <a
            href="#works"
            className="btn-press rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-bold text-[#0F172A] py-3.5 px-6 shadow-sm transition-all"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ─────────────────────────────────── */}
      <section className="container mx-auto px-6 pb-24">
        <div className="reveal w-full max-w-5xl mx-auto rounded-3xl border border-[#E2E8F0] bg-white p-3 shadow-md">
          <div className="rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                PayPilot Ledger Sandbox Overview
              </div>
              <span>Grace Foods Enterprises Workspace</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Reconciled Collections', value: '₦2,850,000.00', sub: 'Auto-matched via webhook', subColor: 'text-[#047857]' },
                { label: 'Outstanding Receivables', value: '₦450,000.00',  sub: 'Across active billing cycles',   subColor: 'text-[#64748B]', valueColor: 'text-amber-600' },
                { label: 'Collection Efficiency',    value: '86.2%',         sub: 'Automatic clearings rate',      subColor: 'text-[#0F766E]', valueColor: 'text-[#0F766E]' },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1 card-hover">
                  <span className="block text-[8px] font-bold text-[#64748B] uppercase tracking-wider">{card.label}</span>
                  <span className={`block text-lg font-bold ${card.valueColor ?? 'text-[#0F172A]'}`}>{card.value}</span>
                  <span className={`block text-[9px] font-semibold ${card.subColor}`}>{card.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ───────────────────────────────────────── */}
      <section id="problem" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-4 reveal-left">
            <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">The Challenge</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Reconciliation slows down operations
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              When scaling collections, matching bank deposits to invoices manually is highly inefficient. Truncated transfer references fail to clarify who paid what, leading to delays, errors, and compliance headaches.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {problemCards.map((c, i) => (
              <div
                key={c.n}
                className={`reveal card-hover rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-2 shadow-sm`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="h-7 w-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-600">{c.n}</div>
                <h4 className="font-extrabold text-[#0F172A] text-sm">{c.title}</h4>
                <p className="text-xs text-[#64748B] leading-normal font-medium">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="works" className="bg-white border-t border-[#E2E8F0]">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16 reveal">
            <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">Automatic reconciliation</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">How PayPilot Reconciles Payments</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { n: '1', title: 'Provision Account',       body: 'Create customer profiles to provision dedicated bank account numbers via the Nomba API.', delay: 0 },
              { n: '2', title: 'Receive Bank Deposits',    body: 'Customers transfer money via standard mobile banking apps directly to their virtual account.', delay: 120 },
              { n: '3', title: 'Automatic Reconciliation', body: 'PayPilot matches incoming webhooks, marks the oldest pending invoice as PAID, and logs the statement.', delay: 240 },
            ].map((step) => (
              <div key={step.n} className="reveal space-y-4 text-center" style={{ transitionDelay: `${step.delay}ms` }}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm mx-auto transition-all ${step.n === '1' ? 'bg-[#0F766E] text-white shadow-md shadow-teal-500/20' : 'bg-teal-50 text-[#0F766E] border border-teal-100'}`}>{step.n}</div>
                <h3 className="font-extrabold text-sm text-[#0F172A]">{step.title}</h3>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed font-semibold">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ─────────────────────────────────────── */}
      <section id="features" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6 reveal-left">
            <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">System Features</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">Reliable Payment Rails</h2>
            <p className="text-xs text-[#64748B] leading-relaxed font-semibold">
              Designed to process digital cash payments efficiently with strict scoping constraints.
            </p>
            <ul className="space-y-3.5 text-xs font-bold text-[#64748B]">
              {[
                'Idempotent Webhook Engine (blocks double-credit alerts)',
                'Manual Unmatched Payment Assignment Drawer',
                'Customer Ledgers — invoices + payments combined',
                'Real-time collection reports and metrics',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#0F766E] mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {featureCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="reveal card-hover bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-2 shadow-sm"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <Icon className="h-5 w-5 text-[#0F766E]" />
                  <h4 className="font-bold text-[#0F172A] text-sm">{c.title}</h4>
                  <p className="text-xs text-[#64748B] leading-normal font-medium">{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────────── */}
      <section id="businesses" className="bg-white border-t border-[#E2E8F0]">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16 reveal">
            <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">Use Cases</span>
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Built for Nigerian SMEs</h2>
            <p className="text-xs text-[#64748B] font-semibold">Flexible collection rails designed for physical and digital business sectors.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((c, i) => (
              <div
                key={c.title}
                className="reveal card-hover bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-2"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <Building2 className="h-5 w-5 text-[#0F766E]" />
                <h4 className="font-extrabold text-sm text-[#0F172A]">{c.title}</h4>
                <p className="text-xs text-[#64748B] leading-relaxed font-semibold">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="container mx-auto px-6 py-20 border-t border-[#E2E8F0] max-w-3xl">
        <div className="text-center space-y-3 mb-16 reveal">
          <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider block">FAQ</span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Questions & Answers</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="reveal bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 text-[#0F172A] hover:bg-slate-50/80 transition-colors"
                >
                  <span className="font-bold text-xs flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-[#0F766E] shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {/* Animated accordion body */}
                <div className={`faq-body ${isOpen ? 'open' : ''}`}>
                  <p className="px-5 pb-5 pt-1 text-xs text-[#64748B] leading-relaxed font-medium pl-11">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────── */}
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="reveal rounded-3xl bg-white border border-[#E2E8F0] p-12 text-center space-y-6 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Ready to test automatic bank reconciliation?
          </h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto font-semibold">
            Access the developer sandbox. Sign in with preset seed credentials to simulate webhook notifications.
          </p>
          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="btn-press inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3.5 px-6 shadow-sm transition-all"
          >
            Open Sandbox Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="container mx-auto px-6 py-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-center gap-5 text-[10px] text-[#64748B] font-bold">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#0F766E] flex items-center justify-center font-bold text-[9px] text-white">P</div>
          <span>PayPilot &copy; 2026. Sandbox Payment Verification Ledger.</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-[#0F766E] transition-colors">Terms</a>
          <span>&bull;</span>
          <a href="#" className="hover:text-[#0F766E] transition-colors">Privacy</a>
          <span>&bull;</span>
          <a href="mailto:support@paypilot.co" className="hover:text-[#0F766E] transition-colors">Support</a>
        </div>
      </footer>

      {/* ── AUTH MODAL ────────────────────────────────────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] p-8 shadow-xl animate-zoom-in text-left relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-[#64748B] hover:text-[#0F172A] text-xs font-bold bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 rounded-lg transition-colors"
            >
              Close
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E]">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-[#0F172A]">Pay<span className="text-[#0F766E]">Pilot</span></span>
                <span className="block text-[7px] font-bold text-[#64748B] tracking-wider uppercase">Sandbox Account</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed mb-6 font-semibold border-b border-[#F1F5F9] pb-4">
              Manage customer accounts, invoices, and payment reconciliation from one workspace.
            </p>

            <div className="flex border-b border-[#E2E8F0] pb-px mb-6 text-xs font-bold">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setErrorMsg(null); }}
                  className={`pb-3 px-6 transition-all border-b-2 capitalize ${activeTab === tab ? 'border-[#0F766E] text-[#0F766E]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 p-3.5 animate-fade-down">
                ⚠️ {errorMsg}
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. info@gracefoods.ng"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Password</label>
                  <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="btn-press w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3 shadow-md disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Username</label>
                    <input type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="gracefoods"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Business Name</label>
                    <input type="text" required value={regBusiness} onChange={(e) => setRegBusiness(e.target.value)}
                      placeholder="Grace Foods"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="info@gracefoods.ng"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Phone</label>
                    <input type="text" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+2348…"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Password</label>
                    <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0F766E] text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-press w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-xs font-bold text-white py-3 shadow-md disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {activeTab === 'login' && (
              <div className="mt-5 text-[9px] text-[#64748B] leading-normal border-t border-[#F1F5F9] pt-4 font-semibold">
                💡 <strong className="text-[#0F172A]">Quick Access:</strong> Email&nbsp;
                <strong className="text-[#0F172A]">info@gracefoods.ng</strong> · Password&nbsp;
                <strong className="text-[#0F172A]">password</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
