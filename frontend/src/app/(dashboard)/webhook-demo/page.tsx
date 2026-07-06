'use client';

import { useEffect, useState, useRef } from 'react';
import TopNavbar from '@/components/TopNavbar';
import {
  fetchCustomers, fetchInvoices, triggerWebhook, seedDemoData, resetDemoData,
  assignUnmatchedPayment, Customer, Invoice, formatNaira
} from '@/lib/api';
import {
  Zap, Send, CheckCircle2, AlertTriangle, RefreshCw, Database,
  Trash2, ChevronDown, ArrowRight, User, FileText, Bell, DollarSign,
  Activity, Clock, Wifi, CircleDot
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────── */
type StepStatus = 'idle' | 'running' | 'done' | 'error';

interface PipelineStep {
  id: string;
  label: string;
  detail: string;
  icon: React.ElementType;
  status: StepStatus;
  result?: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: 'transfer',   label: 'Incoming Bank Transfer',   detail: 'Nomba receives payment on virtual account', icon: DollarSign,   status: 'idle' },
  { id: 'webhook',    label: 'Webhook Dispatched',        detail: 'Nomba posts event to PayPilot endpoint',   icon: Wifi,        status: 'idle' },
  { id: 'va_lookup',  label: 'Virtual Account Resolved',  detail: 'Account number matched to customer profile', icon: User,      status: 'idle' },
  { id: 'invoice',    label: 'Invoice Located',           detail: 'Oldest pending invoice selected for credit', icon: FileText,  status: 'idle' },
  { id: 'reconcile',  label: 'Payment Reconciled',        detail: 'Invoice amount updated, status transitioned', icon: CheckCircle2, status: 'idle' },
  { id: 'notify',     label: 'Merchant Notified',         detail: 'Real-time notification sent to dashboard',  icon: Bell,       status: 'idle' },
];

const STEP_DELAYS = [400, 900, 1500, 2200, 3000, 3700];

