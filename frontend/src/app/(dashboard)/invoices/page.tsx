'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { fetchInvoices, createInvoice, fetchCustomers, Customer, Invoice, formatNaira, formatDate } from '@/lib/api';
import { FileText, Search, Plus, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const invoiceData = await fetchInvoices();
      setInvoices(invoiceData);
      
      const customerData = await fetchCustomers();
      setCustomers(customerData);
    } catch (e: any) {
      setError(e.message || 'Failed to load invoices records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      await createInvoice({
        customer: customerId,
        amount: parseFloat(amount),
        description,
        due_date: dueDate,
        invoice_number: invoiceNumber
      });
      setActionSuccess('Invoice issued successfully and mapped to customer profile!');
      setCustomerId('');
      setAmount('');
      setDescription('');
      setDueDate('');
      
      await loadData();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setActionSuccess(null);
      }, 1500);
    } catch (e: any) {
      setActionError(e.message || 'Failed to create invoice');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter invoices based on search & filter tabs
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = (inv.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inv.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inv.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Invoices Ledger" />

      <div className="flex-1 p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Controls Panel */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, description, invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition-all"
            />
          </div>

          {/* Filter Status Selector & Create Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs py-2 px-3 outline-none text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERPAID">Overpaid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
            <button
              onClick={() => {
                setActionError(null);
                setActionSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-indigo-600/10 transition-all"
            >
              <Plus className="h-4 w-4 text-white" />
              Issue Invoice
            </button>
          </div>
        </div>

        {/* Invoices List Display */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs font-semibold text-slate-500">Loading invoices database...</span>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to Load Invoices</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Make sure the Django REST API is running at http://localhost:8000.</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Invoice Number</th>
                    <th className="py-3 px-6">Customer & Description</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Amount Paid</th>
                    <th className="py-3 px-6">Due Date</th>
                    <th className="py-3 px-6">Nomba VA Destination</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-700">{inv.invoice_number}</td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {inv.customer_name}
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{inv.description}</span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">{formatNaira(inv.amount)}</td>
                      <td className="py-4 px-6 font-semibold text-emerald-600">{formatNaira(inv.amount_paid)}</td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(inv.due_date)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {inv.account_number ? (
                          <div>
                            <span className="font-mono text-slate-800 font-semibold">{inv.account_number}</span>
                            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">{inv.bank_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No account linked</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          inv.status === 'OVERPAID' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' :
                          inv.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <div className="rounded-full bg-slate-50 p-4 text-slate-400 w-14 h-14 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Invoices Found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">There are no invoices matching your filters. Try adjusting query or click Issue Invoice to write a new invoice.</p>
            </div>
          </div>
        )}
      </div>

      {/* Issue Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Issue Invoice</h3>
            <p className="text-xs text-slate-400 mb-5">Generates invoice record mapped to a selected customer profile.</p>
            
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Assign Customer</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.virtual_account?.account_number || 'No Account'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Amount (NGN)</label>
                  <input
                    type="number" required value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Due Date</label>
                  <input
                    type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <input
                  type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Supplying bakery items"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              {actionError && <div className="rounded-lg bg-red-50 text-red-600 text-[10px] font-bold p-3 border border-red-200">{actionError}</div>}
              {actionSuccess && <div className="rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold p-3 border border-emerald-200">{actionSuccess}</div>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4 py-2 hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-2.5 shadow-md shadow-indigo-600/10"
                >
                  {actionLoading ? 'Processing...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
