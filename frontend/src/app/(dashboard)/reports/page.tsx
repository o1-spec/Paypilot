'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TopNavbar from '@/components/TopNavbar';
import SearchBar from '@/components/SearchBar';
import Table from '@/components/Table';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import StatusBadge from '@/components/StatusBadge';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  AlertTriangle, 
  RefreshCw,
  Printer,
  Download,
  Calendar,
  Filter,
  Layers,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { 
  fetchCustomers, 
  fetchInvoices, 
  fetchPayments,
  formatNaira,
  formatDate,
  Customer,
  Invoice,
  Payment
} from '@/lib/api';

interface ReportItem {
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  const [summaries, setSummaries] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchVal, setSearchVal] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [reportTab, setReportTab] = useState<'ledgers' | 'analytics' | 'deposits'>('ledgers');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [custList, invList, payList] = await Promise.all([
        fetchCustomers(),
        fetchInvoices(),
        fetchPayments()
      ]);

      setCustomers(custList);
      setInvoices(invList);
      setPayments(payList);

      const compiled: ReportItem[] = custList.map((c) => {
        const custInvoices = invList.filter((inv) => inv.customer === c.id);
        const custPayments = payList.filter((pay) => pay.customer === c.id);

        const totalInvoiced = custInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = custPayments.reduce((sum, pay) => pay.status === 'MATCHED' ? sum + pay.amount : sum, 0);

        let outstanding = 0;
        custInvoices.forEach((inv) => {
          if (inv.status === 'PENDING' || inv.status === 'PARTIAL') {
            const invoicePaidSum = custPayments
              .filter((pay) => pay.invoice === inv.id && pay.status === 'MATCHED')
              .reduce((sum, pay) => sum + pay.amount, 0);
            outstanding += Math.max(0, inv.amount - invoicePaidSum);
          }
        });

        return {
          id: c.id,
          name: c.full_name,
          businessName: c.business_name || 'Individual',
          virtualAccount: c.virtual_account?.account_number || 'N/A',
          totalInvoiced,
          totalPaid,
          outstandingBalance: outstanding,
          invoiceCount: custInvoices.length,
          paymentCount: custPayments.length,
        };
      });

      setSummaries(compiled);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to compile reporting ledger summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    // Generate a mock CSV trigger download
    const headers = 'Customer,Business,Virtual Account,Total Invoiced,Total Paid,Outstanding\n';
    const rows = summaries
      .map((s) => `"${s.name}","${s.businessName}","${s.virtualAccount}",${s.totalInvoiced},${s.totalPaid},${s.outstandingBalance}`)
      .join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `PayPilot_Account_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

  // Filtration logic
  const filteredSummaries = summaries.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      s.businessName.toLowerCase().includes(searchVal.toLowerCase()) ||
      s.virtualAccount.includes(searchVal);

    const matchesCustomer = customerFilter === 'ALL' || s.id === customerFilter;
    return matchesSearch && matchesCustomer;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesCustomer = customerFilter === 'ALL' || inv.customer === customerFilter;
    return matchesCustomer;
  });

  const filteredPayments = payments.filter((pay) => {
    const matchesCustomer = customerFilter === 'ALL' || pay.customer === customerFilter;
    return matchesCustomer;
  });

  // Aggregates calculation
  const totalInvoiced = filteredSummaries.reduce((sum, s) => sum + s.totalInvoiced, 0);
  const totalPaid = filteredSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalOutstanding = filteredSummaries.reduce((sum, s) => sum + s.outstandingBalance, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;

  // Table Column definitions
  const ledgerColumns = [
    {
      header: 'Customer Portfolio',
      accessor: (s: ReportItem) => (
        <div>
          <span className="block font-semibold text-slate-900 tracking-tight">{s.name}</span>
          <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">{s.businessName}</span>
        </div>
      ),
    },
    {
      header: 'Virtual Account',
      accessor: (s: ReportItem) => <span className="font-mono font-bold text-slate-800">{s.virtualAccount}</span>,
    },
    {
      header: 'Total Invoiced',
      accessor: (s: ReportItem) => <span className="font-semibold text-slate-900">{formatNaira(s.totalInvoiced)}</span>,
    },
    {
      header: 'Total Reconciled',
      accessor: (s: ReportItem) => <span className="font-bold text-emerald-650">{formatNaira(s.totalPaid)}</span>,
    },
    {
      header: 'Outstanding Balance',
      accessor: (s: ReportItem) => <span className="font-bold text-amber-650">{formatNaira(s.outstandingBalance)}</span>,
    },
    {
      header: 'Ledger',
      align: 'right' as const,
      accessor: (s: ReportItem) => (
        <Link
          href={`/customers/${s.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-650 hover:text-indigo-550"
        >
          View Statement
          <ChevronRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  const invoiceColumns = [
    {
      header: 'Invoice ID',
      accessor: (inv: Invoice) => (
        <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-indigo-650 hover:underline">
          {inv.invoice_number}
        </Link>
      ),
    },
    {
      header: 'Customer',
      accessor: (inv: Invoice) => (
        <div>
          <span className="block font-semibold text-slate-900">{inv.customer_name}</span>
          <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">{inv.business_name}</span>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (inv: Invoice) => <span className="font-bold text-slate-900">{formatNaira(inv.amount)}</span>,
    },
    {
      header: 'Paid',
      accessor: (inv: Invoice) => <span className="font-semibold text-emerald-650">{formatNaira(inv.amount_paid)}</span>,
    },
    {
      header: 'Due Date',
      accessor: (inv: Invoice) => <span className="text-slate-500 font-medium">{formatDate(inv.due_date)}</span>,
    },
    {
      header: 'Status',
      accessor: (inv: Invoice) => <StatusBadge status={inv.status} />,
    },
  ];

  const paymentColumns = [
    {
      header: 'Reference',
      accessor: (pay: Payment) => <span className="font-mono font-bold text-slate-800">{pay.reference}</span>,
    },
    {
      header: 'Sender Details',
      accessor: (pay: Payment) => (
        <div>
          <span className="block font-semibold text-slate-900">{pay.customer_name || 'Unmatched Depositor'}</span>
          <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">Sender: {pay.sender_name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      header: 'Amount Received',
      accessor: (pay: Payment) => <span className="font-bold text-slate-900">{formatNaira(pay.amount)}</span>,
    },
    {
      header: 'Virtual Account',
      accessor: (pay: Payment) => <span className="font-mono text-slate-600">{pay.account_number || 'N/A'}</span>,
    },
    {
      header: 'Date Mapped',
      accessor: (pay: Payment) => <span className="text-slate-500 font-medium">{formatDate(pay.created_at)}</span>,
    },
    {
      header: 'Status',
      accessor: (pay: Payment) => <StatusBadge status={pay.status} />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <TopNavbar title="Reports & Accounting" />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-200">
        
        {/* Page Header */}
        <PageHeader
          title="Reports & Analytics"
          description="View comprehensive collection summaries, portfolio metrics, and customer accounts ledgers."
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 py-2.5 px-4 shadow-sm transition-all"
              >
                <Printer className="h-4 w-4 text-slate-400" />
                Print Statement
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white py-2.5 px-4.5 shadow-md transition-all"
              >
                <Download className="h-4 w-4 text-slate-400" />
                Export CSV
              </button>
            </div>
          }
        />

        {/* Global Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Billing Volume"
              value={formatNaira(totalInvoiced)}
              description="Sum of issued invoices"
              icon={BarChart3}
            />
            <StatCard
              title="Collections Received"
              value={formatNaira(totalPaid)}
              description="Successfully reconciled transfer sum"
              icon={TrendingUp}
            />
            <StatCard
              title="Outstanding Receivables"
              value={formatNaira(totalOutstanding)}
              description="Unpaid pending/partial bills balance"
              icon={Clock}
            />
            <StatCard
              title="Collection Efficiency"
              value={`${collectionRate}%`}
              description="Paid relative to issued invoices"
              icon={Layers}
            />
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center gap-4 flex-1 min-w-[280px]">
            <SearchBar
              value={searchVal}
              onChange={setSearchVal}
              placeholder="Search statements..."
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4.5">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Customer:</span>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-3 outline-none text-slate-700 font-bold"
              >
                <option value="ALL">All Portfolios</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Period:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 px-3 outline-none text-slate-700 font-bold"
              >
                <option value="ALL">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report Sections Tabs */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-200 pb-px">
            <button
              onClick={() => setReportTab('ledgers')}
              className={`pb-3.5 px-6 text-xs font-bold transition-all border-b-2 ${
                reportTab === 'ledgers'
                  ? 'border-indigo-650 text-indigo-650'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Account Ledger Statements ({filteredSummaries.length})
            </button>
            <button
              onClick={() => setReportTab('analytics')}
              className={`pb-3.5 px-6 text-xs font-bold transition-all border-b-2 ${
                reportTab === 'analytics'
                  ? 'border-indigo-650 text-indigo-650'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Invoice Performance Analytics ({filteredInvoices.length})
            </button>
            <button
              onClick={() => setReportTab('deposits')}
              className={`pb-3.5 px-6 text-xs font-bold transition-all border-b-2 ${
                reportTab === 'deposits'
                  ? 'border-indigo-650 text-indigo-650'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Collections & Payment History ({filteredPayments.length})
            </button>
          </div>

          {loading ? (
            <LoadingSkeleton type="table" />
          ) : error ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-sm">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Failed to compile reports</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-605 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            <>
              {reportTab === 'ledgers' && (
                <Table
                  columns={ledgerColumns}
                  data={filteredSummaries}
                  emptyState={
                    <EmptyState
                      title="No accounts statements generated"
                      description="Statements appear when billing schedules or bank deposits register."
                      icon={BarChart3}
                    />
                  }
                />
              )}

              {reportTab === 'analytics' && (
                <Table
                  columns={invoiceColumns}
                  data={filteredInvoices}
                  emptyState={
                    <EmptyState
                      title="No invoices reported"
                      description="Issue invoices to compile analytics summaries."
                      icon={Layers}
                    />
                  }
                />
              )}

              {reportTab === 'deposits' && (
                <Table
                  columns={paymentColumns}
                  data={filteredPayments}
                  emptyState={
                    <EmptyState
                      title="No collections logged"
                      description="Collections log history maps bank transfer callbacks automatically."
                      icon={TrendingUp}
                    />
                  }
                />
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
