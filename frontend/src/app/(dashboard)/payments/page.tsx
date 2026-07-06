'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { fetchPayments, triggerWebhook, fetchCustomers, Customer, Payment, formatNaira, formatDate } from '@/lib/api';
import { DollarSign, Search, Send, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Webhook Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [webhookAccount, setWebhookAccount] = useState('');
  const [webhookAmount, setWebhookAmount] = useState('');
  const [webhookBank, setWebhookBank] = useState('Nomba Bank');
  const [webhookRef, setWebhookRef] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const paymentData = await fetchPayments();
      setPayments(paymentData);
      
      const customerData = await fetchCustomers();
      setCustomers(customerData);
    } catch (e: any) {
      setError(e.message || 'Failed to load payments transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await triggerWebhook({
        destination_account_number: webhookAccount,
        amount: parseFloat(webhookAmount),
        reference: webhookRef || undefined
      });
      
      const reconciled = response.status === 'MATCHED';
      if (reconciled) {
        setActionSuccess(`Webhook processed! Reconciled with customer profile.`);
      } else {
        setActionSuccess('Payment recorded! Processed as an unmatched transfer (account not found).');
      }
      
      setWebhookAccount('');
      setWebhookAmount('');
      setWebhookBank('Nomba Bank');
      setWebhookRef('');
      
      await loadData();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setActionSuccess(null);
      }, 1800);
    } catch (e: any) {
      setActionError(e.message || 'Failed to process webhook transfer');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter payments based on search & filter tabs
  const filteredPayments = payments.filter(pay => {
    const matchesSearch = (pay.customer_name || 'Unmatched').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (pay.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (pay.account_number || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || pay.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Payments Stream" />

      <div className="flex-1 p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Controls Panel */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, reference, VA number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition-all"
            />
          </div>

          {/* Filter Status & Webhook Trigger Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs py-2 px-3 outline-none text-slate-700 font-medium"
            >
              <option value="all">All Reconciliations</option>
              <option value="MATCHED">Reconciled Only</option>
              <option value="UNMATCHED">Unmatched Only</option>
            </select>
            
            <button
              onClick={() => {
                setActionError(null);
                setActionSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-indigo-600/10 transition-all"
            >
              <Send className="h-4 w-4 text-white" />
              Simulate Webhook Payment
            </button>
          </div>
        </div>

        {/* Payments List Display */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs font-semibold text-slate-500">Loading transaction stream...</span>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to Load Payments</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Make sure the Django REST API is running at http://localhost:8000.</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Transaction Ref / ID</th>
                    <th className="py-3 px-6">Customer & Details</th>
                    <th className="py-3 px-6">Amount Received</th>
                    <th className="py-3 px-6">Virtual Account Destination</th>
                    <th className="py-3 px-6 text-right">Reconciliation status</th>
                    <th className="py-3 px-6 text-right">Time received</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((pay) => (
                    <tr 
                      key={pay.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                        pay.status === 'UNMATCHED' ? 'bg-red-50/30 border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-500">
                        {pay.reference}
                        <span className="block text-[8px] font-normal text-slate-400 mt-0.5">{pay.id}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {pay.customer_name || 'Unmatched Depositor'}
                        <span className="block text-[10px] font-normal text-slate-500 italic mt-0.5">
                          {pay.status === 'MATCHED' 
                            ? `Reconciled against Invoice ${pay.invoice_number || 'N/A'}` 
                            : `Unmatched payment from ${pay.sender_name || 'Unknown'}`
                          }
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">{formatNaira(pay.amount)}</td>
                      <td className="py-4 px-6 font-mono text-slate-700">
                        {pay.account_number || 'N/A'}
                        <span className="block text-[9px] font-sans font-medium text-slate-400 mt-0.5">{pay.bank_name || 'No Bank'}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                          pay.status === 'MATCHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                        }`}>
                          <CheckCircle2 className="h-3 w-3" />
                          {pay.status === 'MATCHED' ? 'Reconciled' : 'Unmatched'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400 font-medium">
                        {formatDate(pay.created_at)}
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
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Payments Recorded</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">There are no payment transfers logged. Use the webhook simulator to invoke an inbound mock payment event.</p>
            </div>
          </div>
        )}
      </div>

      {/* Simulate Webhook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Simulate Nomba Webhook</h3>
            <p className="text-xs text-slate-400 mb-5">Simulates an inbound transfer hitting the webhook listener.</p>
            
            <form onSubmit={handleTriggerWebhook} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Destination Virtual Account</label>
                <div className="flex gap-2">
                  <input
                    type="text" required value={webhookAccount} onChange={(e) => setWebhookAccount(e.target.value)}
                    placeholder="10-digit account number"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                  <select
                    onChange={(e) => setWebhookAccount(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs px-2 outline-none text-slate-700 max-w-[120px]"
                  >
                    <option value="">Fill VA...</option>
                    {customers.map((c) => c.virtual_account && (
                      <option key={c.id} value={c.virtual_account.account_number}>
                        {c.full_name} ({c.virtual_account.account_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Transfer Amount (NGN)</label>
                  <input
                    type="number" required value={webhookAmount} onChange={(e) => setWebhookAmount(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Bank Provider (Mock)</label>
                  <select
                    value={webhookBank} onChange={(e) => setWebhookBank(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  >
                    <option value="Nomba Bank">Nomba Bank</option>
                    <option value="Providus Bank">Providus Bank</option>
                    <option value="Wema Bank">Wema Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Transaction Reference (Optional)</label>
                <input
                  type="text" value={webhookRef} onChange={(e) => setWebhookRef(e.target.value)}
                  placeholder="Leave empty for auto-generated ref"
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
                  {actionLoading ? 'Processing Webhook...' : 'Fire Webhook Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
