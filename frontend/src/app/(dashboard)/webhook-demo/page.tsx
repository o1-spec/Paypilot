'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { fetchCustomers, triggerWebhook, Customer, formatNaira } from '@/lib/api';
import { Send, AlertCircle, CheckCircle2, AlertTriangle, Terminal, RefreshCw, Code } from 'lucide-react';

export default function WebhookDemoPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [destAccount, setDestAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAccount, setSenderAccount] = useState('');

  // Execution states
  const [simLoading, setSimLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load customer list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleQuickFill = (cust: Customer) => {
    if (!cust.virtual_account) return;
    setDestAccount(cust.virtual_account.account_number);
    setSenderName(cust.full_name);
    setSenderAccount('0099887766');
    setReference(`TXN-${Date.now().toString().slice(-6)}-${cust.full_name.slice(0, 3).toUpperCase()}`);
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimError(null);
    setResult(null);

    try {
      const response = await triggerWebhook({
        destination_account_number: destAccount,
        amount: parseFloat(amount),
        reference: reference || undefined,
        sender_name: senderName || undefined,
        sender_account_number: senderAccount || undefined
      });
      setResult(response);
    } catch (e: any) {
      setSimError(e.message || 'Failed to send webhook request.');
    } finally {
      setSimLoading(false);
    }
  };

  // Generate mock JSON payload shown to the user on screen
  const payloadJson = {
    event: "virtual_account.payment_received",
    data: {
      account_number: destAccount || "101XXXXXXX",
      amount: amount ? parseFloat(amount) : 0,
      reference: reference || "TXN_MOCK_AUTO",
      sender_name: senderName || "Test Sender",
      sender_account_number: senderAccount || "0011223344",
      bank_name: "Access Bank"
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Nomba Webhook Simulator" />

      <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-base font-bold text-slate-800">Nomba API Webhook Simulator</h2>
          <p className="text-xs text-slate-500">Test how PayPilot receives inbound transfers, identifies accounts, resolves customers, and updates outstanding invoice registers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form parameters */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-indigo-500" />
              Transfer Callback Parameters
            </h3>

            {loading ? (
              <div className="text-center py-6">
                <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-[10px] text-slate-500">Loading sandbox accounts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-4 bg-red-50 text-red-600 text-[10px] font-semibold rounded-xl">
                Error loading virtual accounts list.
              </div>
            ) : (
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Select Active Account</span>
                <div className="flex flex-wrap gap-2">
                  {customers.map((c) => c.virtual_account && (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleQuickFill(c)}
                      className="text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-lg px-2.5 py-1.5 transition-colors"
                    >
                      {c.full_name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDestAccount('9999999999');
                      setSenderName('Unregistered Person');
                      setSenderAccount('0088998877');
                      setReference(`TXN-${Date.now().toString().slice(-6)}-UNMATCHED`);
                    }}
                    className="text-[10px] font-semibold bg-red-50 hover:bg-red-100 border border-red-150 text-red-700 rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    Unregistered VA
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Destination Virtual Account</label>
                <input
                  type="text" required value={destAccount} onChange={(e) => setDestAccount(e.target.value)}
                  placeholder="10-digit virtual account number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Transfer Amount (NGN)</label>
                  <input
                    type="number" required value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Reference</label>
                  <input
                    type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                    placeholder="Leave empty for auto ref"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Sender Name</label>
                  <input
                    type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Tunde Bakare"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Sender Account Number</label>
                  <input
                    type="text" value={senderAccount} onChange={(e) => setSenderAccount(e.target.value)}
                    placeholder="e.g. 0122334455"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {simError && <div className="rounded-lg bg-red-50 text-red-600 text-[10px] font-bold p-3 border border-red-200">{simError}</div>}

              <button
                type="submit"
                disabled={simLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white py-3 px-4 shadow-md shadow-indigo-600/10 transition-all"
              >
                <Send className="h-4 w-4" />
                {simLoading ? 'Sending Transfer Webhook...' : 'Fire Webhook Alert'}
              </button>
            </form>
          </div>

          {/* JSON Payload viewer & Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Payload Preview */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 text-slate-100 font-mono text-[11px] relative shadow-lg">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-indigo-400 font-bold uppercase tracking-wider">
                <Code className="h-3 w-3" />
                Live JSON
              </div>
              <span className="block text-[10px] font-bold text-slate-500 mb-3 tracking-wider uppercase">Constructed Webhook Payload</span>
              <pre className="text-slate-350 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(payloadJson, null, 2)}
              </pre>
            </div>

            {/* Reconciliation outcome audit board */}
            {result ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  Reconciliation Results & Logs
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Process Status</span>
                      <span className="font-bold text-slate-800">{result.message}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Audit ID</span>
                      <span className="font-mono text-[10px] text-slate-600 block truncate mt-0.5">{result.payment_id}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Status Analysis</span>
                    {result.status === 'MATCHED' ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                          MATCHED TRANSACTION
                        </div>
                        <p className="text-[11px] leading-relaxed text-emerald-700">
                          The virtual account ` {destAccount} ` was successfully identified as belonging to **{senderName}**. 
                          The reconciliation engine has matching rules that located the customer's oldest pending invoice. 
                          The invoice paid amounts have been updated, transitioning the status to Paid, Partially Paid, or Overpaid.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-250 text-red-800 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                          UNMATCHED TRANSACTION
                        </div>
                        <p className="text-[11px] leading-relaxed text-red-700">
                          The destination account number ` {destAccount} ` could not be resolved to any customer profile. 
                          The platform has safely recorded the NGN {formatNaira(amount)} deposit in the transaction log as **UNMATCHED**, flag-alerting it on the Payments dashboard for manual review.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <AlertCircle className="h-7 w-7 text-slate-350" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Waiting for webhook alert simulation...</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">Fill parameters and click "Fire Webhook Alert" to analyze the Nomba auto-reconciliation lifecycle.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
