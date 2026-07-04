const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  virtual_account: {
    account_number: string;
    bank_name: string;
    account_name: string;
    customer_id: string;
  } | null;
  status: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  business_name: string;
  amount: number;
  description: string;
  due_date: string;
  status: 'pending' | 'paid' | 'partial' | 'overpaid' | 'cancelled';
  virtual_account?: {
    account_number: string;
    bank_name: string;
  } | null;
}

export interface Payment {
  id: string;
  customer_id: string | null;
  customer_name: string;
  business_name: string;
  invoice_id: string | null;
  amount: number;
  account_number: string;
  status: 'reconciled' | 'unmatched';
  date: string;
  reconciliation_detail: string;
  reference: string;
}

export interface DashboardData {
  total_customers: number;
  total_revenue: number;
  pending_invoices: number;
  paid_invoices: number;
  unmatched_payments: number;
  outstanding_balance: number;
  recent_payments: Payment[];
}

export interface CustomerReport {
  customer: Customer;
  invoices: Invoice[];
  payments: Payment[];
  summary: {
    total_invoiced: number;
    total_paid: number;
    outstanding_balance: number;
  };
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/`, { cache: 'no-store' });
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
  const res = await fetch(`${API_BASE_URL}/api/reports/customer/${id}/`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch report for customer ${id}`);
  return res.json();
}

export async function createCustomer(payload: { name: string; email: string; phone: string; business_name?: string }): Promise<Customer> {
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

export async function createInvoice(payload: { customer_id: string; amount: number; description?: string; due_date: string }): Promise<Invoice> {
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

export async function triggerWebhook(payload: { account_number: string; amount: number; bank_name?: string; reference?: string }): Promise<{ message: string; payment: Payment }> {
  const res = await fetch(`${API_BASE_URL}/api/payments/mock-webhook/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to trigger webhook');
  }
  return res.json();
}
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
}
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
