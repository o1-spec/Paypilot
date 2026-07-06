const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VirtualAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  provider: string;
  status: string;
  created_at: string;
}

export interface Customer {
  id: string;
  merchant: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  status: string;
  virtual_account: VirtualAccount | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  merchant: string;
  customer: string;
  customer_name?: string;
  business_name?: string;
  account_number?: string;
  bank_name?: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  description: string;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERPAID' | 'CANCELLED';
  created_at: string;
}

export interface Payment {
  id: string;
  merchant: string | null;
  customer: string | null;
  customer_name?: string;
  business_name?: string;
  virtual_account: string | null;
  account_number?: string;
  bank_name?: string;
  invoice: string | null;
  invoice_number?: string;
  amount: number;
  reference: string;
  sender_name: string;
  sender_account_number: string;
  status: 'MATCHED' | 'UNMATCHED' | 'REVIEW';
  raw_payload: any;
  created_at: string;
}

export interface DashboardData {
  total_revenue: number;
  outstanding_balance: number;
  active_customers: number;
  unmatched_transfers: number;
  recent_payments: Payment[];
  recent_notifications: any[];
}

export interface CustomerReport {
  customer: Customer;
  summary: {
    total_invoiced: number;
    total_paid: number;
    outstanding_balance: number;
  };
  invoices: Invoice[];
  payments: Payment[];
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/summary/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE_URL}/api/customers/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/api/customers/${id}/`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch customer ${id}`);
  return res.json();
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${API_BASE_URL}/api/invoices/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function fetchPayments(): Promise<Payment[]> {
  const res = await fetch(`${API_BASE_URL}/api/payments/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
}

export async function fetchCustomerReport(id: string): Promise<CustomerReport> {
  const res = await fetch(`${API_BASE_URL}/api/reports/customers/${id}/statement/`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch report for customer ${id}`);
  return res.json();
}

export async function createCustomer(payload: { full_name: string; email: string; phone: string; business_name?: string }): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/api/customers/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create customer');
  }
  return res.json();
}

export async function createInvoice(payload: { customer: string; amount: number; description?: string; due_date: string; invoice_number: string }): Promise<Invoice> {
  const res = await fetch(`${API_BASE_URL}/api/invoices/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create invoice');
  }
  return res.json();
}

export async function triggerWebhook(payload: { destination_account_number: string; amount: number; reference?: string; sender_name?: string; sender_account_number?: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/webhooks/nomba/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'virtual_account.payment_received',
      data: {
        account_number: payload.destination_account_number,
        amount: payload.amount,
        reference: payload.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        sender_name: payload.sender_name || 'Test Sender',
        sender_account_number: payload.sender_account_number || '0011223344',
        bank_name: 'Access Bank'
      }
    }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || errorData.detail || 'Failed to trigger webhook');
  }
  return res.json();
}

export function formatNaira(amount: number | string): string {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return '₦0.00';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(val);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
