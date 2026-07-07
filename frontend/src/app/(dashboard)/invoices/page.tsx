'use client';

import React, { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import SearchBar from '@/components/SearchBar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { FileText, Plus, Calendar, AlertOctagon, AlertTriangle, RefreshCw, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { fetchInvoices, createInvoice, cancelInvoice, fetchCustomers, Customer, Invoice, formatNaira, formatDate } from '@/lib/api';
import { useToast } from '@/components/Toast';

const INPUT = 'w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold';
const LABEL = 'block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const [selectedCust, setSelectedCust] = useState('');
  const [amountVal, setAmountVal] = useState('');
  const [dueDateVal, setDueDateVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const [data, custList] = await Promise.all([fetchInvoices(params), fetchCustomers()]);
      setInvoices(data); setCustomers(custList);
    } catch (e: any) { setError(e.response?.data?.detail || e.message || 'Failed to load invoices.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const handleCancelInvoice = async (id: string) => {
    try {
      const updated = await cancelInvoice(id);
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: updated.status } : inv));
      toast(`Invoice ${updated.invoice_number} cancelled successfully.`, 'info');
    } catch (e: any) {
      toast(e.response?.data?.error || 'Failed to cancel invoice.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setActionLoading(true);
    try {
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
      const newInv = await createInvoice({ customer: selectedCust, amount: parseFloat(amountVal), due_date: dueDateVal, description: descVal, invoice_number: invoiceNum });
      setInvoices(prev => [newInv, ...prev]);
      setIsModalOpen(false);
      setSelectedCust(''); setAmountVal(''); setDueDateVal(''); setDescVal('');
      toast(`Invoice ${newInv.invoice_number} created and issued.`, 'success');
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Failed to create invoice.', 'error');
    } finally { setActionLoading(false); }
  };

  const filtered = invoices.filter(inv => {
    const term = searchVal.toLowerCase();
    return (inv.invoice_number || '').toLowerCase().includes(term) ||
      (inv.customer_name || '').toLowerCase().includes(term) ||
      (inv.description || '').toLowerCase().includes(term);
  });

  const columns = [
    {
      header: 'Invoice ID',
      accessor: (inv: Invoice) => (
        <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-amber-600 hover:text-amber-500 hover:underline tracking-tight">{inv.invoice_number}</Link>
      ),
    },
    {
      header: 'Customer & Description',
      accessor: (inv: Invoice) => (
        <div>
          <span className="block font-semibold text-[#0F172A] tracking-tight">{inv.customer_name}</span>
          <span className="block text-[10px] text-[#94A3B8] font-medium mt-0.5">{inv.description}</span>
        </div>
      ),
    },
    { header: 'Amount Due', accessor: (inv: Invoice) => <span className="font-bold text-[#0F172A]">{formatNaira(inv.amount)}</span> },
    { header: 'Amount Paid', accessor: (inv: Invoice) => <span className="font-bold text-emerald-600">{formatNaira(inv.amount_paid)}</span> },
    {
      header: 'Due Date',
      accessor: (inv: Invoice) => (
        <div className="flex items-center gap-1.5 text-[#64748B] font-semibold"><Calendar className="h-3.5 w-3.5 text-[#94A3B8]" />{formatDate(inv.due_date)}</div>
      ),
    },
    { header: 'Status', accessor: (inv: Invoice) => <StatusBadge status={inv.status} /> },
    {
      header: 'Actions',
      align: 'right' as const,
      accessor: (inv: Invoice) => (
        <div className="flex justify-end gap-2">
          <Link href={`/invoices/${inv.id}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-600 bg-amber-50 hover:bg-amber-100/50 rounded-lg px-2.5 py-1.5 border border-amber-200 transition-colors">
            View Details
          </Link>
          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
            <button onClick={() => setCancellingInvoice(inv)} className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-500 bg-rose-50 hover:bg-rose-100/50 rounded-lg px-2.5 py-1.5 border border-rose-200 transition-colors">
              <AlertOctagon className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F6F1]">
      <TopNavbar title="Invoices Ledger" />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Invoices</h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">Manage payment schedules, review due collections, and track invoice payments.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white py-2.5 px-4 shadow-md transition-all">
            <Plus className="h-4 w-4" /> Issue Invoice
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-[#E5E2DC] shadow-sm">
          <SearchBar value={searchVal} onChange={setSearchVal} placeholder="Search by invoice number, customer, description..." />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-[#E5E2DC] bg-[#FAFAF8] hover:bg-[#F0EDE8] text-xs py-2 px-3 outline-none text-[#0F172A] font-bold">
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERPAID">Overpaid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? <LoadingSkeleton type="table" /> : error ? (
          <div className="bg-white border border-[#E5E2DC] rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-[#0F172A]">Failed to load invoices</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">{error}</p>
            <button onClick={loadData} className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white"><RefreshCw className="h-4 w-4" /> Retry</button>
          </div>
        ) : (
          <Table columns={columns} data={filtered} emptyState={
            <EmptyState title="No invoices found" description="Issue a new invoice to assign billing balances to your customer portfolios." icon={FileText} action={{ label: 'Issue Invoice', onClick: () => setIsModalOpen(true) }} />
          } />
        )}
      </main>

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E5E2DC] p-6 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B]"><X className="h-4 w-4" /></button>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Issue Invoice</h3>
            <p className="text-xs text-[#64748B] mb-5">Create a payment schedule mapped to customer virtual accounts.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className={LABEL}>Assign Customer</label>
                <select required value={selectedCust} onChange={e => setSelectedCust(e.target.value)} className={INPUT}>
                  <option value="">Select Customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.virtual_account?.account_number || 'No Account'})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={LABEL}>Amount (NGN)</label><input type="number" required value={amountVal} onChange={e => setAmountVal(e.target.value)} placeholder="e.g. 150000" className={INPUT} /></div>
                <div><label className={LABEL}>Due Date</label><input type="date" required value={dueDateVal} onChange={e => setDueDateVal(e.target.value)} className={INPUT} /></div>
              </div>
              <div><label className={LABEL}>Description</label><input type="text" required value={descVal} onChange={e => setDescVal(e.target.value)} placeholder="e.g. Supplying retail inventory retainers" className={INPUT} /></div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B]">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                  {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Issuing…</> : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E5E2DC] p-6 shadow-2xl">
            <h3 className="text-sm font-extrabold text-[#0F172A] mb-1.5">Cancel Invoice Billing</h3>
            <p className="text-xs text-[#64748B] mb-5 leading-normal">
              Are you sure you want to cancel invoice <strong className="font-mono text-[#0F172A]">{cancellingInvoice.invoice_number}</strong>? Reconciling payments won't apply to cancelled schedules.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
              <button type="button" onClick={() => setCancellingInvoice(null)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B]">Go Back</button>
              <button type="button" onClick={() => { handleCancelInvoice(cancellingInvoice.id); setCancellingInvoice(null); }} className="rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white px-5 py-2.5 shadow-md">
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
