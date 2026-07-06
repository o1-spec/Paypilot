'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { 
  fetchDashboard, 
  fetchCustomers,
  createCustomer, 
  createInvoice, 
  triggerWebhook,
  DashboardData,
  Customer,
  formatNaira,
  formatDate
} from '@/lib/api';
import { 
  Users, 
  TrendingUp, 
  FileCheck2, 
  AlertTriangle, 
  Plus, 
  Send, 
  ArrowUpRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  // Form Input States
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerBusiness, setCustomerBusiness] = useState('');

  const [invoiceCustomerId, setInvoiceCustomerId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');

  const [webhookAccount, setWebhookAccount] = useState('');
  const [webhookAmount, setWebhookAmount] = useState('');
  const [webhookBank, setWebhookBank] = useState('Nomba Bank');
  const [webhookRef, setWebhookRef] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Full Customer List
  const [customers, setCustomers] = useState<Customer[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await fetchDashboard();
      setData(dashboardData);
      
      const custList = await fetchCustomers();
      setCustomers(custList);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const newCust = await createCustomer({
        full_name: customerName,
        email: customerEmail,
        phone: customerPhone,
        business_name: customerBusiness
      });
      setActionSuccess(`Customer ${newCust.full_name} created successfully with a Nomba Virtual Account!`);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerBusiness('');
      
      await loadData();
      
      setTimeout(() => {
        setIsCustomerModalOpen(false);
        setActionSuccess(null);
      }, 1500);
    } catch (e: any) {
      setActionError(e.message || 'Failed to create customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const matchedCust = customers.find(c => c.id === invoiceCustomerId);
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      await createInvoice({
        customer: invoiceCustomerId,
        amount: parseFloat(invoiceAmount),
        description: invoiceDescription,
        due_date: invoiceDueDate,
        invoice_number: invoiceNumber
      });
      setActionSuccess('Invoice successfully generated & issued!');
      setInvoiceCustomerId('');
      setInvoiceAmount('');
      setInvoiceDescription('');
      setInvoiceDueDate('');
      
      await loadData();
      
      setTimeout(() => {
        setIsInvoiceModalOpen(false);
        setActionSuccess(null);
      }, 1500);
    } catch (e: any) {
      setActionError(e.message || 'Failed to create invoice');
    } finally {
      setActionLoading(false);
    }
  };

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
        setActionSuccess(`Reconciliation Successful! Matched customer and processed payment.`);
      } else {
        setActionSuccess('Payment recorded! Processed as an unmatched transfer (account not found).');
      }
      
      setWebhookAccount('');
      setWebhookAmount('');
      setWebhookBank('Nomba Bank');
      setWebhookRef('');
      
      await loadData();
      
      setTimeout(() => {
        setIsWebhookModalOpen(false);
        setActionSuccess(null);
      }, 2000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to process webhook transfer');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Dashboard Overview" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Retrieving system states...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Dashboard Overview" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-2xl bg-white border border-red-100 p-8 shadow-sm text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">API Connection Offline</h3>
            <p className="text-sm text-slate-500">
              The Next.js app is running, but it cannot connect to the Django backend. Make sure your Django server is running locally on port 8000.
            </p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Dashboard Overview" />

      <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">Welcome back, Pilot</h2>
            <p className="text-xs text-slate-500">Manage virtual accounts, invoice tracking, and Nomba payments feed.</p>
          </div>
          
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                setActionError(null);
                setActionSuccess(null);
                setIsCustomerModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold text-slate-700 py-2.5 px-4 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4 text-slate-400" />
              Add Customer
            </button>
            <button
              onClick={() => {
                setActionError(null);
                setActionSuccess(null);
                setIsInvoiceModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold text-slate-700 py-2.5 px-4 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4 text-slate-400" />
              Issue Invoice
            </button>
            <button
              onClick={() => {
                setActionError(null);
                setActionSuccess(null);
                setIsWebhookModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-indigo-600/10 transition-all"
            >
              <Send className="h-4 w-4 text-white" />
              Simulate Webhook
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Reconciled Revenue</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{formatNaira(data?.total_revenue || 0)}</span>
              <span className="block text-[10px] text-slate-400 font-medium mt-1">Sum of auto-matched payments</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Outstanding Balance</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-100">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{formatNaira(data?.outstanding_balance || 0)}</span>
              <span className="block text-[10px] text-slate-400 font-medium mt-1">Pending invoice amounts due</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Active Customers</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{data?.active_customers || 0}</span>
              <span className="block text-[10px] text-slate-400 font-medium mt-1">Customers with active virtual accounts</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Unmatched Transfers</span>
              <div className={`rounded-lg p-2 border ${data?.unmatched_transfers && data.unmatched_transfers > 0 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{data?.unmatched_transfers || 0}</span>
              <span className="block text-[10px] text-slate-400 font-medium mt-1">Transfers requiring manual mapping</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Recent Nomba Transactions</h3>
              <Link href="/payments" className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold inline-flex items-center gap-1.5">
                View Feed
                <ArrowUpRight className="h-4.5 w-4.5" />
              </Link>
            </div>

            {data?.recent_payments && data.recent_payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="pb-3 pr-4">Customer</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Reconciliation</th>
                      <th className="pb-3 px-4">Reference</th>
                      <th className="pb-3 pl-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_payments.map((pay) => (
                      <tr key={pay.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pr-4 font-semibold text-slate-800">
                          {pay.customer_name || 'Unmatched Depositor'}
                          <span className="block text-[10px] font-normal text-slate-400 mt-0.5">VA: {pay.account_number || 'N/A'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{formatNaira(pay.amount)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            pay.status === 'MATCHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                          }`}>
                            {pay.status === 'MATCHED' ? 'Reconciled' : 'Unmatched'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{pay.reference}</td>
                        <td className="py-3.5 pl-4 text-right text-slate-400">{formatDate(pay.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="rounded-full bg-slate-50 p-4 text-slate-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-700">No transactions recorded</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Use the simulator to send a mock transfer webhook.</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Merchant Alerts Stream</h3>
              
              {data?.recent_notifications && data.recent_notifications.length > 0 ? (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {data.recent_notifications.map((notif) => (
                    <div key={notif.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800">{notif.title}</span>
                        <span className="text-[9px] text-slate-400">{formatDate(notif.created_at)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{notif.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  PayPilot automatically alerts you when customer virtual accounts receive payments. All matched and unmatched events are listed here.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-xs mt-6">
              <h4 className="font-bold text-indigo-900">Nomba API Testing Sandbox</h4>
              <p className="text-[10px] text-indigo-700 mt-1 leading-relaxed">
                Try clicking "Simulate Webhook" above. Providing an active customer virtual account automates matching instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Create Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Create Customer</h3>
            <p className="text-xs text-slate-400 mb-5">Adds a profile and auto-provisions a Nomba Virtual Account.</p>
            
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Contact Name</label>
                <input
                  type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tunde Bakare"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. tunde@logistics.ng"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                  <input
                    type="text" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +2348011111111"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Business / Legal Name</label>
                  <input
                    type="text" value={customerBusiness} onChange={(e) => setCustomerBusiness(e.target.value)}
                    placeholder="e.g. Tunde Logistics"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {actionError && <div className="rounded-lg bg-red-50 text-red-600 text-[10px] font-bold p-3 border border-red-200">{actionError}</div>}
              {actionSuccess && <div className="rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold p-3 border border-emerald-200">{actionSuccess}</div>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4 py-2 hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-2.5 shadow-md shadow-indigo-600/10"
                >
                  {actionLoading ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Issue Invoice</h3>
            <p className="text-xs text-slate-400 mb-5">Generates invoice record mapped to a selected customer profile.</p>
            
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Assign Customer</label>
                <select
                  required
                  value={invoiceCustomerId}
                  onChange={(e) => setInvoiceCustomerId(e.target.value)}
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
                    type="number" required value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Due Date</label>
                  <input
                    type="date" required value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <input
                  type="text" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)}
                  placeholder="e.g. Delivery supplies"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              {actionError && <div className="rounded-lg bg-red-50 text-red-600 text-[10px] font-bold p-3 border border-red-200">{actionError}</div>}
              {actionSuccess && <div className="rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold p-3 border border-emerald-200">{actionSuccess}</div>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
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

      {/* 3. Simulate Webhook Modal */}
      {isWebhookModalOpen && (
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
                    placeholder="10-digit virtual account number"
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
                  onClick={() => setIsWebhookModalOpen(false)}
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
