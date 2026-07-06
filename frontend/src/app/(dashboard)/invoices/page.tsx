'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TopNavbar from '@/components/TopNavbar';
import SearchBar from '@/components/SearchBar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { FileText, Plus, Calendar, AlertOctagon, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { 
  fetchInvoices, 
  createInvoice, 
  cancelInvoice, 
  fetchCustomers, 
  Customer, 
  Invoice,
  formatNaira,
  formatDate
} from '@/lib/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedCust, setSelectedCust] = useState('');
  const [amountVal, setAmountVal] = useState('');
  const [dueDateVal, setDueDateVal] = useState('');
  const [descVal, setDescVal] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await fetchInvoices(params);
      setInvoices(data);

      const custList = await fetchCustomers();
      setCustomers(custList);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCancelInvoice = async (id: string) => {
    setError(null);
    try {
      const updated = await cancelInvoice(id);
      // Optimistically update status
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: updated.status } : inv))
      );
      triggerSuccess(`Invoice ${updated.invoice_number} successfully cancelled.`);
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.detail || 'Failed to cancel invoice.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
      const newInv = await createInvoice({
        customer: selectedCust,
        amount: parseFloat(amountVal),
        due_date: dueDateVal,
        description: descVal,
        invoice_number: invoiceNum,
      });

      setInvoices((prev) => [newInv, ...prev]);
      setIsModalOpen(false);

      // Reset forms
      setSelectedCust('');
      setAmountVal('');
      setDueDateVal('');
      setDescVal('');
      triggerSuccess(`Invoice ${newInv.invoice_number} created and issued.`);
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to create invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchVal.toLowerCase();
    return (
      (inv.invoice_number || '').toLowerCase().includes(term) ||
      (inv.customer_name || '').toLowerCase().includes(term) ||
      (inv.description || '').toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      header: 'Invoice ID',
      accessor: (inv: Invoice) => (
        <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-indigo-600 hover:text-indigo-500 hover:underline tracking-tight">
          {inv.invoice_number}
        </Link>
      ),
    },
    {
      header: 'Customer & Description',
      accessor: (inv: Invoice) => (
        <div>
          <span className="block font-semibold text-slate-900 tracking-tight">{inv.customer_name}</span>
          <span className="block text-[10px] text-slate-400 font-medium mt-0.5">{inv.description}</span>
        </div>
      ),
    },
    {
      header: 'Amount Due',
      accessor: (inv: Invoice) => (
        <span className="font-bold text-slate-900">{formatNaira(inv.amount)}</span>
      ),
    },
    {
      header: 'Amount Paid',
      accessor: (inv: Invoice) => (
        <span className="font-bold text-emerald-600">{formatNaira(inv.amount_paid)}</span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (inv: Invoice) => (
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {formatDate(inv.due_date)}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (inv: Invoice) => <StatusBadge status={inv.status} />,
    },
    {
      header: 'Actions',
      align: 'right' as const,
      accessor: (inv: Invoice) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/invoices/${inv.id}`}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100/50 rounded-lg px-2.5 py-1.5 border border-indigo-150 transition-colors"
          >
            View Details
          </Link>
          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
            <button
              onClick={() => handleCancelInvoice(inv.id)}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-500 bg-rose-50 hover:bg-rose-100/50 rounded-lg px-2.5 py-1.5 border border-rose-150 transition-colors"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Invoices Ledger" />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
        <PageHeader
          title="Invoices"
          description="Manage payment schedules, review due collections, and track invoice payments."
          actions={
            <button
              onClick={() => { setActionError(null); setIsModalOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-slate-900/10 transition-all duration-150"
            >
              <Plus className="h-4 w-4 text-white" />
              Issue Invoice
            </button>
          }
        />

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top-3 duration-200">
            <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Filter controls row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
          <SearchBar
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search by invoice number, customer, description..."
          />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs py-2 px-3.5 outline-none text-slate-700 font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERPAID">Overpaid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton type="table" />
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to load invoices</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredInvoices}
            emptyState={
              <EmptyState
                title="No invoices found"
                description="Issue a new invoice to assign billing balances to your customer portfolios."
                icon={FileText}
                action={{
                  label: 'Issue Invoice',
                  onClick: () => setIsModalOpen(true),
                }}
              />
            }
          />
        )}
      </main>

      {/* Create Invoice modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Issue Invoice</h3>
            <p className="text-xs text-slate-400 mb-5">Create a payment schedule mapped to customer virtual accounts.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      {c.full_name} ({c.virtual_account?.account_number || 'No Account'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount (NGN)</label>
                  <input
                    type="number"
                    required
                    value={amountVal}
                    onChange={(e) => setAmountVal(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDateVal}
                    onChange={(e) => setDueDateVal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <input
                  type="text"
                  required
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
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
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Issuing...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