export default function WebhookDemoPage() {
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form inputs
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customAmount, setCustomAmount]           = useState('');
  const [senderName, setSenderName]               = useState('Tunde Bakare');
  const [useCustomAccount, setUseCustomAccount]   = useState(false);
  const [manualAccount, setManualAccount]         = useState('');

  // Pipeline state
  const [steps, setSteps]         = useState<PipelineStep[]>(INITIAL_STEPS);
  const [running, setRunning]     = useState(false);
  const [result, setResult]       = useState<any>(null);
  const [simError, setSimError]   = useState<string | null>(null);
  const [runCount, setRunCount]   = useState(0);

  // Demo tool states
  const [seeding, setSeeding]     = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toolMsg, setToolMsg]     = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoadingData(true);
    try {
      const [c, inv] = await Promise.all([fetchCustomers(), fetchInvoices()]);
      setCustomers(c);
      setInvoices(inv);
      // Auto-select first customer with a VA
      const firstWithVA = c.find(x => x.virtual_account);
      if (firstWithVA) setSelectedCustomer(firstWithVA.id);
    } catch {}
    setLoadingData(false);
  };

  useEffect(() => { load(); }, []);

  /* derived helpers */
  const chosenCustomer = customers.find(c => c.id === selectedCustomer) ?? null;
  const chosenInvoices = invoices.filter(i => i.customer === selectedCustomer && i.status === 'PENDING');
  const destAccount = useCustomAccount
    ? manualAccount
    : chosenCustomer?.virtual_account?.account_number ?? '';
  const sendAmount = customAmount
    ? parseFloat(customAmount)
    : chosenInvoices[0]?.amount ?? 15000;

  const resetSteps = () =>
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'idle', result: undefined })));

  const setStepStatus = (id: string, status: StepStatus, result?: string) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, result } : s));

  /* ── Main simulation ─────────────────────────────────────── */
  const handleSimulate = async () => {
    if (!destAccount) {
      setSimError('Select a customer with a virtual account first.');
      return;
    }
    setSimError(null);
    setResult(null);
    setRunning(true);
    setRunCount(c => c + 1);
    resetSteps();

    // Step 1 — Transfer arrives
    setStepStatus('transfer', 'running');
    await delay(STEP_DELAYS[0]);
    setStepStatus('transfer', 'done', `₦${Number(sendAmount).toLocaleString()} → Account ${destAccount}`);

    // Step 2 — Webhook dispatched
    setStepStatus('webhook', 'running');
    await delay(STEP_DELAYS[1] - STEP_DELAYS[0]);

    let apiResult: any = null;
    let apiError: string | null = null;
    try {
      apiResult = await triggerWebhook({
        destination_account_number: destAccount,
        amount: sendAmount,
        sender_name: senderName,
        sender_account_number: '0099887766',
      });
      setStepStatus('webhook', 'done', 'POST /api/webhooks/nomba/ → 200 OK');
    } catch (e: any) {
      apiError = e.message ?? 'Webhook call failed';
      setStepStatus('webhook', 'error', apiError ?? undefined);
      setSimError(apiError);
      setRunning(false);
      return;
    }

    // Step 3 — VA lookup
    setStepStatus('va_lookup', 'running');
    await delay(STEP_DELAYS[2] - STEP_DELAYS[1]);
    const matched = apiResult?.status === 'MATCHED' || apiResult?.status === 'PAID' || apiResult?.matched;
    setStepStatus(
      'va_lookup',
      matched ? 'done' : 'error',
      matched ? `Customer: ${chosenCustomer?.full_name ?? 'Resolved'}` : 'No customer found for this account'
    );

    // Step 4 — Invoice located
    setStepStatus('invoice', 'running');
    await delay(STEP_DELAYS[3] - STEP_DELAYS[2]);
    if (matched) {
      const inv = chosenInvoices[0];
      setStepStatus('invoice', 'done', inv ? `${inv.invoice_number} — ${formatNaira(inv.amount)}` : 'No pending invoice — logged as credit');
    } else {
      setStepStatus('invoice', 'error', 'No invoice to match — payment flagged for review');
    }

    // Step 5 — Reconciliation
    setStepStatus('reconcile', 'running');
    await delay(STEP_DELAYS[4] - STEP_DELAYS[3]);
    setStepStatus(
      'reconcile',
      matched ? 'done' : 'error',
      matched ? `Status → ${apiResult?.invoice_status ?? 'PAID/PARTIAL'} · Ref: ${apiResult?.reference ?? 'auto'}` : 'Payment saved as UNMATCHED'
    );

    // Step 6 — Notify
    setStepStatus('notify', 'running');
    await delay(STEP_DELAYS[5] - STEP_DELAYS[4]);
    setStepStatus('notify', 'done', matched ? 'Payment notification dispatched ✓' : 'Unmatched payment alert dispatched ✓');

    setResult(apiResult);
    setRunning(false);

    // scroll to result
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
  };

  const handleSeed = async () => {
    setSeeding(true); setToolMsg(null);
    try {
      await seedDemoData();
      setToolMsg('✅ Demo data seeded successfully. Reload the page if needed.');
      await load();
    } catch (e: any) {
      setToolMsg('❌ Seed failed: ' + (e.message ?? 'unknown error'));
    }
    setSeeding(false);
  };

  const handleReset = async () => {
    if (!confirm('This will delete all demo customers, invoices, and payments. Are you sure?')) return;
    setResetting(true); setToolMsg(null);
    try {
      await resetDemoData();
      setToolMsg('✅ Demo data reset. Ready for a fresh demo run.');
      setResult(null); resetSteps();
      await load();
    } catch (e: any) {
      setToolMsg('❌ Reset failed: ' + (e.message ?? 'unknown error'));
    }
    setResetting(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <TopNavbar title="Webhook Demo" />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/30">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-base font-bold text-slate-900">Live Reconciliation Demo</h1>
              <span className="ml-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                Nomba Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium ml-9">
              Simulate a bank transfer webhook and watch PayPilot reconcile it in real time.
            </p>
          </div>

          {/* Demo tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 px-3 py-2 shadow-sm transition-all"
            >
              <Database className="h-3.5 w-3.5 text-indigo-500" />
              {seeding ? 'Seeding…' : 'Seed Demo Data'}
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-600 px-3 py-2 shadow-sm transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {resetting ? 'Resetting…' : 'Reset Demo'}
            </button>
          </div>
        </div>

        {toolMsg && (
          <div className={`rounded-xl px-4 py-3 text-xs font-semibold border ${toolMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {toolMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT: Configuration panel ─────────────────────── */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                Transfer Parameters
              </h3>

              {/* Customer select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Customer</label>
                {loadingData ? (
                  <div className="h-9 bg-slate-100 animate-pulse rounded-xl" />
                ) : customers.length === 0 ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold p-3">
                    No customers found. Click "Seed Demo Data" first.
                  </div>
                ) : (
                  <select
                    value={selectedCustomer}
                    onChange={e => { setSelectedCustomer(e.target.value); setUseCustomAccount(false); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 font-semibold transition-all"
                  >
                    <option value="">— Select customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id} disabled={!c.virtual_account}>
                        {c.full_name} {!c.virtual_account ? '(no VA)' : `· ${c.virtual_account.account_number}`}
                      </option>
                    ))}
                  </select>
                )}
                {/* Show pending invoices hint */}
                {chosenCustomer && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1 text-[10px] font-semibold text-slate-500">
                    <div className="flex justify-between">
                      <span>Virtual Account</span>
                      <span className="font-mono text-slate-700">{chosenCustomer.virtual_account?.account_number ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bank</span>
                      <span className="text-slate-700">{chosenCustomer.virtual_account?.bank_name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending invoices</span>
                      <span className={`font-bold ${chosenInvoices.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {chosenInvoices.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Use unregistered account toggle */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="use-custom"
                  checked={useCustomAccount}
                  onChange={e => setUseCustomAccount(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="use-custom" className="text-[10px] font-semibold text-slate-600 cursor-pointer">
                  Use unknown / unregistered account (triggers UNMATCHED flow)
                </label>
              </div>
              {useCustomAccount && (
                <input
                  type="text"
                  value={manualAccount}
                  onChange={e => setManualAccount(e.target.value)}
                  placeholder="Enter unknown account number e.g. 9999999999"
                  className="w-full rounded-xl border border-rose-300 bg-rose-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-rose-500 text-slate-800 font-semibold transition-all"
                />
              )}

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Transfer Amount (NGN)
                  {chosenInvoices[0] && !customAmount && (
                    <span className="ml-2 text-indigo-600 font-bold">
                      · auto-filled from invoice ({formatNaira(chosenInvoices[0].amount)})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder={chosenInvoices[0] ? String(chosenInvoices[0].amount) : '15000'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 font-semibold transition-all"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {[5000, 10000, 25000, 50000].map(v => (
                    <button key={v} type="button" onClick={() => setCustomAmount(String(v))}
                      className="text-[9px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg px-2 py-1 transition-colors"
                    >
                      ₦{v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 font-semibold transition-all"
                />
              </div>

              {simError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold p-3">
                  ⚠ {simError}
                </div>
              )}

              <button
                onClick={handleSimulate}
                disabled={running || !destAccount}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-xs font-bold text-white py-3.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                {running ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Simulating reconciliation…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {runCount > 0 ? 'Run Again' : 'Simulate Incoming Transfer'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Live pipeline + result ─────────────────── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Pipeline steps */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-indigo-500" />
                Reconciliation Pipeline
                {running && (
                  <span className="ml-auto text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </h3>

              <div className="space-y-0">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isLast = idx === steps.length - 1;
                  return (
                    <div key={step.id} className="flex gap-4">
                      {/* Connector column */}
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                          step.status === 'done'    ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' :
                          step.status === 'running' ? 'bg-indigo-600 shadow-md shadow-indigo-500/30 animate-pulse' :
                          step.status === 'error'   ? 'bg-rose-500 shadow-md shadow-rose-500/30' :
                          'bg-slate-100 border border-slate-200'
                        }`}>
                          {step.status === 'running' ? (
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Icon className={`h-3.5 w-3.5 ${step.status === 'idle' ? 'text-slate-400' : 'text-white'}`} />
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 my-1 min-h-[20px] transition-colors duration-700 ${step.status === 'done' ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                        )}
                      </div>

                      {/* Step content */}
                      <div className={`pb-5 flex-1 min-w-0 transition-all duration-300 ${isLast ? 'pb-0' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold transition-colors ${
                            step.status === 'done'    ? 'text-slate-900' :
                            step.status === 'running' ? 'text-indigo-700' :
                            step.status === 'error'   ? 'text-rose-700' :
                            'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                          {step.status === 'done' && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">DONE</span>
                          )}
                          {step.status === 'error' && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">FAILED</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {step.result ?? step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result card */}
            <div ref={resultRef}>
              {result ? (
                <div className={`rounded-2xl border p-6 space-y-4 shadow-sm transition-all ${
                  result.status === 'MATCHED' || result.invoice_status
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.status === 'MATCHED' || result.invoice_status ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <h4 className={`text-sm font-bold ${result.status === 'MATCHED' || result.invoice_status ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {result.status === 'MATCHED' || result.invoice_status
                          ? '✅ Payment Automatically Reconciled'
                          : '⚠️ Payment Saved as Unmatched — Needs Review'}
                      </h4>
                      <p className={`text-[10px] font-medium mt-0.5 ${result.status === 'MATCHED' || result.invoice_status ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {result.message ?? 'Webhook processed by PayPilot reconciliation engine.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Amount', value: formatNaira(sendAmount) },
                      { label: 'Status', value: result.status ?? result.invoice_status ?? 'UNMATCHED' },
                      { label: 'Reference', value: result.reference?.slice(0, 14) ?? 'auto' },
                      { label: 'Invoice', value: result.invoice_status ? `→ ${result.invoice_status}` : '—' },
                    ].map(item => (
                      <div key={item.label} className="bg-white/70 rounded-xl p-3 border border-white">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                        <span className="block text-xs font-bold text-slate-800 mt-0.5 truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setResult(null); resetSteps(); }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 px-3 py-2 transition-all">
                      <RefreshCw className="h-3.5 w-3.5" /> Run Again
                    </button>
                    <a href="/payments"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white hover:bg-indigo-50 text-[10px] font-bold text-indigo-700 px-3 py-2 transition-all">
                      <ArrowRight className="h-3.5 w-3.5" /> View in Payments
                    </a>
                    <a href="/dashboard"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 px-3 py-2 transition-all">
                      <ArrowRight className="h-3.5 w-3.5" /> View Dashboard
                    </a>
                  </div>
                </div>
              ) : !running && runCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-2">
                  <Zap className="h-8 w-8 text-indigo-200 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">Ready to simulate</h4>
                  <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">
                    Select a customer, configure the transfer amount, and click "Simulate Incoming Transfer" to watch the reconciliation pipeline execute live.
                  </p>
                </div>
              ) : null}
            </div>

            {/* How it works explainer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                What just happened?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px] font-medium text-slate-600">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                  <span className="block font-bold text-slate-800 text-xs">1. Virtual Account</span>
                  <p>Each customer has a unique Nomba virtual account number. When they transfer money, it lands here.</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                  <span className="block font-bold text-slate-800 text-xs">2. Webhook Engine</span>
                  <p>Nomba notifies PayPilot via webhook. The engine validates, deduplicates, and routes the payment.</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                  <span className="block font-bold text-slate-800 text-xs">3. Auto Reconciliation</span>
                  <p>The oldest pending invoice is credited. Overpayments, partial payments, and UNMATCHED cases are all handled.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
