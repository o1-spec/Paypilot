'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TopNavbar from '@/components/TopNavbar';
import SearchBar from '@/components/SearchBar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { 
  DollarSign, 
  Send, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw,
  GitCommit,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Inbox,
  User,
  FileText,
  Bell,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { 
  fetchPayments, 
  fetchCustomers, 
  assignUnmatchedPayment, 
  markPaymentReviewed, 
  triggerWebhook,
  Customer,
  Payment,
  formatNaira,
  formatDate
} from '@/lib/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSimOpen, setIsSimOpen] = useState(false);
  
  // Claim states
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [claimingPayment, setClaimingPayment] = useState<Payment | null>(null);
  const [selectedCust, setSelectedCust] = useState('');

  // Expandable trace states
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  // Webhook states
  const [webhookAccount, setWebhookAccount] = useState('');
  const [webhookAmount, setWebhookAmount] = useState('');
  const [webhookRef, setWebhookRef] = useState('');

  // Alerts states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await fetchPayments(params);
      setPayments(data);

      const custList = await fetchCustomers();
      setCustomers(custList);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to retrieve payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleMarkReview = async (id: string) => {
    setError(null);
    try {
      const updated = await markPaymentReviewed(id);
      // Optimistically update
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p))
      );
      triggerSuccess('Payment flagged for standard review.');
    } catch (e: any) {
      setError(e.response?.data?.error || e.response?.data?.detail || 'Failed to flag payment.');
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingPayment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await assignUnmatchedPayment(claimingPayment.id, {
        customer: selectedCust,
      });

      // Optimistically update state
      setPayments((prev) =>
        prev.map((p) => (p.id === claimingPayment.id ? { ...p, status: updated.status, customer_name: updated.customer_name } : p))
      );

      setIsClaimOpen(false);
      setClaimingPayment(null);
      setSelectedCust('');
      triggerSuccess(`Payment successfully claimed and reconciled.`);
      await loadData();
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to assign unmatched payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
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
        triggerSuccess(`Payment Auto-Reconciled! Matched customer profile.`);
      } else {
        triggerSuccess('Payment logged as unmatched deposit (no active customer found).');
      }

      setIsSimOpen(false);
      setWebhookAccount('');
      setWebhookAmount('');
      setWebhookRef('');
      await loadData();
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to trigger webhook transfer.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPaymentId(expandedPaymentId === id ? null : id);
  };

  const filteredPayments = payments.filter((p) => {
    const term = searchVal.toLowerCase();
    return (
      (p.reference || '').toLowerCase().includes(term) ||
      (p.customer_name || '').toLowerCase().includes(term) ||
      (p.sender_name || '').toLowerCase().includes(term) ||
      (p.account_number || '').includes(term)
    );
  });

  const columns = [
    {
      header: 'Audit Trace',
      accessor: (p: Payment) => (
        <button
          onClick={() => toggleExpand(p.id)}
          className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-550 transition-colors"
        >
          {expandedPaymentId === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      ),
    },
    {
      header: 'Reference',
      accessor: (p: Payment) => (
        <span className="font-mono font-bold text-slate-800 tracking-tight">{p.reference}</span>
      ),
    },
    {
      header: 'Depositor & Channel',
      accessor: (p: Payment) => (
        <div>
          <span className="block font-semibold text-slate-900 tracking-tight">
            {p.customer_name || 'Unmatched Depositor'}
          </span>
          <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
            Sender: {p.sender_name || 'Unknown'} &bull; {p.bank_name || 'Nomba Bank'}
          </span>
        </div>
      ),
    },
    {
      header: 'Amount Reconciled',
      accessor: (p: Payment) => (
        <span className="font-bold text-slate-900">{formatNaira(p.amount)}</span>
      ),
    },
    {
      header: 'Destination Account',
      accessor: (p: Payment) => (
        <span className="font-mono text-slate-700 font-semibold">
          {p.account_number || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (p: Payment) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      align: 'right' as const,
      accessor: (p: Payment) => (
        <div className="flex justify-end gap-2">
          {p.status === 'UNMATCHED' && (
            <>
              <button
                onClick={() => {
                  setClaimingPayment(p);
                  setIsClaimOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-550 bg-indigo-50 hover:bg-indigo-100/50 rounded-lg px-2 py-1.5 border border-indigo-150 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Claim
              </button>
              <button
                onClick={() => handleMarkReview(p.id)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-250 transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Review
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <TopNavbar title="Payments Stream" />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
        <PageHeader
          title="Payments Ledger"
          description="Monitor real-time incoming cash transfers, review automatic reconciliations, and map unmatched deposits."
          actions={
            <button
              onClick={() => { setActionError(null); setIsSimOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-slate-900/10 transition-all duration-150"
            >
              <Send className="h-4 w-4 text-white" />
              Simulate Deposit
            </button>
          }
        />

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-4.5 text-xs font-bold text-emerald-800 flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-3 duration-250">
            <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Dynamic visual diagram tracing the auto-reconciliation engine pipeline */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden hidden lg:block">
          <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-indigo-500/10 blur-[50px] pointer-events-none" />
          
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Auto-Reconciliation Flow</span>
              <h3 className="text-sm font-extrabold tracking-tight mt-0.5">PayPilot Webhook Resolution Stages</h3>
            </div>

            <div className="grid grid-cols-5 gap-6 pt-3 relative">
              {/* Stepper Grid Connectors */}
              <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-slate-800 z-0" />
              
              <div className="flex flex-col items-center text-center space-y-2 z-10">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 border border-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-100">1. Transfer Webhook</span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">Incoming bank transfer event received</span>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 z-10">
                <div className="h-10 w-10 rounded-xl bg-indigo-650/40 border border-indigo-900 flex items-center justify-center font-bold text-indigo-300 shadow-md">
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-100">2. Match Virtual Account</span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">Identified allocated virtual account</span>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 z-10">
                <div className="h-10 w-10 rounded-xl bg-indigo-650/40 border border-indigo-900 flex items-center justify-center font-bold text-indigo-300 shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-100">3. Customer Resolved</span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">Resolved customer legal profiles</span>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 z-10">
                <div className="h-10 w-10 rounded-xl bg-indigo-650/40 border border-indigo-900 flex items-center justify-center font-bold text-indigo-300 shadow-md">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-100">4. Invoice Updates</span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">Increment paid sum on open balances</span>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 z-10">
                <div className="h-10 w-10 rounded-xl bg-indigo-650/40 border border-indigo-900 flex items-center justify-center font-bold text-indigo-300 shadow-md">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-100">5. Alert Dispatched</span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">Notify merchant of collections status</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
          <SearchBar
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search by transaction reference, sender, account..."
          />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs py-2 px-3.5 outline-none text-slate-700 font-bold"
            >
              <option value="ALL">All Payments</option>
              <option value="MATCHED">Matched & Reconciled</option>
              <option value="UNMATCHED">Unmatched Deposits</option>
              <option value="REVIEW">In Review Queue</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton type="table" />
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">Failed to load payments</h3>
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
          <div className="space-y-4">
            <Table
              columns={columns}
              data={filteredPayments}
              emptyState={
                <EmptyState
                  title="No payments reconciled"
                  description="No incoming transfers have hit your accounts. Simulate a deposit to verify webhook flows."
                  icon={DollarSign}
                  action={{
                    label: 'Simulate Webhook',
                    onClick: () => setIsSimOpen(true),
                  }}
                />
              }
            />

            {/* Inline reconciliation timeline trace card drawer */}
            {expandedPaymentId && (
              (() => {
                const target = payments.find((p) => p.id === expandedPaymentId);
                if (!target) return null;

                const isMatched = target.status === 'MATCHED';
                const isReview = target.status === 'REVIEW';

                return (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Resolution Trace</h4>
                      <p className="text-[10px] text-slate-550 mt-0.5">Step-by-step verification trace for reference <strong className="font-mono">{target.reference}</strong>.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-3 relative">
                      
                      {/* Step 1 */}
                      <div className="space-y-2.5 text-xs text-left">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-[10px]">1</div>
                          Transfer Received
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-1 pl-8">
                          <span className="block">Sender: {target.sender_name || 'Anonymous'}</span>
                          <span className="block">Bank: {target.bank_name || 'Nomba Bank'}</span>
                          <span className="block">Sum: {formatNaira(target.amount)}</span>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-2.5 text-xs text-left">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <div className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                            target.account_number 
                              ? 'bg-emerald-50 text-emerald-650 border-emerald-100' 
                              : 'bg-rose-50 text-rose-650 border-rose-100'
                          }`}>2</div>
                          VA Identified
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-1 pl-8">
                          {target.account_number ? (
                            <>
                              <span className="block font-mono font-bold text-slate-750">Acc: {target.account_number}</span>
                              <span className="block text-emerald-650 font-semibold">Matched VA channel</span>
                            </>
                          ) : (
                            <span className="text-rose-600 font-semibold">Unknown destination account!</span>
                          )}
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="space-y-2.5 text-xs text-left">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <div className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                            target.customer_name 
                              ? 'bg-emerald-50 text-emerald-650 border-emerald-100' 
                              : 'bg-rose-50 text-rose-650 border-rose-100'
                          }`}>3</div>
                          Customer Found
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-1 pl-8">
                          {target.customer_name ? (
                            <>
                              <span className="block font-bold text-slate-800">{target.customer_name}</span>
                              <span className="block text-emerald-650 font-semibold">Profile resolved</span>
                            </>
                          ) : (
                            <span className="text-rose-600 font-semibold">Customer unresolved! Suspended matching.</span>
                          )}
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="space-y-2.5 text-xs text-left">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <div className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                            isMatched 
                              ? 'bg-emerald-50 text-emerald-650 border-emerald-100' 
                              : isReview 
                                ? 'bg-amber-50 text-amber-650 border-amber-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>4</div>
                          Invoice Updated
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-1 pl-8">
                          {isMatched ? (
                            <>
                              <span className="block text-slate-700 font-semibold">Cleared oldest invoice</span>
                              <span className="block text-emerald-650 font-bold">Paid balance incremented</span>
                            </>
                          ) : isReview ? (
                            <span className="text-amber-650 font-semibold">Flagged for manual audit review</span>
                          ) : (
                            <span className="text-slate-400 italic">Matching skipped</span>
                          )}
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="space-y-2.5 text-xs text-left">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <div className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                            isMatched 
                              ? 'bg-emerald-50 text-emerald-650 border-emerald-100' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>5</div>
                          Alert Sent
                        </div>
                        <div className="text-[10px] text-slate-500 space-y-1 pl-8">
                          {isMatched ? (
                            <>
                              <span className="block text-slate-600 font-medium">Webhook cleared successfully</span>
                              <span className="block text-emerald-650 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                Notifications active
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Platform alert disabled</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </main>

      {/* Webhook simulator modal */}
      {isSimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Webhook Payment Simulator</h3>
            <p className="text-xs text-slate-400 mb-5">Simulates Nomba virtual account transfer hook listeners.</p>

            <form onSubmit={handleSimulateWebhook} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Destination Account</label>
                <div className="flex gap-2">
                  <input
                    type="text" required value={webhookAccount} onChange={(e) => setWebhookAccount(e.target.value)}
                    placeholder="10-digit account number"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all font-semibold"
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
                    <option value="9999999999">Unknown VA (Recon unmatched)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount (NGN)</label>
                  <input
                    type="number"
                    required
                    value={webhookAmount}
                    onChange={(e) => setWebhookAmount(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Bank</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  >
                    <option value="Nomba Bank">Nomba Bank</option>
                    <option value="Wema Bank">Wema Bank</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Transaction Reference</label>
                <input
                  type="text" value={webhookRef} onChange={(e) => setWebhookRef(e.target.value)}
                  placeholder="e.g. TXN_RECON_8822"
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
                  onClick={() => setIsSimOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Firing...' : 'Fire Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim / Assign payment modal */}
      {isClaimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Claim Unmatched Payment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Associate unmatched transaction reference <strong className="font-mono text-slate-700">{claimingPayment?.reference}</strong> (₦{claimingPayment?.amount.toLocaleString()}) to a registered customer.
            </p>

            <form onSubmit={handleClaim} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Assign Customer Profile</label>
                <select
                  required
                  value={selectedCust}
                  onChange={(e) => setSelectedCust(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all font-semibold"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.virtual_account?.account_number || 'No VA'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-[10px] text-amber-800 leading-normal flex gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  This action manually links this unmatched payment. If an active pending invoice exists, it will increment the paid balance and update its status.
                </div>
              </div>

              {actionError && (
                <div className="rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold p-3 border border-rose-200 leading-normal">
                  ⚠️ {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsClaimOpen(false);
                    setClaimingPayment(null);
                  }}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-2.5 shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  Confirm Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
