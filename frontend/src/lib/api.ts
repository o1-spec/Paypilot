import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to load token dynamically from localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('paypilot_demo_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.token) {
            config.headers.Authorization = `Bearer ${parsed.token}`;
          }
        } catch (e) {}
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and catch auth expired states
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid redirecting if we are already on the landing page
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        localStorage.removeItem('paypilot_demo_session');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

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
  total_customers: number;
  total_virtual_accounts: number;
  total_revenue: number;
  todays_revenue: number;
  outstanding_balance: number;
  pending_invoices_count: number;
  paid_invoices_count: number;
  partial_invoices_count: number;
  overpaid_invoices_count: number;
  unmatched_payments_count: number;
  recent_payments: Payment[];
  recent_invoices: Invoice[];
  recent_notifications: any[];
  monthly_revenue_summary: { month: string; amount: number }[];
  invoice_status_breakdown: Record<string, number>;
}

export interface StatementLine {
  date: string;
  type: 'INVOICE' | 'PAYMENT';
  description: string;
  debit: string;
  credit: string;
  reference: string;
  running_balance: number;
}

export interface CustomerReport {
  customer: Customer;
  virtual_account: VirtualAccount | null;
  total_invoice_amount: number;
  total_paid: number;
  outstanding_balance: number;
  invoices: Invoice[];
  payments: Payment[];
  statement_lines: StatementLine[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

// 🔐 Authentication APIs
export async function loginMerchant(payload: any) {
  const res = await apiClient.post('/api/auth/login/', payload);
  return res.data;
}

export async function registerMerchant(payload: any) {
  const res = await apiClient.post('/api/auth/register/', payload);
  return res.data;
}

// 📊 Dashboard APIs
export async function fetchDashboard(): Promise<DashboardData> {
  const res = await apiClient.get('/api/dashboard/summary/');
  return res.data;
}

// 👥 Customer APIs
export async function fetchCustomers(): Promise<Customer[]> {
  const res = await apiClient.get('/api/customers/');
  return res.data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const res = await apiClient.get(`/api/customers/${id}/`);
  return res.data;
}

export async function createCustomer(payload: any): Promise<Customer> {
  const res = await apiClient.post('/api/customers/', payload);
  return res.data;
}

export async function updateCustomer(id: string, payload: any): Promise<Customer> {
  const res = await apiClient.patch(`/api/customers/${id}/`, payload);
  return res.data;
}

// 🧾 Invoice APIs
export async function fetchInvoices(params?: any): Promise<Invoice[]> {
  const res = await apiClient.get('/api/invoices/', { params });
  return res.data;
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const res = await apiClient.get(`/api/invoices/${id}/`);
  return res.data;
}

export async function createInvoice(payload: any): Promise<Invoice> {
  const res = await apiClient.post('/api/invoices/', payload);
  return res.data;
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const res = await apiClient.post(`/api/invoices/${id}/cancel/`);
  return res.data;
}

// 🏦 Virtual Account Provisioning APIs
export async function provisionVirtualAccount(customerId: string): Promise<VirtualAccount> {
  const res = await apiClient.post('/api/virtual-accounts/provision/', { customer_id: customerId });
  return res.data;
}

// 💸 Payment & Claims APIs
export async function fetchPayments(params?: any): Promise<Payment[]> {
  const res = await apiClient.get('/api/payments/', { params });
  return res.data;
}

export async function assignUnmatchedPayment(id: string, payload: { customer: string; invoice?: string }): Promise<Payment> {
  const res = await apiClient.post(`/api/payments/${id}/assign/`, payload);
  return res.data;
}

export async function markPaymentReviewed(id: string): Promise<Payment> {
  const res = await apiClient.post(`/api/payments/${id}/mark-reviewed/`);
  return res.data;
}

// 📈 Reports & Audit Ledger APIs
export async function fetchCustomerReport(id: string): Promise<CustomerReport> {
  const res = await apiClient.get(`/api/reports/customers/${id}/statement/`);
  return res.data;
}

// 🔔 Notifications APIs
export async function fetchNotifications(params?: any): Promise<NotificationItem[]> {
  const res = await apiClient.get('/api/notifications/', { params });
  return res.data;
}

export async function fetchUnreadNotifications(): Promise<NotificationItem[]> {
  const res = await apiClient.get('/api/notifications/unread/');
  return res.data;
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const res = await apiClient.post(`/api/notifications/${id}/mark-read/`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<any> {
  const res = await apiClient.post('/api/notifications/mark-all-read/');
  return res.data;
}

// 🔄 Webhook simulation
export async function triggerWebhook(payload: { destination_account_number: string; amount: number; reference?: string; sender_name?: string; sender_account_number?: string }): Promise<any> {
  const res = await apiClient.post('/api/webhooks/nomba/', {
    event: 'virtual_account.payment_received',
    data: {
      account_number: payload.destination_account_number,
      amount: payload.amount,
      reference: payload.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      sender_name: payload.sender_name || 'Test Sender',
      sender_account_number: payload.sender_account_number || '0011223344',
      bank_name: 'Access Bank'
    }
  });
  return res.data;
}

// Formatting helpers
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

export async function seedDemoData(): Promise<any> {
  const res = await apiClient.post('/api/customers/demo/', { action: 'seed' });
  return res.data;
}

export async function resetDemoData(): Promise<any> {
  const res = await apiClient.post('/api/customers/demo/', { action: 'reset' });
  return res.data;
}
