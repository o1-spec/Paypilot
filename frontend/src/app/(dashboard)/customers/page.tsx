'use client';

import { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import { fetchCustomers, createCustomer, Customer } from '@/lib/api';
import { Users, Search, Plus, UserCheck, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const newCust = await createCustomer({ 
        full_name: fullName, 
        email, 
        phone, 
        business_name: businessName 
      });
      setActionSuccess(`Customer ${newCust.full_name} created! VA details provisioned.`);
      setFullName('');
      setEmail('');
      setPhone('');
      setBusinessName('');
      
      await loadCustomers();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setActionSuccess(null);
      }, 1500);
    } catch (e: any) {
      setActionError(e.message || 'Failed to create customer');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c => 
    (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.virtual_account?.account_number || '').includes(searchQuery)
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNavbar title="Customers Directory" />
      
      <div className="flex-1 p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Controls header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, VA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition-all"
            />
          </div>
          
          <button
            onClick={() => {
              setActionError(null);
              setActionSuccess(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs font-bold text-white py-2.5 px-4.5 shadow-md shadow-indigo-600/10 transition-all"
          >
            <Plus className="h-4 w-4 text-white" />
            Add New Customer
          </button>
        </div>

        {/* Loading/Error/Table wrapper */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs font-semibold text-slate-500">Loading customers...</span>
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Failed to Load Customers</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Make sure the Django REST API is running at http://localhost:8000.</p>
            <button
              onClick={loadCustomers}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Customer & Business</th>
                    <th className="py-3 px-6">Contact Info</th>
                    <th className="py-3 px-6">Nomba Virtual Account</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 font-semibold text-slate-900">
                        {cust.full_name}
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{cust.business_name}</span>
                      </td>
                      <td className="py-4.5 px-6 text-slate-600">
                        {cust.email}
                        <span className="block text-[10px] text-slate-400 mt-0.5">{cust.phone}</span>
                      </td>
                      <td className="py-4.5 px-6">
                        {cust.virtual_account ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900">{cust.virtual_account.account_number}</span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">{cust.virtual_account.bank_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No account provisioned</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          cust.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          <UserCheck className="h-3 w-3" />
                          {cust.status.charAt(0).toUpperCase() + cust.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <Link
                          href={`/customers/${cust.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                          View Account
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
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Customers Found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">There are no customers matching your search query. Try checking spelling or register a new customer.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Register New Customer</h3>
            <p className="text-xs text-slate-400 mb-5">Adds a profile and auto-provisions a Nomba Virtual Account.</p>
            
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Contact Name</label>
                <input
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tunde Bakare"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tunde@logistics.ng"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                  <input
                    type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +2348011111111"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs py-2.5 px-3.5 outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Business / Legal Name</label>
                  <input
                    type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
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
                  {actionLoading ? 'Creating...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
