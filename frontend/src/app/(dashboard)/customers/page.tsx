'use client';

import React, { useEffect, useState } from 'react';
import TopNavbar from '@/components/TopNavbar';
import SearchBar from '@/components/SearchBar';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Users, Plus, ChevronRight, AlertTriangle, RefreshCw, Mail, Phone, CreditCard, Pencil, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { fetchCustomers, createCustomer, updateCustomer, Customer } from '@/lib/api';
import { useToast } from '@/components/Toast';

const INPUT = 'w-full rounded-xl bg-[#FAFAF8] border border-[#E5E2DC] focus:border-amber-500 text-xs py-2.5 px-3.5 outline-none text-[#0F172A] transition-all font-semibold';
const LABEL = 'block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1';

function Modal({ title, sub, onClose, children }: { title: string; sub: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#E5E2DC] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#64748B]"><X className="h-4 w-4" /></button>
        <h3 className="text-base font-bold text-[#0F172A] mb-1">{title}</h3>
        <p className="text-xs text-[#64748B] mb-5">{sub}</p>
        {children}
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-purple-50 text-purple-700 border-purple-200',
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBusiness, setEditBusiness] = useState('');

  const loadCustomers = async () => {
    setLoading(true); setError(null);
    try { setCustomers(await fetchCustomers()); }
    catch (e: any) { setError(e.response?.data?.detail || e.message || 'Failed to retrieve customers.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setActionLoading(true);
    try {
      const newCust = await createCustomer({ full_name: fullName, email, phone, business_name: businessName || undefined });
      setCustomers(prev => [newCust, ...prev]);
      setIsModalOpen(false);
      setFullName(''); setEmail(''); setPhone(''); setBusinessName('');
      toast(`${newCust.full_name} registered — virtual account provisioned!`, 'success');
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Failed to register customer profile.', 'error');
    } finally { setActionLoading(false); }
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c); setEditName(c.full_name); setEditEmail(c.email);
    setEditPhone(c.phone); setEditBusiness(c.business_name || ''); setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setActionLoading(true);
    try {
      const updated = await updateCustomer(editingCustomer.id, { full_name: editName, email: editEmail, phone: editPhone, business_name: editBusiness || undefined });
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
      setIsEditOpen(false); setEditingCustomer(null);
      toast('Customer profile updated successfully.', 'success');
    } catch (e: any) {
      const d = e.response?.data;
      toast(d?.error || d?.detail || 'Failed to update customer.', 'error');
    } finally { setActionLoading(false); }
  };

  const filtered = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(searchVal.toLowerCase()) ||
    (c.business_name || '').toLowerCase().includes(searchVal.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchVal.toLowerCase()) ||
    (c.virtual_account?.account_number || '').includes(searchVal)
  );

  const avatarColor = (name: string) => {
    const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  };

  const columns = [
    {
      header: 'Customer',
      accessor: (c: Customer) => {
        const initials = c.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-bold text-xs ${avatarColor(c.full_name)}`}>{initials}</div>
            <div>
              <span className="block font-bold text-[#0F172A] tracking-tight">{c.full_name}</span>
              <span className="block text-[10px] text-[#94A3B8] font-semibold mt-0.5">{c.business_name || 'Individual'}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contact Info',
      accessor: (c: Customer) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-[#0F172A] font-medium"><Mail className="h-3.5 w-3.5 text-[#94A3B8]" />{c.email}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] font-medium"><Phone className="h-3.5 w-3.5 text-[#94A3B8]" />{c.phone}</div>
        </div>
      ),
    },
    {
      header: 'Virtual Account',
      accessor: (c: Customer) => (
        <div className="space-y-0.5">
          {c.virtual_account ? (
            <>
              <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#0F172A]"><CreditCard className="h-3.5 w-3.5 text-[#94A3B8]" />{c.virtual_account.account_number}</div>
              <span className="block text-[10px] text-[#94A3B8] font-semibold pl-5">{c.virtual_account.bank_name}</span>
            </>
          ) : <span className="text-[#94A3B8] italic text-[11px]">No account provisioned</span>}
        </div>
      ),
    },
    { header: 'Status', accessor: (c: Customer) => <StatusBadge status={c.status || 'ACTIVE'} /> },
    {
      header: 'Actions',
      align: 'right' as const,
      accessor: (c: Customer) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openEdit(c)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#64748B] hover:text-[#0F172A] bg-white hover:bg-[#FAFAF8] border border-[#E5E2DC] rounded-lg px-2 py-1.5 transition-all">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <Link href={`/customers/${c.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-600 bg-amber-50 hover:bg-amber-100/50 border border-amber-200 rounded-lg px-2.5 py-1.5 transition-all">
            View <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F6F1]">
      <TopNavbar title="Customers Directory" />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Customers</h1>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">Register portfolios and track their allocated virtual balance endpoints.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white py-2.5 px-4 shadow-md transition-all">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E5E2DC] shadow-sm">
          <SearchBar value={searchVal} onChange={setSearchVal} placeholder="Search by name, email, account..." />
        </div>

        {loading ? <LoadingSkeleton type="table" /> : error ? (
          <div className="bg-white border border-[#E5E2DC] rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-[#0F172A]">Failed to load customers</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">{error}</p>
            <button onClick={loadCustomers} className="btn-press inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : (
          <Table columns={columns} data={filtered} emptyState={
            <EmptyState title="No customers registered" description="Create customer profiles to provision virtual accounts automatically." icon={Users} action={{ label: 'Add Customer', onClick: () => setIsModalOpen(true) }} />
          } />
        )}
      </main>

      {isModalOpen && (
        <Modal title="Register Customer" sub="Creates a profile and auto-provisions a Nomba Virtual Account." onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className={LABEL}>Contact Name</label><input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Tunde Bakare" className={INPUT} /></div>
            <div><label className={LABEL}>Email Address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. tunde@logistics.ng" className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={LABEL}>Phone</label><input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." className={INPUT} /></div>
              <div><label className={LABEL}>Business Name</label><input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Optional" className={INPUT} /></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B] transition-colors">Cancel</button>
              <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-[#0F172A] hover:bg-neutral-800 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering…</> : 'Register Customer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isEditOpen && editingCustomer && (
        <Modal title="Edit Customer" sub={`Update contact details for ${editingCustomer.full_name}.`} onClose={() => setIsEditOpen(false)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><label className={LABEL}>Full Name</label><input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className={INPUT} /></div>
            <div><label className={LABEL}>Email</label><input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)} className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={LABEL}>Phone</label><input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={INPUT} /></div>
              <div><label className={LABEL}>Business Name</label><input type="text" value={editBusiness} onChange={e => setEditBusiness(e.target.value)} placeholder="Optional" className={INPUT} /></div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
              <button type="button" onClick={() => setIsEditOpen(false)} className="rounded-xl border border-[#E5E2DC] text-xs font-semibold px-4 py-2 hover:bg-[#FAFAF8] text-[#64748B] transition-colors">Cancel</button>
              <button type="submit" disabled={actionLoading} className="btn-press rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-white px-5 py-2.5 shadow-md disabled:opacity-50 inline-flex items-center gap-2">
                {actionLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
