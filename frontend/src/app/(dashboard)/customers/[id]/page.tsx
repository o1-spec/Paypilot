'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TopNavbar from '@/components/TopNavbar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { 
  ArrowLeft, 
  Building2, 
  CreditCard, 
  FileText, 
  DollarSign, 
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Printer,
  Sparkles,
  Calendar,
  Clock,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { 
  fetchCustomerReport, 
  createInvoice,
  CustomerReport, 
  formatNaira, 
  formatDate,
  Invoice,
  Payment,
  StatementLine
} from '@/lib/api';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<CustomerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'statement' | 'invoices' | 'payments'>('statement');
  
  // Modals & Action States
  const [isCopied, setIsCopied] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Form states
  const [amountVal, setAmountVal] = useState('');
  const [dueDateVal, setDueDateVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomerReport(params.id);
      setReport(data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to compile customer ledger statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [params.id]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCopyAccount = () => {
    if (!report?.virtual_account) return;
    navigator.clipboard.writeText(report.virtual_account.account_number);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
      await createInvoice({
        customer: params.id,
        amount: parseFloat(amountVal),
        due_date: dueDateVal,
        description: descVal,
        invoice_number: invoiceNum,
      });

      triggerSuccess('Billing invoice issued and mapped to customer portfolio.');
      setIsInvoiceModalOpen(false);
      
      // Reset
      setAmountVal('');
      setDueDateVal('');
      setDescVal('');

      await loadReport();
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to issue invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNavbar title="Customer Details" />
        <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
          <LoadingSkeleton type="card-grid" />
          <LoadingSkeleton type="table" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNavbar title="Customer Details" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-2xl bg-white border border-red-150 p-8 shadow-sm text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to load statement</h3>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              onClick={loadReport}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Retry compilation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { customer, virtual_account, total_invoice_amount, total_paid, outstanding_balance, invoices, payments, statement_lines } = report;

  const invoiceColumns = [
    {
      header: 'Invoice Number',
      accessor: (inv: Invoice) => (
        <span className="font-semibold text-slate-900">{inv.invoice_number}</span>
      ),
    },
    {
      header: 'Amount',
      accessor: (inv: Invoice) => (
        <span className="font-bold text-slate-900">{formatNaira(inv.amount)}</span>
      ),
    },
    {
      header: 'Paid',
      accessor: (inv: Invoice) => (
        <span className="font-semibold text-emerald-600">{formatNaira(inv.amount_paid)}</span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (inv: Invoice) => (
        <span className="text-slate-500 font-medium">{formatDate(inv.due_date)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (inv: Invoice) => <StatusBadge status={inv.status} />,
    },
  ];

  const paymentColumns = [
    {
      header: 'Reference',
      accessor: (pay: Payment) => (
        <span className="font-mono font-bold text-slate-800">{pay.reference}</span>
      ),
    },
    {
      header: 'Amount Received',
      accessor: (pay: Payment) => (
        <span className="font-bold text-emerald-600">{formatNaira(pay.amount)}</span>
      ),
    },
    {
      header: 'Date Mapped',
      accessor: (pay: Payment) => (
        <span className="text-slate-500 font-medium">{formatDate(pay.created_at)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (pay: Payment) => <StatusBadge status={pay.status} />,
    },
  ];

  const statementColumns = [
    {
      header: 'Date',
      accessor: (line: StatementLine) => <span className="text-slate-500 font-semibold">{formatDate(line.date)}</span>,
    },
    {
      header: 'Transaction Details',
      accessor: (line: StatementLine) => (
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg border ${
            line.type === 'INVOICE' 
              ? 'bg-rose-50 border-rose-100 text-rose-600' 
              : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {line.type === 'INVOICE' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
          </div>
          <div>
            <span className="block font-semibold text-slate-800 tracking-tight">{line.description}</span>
            <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Ref: {line.reference}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Debit (+)',
      align: 'right' as const,
      accessor: (line: StatementLine) => (
        <span className="font-semibold text-slate-900">
          {parseFloat(line.debit) > 0 ? formatNaira(line.debit) : '—'}
        </span>
      ),
    },
    {
      header: 'Credit (-)',
      align: 'right' as const,
      accessor: (line: StatementLine) => (
        <span className="font-bold text-emerald-600">
          {parseFloat(line.credit) > 0 ? `-${formatNaira(line.credit)}` : '—'}
        </span>
      ),
    },
    {
      header: 'Balance',
      align: 'right' as const,
      accessor: (line: StatementLine) => (
        <span className="font-bold text-slate-900">
          {formatNaira(line.running_balance)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <TopNavbar title="Customer Profile Details" />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
        
        {/* Back Link & Quick Actions header row */}
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers Directory
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsStatementModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 py-2.5 px-4 shadow-sm transition-all"
            >
              <Printer className="h-4 w-4 text-slate-400" />
              View Statement Ledger
            </button>
            <button
              onClick={() => { setActionError(null); setIsInvoiceModalOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-slate-900/10 transition-all"
            >
              <Plus className="h-4 w-4 text-white" />
              Create Invoice
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4.5 text-xs font-bold text-emerald-800 flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-3 duration-250">
            <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Outer Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Ledgers & Statements (Col span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Total balance summary cards */}
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
                <span className="block text-lg font-bold text-slate-900 tracking-tight">
                  {formatNaira(total_invoice_amount)}
                </span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
                <span className="block text-lg font-bold text-emerald-600 tracking-tight">
                  {formatNaira(total_paid)}
                </span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1 border-l-4 border-l-amber-500">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
                <span className="block text-lg font-bold text-amber-600 tracking-tight">
                  {formatNaira(outstanding_balance)}
                </span>
              </div>
            </div>

            {/* Main Tabs Container */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex border-b border-slate-100 pb-px">
                <button
                  onClick={() => setActiveTab('statement')}
                  className={`pb-3.5 px-5 text-xs font-bold transition-all border-b-2 ${
                    activeTab === 'statement'
                      ? 'border-indigo-650 text-indigo-650'
                      : 'border-transparent text-slate-450 hover:text-slate-750'
                  }`}
                >
                  Account Ledger Statement
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`pb-3.5 px-5 text-xs font-bold transition-all border-b-2 ${
                    activeTab === 'invoices'
                      ? 'border-indigo-650 text-indigo-650'
                      : 'border-transparent text-slate-450 hover:text-slate-750'
                  }`}
                >
                  Issued Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`pb-3.5 px-5 text-xs font-bold transition-all border-b-2 ${
                    activeTab === 'payments'
                      ? 'border-indigo-650 text-indigo-650'
                      : 'border-transparent text-slate-450 hover:text-slate-750'
                  }`}
                >
                  Payment History ({payments.length})
                </button>
              </div>

              {/* Render Active Tab */}
              {activeTab === 'statement' && (
                <Table
                  columns={statementColumns}
                  data={statement_lines}
                  emptyState={
                    <EmptyState
                      title="No ledger history"
                      description="Account activities display here when invoices are generated or deposits land."
                      icon={BookOpen}
                    />
                  }
                />
              )}

              {activeTab === 'invoices' && (
                <Table
                  columns={invoiceColumns}
                  data={invoices}
                  emptyState={
                    <EmptyState
                      title="No invoices found"
                      description="There are no billing invoices generated for this customer."
                      icon={FileText}
                    />
                  }
                />
              )}

              {activeTab === 'payments' && (
                <Table
                  columns={paymentColumns}
                  data={payments}
                  emptyState={
                    <EmptyState
                      title="No payments reconciled"
                      description="No deposits have landed in this customer's virtual account yet."
                      icon={DollarSign}
                    />
                  }
                />
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Customer Details, Virtual Accounts, Timeline (Col span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Customer Information Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-indigo-500" />
                Customer Profile Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-indigo-55/40 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    {customer.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">{customer.full_name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{customer.business_name || 'Individual Client'}</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 text-xs border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Email:
                    </span>
                    <span className="font-semibold text-slate-800">{customer.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Phone:
                    </span>
                    <span className="font-semibold text-slate-800">{customer.phone}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      Status:
                    </span>
                    <StatusBadge status={customer.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Allocated Virtual Account Details Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
                Nomba Virtual Account
              </h3>

              {virtual_account ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-2 shadow-inner text-xs relative">
                    <button
                      onClick={handleCopyAccount}
                      className="absolute top-4.5 right-4.5 p-1.5 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Copy account number"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    
                    <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Destination Account</span>
                    <span className="block font-mono font-bold text-sm text-slate-850 select-all tracking-wide">{virtual_account.account_number}</span>
                    <div className="pt-2 border-t border-slate-150/50 flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>Bank:</span>
                      <span className="text-slate-750 font-bold">{virtual_account.bank_name}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Account Name:</span>
                      <span className="font-semibold text-slate-800">{virtual_account.account_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Provider Channel:</span>
                      <span className="font-semibold text-slate-850 font-mono text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">{virtual_account.provider}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="text-slate-400 italic text-xs">No active virtual account provisioned.</span>
                </div>
              )}
            </div>

            {/* 3. Timeline / Recent Activity Feed */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-500" />
                Ledger Timeline Activity
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {/* Invoice issues event log */}
                <div className="relative text-xs space-y-1">
                  <div className="absolute -left-6 top-1 h-4.5 w-4.5 rounded-full border-4 border-white bg-indigo-500 shadow-sm" />
                  <span className="block font-bold text-slate-850">Profile provisioned</span>
                  <span className="block text-[10px] text-slate-400 font-semibold">{formatDate(customer.created_at)}</span>
                </div>

                {invoices.slice(0, 2).map((inv) => (
                  <div key={inv.id} className="relative text-xs space-y-1">
                    <div className="absolute -left-6 top-1 h-4.5 w-4.5 rounded-full border-4 border-white bg-slate-400 shadow-sm" />
                    <span className="block font-bold text-slate-855">Invoice {inv.invoice_number} Issued</span>
                    <p className="text-[10px] text-slate-500 font-medium">Issued for NGN {inv.amount.toLocaleString()}</p>
                    <span className="block text-[9px] text-slate-400 font-semibold">{formatDate(inv.created_at)}</span>
                  </div>
                ))}

                {payments.slice(0, 2).map((p) => (
                  <div key={p.id} className="relative text-xs space-y-1">
                    <div className="absolute -left-6 top-1 h-4.5 w-4.5 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
                    <span className="block font-bold text-emerald-700">Payment {p.reference} Matched</span>
                    <p className="text-[10px] text-slate-500 font-medium">Reconciled NGN {p.amount.toLocaleString()}</p>
                    <span className="block text-[9px] text-slate-400 font-semibold">{formatDate(p.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* CREATE INVOICE MODAL SHELL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Issue Invoice</h3>
            <p className="text-xs text-slate-400 mb-5">Create invoice mapped to customer virtual accounts.</p>
            
            <form onSubmit={handleCreateInvoice} className="space-y-4">
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
                  placeholder="e.g. Supplying retail inventory retainers"
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
                  type="button" onClick={() => setIsInvoiceModalOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={actionLoading}
                  className="rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Issuing...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT-FRIENDLY STATEMENT MODAL SHELL */}
      {isStatementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Customer Statement Ledger</h3>
                  <p className="text-xs text-slate-400 font-medium">Audit account sheet containing invoices and payment details.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => typeof window !== 'undefined' && window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 px-3 py-1.5 shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                    Print / PDF
                  </button>
                  <button
                    onClick={() => setIsStatementModalOpen(false)}
                    className="rounded-lg border border-slate-250 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 px-3 py-1.5"
                  >
                    Close Sheet
                  </button>
                </div>
              </div>

              {/* Statement details layout */}
              <div className="grid grid-cols-2 gap-8 text-xs pb-6 border-b border-slate-100 mb-6">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Merchant issuer</span>
                  <span className="block font-bold text-slate-800">PayPilot Demo Merchant</span>
                  <span className="block text-slate-400">info@gracefoods.ng</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customer recipient</span>
                  <span className="block font-bold text-slate-850">{customer.full_name}</span>
                  <span className="block text-slate-400">{customer.business_name || 'Individual'} &bull; {customer.email}</span>
                </div>
              </div>

              {/* Statement summary cards */}
              <div className="grid grid-cols-3 gap-5 text-center pb-6">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Invoiced</span>
                  <span className="font-bold text-xs text-slate-800">{formatNaira(total_invoice_amount)}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reconciled</span>
                  <span className="font-bold text-xs text-emerald-600">{formatNaira(total_paid)}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outstanding balance</span>
                  <span className="font-bold text-xs text-amber-600">{formatNaira(outstanding_balance)}</span>
                </div>
              </div>

              {/* Ledger Statement table */}
              <Table
                columns={statementColumns}
                data={statement_lines}
                emptyState={
                  <EmptyState
                    title="No statement transactions logged"
                    description="Transactions appear when billing schedules or bank deposits register."
                    icon={BookOpen}
                  />
                }
              />
            </div>
            
            <div className="border-t border-slate-100 pt-5 mt-6 text-[10px] text-slate-450 flex justify-between">
              <span>PayPilot platform dedicated virtual accounts ledger statement sheet.</span>
              <span>Generated on {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
