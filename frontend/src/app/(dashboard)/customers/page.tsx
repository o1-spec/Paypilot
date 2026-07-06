'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import TopNavbar from '@/components/TopNavbar';
import SearchBar from '@/components/SearchBar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Users, Plus, ChevronRight, AlertTriangle, RefreshCw, Mail, Phone, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { 
  fetchCustomers, 
  createCustomer, 
  Customer 
} from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed to retrieve customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      const newCust = await createCustomer({
        full_name: fullName,
        email,
        phone,
        business_name: businessName || undefined,
      });

      // Optimistically update local array
      setCustomers((prev) => [newCust, ...prev]);
      setIsModalOpen(false);

      // Reset forms
      setFullName('');
      setEmail('');
      setPhone('');
      setBusinessName('');
    } catch (e: any) {
      const data = e.response?.data;
      setActionError(data?.error || data?.detail || 'Failed to register customer profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      (c.full_name || '').toLowerCase().includes(searchVal.toLowerCase()) ||
      (c.business_name || '').toLowerCase().includes(searchVal.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchVal.toLowerCase()) ||
      (c.virtual_account?.account_number || '').includes(searchVal)
  );

  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-indigo-50 text-indigo-650 border-indigo-150',
      'bg-emerald-50 text-emerald-650 border-emerald-150',
      'bg-purple-50 text-purple-650 border-purple-150',
      'bg-rose-50 text-rose-650 border-rose-150',
      'bg-amber-50 text-amber-650 border-amber-150',
    ];
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const columns = [
    {
      header: 'Customer',
      accessor: (c: Customer) => {
        const initials = c.full_name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-bold text-xs ${getInitialsColor(c.full_name)}`}>
              {initials}
            </div>
            <div>
              <span className="block font-bold text-slate-900 tracking-tight">{c.full_name}</span>
              <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">{c.business_name || 'Individual'}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contact Info',
      accessor: (c: Customer) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-650 font-medium">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {c.email}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {c.phone}
          </div>
        </div>
      ),
    },
    {
      header: 'Virtual Account',
      accessor: (c: Customer) => (
        <div className="space-y-0.5">
          {c.virtual_account ? (
            <>
              <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-850">
                <CreditCard className="h-3.5 w-3.5 text-slate-450" />
                {c.virtual_account.account_number}
              </div>
              <span className="block text-[10px] text-slate-400 font-semibold pl-5">{c.virtual_account.bank_name}</span>
            </>
          ) : (
            <span className="text-slate-450 italic text-[11px]">No account provisioned</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (c: Customer) => <StatusBadge status={c.status || 'ACTIVE'} />,
    },
    {
      header: 'Ledger Audit',
      align: 'right' as const,
      accessor: (c: Customer) => (
        <Link
          href={`/customers/${c.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 transition-all"
        >
          View Account
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <TopNavbar title="Customers Directory" />

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
        <PageHeader
          title="Customers"
          description="Register portfolios of business contacts and track their allocated virtual balance endpoints."
          actions={
            <button
              onClick={() => { setActionError(null); setIsModalOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-slate-900/10 transition-all duration-150"
            >
              <Plus className="h-4 w-4 text-white" />
              Add Customer
            </button>
          }
        />

        {/* Filter controls row */}
        <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
          <SearchBar
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Search by customer name, email, account..."
          />
        </div>

        {loading ? (
          <LoadingSkeleton type="table" />
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to load customer list</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
            <button
              onClick={loadCustomers}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredCustomers}
            emptyState={
              <EmptyState
                title="No customers registered"
                description="Create customer profiles to provision persistent virtual accounts automatically."
                icon={Users}
                action={{
                  label: 'Add Customer',
                  onClick: () => setIsModalOpen(true),
                }}
              />
            }
          />
        )}
      </main>

      {/* Create Customer modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Register Customer</h3>
            <p className="text-xs text-slate-400 mb-5">Creates a profile and auto-provisions a Nomba Virtual Account details.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contact Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tunde Bakare"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tunde@logistics.ng"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800 transition-all"
                  />
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 text-xs font-semibold px-4.5 py-2 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-slate-950 hover:bg-slate-900 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
