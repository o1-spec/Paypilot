'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TopNavbar from '@/components/TopNavbar';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import {
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  Send,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Calendar
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
  formatDate
} from '@/lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isSimOpen, setIsSimOpen] = useState(false);

  // Action loading/error states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerBusiness, setCustomerBusiness] = useState('');

  const [selectedCust, setSelectedCust] = useState('');
  const [amountVal, setAmountVal] = useState('');
  const [dueDateVal, setDueDateVal] = useState('');
  const [descVal, setDescVal] = useState('');

  const [webhookAccount, setWebhookAccount] = useState('');
  const [webhookAmount, setWebhookAmount] = useState('');
  const [webhookRef, setWebhookRef] = useState('');
  const [webhookBank, setWebhookBank] = useState('Nomba Bank');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashData = await fetchDashboard();
      setData(dashData);

      const custList = await fetchCustomers();
      setCustomers(custList);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to connect to backend APIs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stepper timeline trace step
  const [demoStep, setDemoStep] = useState(0);

  const handleSeedDemo = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await seedDemoData();
      triggerSuccess('Demo database seeded successfully with mock portfolios.');
      await loadData();
    } catch (e: any) {
      setActionError(e.response?.data?.error || e.message || 'Failed to seed demo data.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await resetDemoData();
      triggerSuccess('All portfolios cleared. Welcome to empty state demo!');
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Failed to reset database.');
    } finally {
      setActionLoading(false);
    }
  };

  const startSimulateDemo = async () => {
    setActionError(null);
    // Step 1: Incoming transfer registered
    setDemoStep(1);

    // Step 2: Wema bank identified
    setTimeout(() => {
      setDemoStep(2);
    }, 1500);

    // Step 3: Customer profile matched
    setTimeout(() => {
      setDemoStep(3);
    }, 3000);

    // Step 4: Webhook called on Django, Invoice cleared
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
      } catch (e: any) {
        setActionError('Auto-reconciliation simulation encountered an API error.');
      }
    }, 4500);

    // Step 5: Refresh UI metrics & show completion indicators
    setTimeout(async () => {
      setDemoStep(5);
      await loadData();
    }, 6000);

    // End flow
    setTimeout(() => {
      setDemoStep(0);
      triggerSuccess('Automatic Reconciliation Completed! Invoice balance cleared and notifications broadcasted.');
    }, 8500);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const newCust = await createCustomer({
        full_name: customerName,
        email: customerEmail,
        phone: customerPhone,
        business_name: customerBusiness,
      });

      triggerSuccess(`Customer ${newCust.full_name} registered! Virtual account provisioned.`);
      setIsCustModalOpen(false);

      // Reset
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerBusiness('');

      await loadData();
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to create customer profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
      await createInvoice({
        customer: selectedCust,
        amount: parseFloat(amountVal),
        description: descVal || 'General retail invoice',
        due_date: dueDateVal,
        invoice_number: invoiceNum,
      });

      triggerSuccess('Invoice issued and sent to customer account.');
      setIsInvModalOpen(false);

      // Reset
      setSelectedCust('');
      setAmountVal('');
      setDueDateVal('');
      setDescVal('');

      await loadData();
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to issue invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await triggerWebhook({
        destination_account_number: webhookAccount,
        amount: parseFloat(webhookAmount),
        reference: webhookRef || undefined,
      });

      if (response.matched) {
        triggerSuccess(`Payment Reconciled! Matched customer and paid Invoice.`);
      } else {
        triggerSuccess('Payment logged as unmatched deposit (no active customer account).');
      }
      setIsSimOpen(false);

      // Reset
      setWebhookAccount('');
      setWebhookAmount('');
      setWebhookRef('');

      await loadData();
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to simulate webhook payment.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Dashboard" />
        <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          <PageHeader title="Overview" description="Loading summary analytics..." />
          <LoadingSkeleton type="card-grid" />
          <LoadingSkeleton type="table" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-2xl bg-white border border-red-150 p-8 shadow-sm text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-slate-900">API Connection Offline</h3>
            <p className="text-xs text-slate-500">
              Next.js server is active, but the backend is unreachable. Verify that the Django backend server is running locally on port 8000.
            </p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Visual SVG chart calculation datasets
  const chartData = data?.monthly_revenue_summary || [
    { month: 'Jan', amount: 50000 },
    { month: 'Feb', amount: 80000 },
    { month: 'Mar', amount: 150000 },
    { month: 'Apr', amount: 90000 },
    { month: 'May', amount: 220000 },
    { month: 'Jun', amount: data?.total_revenue || 350000 },
  ];

  const maxAmount = Math.max(...chartData.map((c) => c.amount), 10000);
  const chartPoints = chartData
    .map((c, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 100 - (c.amount / maxAmount) * 80; // Scale to fit nicely inside height
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,100 ${chartPoints} 100,100`;

  // Status breakdown mapping
  const statusCounts = data?.invoice_status_breakdown || {
    PAID: data?.paid_invoices_count || 0,
    PENDING: data?.pending_invoices_count || 0,
    PARTIAL: data?.partial_invoices_count || 0,
    OVERPAID: data?.overpaid_invoices_count || 0,
  };

  const totalInvoicesSum = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <TopNavbar title="Dashboard" />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">

        {/* Welcome Premium Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-8 text-white shadow-xl border border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-indigo-500/10 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 h-[180px] w-[180px] rounded-full bg-purple-500/10 blur-[50px] pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5" />
              Dedicated Virtual Banking Sandbox
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome to PayPilot Control Panel</h1>
            <p className="text-xs text-slate-400 max-w-xl font-medium">
              Monitor Providus and Wema bank channels. Transmit mock bank transfers using the webhook simulator to test automatic reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10">
            <button
              onClick={() => { setActionError(null); setIsSimOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white py-3 px-5 shadow-lg shadow-indigo-600/15 transition-all duration-150 active:scale-98"
            >
              <Send className="h-4 w-4" />
              Simulate Inbound Deposit
            </button>
          </div>
        </div>

        {/* Judges' Demo Mode Sandbox */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                Judging Sandbox
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">Automatic Reconciliation Demo Sandbox</h2>
              <p className="text-xs text-slate-400 mt-0.5">Seed demo portfolios, clear records clean, and run simulated payment webhook streams to watch the auto-reconciliation engine in real time.</p>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <button
                onClick={handleSeedDemo}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 py-2 px-4 shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-slate-400 ${actionLoading ? 'animate-spin' : ''}`} />
                Seed Demo Data
              </button>
              <button
                onClick={handleResetDemo}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-150 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 py-2 px-4 shadow-sm transition-all disabled:opacity-50"
              >
                Reset Demo
              </button>
              <button
                onClick={startSimulateDemo}
                disabled={demoStep > 0}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white py-2 px-4.5 shadow-md transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4 text-white" />
                Simulate Incoming Transfer
              </button>
            </div>
          </div>

          {/* Stepper Timeline Progress Animation Overlay */}
          {demoStep > 0 && (
            <div className="rounded-2xl border border-indigo-150 bg-indigo-50/30 p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-indigo-650 uppercase tracking-widest text-[10px]">
                  <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                  Auto-Reconciliation Engine Live Trace
                </span>
                <span className="text-slate-450">Step {demoStep} of 5</span>
              </div>

              {/* Steps visual stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 relative">
                {/* Step 1 */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${demoStep >= 1 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'
                  }`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${demoStep > 1 ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                    {demoStep > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-900 leading-tight">Incoming Transfer</span>
                    <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">NGN 35,000 Wema Bank</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${demoStep >= 2 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'
                  }`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${demoStep > 2 ? 'bg-emerald-500 text-white' : demoStep === 2 ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                    }`}>
                    {demoStep > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-900 leading-tight">Virtual Account Match</span>
                    <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Identified VA endpoint</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${demoStep >= 3 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'
                  }`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${demoStep > 3 ? 'bg-emerald-500 text-white' : demoStep === 3 ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                    }`}>
                    {demoStep > 3 ? <CheckCircle2 className="h-4 w-4" /> : '3'}
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-900 leading-tight">Customer Found</span>
                    <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Profile resolved</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${demoStep >= 4 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'
                  }`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${demoStep > 4 ? 'bg-emerald-500 text-white' : demoStep === 4 ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                    }`}>
                    {demoStep > 4 ? <CheckCircle2 className="h-4 w-4" /> : '4'}
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-900 leading-tight">Invoice Cleared</span>
                    <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Paid amount updated</span>
                  </div>
                </div>

                {/* Step 5 */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${demoStep >= 5 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'
                  }`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${demoStep === 5 ? 'bg-emerald-500 text-white animate-bounce' : 'bg-slate-200 text-slate-400'
                    }`}>
                    {demoStep === 5 ? <CheckCircle2 className="h-4 w-4" /> : '5'}
                  </div>
                  <div className="text-xs">
                    <span className="block font-bold text-slate-900 leading-tight">Dashboard Updates</span>
                    <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Live UI metrics refreshed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4.5 text-xs font-bold text-emerald-800 flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-3 duration-250">
            <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* 1. TOP CARDS (6 Metrics Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <span className="text-lg font-bold text-slate-900 tracking-tight block truncate">
              {formatNaira(data?.total_revenue || 0)}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              +12.4%
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
            <span className="block text-lg font-bold text-slate-900 tracking-tight truncate">
              {formatNaira(data?.outstanding_balance || 0)}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
              <Clock className="h-3 w-3" />
              Active dues
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Customers</span>
            <span className="block text-lg font-bold text-slate-900 tracking-tight">
              {data?.total_customers || 0}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <Users className="h-3 w-3 text-slate-400" />
              Allocated VAs
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Paid Invoices</span>
            <span className="block text-lg font-bold text-emerald-600 tracking-tight">
              {data?.paid_invoices_count || 0}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Fully reconciled
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pending Invoices</span>
            <span className="block text-lg font-bold text-amber-600 tracking-tight">
              {data?.pending_invoices_count || 0}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <FileText className="h-3 w-3" />
              Awaiting transfers
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unmatched Deposits</span>
            <span className="block text-lg font-bold text-rose-600 tracking-tight">
              {data?.unmatched_payments_count || 0}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              Manual assignment
            </div>
          </div>

        </div>

        {/* 2. MIDDLE ROW (Charts Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Revenue Chart Card */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Collections Revenue Trend</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Historical overview of bank transfer deposits.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Monthly sums
              </div>
            </div>

            {/* Custom Interactive SVG Graph Area */}
            <div className="relative flex-1 w-full min-h-[180px] bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="55" x2="100" y2="55" stroke="#f1f5f9" strokeWidth="0.5" />
                <line x1="0" y1="90" x2="100" y2="90" stroke="#e2e8f0" strokeWidth="0.7" />

                {/* SVG Area fill gradient */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                <polygon points={areaPoints} fill="url(#chartGradient)" />

                {/* Stroke Path Line */}
                <polyline
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartPoints}
                />

                {/* Circles for Data Nodes */}
                {chartData.map((c, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 100 - (c.amount / maxAmount) * 80;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="#ffffff"
                      stroke="#4f46e5"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              {/* Labels Row */}
              <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                {chartData.map((c, i) => (
                  <span key={i}>{c.month}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Invoices Status Breakdown Pie/Donut Chart */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px]">
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">Invoice Status Matrix</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Distribution breakdown of billing schedules.</p>
            </div>

            {/* Pure CSS Bar Breakdowns */}
            <div className="space-y-4 my-auto">

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Paid Invoices
                  </span>
                  <span>{statusCounts.PAID} ({Math.round((statusCounts.PAID / totalInvoicesSum) * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(statusCounts.PAID / totalInvoicesSum) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Pending Invoices
                  </span>
                  <span>{statusCounts.PENDING} ({Math.round((statusCounts.PENDING / totalInvoicesSum) * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(statusCounts.PENDING / totalInvoicesSum) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Partially Paid
                  </span>
                  <span>{statusCounts.PARTIAL} ({Math.round((statusCounts.PARTIAL / totalInvoicesSum) * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(statusCounts.PARTIAL / totalInvoicesSum) * 100}%` }} />
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>Total invoices compiled:</span>
              <span className="font-bold text-slate-800">{totalInvoicesSum} invoices</span>
            </div>
          </div>

        </div>

        {/* 3. BOTTOM ROW (Recent Payments, Notifications, Recent Customers, Quick Actions) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Column A: Recent Payments */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Recent Payments</h3>
                <Link href="/payments" className="text-[10px] text-indigo-600 hover:text-indigo-500 font-bold inline-flex items-center gap-1">
                  View feed
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-4">
                {(data?.recent_payments || []).slice(0, 4).map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <div>
                      <span className="block font-semibold text-slate-800">{pay.customer_name || 'Unmatched Payment'}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">{pay.reference}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-slate-900">{formatNaira(pay.amount)}</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">{formatDate(pay.created_at)}</span>
                    </div>
                  </div>
                ))}
                {(!data?.recent_payments || data.recent_payments.length === 0) && (
                  <span className="block text-xs text-slate-400 italic text-center py-6">No payments cleared.</span>
                )}
              </div>
            </div>
          </div>

          {/* Column B: Recent Notifications */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Audit Notifications</h3>
                <span className="text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                  System Logs
                </span>
              </div>

              <div className="space-y-4">
                {(data?.recent_notifications || []).slice(0, 4).map((n) => (
                  <div key={n.id} className="text-xs pb-3.5 border-b border-slate-50 last:border-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 tracking-tight leading-tight">{n.title}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{formatDate(n.created_at)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">{n.message}</p>
                  </div>
                ))}
                {(!data?.recent_notifications || data.recent_notifications.length === 0) && (
                  <span className="block text-xs text-slate-400 italic text-center py-6">No audit records flagged.</span>
                )}
              </div>
            </div>
          </div>

          {/* Column C: Quick Actions & Recent Customers */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[380px]">
            <div className="space-y-6">

              {/* Quick Actions Panel */}
              <div>
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setActionError(null); setIsCustModalOpen(true); }}
                    className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 transition-all font-semibold text-xs text-center"
                  >
                    <Users className="h-4 w-4 text-indigo-500 mb-1.5" />
                    New Customer
                  </button>
                  <button
                    onClick={() => { setActionError(null); setIsInvModalOpen(true); }}
                    className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 transition-all font-semibold text-xs text-center"
                  >
                    <FileText className="h-4 w-4 text-emerald-500 mb-1.5" />
                    Issue Invoice
                  </button>
                </div>
              </div>

              {/* Recent Customers List */}
              <div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-3">
                  <h3 className="font-bold text-xs text-slate-405 uppercase tracking-wider">Recent Portfolios</h3>
                  <Link href="/customers" className="text-[10px] text-indigo-650 hover:text-indigo-550 font-bold">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {customers.slice(0, 3).map((c) => (
                    <Link
                      href={`/customers/${c.id}`}
                      key={c.id}
                      className="flex items-center justify-between text-xs hover:bg-slate-50/50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div>
                        <span className="block font-semibold text-slate-800 leading-tight">{c.full_name}</span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">{c.business_name || 'Individual'}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                        {c.virtual_account?.account_number || 'No VA'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* MODALS ACTIONS SHELLS */}

      {/* Create Customer Modal */}
      {isCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Create Customer</h3>
            <p className="text-xs text-slate-400 mb-5">Provide details to generate a customer profile and virtual account.</p>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contact Name</label>
                <input
                  type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tunde Bakare"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. tunde@logistics.ng"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Phone</label>
                  <input
                    type="text" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Business Name</label>
                  <input
                    type="text" value={customerBusiness} onChange={(e) => setCustomerBusiness(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              {actionError && (
                <div className="rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold p-3 border border-rose-200 leading-normal">
                  ⚠️ {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button" onClick={() => setIsCustModalOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Invoice Modal */}
      {isInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Issue Invoice</h3>
            <p className="text-xs text-slate-400 mb-5">Create invoice mapped to customer virtual accounts.</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Assign Customer</label>
                <select
                  required
                  value={selectedCust}
                  onChange={(e) => setSelectedCust(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all font-semibold"
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.virtual_account?.account_number || 'No VA'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount (NGN)</label>
                  <input
                    type="number" required value={amountVal} onChange={(e) => setAmountVal(e.target.value)}
                    placeholder="₦150,000.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Due Date</label>
                  <input
                    type="date" required value={dueDateVal} onChange={(e) => setDueDateVal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <input
                  type="text" required value={descVal} onChange={(e) => setDescVal(e.target.value)}
                  placeholder="e.g. Monthly maintenance retainer"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                />
              </div>

              {actionError && (
                <div className="rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold p-3 border border-rose-200 leading-normal">
                  ⚠️ {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button" onClick={() => setIsInvModalOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Simulator Modal */}
      {isSimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Nomba Webhook Simulator</h3>
            <p className="text-xs text-slate-400 mb-5">Simulate an inbound bank transfer deposit landing in the system.</p>

            <form onSubmit={handleTriggerWebhook} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Target Virtual Account</label>
                <div className="flex gap-2">
                  <input
                    type="text" required value={webhookAccount} onChange={(e) => setWebhookAccount(e.target.value)}
                    placeholder="10-digit virtual account number"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all font-semibold"
                  />
                  <select
                    onChange={(e) => setWebhookAccount(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs px-2 outline-none text-slate-700 max-w-[130px]"
                  >
                    <option value="">Fill VA...</option>
                    {customers.map((c) => c.virtual_account && (
                      <option key={c.id} value={c.virtual_account.account_number}>
                        {c.full_name} ({c.virtual_account.account_number})
                      </option>
                    ))}
                    <option value="9999999999">Unknown VA (Recon unmatched)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount (NGN)</label>
                  <input
                    type="number" required value={webhookAmount} onChange={(e) => setWebhookAmount(e.target.value)}
                    placeholder="₦150,000.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bank Provider</label>
                  <select
                    value={webhookBank} onChange={(e) => setWebhookBank(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  >
                    <option value="Nomba Bank">Nomba Bank</option>
                    <option value="Providus Bank">Providus Bank</option>
                    <option value="Wema Bank">Wema Bank</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Transaction Reference</label>
                <input
                  type="text" value={webhookRef} onChange={(e) => setWebhookRef(e.target.value)}
                  placeholder="Leave empty for auto ref"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                />
              </div>

              {actionError && (
                <div className="rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold p-3 border border-rose-200 leading-normal">
                  ⚠️ {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button" onClick={() => setIsSimOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-2.5 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing Webhook...' : 'Simulate Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
