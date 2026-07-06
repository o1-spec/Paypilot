'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TopNavbar from '@/components/TopNavbar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { 
  ArrowLeft, 
  Building2, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Copy,
  Check,
  Printer,
  Sparkles,
  AlertOctagon,
  Calendar,
  Mail,
  Phone,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { 
  fetchInvoice, 
  cancelInvoice, 
  fetchPayments,
  Invoice,
  Payment,
  formatNaira, 
  formatDate
} from '@/lib/api';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Action status indicators
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvoice(params.id);
      setInvoice(data);

      const paymentList = await fetchPayments();
      // Filter payments that match this invoice ID
      const matchingPayments = paymentList.filter((p) => p.invoice === params.id && p.status === 'MATCHED');
      setPayments(matchingPayments);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to retrieve invoice details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCopyAccount = () => {
    if (!invoice?.account_number) return;
    navigator.clipboard.writeText(invoice.account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const updated = await cancelInvoice(invoice.id);
      setInvoice(updated);
      triggerSuccess(`Invoice ${updated.invoice_number} successfully cancelled.`);
    } catch (e: any) {
      const data = e.response?.data;
      setError(data?.error || data?.detail || 'Failed to cancel invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNavbar title="Invoice Details" />
        <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          <LoadingSkeleton type="card-grid" />
          <LoadingSkeleton type="table" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNavbar title="Invoice Details" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-2xl bg-white border border-red-150 p-8 shadow-sm text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to load invoice</h3>
            <p className="text-xs text-slate-500">{error}</p>
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

  const remainingBalance = Math.max(0, invoice.amount - invoice.amount_paid);

  const paymentColumns = [
    {
      header: 'Reference',
      accessor: (p: Payment) => (
        <span className="font-mono font-bold text-slate-800">{p.reference}</span>
      ),
    },
    {
      header: 'Amount Reconciled',
      accessor: (p: Payment) => (
        <span className="font-bold text-emerald-600">{formatNaira(p.amount)}</span>
      ),
    },
    {
      header: 'Bank Channel',
      accessor: (p: Payment) => (
        <span className="text-slate-500 font-semibold">{p.bank_name || 'Nomba Bank'}</span>
      ),
    },
    {
      header: 'Date Cleared',
      accessor: (p: Payment) => (
        <span className="text-slate-400 font-medium">{formatDate(p.created_at)}</span>
      ),
    },
    {
      header: 'Reconciliation',
      accessor: (p: Payment) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <TopNavbar title="Invoice Details" />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
        
        {/* Back Link & Page Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices Ledger
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => typeof window !== 'undefined' && window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 py-2.5 px-4 shadow-sm transition-all"
            >
              <Printer className="h-4 w-4 text-slate-400" />
              Print Invoice
            </button>
            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-600 py-2.5 px-4 shadow-sm border border-rose-150 transition-all disabled:opacity-50"
              >
                <AlertOctagon className="h-4 w-4 text-rose-500" />
                Cancel Invoice
              </button>
            )}
          </div>
        </div>

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4.5 text-xs font-bold text-emerald-800 flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-3 duration-250">
            <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Invoice Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Invoice items & Payments Feed (col span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stripe Invoice Core Frame */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
              
              {/* Stripe Header: Logo and Invoice details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-widest">PayPilot Billing</span>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{invoice.invoice_number}</h2>
                </div>
                <div>
                  <StatusBadge status={invoice.status} />
                </div>
              </div>

              {/* Amount and description summary */}
              <div className="grid grid-cols-3 gap-6 bg-slate-50 border border-slate-150 rounded-2xl p-5 shadow-inner">
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Total</span>
                  <span className="font-extrabold text-base text-slate-900">{formatNaira(invoice.amount)}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Paid</span>
                  <span className="font-extrabold text-base text-emerald-600">{formatNaira(invoice.amount_paid)}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining Balance</span>
                  <span className="font-extrabold text-base text-slate-900">
                    {remainingBalance > 0 ? formatNaira(remainingBalance) : '₦0.00'}
                  </span>
                </div>
              </div>

              {/* Description body */}
              <div className="space-y-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Billing Description</span>
                <p className="text-xs text-slate-650 leading-relaxed font-semibold">{invoice.description}</p>
              </div>
            </div>

            {/* Matched Payments Table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-xs text-slate-405 uppercase tracking-wider">Reconciled Deposits</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Bank transfer collections automatically mapped to this invoice.</p>
              </div>

              <Table
                columns={paymentColumns}
                data={payments}
                emptyState={
                  <EmptyState
                    title="No payments reconciled"
                    description="No deposits have cleared this invoice balance yet. Wire a simulated payment to test."
                    icon={DollarSign}
                  />
                }
              />
            </div>

          </div>

          {/* RIGHT SIDE: Customer and Nomba Virtual Account sidebar (col span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Customer Information Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-indigo-500" />
                Customer Recipient
              </h3>
              
              <div className="space-y-3.5">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none">
                    {invoice.customer_name || 'Business Customer'}
                  </h4>
                  {invoice.business_name && (
                    <span className="block text-[10px] text-slate-400 font-semibold mt-1">{invoice.business_name}</span>
                  )}
                </div>

                <div className="space-y-2 text-xs pt-3 border-t border-slate-50">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Contact Email:</span>
                    <span className="font-bold text-slate-800">Available on profile</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Issuer Merchant:</span>
                    <span className="font-bold text-slate-800">Scoped Tenant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Target Nomba Virtual Account card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
                Dedicated Virtual Bank Channel
              </h3>

              {invoice.account_number ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-2 shadow-inner text-xs relative">
                    <button
                      onClick={handleCopyAccount}
                      className="absolute top-4.5 right-4.5 p-1.5 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Copy account number"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    
                    <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Destination Account</span>
                    <span className="block font-mono font-bold text-sm text-slate-850 select-all tracking-wide">{invoice.account_number}</span>
                    <div className="pt-2 border-t border-slate-150/50 flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>Bank:</span>
                      <span className="text-slate-755 font-bold">{invoice.bank_name || 'Providus Bank'}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 text-[10px] text-slate-450 leading-normal">
                    💡 **Automated Flow**: Direct transfers hitting this account clear this invoice balance in real-time.
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="text-slate-400 italic text-xs">No linked virtual banking details.</span>
                </div>
              )}
            </div>

            {/* 3. Invoice lifecycle Timeline */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-500" />
                Lifecycle Audit Timeline
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {/* 1. Created */}
                <div className="relative text-xs space-y-1">
                  <div className="absolute -left-6 top-1 h-4.5 w-4.5 rounded-full border-4 border-white bg-indigo-500 shadow-sm" />
                  <span className="block font-bold text-slate-800">Invoice Issued</span>
                  <span className="block text-[10px] text-slate-400 font-semibold">{formatDate(invoice.created_at)}</span>
                </div>

                {/* 2. Paid / Partial status */}
                {invoice.amount_paid > 0 && (
                  <div className="relative text-xs space-y-1">
                    <div className={`absolute -left-6 top-1 h-4.5 w-4.5 rounded-full border-4 border-white shadow-sm ${
                      invoice.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span className="block font-bold text-slate-800">
                      {invoice.status === 'PAID' ? 'Payment Fully Cleared' : 'Partial Payment Cleared'}
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium">Reconciled NGN {invoice.amount_paid.toLocaleString()}</p>
                  </div>
                )}

                {/* 3. Due Date boundary */}
                {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                  <div className="relative text-xs space-y-1">
                    <div className="absolute -left-6 top-1 h-4.5 w-4.5 rounded-full border-4 border-white bg-slate-350 shadow-sm" />
                    <span className="block font-bold text-slate-800">Due Date deadline</span>
                    <span className="block text-[10px] text-slate-450 font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {invoice.due_date}
                    </span>
                  </div>
                )}

                {/* 4. Cancelled indicator */}
                {invoice.status === 'CANCELLED' && (
                  <div className="relative text-xs space-y-1">
                    <div className="absolute -left-6 top-1 h-4.5 w-4.5 rounded-full border-4 border-white bg-rose-500 shadow-sm" />
                    <span className="block font-bold text-rose-700">Invoice Cancelled</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">Manually deleted</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
