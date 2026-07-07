'use client';

import React, { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import SearchBar from '@/components/SearchBar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { DollarSign, Send, HelpCircle, Check, AlertCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Inbox, User, FileText, Bell, CheckCircle2, Loader2, X } from 'lucide-react';
import { fetchPayments, fetchCustomers, assignUnmatchedPayment, markPaymentReviewed, triggerWebhook, Customer, Payment, formatNaira, formatDate } from '@/lib/api';
import { useToast } from '@/components/Toast';

const INPUT = 'w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold';
const LABEL = 'block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'review'>('all');
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [claimingPayment, setClaimingPayment] = useState<Payment | null>(null);
  const [selectedCust, setSelectedCust] = useState('');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [webhookAccount, setWebhookAccount] = useState('');
  const [webhookAmount, setWebhookAmount] = useState('');
  const [webhookRef, setWebhookRef] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const [data, custList] = await Promise.all([fetchPayments(params), fetchCustomers()]);
      setPayments(data); setCustomers(custList);
    } catch (e: any) { setError(e.response?.data?.detail || e.message || 'Failed to retrieve payments.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const handleMarkReview = async (id: string) => {
    try {
      const updated = await markPaymentReviewed(id);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: updated.status } : p));
      toast('Payment flagged for standard review.', 'info');
    } catch (e: any) { toast(e.response?.data?.error || 'Failed to flag payment.', 'error'); }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingPayment) return;
    setActionLoading(true);
    try {
      const updated = await assignUnmatchedPayment(claimingPayment.id, { customer: selectedCust });
      setPayments(prev => prev.map(p => p.id === claimingPayment.id ? { ...p, status: updated.status, customer_name: updated.customer_name } : p));
      setIsClaimOpen(false); setClaimingPayment(null); setSelectedCust('');
      toast('Payment successfully claimed and reconciled.', 'success');
      await loadData();
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Failed to assign unmatched payment.', 'error');
    } finally { setActionLoading(false); }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault(); setActionLoading(true);
    try {
      const response = await triggerWebhook({ destination_account_number: webhookAccount, amount: parseFloat(webhookAmount), reference: webhookRef || undefined });
      if (response.matched) toast('Payment Auto-Reconciled! Matched customer profile.', 'success');
      else toast('Payment logged as unmatched deposit — no active customer found.', 'warning');
      setIsSimOpen(false); setWebhookAccount(''); setWebhookAmount(''); setWebhookRef('');
      await loadData();
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Failed to trigger webhook transfer.', 'error');
    } finally { setActionLoading(false); }
  };

  const filteredPayments = payments.filter(p => {
    const term = searchVal.toLowerCase();
    const matchesSearch = (p.reference || '').toLowerCase().includes(term) || (p.customer_name || '').toLowerCase().includes(term) || (p.sender_name || '').toLowerCase().includes(term) || (p.account_number || '').includes(term);
    const matchesTab = activeTab === 'review' ? p.status === 'UNMATCHED' || p.status === 'REVIEW' : true;
    return matchesSearch && matchesTab;
  });

  const unmatchedPayments = payments.filter(p => p.status === 'UNMATCHED' || p.status === 'REVIEW');

  const columns = [
    {
      header: 'Audit Trace',
      accessor: (p: Payment) => (
        <button onClick={() => setExpandedPaymentId(expandedPaymentId === p.id ? null : p.id)} className="p-1.5 rounded-lg border border-[#E5E2DC] hover:bg-[#FAFAF8] text-[#64748B] transition-colors">
          {expandedPaymentId === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      ),
    },
    { header: 'Reference', accessor: (p: Payment) => <span className="font-mono font-bold text-[#0F172A] tracking-tight">{p.reference}</span> },
    {
      header: 'Depositor & Channel',
      accessor: (p: Payment) => (
        <div>
          <span className="block font-semibold text-[#0F172A] tracking-tight">{p.customer_name || 'Unmatched Depositor'}</span>
          <span className="block text-[10px] text-[#94A3B8] font-semibold mt-0.5">Sender: {p.sender_name || 'Unknown'} &bull; {p.bank_name || 'Nomba Bank'}</span>
        </div>
      ),
    },
    { header: 'Amount', accessor: (p: Payment) => <span className="font-bold text-[#0F172A]">{formatNaira(p.amount)}</span> },
    { header: 'Destination Account', accessor: (p: Payment) => <span className="font-mono text-[#64748B] font-semibold">{p.account_number || 'N/A'}</span> },
    { header: 'Status', accessor: (p: Payment) => <StatusBadge status={p.status} /> },
    {
      header: 'Actions',
      align: 'right' as const,
      accessor: (p: Payment) => (
        <div className="flex justify-end gap-2">
          {p.status === 'UNMATCHED' && (
            <>
              <button onClick={() => { setClaimingPayment(p); setIsClaimOpen(true); }} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-600 bg-amber-50 hover:bg-amber-100/50 rounded-lg px-2 py-1.5 border border-amber-200 transition-colors">
                <Check className="h-3.5 w-3.5" /> Claim
              </button>
              <button onClick={() => handleMarkReview(p.id)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-[#FAFAF8] rounded-lg px-2 py-1.5 border border-[#E5E2DC] transition-colors">
                <HelpCircle className="h-3.5 w-3.5" /> Review
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F6F1]">
      <TopNavbar title="Payments Stream" />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Payments Ledger</h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">Monitor real-time incoming cash transfers and map unmatched deposits.</p>
          </div>
          <button onClick={() => setIsSimOpen(true)} className="btn-press inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-white py-2.5 px-4 shadow-md shadow-amber-500/20 transition-all">
            <Send className="h-4 w-4" /> Simulate Deposit
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#F0EDE8] rounded-xl p-1 w-fit">
          <button onClick={() => setActiveTab('all')} className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>All Payments</button>
          <button onClick={() => setActiveTab('review')} className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-4 py-2 rounded-lg transition-all ${activeTab === 'review' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
            Review Queue
            {unmatchedPayments.length > 0 && <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{unmatchedPayments.length}</span>}
          </button>
        </div>

        {/* Reconciliation Flow Diagram */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] px-8 py-6 text-white shadow-xl hidden lg:block">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-500/10 blur-[50px] pointer-events-none" />
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Auto-Reconciliation Flow</span>
          <h3 className="text-sm font-extrabold tracking-tight mt-0.5 mb-4">PayPilot Webhook Resolution Stages</h3>
          <div className="grid grid-cols-5 gap-6 relative">
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-white/10 z-0" />
            {[
              { icon: DollarSign, label: '1. Transfer Webhook', sub: 'Incoming bank transfer event' },
              { icon: Inbox, label: '2. Match Virtual Account', sub: 'Identified allocated VA' },
              { icon: User, label: '3. Customer Resolved', sub: 'Resolved customer profiles' },
              { icon: FileText, label: '4. Invoice Updates', sub: 'Increment paid balances' },
              { icon: Bell, label: '5. Alert Dispatched', sub: 'Notify merchant status' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center space-y-2 z-10">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md ${i === 0 ? 'bg-amber-500' : 'bg-white/10 border border-white/15'}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-100">{step.label}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">{step.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-[#E5E2DC] shadow-sm">
          <SearchBar value={searchVal} onChange={setSearchVal} placeholder="Search by reference, sender, account..." />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Filter:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-[#E5E2DC] bg-[#FAFAF8] hover:bg-[#F0EDE8] text-xs py-2 px-3 outline-none text-[#0F172A] font-bold">
              <option value="ALL">All Payments</option>
              <option value="MATCHED">Matched & Reconciled</option>
              <option value="UNMATCHED">Unmatched Deposits</option>
              <option value="REVIEW">In Review Queue</option>
            </select>
          </div>
        </div>

        {loading ? <LoadingSkeleton type="table" /> : error ? (
          <div className="bg-white border border-[#E5E2DC] rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-[#0F172A]">Failed to load payments</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">{error}</p>
            <button onClick={loadData} className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white"><RefreshCw className="h-4 w-4" /> Retry</button>
          </div>
        ) : (
          <div className="space-y-4">
            <Table columns={columns} data={filteredPayments} emptyState={
              <EmptyState title="No payments reconciled" description="No incoming transfers have hit your accounts. Simulate a deposit to verify webhook flows." icon={DollarSign} action={{ label: 'Simulate Webhook', onClick: () => setIsSimOpen(true) }} />
            } />

            {/* Expanded trace drawer */}
            {expandedPaymentId && (() => {
              const target = payments.find(p => p.id === expandedPaymentId);
              if (!target) return null;
              const isMatched = target.status === 'MATCHED';
              const isReview = target.status === 'REVIEW';
              const STEPS = [
                { label: 'Transfer Received', done: true, detail: [`Sender: ${target.sender_name || 'Anonymous'}`, `Bank: ${target.bank_name || 'Nomba Bank'}`, `Sum: ${formatNaira(target.amount)}`] },
                { label: 'VA Identified', done: !!target.account_number, detail: target.account_number ? [`Acc: ${target.account_number}`, 'Matched VA channel'] : ['Unknown destination account!'] },
                { label: 'Customer Found', done: !!target.customer_name, detail: target.customer_name ? [target.customer_name, 'Profile resolved'] : ['Customer unresolved!'] },
                { label: 'Invoice Updated', done: isMatched, detail: isMatched ? ['Cleared oldest invoice', 'Paid balance incremented'] : isReview ? ['Flagged for manual audit'] : ['Matching skipped'] },
                { label: 'Alert Sent', done: isMatched, detail: isMatched ? ['Webhook cleared successfully', 'Notifications active'] : ['Platform alert disabled'] },
              ];
              return (
                <div className="rounded-3xl border border-[#E5E2DC] bg-white p-6 shadow-sm space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Transaction Resolution Trace</h4>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Step-by-step verification for reference <strong className="font-mono">{target.reference}</strong>.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-3">
                    {STEPS.map((step, i) => (
                      <div key={i} className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                          <div className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-[10px] ${step.done ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{i + 1}</div>
                          {step.label}
                        </div>
                        <div className="text-[10px] text-[#64748B] space-y-1 pl-8">
                          {step.detail.map((d, j) => <span key={j} className="block">{d}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Webhook Simulator Modal */}
      {isSimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E5E2DC] p-6 shadow-2xl">
            <button onClick={() => setIsSimOpen(false)} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B]"><X className="h-4 w-4" /></button>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Webhook Payment Simulator</h3>
            <p className="text-xs text-[#64748B] mb-5">Simulates Nomba virtual account transfer hook listeners.</p>
            <form onSubmit={handleSimulateWebhook} className="space-y-4">
              <div><label className={LABEL}>Destination Account</label>
                <div className="flex gap-2">
                  <input type="text" required value={webhookAccount} onChange={e => setWebhookAccount(e.target.value)} placeholder="10-digit account number" className={INPUT} />
                  <select onChange={e => setWebhookAccount(e.target.value)} className="rounded-xl border border-[#E5E2DC] bg-[#FAFAF8] text-xs px-2 outline-none text-[#64748B] max-w-[120px]">
                    <option value="">Fill VA…</option>
                    {customers.map(c => c.virtual_account && <option key={c.id} value={c.virtual_account.account_number}>{c.full_name} ({c.virtual_account.account_number})</option>)}
                    <option value="9999999999">Unknown VA (unmatched)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={LABEL}>Amount (NGN)</label><input type="number" required value={webhookAmount} onChange={e => setWebhookAmount(e.target.value)} placeholder="e.g. 150000" className={INPUT} /></div>
                <div><label className={LABEL}>Bank</label>
                  <select className={INPUT}><option>Nomba Bank</option><option>Wema Bank</option></select>
                </div>
              </div>
              <div><label className={LABEL}>Transaction Reference</label><input type="text" value={webhookRef} onChange={e => setWebhookRef(e.target.value)} placeholder="e.g. TXN_RECON_8822" className={INPUT} /></div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button type="button" onClick={() => setIsSimOpen(false)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B]">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                  {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Firing…</> : <><Send className="h-3.5 w-3.5" /> Fire Webhook</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isClaimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E5E2DC] p-6 shadow-2xl">
            <button onClick={() => { setIsClaimOpen(false); setClaimingPayment(null); }} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B]"><X className="h-4 w-4" /></button>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Claim Unmatched Payment</h3>
            <p className="text-xs text-[#64748B] mb-4">
              Associate transaction <strong className="font-mono text-[#0F172A]">{claimingPayment?.reference}</strong> ({formatNaira(claimingPayment?.amount || 0)}) to a registered customer.
            </p>
            <form onSubmit={handleClaim} className="space-y-4">
              <div><label className={LABEL}>Assign Customer Profile</label>
                <select required value={selectedCust} onChange={e => setSelectedCust(e.target.value)} className={INPUT}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.virtual_account?.account_number || 'No VA'})</option>)}
                </select>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-[10px] text-amber-800 leading-normal flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>This action manually links this unmatched payment. If an active pending invoice exists, it will increment the paid balance and update its status.</div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button type="button" onClick={() => { setIsClaimOpen(false); setClaimingPayment(null); }} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B]">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                  {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Claiming…</> : 'Confirm Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
