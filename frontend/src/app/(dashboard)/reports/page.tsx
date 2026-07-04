'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { fetchCustomers, fetchInvoices, fetchPayments, Customer, Invoice, Payment, formatNaira } from '@/lib/api';
import { BarChart3, Search, TrendingUp, Clock, AlertTriangle, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface CustomerReportSummary {
  id: string;
  name: string;
  businessName: string;
  virtualAccount: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceCount: number;
  paymentCount: number;
}

export default function ReportsPage() {
  const [summaries, setSummaries] = useState<CustomerReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const customers = await fetchCustomers();
      const invoices = await fetchInvoices();
      const payments = await fetchPayments();

      // Compile a comprehensive aggregate summary list for each customer
      const compiled: CustomerReportSummary[] = customers.map(cust => {
        const custInvoices = invoices.filter(inv => inv.customer_id === cust.id);
        const custPayments = payments.filter(pay => pay.customer_id === cust.id);
        
        const totalInvoiced = custInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = custPayments.reduce((sum, pay) => pay.status === 'reconciled' ? sum + pay.amount : sum, 0);
        
        // Outstanding balance calculations (invoice amount minus payments against that invoice)
        let outstanding = 0;
        custInvoices.forEach(inv => {
          if (inv.status === 'pending' || inv.status === 'partial') {
            const invoicePaidSum = custPayments
              .filter(pay => pay.invoice_id === inv.id && pay.status === 'reconciled')
              .reduce((sum, pay) => sum + pay.amount, 0);
            outstanding += Math.max(0, inv.amount - invoicePaidSum);
          }
        });

        return {
          id: cust.id,
          name: cust.name,
          businessName: cust.business_name,
          virtualAccount: cust.virtual_account?.account_number || 'N/A',
          totalInvoiced,
          totalPaid,
          outstandingBalance: outstanding,
          invoiceCount: custInvoices.length,
          paymentCount: custPayments.length
        };
      });

      setSummaries(compiled);
    } catch (e: any) {
      setError(e.message || 'Failed to generate financial reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSummaries = summaries.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.virtualAccount.includes(searchQuery)
  );

  // Merchant global aggregates
  const grandTotalInvoiced = summaries.reduce((sum, s) => sum + s.totalInvoiced, 0);
  const grandTotalPaid = summaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const grandTotalOutstanding = summaries.reduce((sum, s) => sum + s.outstandingBalance, 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Reports & Audit Ledger" />

      <div className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto">
        
        {/* Merchant Summary Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total Invoiced</span>
                <span className="block text-xl font-bold text-slate-900 tracking-tight">{formatNaira(grandTotalInvoiced)}</span>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reconciled Collections</span>
                <span className="block text-xl font-bold text-emerald-600 tracking-tight">{formatNaira(grandTotalPaid)}</span>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Dues</span>
                <span className="block text-xl font-bold text-amber-600 tracking-tight">{formatNaira(grandTotalOutstanding)}</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-100">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Search controls */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter statement summaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition-all"
            />
          </div>
          
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold text-slate-700 py-2.5 px-4 shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Refresh Audit
          </button>
        </div>

        {/* Reports Ledger Listing */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs font-semibold text-slate-500">Generating portfolio ledgers...</span>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to Compile Reports</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Make sure the Django REST API is running at http://localhost:8000.</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredSummaries.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Customer Portfolio</th>
                    <th className="py-3 px-6">Nomba VA</th>
                    <th className="py-3 px-6">Total Invoiced</th>
                    <th className="py-3 px-6">Total Paid</th>
                    <th className="py-3 px-6">Outstanding</th>
                    <th className="py-3 px-6 text-center">Activity Metrics</th>
                    <th className="py-3 px-6 text-right">Audit Sheet</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.map((summary) => (
                    <tr key={summary.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 font-semibold text-slate-900">
                        {summary.name}
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{summary.businessName}</span>
                      </td>
                      <td className="py-4.5 px-6 font-mono font-semibold text-slate-700">{summary.virtualAccount}</td>
                      <td className="py-4.5 px-6 font-semibold text-slate-900">{formatNaira(summary.totalInvoiced)}</td>
                      <td className="py-4.5 px-6 font-bold text-emerald-600">{formatNaira(summary.totalPaid)}</td>
                      <td className="py-4.5 px-6 font-bold text-amber-600">{formatNaira(summary.outstandingBalance)}</td>
                      <td className="py-4.5 px-6 text-center text-slate-500">
                        <span className="font-semibold text-slate-700">{summary.invoiceCount}</span> invoices &bull; <span className="font-semibold text-slate-700">{summary.paymentCount}</span> payments
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <Link
                          href={`/customers/${summary.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                          View Ledger
                          <ChevronRight className="h-4 w-4" />
                        </Link>
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
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No summaries found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">There are no statements matching your search query.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
