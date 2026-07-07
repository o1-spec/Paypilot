'use client';

import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Compass,
  FileText,
  Code,
  DollarSign,
  Activity,
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

interface StickerProps {
  children: React.ReactNode;
  className?: string;
  rotation?: string;
}

function Sticker({ children, className = "", rotation = "rotate-0" }: StickerProps) {
  return (
    <div className={`absolute pointer-events-none select-none transition-all duration-350 hover:scale-105 hover:rotate-0 z-10 ${className} ${rotation}`}>
      <div className="relative border border-dashed border-neutral-300/80 p-1.5 bg-neutral-100/5 rounded-xl">
        {/* Resize Handles */}
        <span className="absolute -top-1 -left-1 w-1.5 h-1.5 border border-neutral-400 bg-white" />
        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 border border-neutral-400 bg-white" />
        <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 border border-neutral-400 bg-white" />
        <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border border-neutral-400 bg-white" />

        {/* Content Card */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-md shadow-neutral-200/20 text-left min-w-[200px]">
          {children}
        </div>
      </div>
    </div>
  );
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

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
      a: 'PayPilot assigns a unique, persistent bank account number to each customer using Nomba infrastructure. When they pay via standard bank transfer, our webhook engine receives the deposit notification in real time, resolves the customer profile, matches the payment to their oldest pending invoice, and dispatches alerts.',
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
    <div className="relative min-h-screen bg-gradient-to-b from-[#FAFAF7] via-[#FCFAF8] to-[#F5F2EC] text-[#0F172A] flex flex-col overflow-x-hidden font-sans">
      
      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #dfddd9 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── STICKY HEADER ──────────────────────────────────────── */}
      <header className="bg-white/60 backdrop-blur-md border-b border-[#E5E2DC]/60 sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-sm shadow-amber-500/10">
              <Zap className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-[#0F172A]">Pay<span className="text-amber-500">Pilot</span></span>
              <span className="block text-[8px] font-bold text-[#64748B] tracking-widest uppercase">Nomba Partner</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#64748B]">
            {['problem','works','features','businesses','faq'].map((id) => (
              <a key={id} href={`#${id}`} className="nav-link hover:text-[#0F172A] transition-colors capitalize">
                {id === 'works' ? 'How It Works' : id === 'businesses' ? 'Use Cases' : id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </nav>

          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white py-2.5 px-5 shadow-sm transition-all"
          >
            Open Demo Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ── HERO & FLOATING CANVAS STICKERS ───────────────────── */}
      <section className="relative z-10 container mx-auto px-6 pt-24 pb-20 text-center min-h-[580px] flex flex-col justify-center max-w-5xl">
        
        {/* Floating Canvas Stickers (visible on desktop) */}
        <div className="absolute inset-0 z-0 pointer-events-none hidden lg:block">
          
          {/* Sticker 1: Virtual Account */}
          <Sticker className="top-12 left-6" rotation="-rotate-6">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                <Building2 className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Dedicated Account</span>
            </div>
            <p className="text-[11px] font-extrabold text-[#0F172A] font-mono">Wema Bank · 1012394857</p>
            <div className="mt-1.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-[#64748B] font-semibold">Customer: Femi Otedola</span>
            </div>
          </Sticker>

          {/* Sticker 2: Webhook Live Status */}
          <Sticker className="top-48 left-16" rotation="rotate-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[9px] font-mono text-[#64748B] font-bold">Webhook Listener</span>
            </div>
            <p className="text-[10px] font-extrabold text-[#0F172A] mb-1">Inbound deposit parsed</p>
            <div className="space-y-1">
              <div className="h-1 w-20 rounded bg-emerald-100" />
              <div className="h-1 w-16 rounded bg-emerald-100" />
              <div className="h-1 w-24 rounded bg-neutral-200" />
            </div>
          </Sticker>

          {/* Sticker 3: Code verification */}
          <Sticker className="bottom-14 left-10" rotation="-rotate-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Code className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[9px] font-mono text-amber-600 font-bold">webhook_verify.py</span>
            </div>
            <pre className="text-[9px] font-mono bg-neutral-50 p-1.5 border border-neutral-100 rounded text-neutral-600">
              {`hmac.new(signing_key, \n  raw_body, hashlib.sha256)`}
            </pre>
          </Sticker>

          {/* Sticker 4: Critic review reconciliation */}
          <Sticker className="top-8 right-6" rotation="rotate-6">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Reconciler</span>
            </div>
            <p className="text-[11px] font-bold text-[#0F172A]">Matched to INV-2026-102</p>
            <div className="mt-1.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-[#64748B] font-semibold">100% matched</span>
            </div>
          </Sticker>

          {/* Sticker 5: Credit tracking */}
          <Sticker className="top-40 right-14" rotation="-rotate-6">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-50 text-rose-600 border border-rose-100">
                <DollarSign className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Overpayment credit</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4 text-[9px] font-bold">
                <span className="text-[#64748B]">Excess paid:</span>
                <span className="text-emerald-600">+₦25,000.00</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[9px] font-semibold text-[#64748B]">
                <span className="text-[#64748B]">Status:</span>
                <span>Mapped to statement</span>
              </div>
            </div>
          </Sticker>

          {/* Sticker 6: Unmatched payment queue */}
          <Sticker className="bottom-16 right-10" rotation="rotate-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold text-[#0F172A]">Unmatched Alert</span>
            </div>
            <p className="text-[9px] text-[#64748B] font-semibold leading-tight">
              Transfer of ₦150,000 from unknown bank reference. Assigned to Review Queue.
            </p>
          </Sticker>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E2DC] bg-white/80 px-3.5 py-1 text-xs text-[#0F172A] font-bold mb-3 shadow-xs animate-fade-up">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            Powered by Nomba Infrastructure
          </div>

          <h1 className="font-serif text-5xl font-semibold tracking-tight text-[#0F172A] md:text-7xl leading-[1.08] animate-fade-up delay-75">
            Dedicated virtual accounts <br />
            for <span className="italic font-normal font-serif text-amber-500">cleaner</span> business payments.
          </h1>

          <p className="mt-6 max-w-xl mx-auto text-sm text-[#64748B] leading-relaxed font-sans font-semibold animate-fade-up delay-150">
            PayPilot helps Nigerian SMEs assign dedicated account numbers to customers, track bank transfers, and reconcile payments automatically using Nomba's virtual account infrastructure.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up delay-200">
            <button
              onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
              className="btn-press min-w-[180px] bg-neutral-900 text-white hover:bg-neutral-800 rounded-full font-bold text-xs py-3.5 px-6 shadow-lg shadow-neutral-900/10"
            >
              <Zap className="h-4 w-4 inline mr-1" /> Open Sandbox Dashboard
            </button>
            <a
              href="#works"
              className="btn-press min-w-[160px] border border-neutral-300 bg-white/80 hover:bg-neutral-50 text-neutral-900 rounded-full font-bold text-xs py-3.5 px-6"
            >
              See how it works <ArrowRight className="h-4 w-4 inline ml-1" />
            </a>
          </div>

          <p className="mt-4 text-[10px] text-neutral-400 font-bold animate-fade-up delay-300">
            Zero setup required. Developer sandbox comes pre-loaded with mock operations.
          </p>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ─────────────────────────────────── */}
      <section className="container mx-auto px-6 pb-24">
        <div className="reveal w-full max-w-5xl mx-auto rounded-3xl border border-[#E5E2DC] bg-white p-3.5 shadow-md">
          <div className="rounded-2xl border border-neutral-200 bg-[#FAFAF8] p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#E5E2DC] pb-4 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                PayPilot Ledger Sandbox Overview
              </div>
              <span>Grace Foods Enterprises Workspace</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Reconciled Collections', value: '₦2,850,000.00', sub: 'Auto-matched via webhook', subColor: 'text-amber-600' },
                { label: 'Outstanding Receivables', value: '₦450,000.00',  sub: 'Across active billing cycles',   subColor: 'text-[#64748B]', valueColor: 'text-rose-600' },
                { label: 'Collection Efficiency',    value: '86.2%',         sub: 'Automatic clearings rate',      subColor: 'text-amber-600', valueColor: 'text-amber-500' },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-[#E5E2DC] rounded-2xl p-5 space-y-1 card-hover shadow-xs">
                  <span className="block text-[8px] font-bold text-[#64748B] uppercase tracking-wider">{card.label}</span>
                  <span className={`block text-lg font-extrabold ${card.valueColor ?? 'text-[#0F172A]'}`}>{card.value}</span>
                  <span className={`block text-[9px] font-semibold ${card.subColor}`}>{card.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ───────────────────────────────────────── */}
      <section id="problem" className="container mx-auto px-6 py-20 border-t border-[#E5E2DC]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-4 reveal-left">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">The Challenge</span>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900 leading-tight">
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
                className="reveal card-hover rounded-2xl border border-[#E5E2DC] bg-white p-6 space-y-2 shadow-xs"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-xs text-amber-500">{c.n}</div>
                <h4 className="font-bold text-[#0F172A] text-sm">{c.title}</h4>
                <p className="text-xs text-[#64748B] leading-normal font-semibold">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="works" className="bg-white border-t border-[#E5E2DC]/60">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16 reveal">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Automatic reconciliation</span>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900">How PayPilot Reconciles Payments</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { n: '1', title: 'Provision Account',       body: 'Create customer profiles to provision dedicated bank account numbers via the Nomba API.', delay: 0 },
              { n: '2', title: 'Receive Bank Deposits',    body: 'Customers transfer money via standard mobile banking apps directly to their virtual account.', delay: 120 },
              { n: '3', title: 'Automatic Reconciliation', body: 'PayPilot matches incoming webhooks, marks the oldest pending invoice as PAID, and logs the statement.', delay: 240 },
            ].map((step) => (
              <div key={step.n} className="reveal space-y-4 text-center" style={{ transitionDelay: `${step.delay}ms` }}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm mx-auto transition-all ${step.n === '1' ? 'bg-neutral-900 text-white shadow-md shadow-neutral-950/20' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}>{step.n}</div>
                <h3 className="font-bold text-sm text-[#0F172A]">{step.title}</h3>
                <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed font-semibold">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ─────────────────────────────────────── */}
      <section id="features" className="container mx-auto px-6 py-20 border-t border-[#E5E2DC]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-6 reveal-left">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">System Features</span>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900 leading-tight">Reliable Payment Rails</h2>
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
                  <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
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
                  className="reveal card-hover bg-white border border-[#E5E2DC] rounded-2xl p-6 space-y-2 shadow-xs"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <Icon className="h-5 w-5 text-amber-500" />
                  <h4 className="font-bold text-[#0F172A] text-sm">{c.title}</h4>
                  <p className="text-xs text-[#64748B] leading-normal font-semibold">{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────────── */}
      <section id="businesses" className="bg-white border-t border-[#E5E2DC]/60">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16 reveal">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Use Cases</span>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900">Built for Nigerian SMEs</h2>
            <p className="text-xs text-[#64748B] font-semibold">Flexible collection rails designed for physical and digital business sectors.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((c, i) => (
              <div
                key={c.title}
                className="reveal card-hover bg-[#FAFAF8] border border-[#E5E2DC] p-6 rounded-2xl space-y-2 shadow-xs"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <Building2 className="h-5 w-5 text-amber-500" />
                <h4 className="font-bold text-sm text-[#0F172A]">{c.title}</h4>
                <p className="text-xs text-[#64748B] leading-relaxed font-semibold">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="container mx-auto px-6 py-20 border-t border-[#E5E2DC] max-w-3xl">
        <div className="text-center space-y-3 mb-16 reveal">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">FAQ</span>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900">Questions & Answers</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="reveal bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden shadow-xs transition-all duration-200"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 text-[#0F172A] hover:bg-[#FAFAF8] transition-colors"
                >
                  <span className="font-bold text-xs flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {/* Animated accordion body */}
                <div className={`faq-body ${isOpen ? 'open' : ''}`}>
                  <p className="px-5 pb-5 pt-1 text-xs text-[#64748B] leading-relaxed font-semibold pl-11">
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
        <div className="reveal rounded-3xl bg-linear-to-r from-neutral-50 via-white to-neutral-50 border border-[#E5E2DC] p-12 text-center space-y-6 shadow-sm">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-neutral-900">
            Ready to test automatic bank reconciliation?
          </h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto font-semibold">
            Access the developer sandbox. Sign in with preset seed credentials to simulate webhook notifications.
          </p>
          <button
            onClick={() => { setErrorMsg(null); setIsAuthModalOpen(true); }}
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white py-3.5 px-6 shadow-md transition-all"
          >
            Open Sandbox Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="container mx-auto px-6 py-8 border-t border-[#E5E2DC] flex flex-col sm:flex-row justify-between items-center gap-5 text-[10px] text-[#64748B] font-bold">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-neutral-900 flex items-center justify-center font-bold text-[9px] text-white">P</div>
          <span>PayPilot &copy; 2026. Sandbox Payment Verification Ledger.</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-amber-500 transition-colors">Terms</a>
          <span>&bull;</span>
          <a href="#" className="hover:text-amber-500 transition-colors">Privacy</a>
          <span>&bull;</span>
          <a href="mailto:support@paypilot.co" className="hover:text-amber-500 transition-colors">Support</a>
        </div>
      </footer>

      {/* ── AUTH MODAL ────────────────────────────────────────── */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E5E2DC] p-8 shadow-xl animate-zoom-in text-left relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-6 right-6 text-[#64748B] hover:text-[#0F172A] text-xs font-bold bg-[#FAFAF8] border border-[#E5E2DC] px-3 py-1.5 rounded-full transition-colors"
            >
              Close
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-[#0F172A]">Pay<span className="text-amber-500">Pilot</span></span>
                <span className="block text-[7px] font-bold text-[#64748B] tracking-wider uppercase">Sandbox Account</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed mb-6 font-semibold border-b border-[#F1F5F9] pb-4">
              Manage customer accounts, invoices, and payment reconciliation from one workspace.
            </p>

            <div className="flex border-b border-[#E5E2DC] pb-px mb-6 text-xs font-bold">
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setErrorMsg(null); }}
                  className={`pb-3 px-6 transition-all border-b-2 capitalize ${activeTab === tab ? 'border-amber-500 text-amber-500' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
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
                    className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input 
                      type={showLoginPassword ? 'text' : 'password'} 
                      required 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 pl-3.5 pr-10 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B] hover:text-amber-500"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-press w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white py-3 shadow-md disabled:opacity-50 transition-colors"
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
                      className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Business Name</label>
                    <input type="text" required value={regBusiness} onChange={(e) => setRegBusiness(e.target.value)}
                      placeholder="Grace Foods"
                      className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="info@gracefoods.ng"
                    className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Phone</label>
                    <input type="text" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+2348…"
                      className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input 
                        type={showRegPassword ? 'text' : 'password'} 
                        required 
                        value={regPassword} 
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 pl-3.5 pr-10 outline-none text-[#0F172A] transition-all font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B] hover:text-amber-500"
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="btn-press w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white py-3 shadow-md disabled:opacity-50 transition-colors"
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
