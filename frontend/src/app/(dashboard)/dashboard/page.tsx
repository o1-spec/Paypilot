'use client';

import React, { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import {
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  FileText,
  Zap,
  Loader2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  fetchDashboard,
  fetchCustomers,
  createCustomer,
  createInvoice,
  triggerWebhook,
  seedDemoData,
  resetDemoData,
  DashboardData,
  Customer,
  formatNaira,
  formatDate,
} from '@/lib/api';
import { useToast } from '@/components/Toast';

/* ── shared input / label styles ──────────────────────────────── */
const INPUT =
  'w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold';
const LABEL = 'block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1';

/* ── Modal backdrop ────────────────────────────────────────────── */
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E5E2DC] p-6 shadow-2xl animate-zoom-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B] transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ── Metric card ───────────────────────────────────────────────── */
function MetricCard({
  label, value, sub, subColor = 'text-[#64748B]', accent,
}: {
  label: string; value: string | number; sub: React.ReactNode;
  subColor?: string; accent?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-2 hover:shadow-md transition-shadow card-hover ${accent || 'border-[#E5E2DC]'}`}>
      <span className="block text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">{label}</span>
      <span className="text-xl font-extrabold text-[#0F172A] tracking-tight block truncate">{value}</span>
      <div className={`flex items-center gap-1 text-[10px] font-bold ${subColor}`}>{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState('');
  const { toast } = useToast();

  // Modal states
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isSimOpen, setIsSimOpen] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerBusiness, setCustomerBusiness] = useState('');

  // Invoice form
  const [selectedCust, setSelectedCust] = useState('');
  const [amountVal, setAmountVal] = useState('');
  const [dueDateVal, setDueDateVal] = useState('');
  const [descVal, setDescVal] = useState('');

  // Webhook form
  const [webhookAccount, setWebhookAccount] = useState('');
  const [webhookAmount, setWebhookAmount] = useState('');
  const [webhookRef, setWebhookRef] = useState('');
  const [webhookBank, setWebhookBank] = useState('Nomba Bank');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, custList] = await Promise.all([fetchDashboard(), fetchCustomers()]);
      setData(dashData);
      setCustomers(custList);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to connect to backend APIs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('paypilot_demo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.businessName) setMerchantName(parsed.businessName);
      } catch {}
    }
    loadData();
  }, []);

  const handleSeedDemo = async () => {
    setActionLoading(true);
    try {
      await seedDemoData();
      toast('Demo portfolio seeded with mock data!', 'success');
      await loadData();
    } catch (e: any) {
      toast(e.response?.data?.error || 'Failed to seed demo data.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setActionLoading(true);
    try {
      await resetDemoData();
      toast('All portfolios cleared — clean slate!', 'info');
      await loadData();
    } catch (e: any) {
      toast(e.message || 'Failed to reset database.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const startSimulateDemo = async () => {
    setDemoStep(1);
    setTimeout(() => setDemoStep(2), 1500);
    setTimeout(() => setDemoStep(3), 3000);
    setTimeout(async () => {
      setDemoStep(4);
      try {
        const firstCust = customers.find((c) => c.virtual_account);
        const targetAccount = firstCust?.virtual_account?.account_number || '3036956959';
        await triggerWebhook({
          destination_account_number: targetAccount,
          amount: 35000,
          reference: `DEMO-RECON-${Date.now().toString().slice(-6)}`,
        });
      } catch {
        toast('Auto-reconciliation simulation hit an API error.', 'error');
      }
    }, 4500);
    setTimeout(async () => {
      setDemoStep(5);
      await loadData();
    }, 6000);
    setTimeout(() => {
      setDemoStep(0);
      toast('Reconciliation complete! Invoice cleared & notifications sent.', 'success', 5000);
    }, 8500);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const newCust = await createCustomer({
        full_name: customerName, email: customerEmail,
        phone: customerPhone, business_name: customerBusiness,
      });
      toast(`${newCust.full_name} registered — virtual account provisioned!`, 'success');
      setIsCustModalOpen(false);
      setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setCustomerBusiness('');
      await loadData();
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Failed to create customer profile.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createInvoice({
        customer: selectedCust, amount: parseFloat(amountVal),
        description: descVal || 'General retail invoice',
        due_date: dueDateVal, invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      });
      toast('Invoice issued and linked to customer account.', 'success');
      setIsInvModalOpen(false);
      setSelectedCust(''); setAmountVal(''); setDueDateVal(''); setDescVal('');
      await loadData();
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Failed to issue invoice.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await triggerWebhook({
        destination_account_number: webhookAccount,
        amount: parseFloat(webhookAmount),
        reference: webhookRef || undefined,
      });
      if (response.matched) {
        toast('Payment reconciled! Invoice automatically cleared.', 'success');
      } else {
        toast('Payment logged as unmatched deposit — requires manual assignment.', 'warning');
      }
      setIsSimOpen(false);
      setWebhookAccount(''); setWebhookAmount(''); setWebhookRef('');
      await loadData();
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Webhook simulation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Dashboard" />
        <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <LoadingSkeleton type="card-grid" />
          <LoadingSkeleton type="table" />
        </div>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-2xl bg-white border border-[#E5E2DC] p-8 shadow-sm text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 mx-auto">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">API Connection Offline</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              The backend server is unreachable. Verify the Django server is running.
            </p>
            <button
              onClick={loadData}
              className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-neutral-800 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md"
            >
              <RefreshCw className="h-4 w-4" /> Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Chart data ────────────────────────────────────────────── */
  const chartData = data?.monthly_revenue_summary?.length
    ? data.monthly_revenue_summary
    : [
        { month: 'Jan', amount: 50000 }, { month: 'Feb', amount: 80000 },
        { month: 'Mar', amount: 150000 }, { month: 'Apr', amount: 90000 },
        { month: 'May', amount: 220000 }, { month: 'Jun', amount: data?.total_revenue || 350000 },
      ];
  const maxAmount = Math.max(...chartData.map((c) => c.amount), 10000);
  const chartPoints = chartData
    .map((c, i) => `${(i / (chartData.length - 1)) * 100},${100 - (c.amount / maxAmount) * 80}`)
    .join(' ');
  const areaPoints = `0,100 ${chartPoints} 100,100`;

  const statusCounts = data?.invoice_status_breakdown || {
    PAID: data?.paid_invoices_count || 0,
    PENDING: data?.pending_invoices_count || 0,
    PARTIAL: data?.partial_invoices_count || 0,
    OVERPAID: data?.overpaid_invoices_count || 0,
  };
  const totalInvoicesSum = Math.max(Object.values(statusCounts).reduce((a, b) => a + b, 0), 1);

  /* ── Stepper steps config ──────────────────────────────────── */
  const STEPS = [
    { label: 'Incoming Transfer', sub: 'NGN 35,000 Wema Bank' },
    { label: 'Virtual Account Match', sub: 'Identified VA endpoint' },
    { label: 'Customer Found', sub: 'Profile resolved' },
    { label: 'Invoice Cleared', sub: 'Paid amount updated' },
    { label: 'Dashboard Updated', sub: 'Live UI metrics refreshed' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F6F1]">
      <TopNavbar title="Dashboard" />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* ── WELCOME BANNER ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] px-8 py-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Warm glow blobs */}
          <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-amber-500/10 blur-[70px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-amber-400/8 blur-[50px] pointer-events-none" />

          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-300 uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5" />
              PayPilot · Powered by Nomba
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome back{merchantName ? `, ${merchantName}` : ''} 👋
            </h1>
            <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
              Monitor virtual account collections, track invoice reconciliation, and manage your customer portfolio from one place.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10">
            <button
              onClick={() => setIsCustModalOpen(true)}
              className="btn-press inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white py-3 px-5 transition-all"
            >
              <Users className="h-4 w-4" />
              Add Customer
            </button>
            <button
              onClick={() => setIsInvModalOpen(true)}
              className="btn-press inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-white py-3 px-5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <FileText className="h-4 w-4" />
              Issue Invoice
            </button>
          </div>
        </div>

        {/* ── RECONCILIATION PIPELINE INSIGHT ─────────────────── */}
        <div className="bg-white border border-[#E5E2DC] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#E5E2DC] pb-4">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A] tracking-tight">Auto-Reconciliation Pipeline</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">How PayPilot processes every incoming transfer from Nomba automatically.</p>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
              <button
                onClick={handleSeedDemo}
                disabled={actionLoading}
                className="btn-press inline-flex items-center gap-2 rounded-xl border border-[#E5E2DC] bg-[#FAFAF8] hover:bg-[#F0EDE8] text-xs font-semibold text-[#0F172A] py-2 px-4 shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#64748B] ${actionLoading ? 'animate-spin' : ''}`} />
                Load Sample Data
              </button>
              <button
                onClick={handleResetDemo}
                disabled={actionLoading}
                className="btn-press inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 py-2 px-4 shadow-sm transition-all disabled:opacity-50"
              >
                Clear Records
              </button>
              <a
                href="/webhook-demo"
                className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white py-2 px-4 shadow-md transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                Open Developer Console
              </a>
            </div>
          </div>

          {/* Pipeline steps always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E5E2DC] bg-[#FAFAF8]">
                <div className="h-7 w-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 text-amber-700">
                  {i + 1}
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#0F172A] leading-tight">{step.label}</span>
                  <span className="block text-[9px] text-[#94A3B8] font-semibold mt-0.5">{step.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── METRICS ROW ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Total Revenue"
            value={formatNaira(data?.total_revenue || 0)}
            sub={<><TrendingUp className="h-3 w-3" /> +12.4% this month</>}
            subColor="text-emerald-600"
          />
          <MetricCard
            label="Outstanding"
            value={formatNaira(data?.outstanding_balance || 0)}
            sub={<><Clock className="h-3 w-3" /> Active dues</>}
            subColor="text-amber-600"
          />
          <MetricCard
            label="Customers"
            value={data?.total_customers || 0}
            sub={<><Users className="h-3 w-3" /> Allocated VAs</>}
          />
          <MetricCard
            label="Paid Invoices"
            value={data?.paid_invoices_count || 0}
            sub={<><CheckCircle2 className="h-3 w-3" /> Fully reconciled</>}
            subColor="text-emerald-600"
          />
          <MetricCard
            label="Pending"
            value={data?.pending_invoices_count || 0}
            sub={<><FileText className="h-3 w-3" /> Awaiting transfers</>}
            subColor="text-amber-600"
          />
          <MetricCard
            label="Unmatched"
            value={data?.unmatched_payments_count || 0}
            sub={<><AlertTriangle className="h-3 w-3" /> Manual required</>}
            subColor="text-rose-600"
            accent="border-rose-200 border-l-4 border-l-rose-400"
          />
        </div>

        {/* ── CHARTS ROW ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Revenue Chart */}
          <div className="lg:col-span-8 bg-white border border-[#E5E2DC] rounded-3xl p-6 shadow-sm flex flex-col h-[340px]">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4 mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">Collections Revenue Trend</h3>
                <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">Historical overview of bank transfer deposits.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] font-bold bg-[#FAFAF8] border border-[#E5E2DC] rounded-lg px-2.5 py-1">
                Monthly sums
              </div>
            </div>

            <div className="relative flex-1 w-full min-h-[160px] bg-[#FAFAF8] rounded-2xl border border-[#E5E2DC] p-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <line x1="0" y1="20" x2="100" y2="20" stroke="#E5E2DC" strokeWidth="0.5" />
                <line x1="0" y1="55" x2="100" y2="55" stroke="#E5E2DC" strokeWidth="0.5" />
                <line x1="0" y1="90" x2="100" y2="90" stroke="#E5E2DC" strokeWidth="0.7" />
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#chartGrad)" />
                <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={chartPoints} />
                {chartData.map((c, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 100 - (c.amount / maxAmount) * 80;
                  return <circle key={i} cx={x} cy={y} r="2.5" fill="#ffffff" stroke="#F59E0B" strokeWidth="2" />;
                })}
              </svg>
              <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider">
                {chartData.map((c, i) => <span key={i}>{c.month}</span>)}
              </div>
            </div>
          </div>

          {/* Invoice Status Breakdown */}
          <div className="lg:col-span-4 bg-white border border-[#E5E2DC] rounded-3xl p-6 shadow-sm flex flex-col h-[340px]">
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">Invoice Status Matrix</h3>
              <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">Distribution breakdown of billing schedules.</p>
            </div>

            <div className="space-y-4 my-auto flex-1 flex flex-col justify-center">
              {[
                { label: 'Paid Invoices', key: 'PAID', color: 'bg-emerald-500' },
                { label: 'Pending Invoices', key: 'PENDING', color: 'bg-amber-500' },
                { label: 'Partially Paid', key: 'PARTIAL', color: 'bg-sky-500' },
                { label: 'Overpaid', key: 'OVERPAID', color: 'bg-rose-400' },
              ].map(({ label, key, color }) => {
                const count = (statusCounts as any)[key] || 0;
                const pct = Math.round((count / totalInvoicesSum) * 100);
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#0F172A]">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        {label}
                      </span>
                      <span className="text-[#64748B]">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#F0EDE8] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#E5E2DC] pt-3 flex items-center justify-between text-[10px] font-semibold text-[#94A3B8]">
              <span>Total invoices compiled:</span>
              <span className="font-bold text-[#0F172A]">{totalInvoicesSum} invoices</span>
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Recent Payments */}
          <div className="bg-white border border-[#E5E2DC] rounded-3xl p-6 shadow-sm min-h-[340px] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3.5 mb-4">
              <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">Recent Payments</h3>
              <Link href="/payments" className="text-[10px] text-amber-600 hover:text-amber-500 font-bold inline-flex items-center gap-1">
                View feed <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3 flex-1">
              {(data?.recent_payments || []).slice(0, 5).map((pay) => (
                <div key={pay.id} className="flex items-center justify-between text-xs pb-3 border-b border-[#F0EDE8] last:border-0 last:pb-0">
                  <div>
                    <span className="block font-semibold text-[#0F172A] leading-tight">{pay.customer_name || 'Unmatched Payment'}</span>
                    <span className="block text-[10px] text-[#94A3B8] mt-0.5 font-mono">{pay.reference}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-[#0F172A]">{formatNaira(pay.amount)}</span>
                    <span className="block text-[9px] text-[#94A3B8] mt-0.5">{formatDate(pay.created_at)}</span>
                  </div>
                </div>
              ))}
              {(!data?.recent_payments || data.recent_payments.length === 0) && (
                <span className="block text-xs text-[#94A3B8] italic text-center py-6">No payments cleared yet.</span>
              )}
            </div>
          </div>

          {/* Audit Notifications */}
          <div className="bg-white border border-[#E5E2DC] rounded-3xl p-6 shadow-sm min-h-[340px] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3.5 mb-4">
              <h3 className="font-bold text-sm text-[#0F172A] tracking-tight">Audit Notifications</h3>
              <span className="text-[9px] bg-[#FAFAF8] border border-[#E5E2DC] px-2 py-0.5 rounded-full text-[#64748B] font-bold">System Logs</span>
            </div>
            <div className="space-y-3.5 flex-1">
              {(data?.recent_notifications || []).slice(0, 4).map((n) => (
                <div key={n.id} className="text-xs pb-3.5 border-b border-[#F0EDE8] last:border-0 last:pb-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#0F172A] leading-tight">{n.title}</span>
                    <span className="text-[9px] text-[#94A3B8] font-medium shrink-0">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-normal">{n.message}</p>
                </div>
              ))}
              {(!data?.recent_notifications || data.recent_notifications.length === 0) && (
                <span className="block text-xs text-[#94A3B8] italic text-center py-6">No audit records flagged.</span>
              )}
            </div>
          </div>

          {/* Quick Actions + Recent Portfolios */}
          <div className="bg-white border border-[#E5E2DC] rounded-3xl p-6 shadow-sm min-h-[340px] flex flex-col gap-5">
            <div>
              <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsCustModalOpen(true)}
                  className="btn-press flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E2DC] hover:border-amber-300 hover:bg-amber-50/30 text-[#0F172A] transition-all text-xs font-semibold text-center"
                >
                  <Users className="h-4 w-4 text-amber-500 mb-1.5" />
                  New Customer
                </button>
                <button
                  onClick={() => setIsInvModalOpen(true)}
                  className="btn-press flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#E5E2DC] hover:border-emerald-300 hover:bg-emerald-50/30 text-[#0F172A] transition-all text-xs font-semibold text-center"
                >
                  <FileText className="h-4 w-4 text-emerald-500 mb-1.5" />
                  Issue Invoice
                </button>
              </div>
            </div>

            <div className="border-t border-[#E5E2DC] pt-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Recent Portfolios</h3>
                <Link href="/customers" className="text-[10px] text-amber-600 hover:text-amber-500 font-bold">View all</Link>
              </div>
              <div className="space-y-2.5">
                {customers.slice(0, 3).map((c) => (
                  <Link
                    href={`/customers/${c.id}`}
                    key={c.id}
                    className="flex items-center justify-between text-xs hover:bg-[#FAFAF8] p-2 rounded-xl transition-colors border border-transparent hover:border-[#E5E2DC]"
                  >
                    <div>
                      <span className="block font-semibold text-[#0F172A] leading-tight">{c.full_name}</span>
                      <span className="block text-[9px] text-[#94A3B8] mt-0.5">{c.business_name || 'Individual'}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#64748B] font-bold bg-[#FAFAF8] px-2 py-0.5 rounded-md border border-[#E5E2DC]">
                      {c.virtual_account?.account_number || 'No VA'}
                    </span>
                  </Link>
                ))}
                {customers.length === 0 && (
                  <span className="block text-xs text-[#94A3B8] italic text-center py-4">No customers yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ══ MODALS ══════════════════════════════════════════════ */}

      {/* Create Customer */}
      {isCustModalOpen && (
        <Modal onClose={() => setIsCustModalOpen(false)}>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">Create Customer</h3>
          <p className="text-xs text-[#64748B] mb-5">Provide details to register a customer and provision a virtual account.</p>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div><label className={LABEL}>Contact Name</label>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Tunde Bakare" className={INPUT} />
            </div>
            <div><label className={LABEL}>Email Address</label>
              <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="e.g. tunde@logistics.ng" className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={LABEL}>Phone</label>
                <input type="text" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+234..." className={INPUT} />
              </div>
              <div><label className={LABEL}>Business Name</label>
                <input type="text" value={customerBusiness} onChange={(e) => setCustomerBusiness(e.target.value)} placeholder="Optional" className={INPUT} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
              <button type="button" onClick={() => setIsCustModalOpen(false)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B] transition-colors">Cancel</button>
              <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</> : 'Create Profile'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Issue Invoice */}
      {isInvModalOpen && (
        <Modal onClose={() => setIsInvModalOpen(false)}>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">Issue Invoice</h3>
          <p className="text-xs text-[#64748B] mb-5">Create an invoice mapped to a customer's virtual account.</p>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div><label className={LABEL}>Assign Customer</label>
              <select required value={selectedCust} onChange={(e) => setSelectedCust(e.target.value)} className={INPUT}>
                <option value="">Select Customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.virtual_account?.account_number || 'No VA'})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={LABEL}>Amount (NGN)</label>
                <input type="number" required value={amountVal} onChange={(e) => setAmountVal(e.target.value)} placeholder="150000" className={INPUT} />
              </div>
              <div><label className={LABEL}>Due Date</label>
                <input type="date" required value={dueDateVal} onChange={(e) => setDueDateVal(e.target.value)} className={INPUT} />
              </div>
            </div>
            <div><label className={LABEL}>Description</label>
              <input type="text" required value={descVal} onChange={(e) => setDescVal(e.target.value)} placeholder="e.g. Monthly maintenance retainer" className={INPUT} />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
              <button type="button" onClick={() => setIsInvModalOpen(false)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B] transition-colors">Cancel</button>
              <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…</> : 'Generate Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Test Webhook (Dev Console shortcut) */}
      {isSimOpen && (
        <Modal onClose={() => setIsSimOpen(false)}>
          <h3 className="text-base font-bold text-[#0F172A] mb-1">Fire Test Webhook</h3>
          <p className="text-xs text-[#64748B] mb-5">Manually trigger a Nomba transfer event to test the reconciliation engine.</p>
          <form onSubmit={handleTriggerWebhook} className="space-y-4">
            <div><label className={LABEL}>Target Virtual Account</label>
              <div className="flex gap-2">
                <input type="text" required value={webhookAccount} onChange={(e) => setWebhookAccount(e.target.value)} placeholder="10-digit VA number" className={INPUT} />
                <select onChange={(e) => setWebhookAccount(e.target.value)} className="rounded-xl border border-[#E5E2DC] bg-[#FAFAF8] text-xs px-2 outline-none text-[#64748B] max-w-[130px]">
                  <option value="">Fill VA…</option>
                  {customers.map((c) => c.virtual_account && (
                    <option key={c.id} value={c.virtual_account.account_number}>{c.full_name} ({c.virtual_account.account_number})</option>
                  ))}
                  <option value="9999999999">Unknown VA (unmatched flow)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={LABEL}>Amount (NGN)</label>
                <input type="number" required value={webhookAmount} onChange={(e) => setWebhookAmount(e.target.value)} placeholder="35000" className={INPUT} />
              </div>
              <div><label className={LABEL}>Bank Provider</label>
                <select value={webhookBank} onChange={(e) => setWebhookBank(e.target.value)} className={INPUT}>
                  <option>Nomba Bank</option>
                  <option>Providus Bank</option>
                  <option>Wema Bank</option>
                </select>
              </div>
            </div>
            <div><label className={LABEL}>Transaction Reference</label>
              <input type="text" value={webhookRef} onChange={(e) => setWebhookRef(e.target.value)} placeholder="Leave empty for auto-reference" className={INPUT} />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
              <button type="button" onClick={() => setIsSimOpen(false)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B] transition-colors">Cancel</button>
              <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…</> : <><Send className="h-3.5 w-3.5" /> Fire Webhook</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
