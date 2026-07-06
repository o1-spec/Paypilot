'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopNavbar from '@/components/TopNavbar';
import { 
  fetchCustomerReport, 
  triggerWebhook, 
  CustomerReport, 
  formatNaira, 
  formatDate 
} from '@/lib/api';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Wallet
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [report, setReport] = useState<CustomerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Webhook quick simulate modal
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [simAmount, setSimAmount] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomerReport(id);
      setReport(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load customer profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const copyToClipboard = () => {
    if (!report?.customer.virtual_account) return;
    navigator.clipboard.writeText(report.customer.virtual_account.account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report?.customer.virtual_account) return;

    setSimLoading(true);
    setSimError(null);
    setSimSuccess(null);

    try {
      await triggerWebhook({
        destination_account_number: report.customer.virtual_account.account_number,
        amount: parseFloat(simAmount),
        sender_name: report.customer.full_name,
        reference: `MOCK_TXN_CUST_${Math.floor(100000 + Math.random() * 900000)}`
      });

      setSimSuccess('Payment transfer received! Account reconciled.');
      setSimAmount('');
      
      // Reload report details
      await loadReport();

      setTimeout(() => {
        setIsSimulateOpen(false);
        setSimSuccess(null);
      }, 1800);
    } catch (e: any) {
      setSimError(e.message || 'Failed to trigger payment');
    } finally {
      setSimLoading(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Customer Profile" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-500">Retrieving ledger statement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex-1 flex flex-col">
        <TopNavbar title="Customer Profile" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full rounded-2xl bg-white border border-red-100 p-8 shadow-sm text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Profile Not Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">This customer profile does not exist or the backend API is offline.</p>
            <button
              onClick={() => router.push('/customers')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Back to directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { customer, invoices, payments, summary } = report;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title={`${customer.full_name} Ledger`} />

      <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        {/* Back Link & Quick action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => router.push('/customers')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customer Directory
          </button>

          {customer.virtual_account && (
            <button
              onClick={() => {
                setSimError(null);
                setSimSuccess(null);
                setIsSimulateOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-indigo-600/10 transition-all"
            >
              <Send className="h-4 w-4 text-white" />
              Simulate Inbound Payment
            </button>
          )}
        </div>

        {/* Customer Header & Virtual Card layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: Profile metadata & Nomba virtual account card */}
          <div className="space-y-6">
            {/* Nomba Virtual Account Credit Card Mockup */}
            {customer.virtual_account && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl border border-indigo-800/20">
                {/* Background glow lines */}
                <div className="absolute top-[-20%] right-[-10%] h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
                <div className="absolute bottom-[-30%] left-[-20%] h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
                
                {/* Top bank identifier */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="h-5 w-5 text-indigo-400" />
                    <span className="text-[10px] font-bold tracking-widest text-indigo-300 uppercase">DEDICATED ACCOUNT</span>
                  </div>
                  <span className="text-xs font-bold tracking-tight text-white">{customer.virtual_account.bank_name}</span>
                </div>

                {/* Account Number display */}
                <div className="mt-8">
                  <span className="block text-[10px] text-indigo-300 font-semibold tracking-wider uppercase">Account Number</span>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="text-2xl font-mono font-bold tracking-widest text-white">
                      {customer.virtual_account.account_number}
                    </span>
                    <button 
                      onClick={copyToClipboard}
                      className="rounded-lg p-1.5 text-indigo-300 hover:bg-white/10 hover:text-white transition-colors"
                      title="Copy account number"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Card holder name */}
                <div className="mt-8 pt-4 border-t border-indigo-900/40 flex items-center justify-between">
                  <div>
                    <span className="block text-[8px] text-indigo-400 font-semibold tracking-wider uppercase">Account Name</span>
                    <span className="block text-xs font-semibold text-white tracking-wide truncate max-w-[200px]">
                      {customer.virtual_account.account_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-indigo-400 font-semibold tracking-wider uppercase">Provider</span>
                    <span className="block text-[10px] font-bold text-indigo-300 tracking-wider">NOMBA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Info Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Contact Profile</h3>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Legal Business Name</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{customer.business_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Contact Name</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{customer.full_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Email Address</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">{customer.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Phone Number</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">{customer.phone}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Account Status</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 mt-1 border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Ledger summaries & statement grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm text-left">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
                <span className="block text-base sm:text-lg font-bold text-slate-900 mt-1.5">{formatNaira(summary.total_invoiced)}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm text-left">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Reconciled Paid</span>
                <span className="block text-base sm:text-lg font-bold text-emerald-600 mt-1.5">{formatNaira(summary.total_paid)}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm text-left">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
                <span className="block text-base sm:text-lg font-bold text-amber-600 mt-1.5">{formatNaira(summary.outstanding_balance)}</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-slate-400" />
                Invoices Registry
              </h3>
              
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 pr-4">Invoice ID & Desc</th>
                        <th className="pb-3 px-4">Amount</th>
                        <th className="pb-3 px-4">Due Date</th>
                        <th className="pb-3 pl-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pr-4 font-semibold text-slate-800">
                            {inv.invoice_number}
                            <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{inv.description}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{formatNaira(inv.amount)}</td>
                          <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.due_date)}</td>
                          <td className="py-3.5 pl-4 text-right">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              inv.status === 'OVERPAID' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No invoices issued to this customer.</p>
              )}
            </div>

            {/* Payments History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
                <DollarSign className="h-4.5 w-4.5 text-slate-400" />
                Reconciled Payments History
              </h3>
              
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 pr-4">Reference</th>
                        <th className="pb-3 px-4">Amount</th>
                        <th className="pb-3 px-4">Reconciliation Details</th>
                        <th className="pb-3 pl-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay) => (
                        <tr key={pay.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pr-4 font-semibold text-slate-800">
                            {pay.reference}
                            <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Sender: {pay.sender_name || 'Unknown'}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{formatNaira(pay.amount)}</td>
                          <td className="py-3.5 px-4 text-slate-600 italic text-[11px]">
                            {pay.status === 'MATCHED' 
                              ? `Reconciled against Invoice ${pay.invoice_number || 'N/A'}` 
                              : `Unmatched payment from ${pay.sender_name || 'Unknown'}`
                            }
                          </td>
                          <td className="py-3.5 pl-4 text-right text-slate-400">{formatDate(pay.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No payments received for this account yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webhook simulator modal */}
      {isSimulateOpen && customer.virtual_account && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Transfer to {customer.full_name}</h3>
            <p className="text-xs text-slate-400 mb-5">
              Simulates a customer sending a bank transfer to virtual account <span className="font-mono font-bold text-slate-700">{customer.virtual_account.account_number}</span>.
            </p>
            
            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Transfer Amount (NGN)</label>
                <input
                  type="number" required value={simAmount} onChange={(e) => setSimAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Origin Bank</label>
                <input
                  type="text" disabled value={customer.virtual_account.bank_name}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 text-xs py-2.5 px-3.5 outline-none text-slate-500"
                />
              </div>

              {simError && <div className="rounded-lg bg-red-50 text-red-600 text-[10px] font-bold p-3 border border-red-200">{simError}</div>}
              {simSuccess && <div className="rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold p-3 border border-emerald-200">{simSuccess}</div>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSimulateOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4 py-2 hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simLoading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white px-5 py-2.5 shadow-md shadow-indigo-600/10"
                >
                  {simLoading ? 'Simulating...' : 'Submit Bank Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
