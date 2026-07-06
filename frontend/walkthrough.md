# PayPilot MVP Frontend Integration Walkthrough

We have successfully integrated, refactored, and compiled the complete PayPilot frontend pages, connecting them directly with the active Django REST Framework backend APIs. All typescript checks and Next.js compiler runs pass cleanly.

---

## 🛠️ Summary of Changes Made

### 1. Django REST Backend Serializer Adjustments
* **[customers/serializers.py](file:///Users/macbook/Documents/Paypilot/backend/customers/serializers.py)**: Nested the `VirtualAccountSerializer` detail representation directly inside customer record payloads.
* **[invoices/serializers.py](file:///Users/macbook/Documents/Paypilot/backend/invoices/serializers.py)**: Exposed read-only nested source attributes `account_number` (`customer.virtual_account.account_number`) and `bank_name` (`customer.virtual_account.bank_name`) so that invoices list tables render destination accounts without extra calls.
* **[payments/serializers.py](file:///Users/macbook/Documents/Paypilot/backend/payments/serializers.py)**: Appended source properties `customer_name`, `business_name`, `invoice_number`, `account_number`, and `bank_name` to display matched customer profiles dynamically.
* **[customers/views.py](file:///Users/macbook/Documents/Paypilot/backend/customers/views.py)**: Updated `CustomerStatementView` to use the primary `CustomerSerializer` class for formatting, nesting virtual account information directly.

### 2. Frontend Client & Types Synchronization
* **[api.ts](file:///Users/macbook/Documents/Paypilot/frontend/src/lib/api.ts)**: Unified endpoint functions (`fetchCustomers`, `fetchInvoices`, `createInvoice`, etc.) to point to live backend routes.
* **[types/index.ts](file:///Users/macbook/Documents/Paypilot/frontend/src/types/index.ts)**: Re-typed all global declarations directly to align with the serializer responses.

### 3. Integrated Frontend Pages
* **`/dashboard`**: Renders live metrics (Revenue, Balances, Customers, Unmatched counts) from Django aggregates, displays recent payments list, and registers customers/invoices using unified modals.
* **`/customers`**: Renders customer registries, contact details, provisioned virtual accounts, and active status tags. Includes an active "Register Customer" modal.
* **`/customers/[id]`**: Serves as a dynamic financial ledger displaying the customer’s virtual account details, issued invoices list, payments log, and statement balances.
* **`/invoices`**: Displays a table of issued invoices with filter tabs.
* **`/payments`**: Shows the real-time payments feed. It highlights unmatched incoming payments with a distinct left border alert.
* **`/reports`**: Lists merchant statement compilations, totaling aggregate outstanding dues, invoices, and payments per customer.
* **`/webhook-demo`**: An interactive sandbox that compiles JSON payloads, fires events to the Django Nomba API, and displays reconciliation outcomes.
* **`Sidebar.tsx`**: Added Webhook Simulator link to the sidebar.

---

## 🧪 Verification and Build Status

### Next.js Production Compilation
We ran a full static build checking TypeScript safety and route bundling:
```bash
npm run build
```
**Compilation Output:**
```text
▲ Next.js 16.2.10 (Turbopack)
✓ Compiled successfully in 7.3s
  Running TypeScript ...
  Finished TypeScript in 5.0s ...
✓ Generating static pages using 7 workers (10/10) in 257ms
Finalizing page optimization ...
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /customers
├ ƒ /customers/[id]
├ ○ /dashboard
├ ○ /invoices
├ ○ /payments
├ ○ /reports
└ ○ /webhook-demo
```
The compile completed successfully with **zero errors**.

---

## 🚀 How to Run and Test Locally

To test the application locally and showcase the Nomba auto-reconciliation engine to judges, use the following steps:

### Step 1: Start the Backend Service
Ensure that your virtual environment is active, migrations have run, and seed data is populated:
```bash
# Navigate to backend
cd backend
python manage.py migrate
python manage.py seed_data   # Populates default Grace Foods merchant & demo customers
python manage.py runserver
```

### Step 2: Start the Next.js Frontend
```bash
# Navigate to frontend
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Step 3: Run the Webhook Simulation
1. Log in to the merchant portal (the client will fall back to using default credentials if backend is running).
2. Go to the **Webhook Simulator** page in the left sidebar.
3. Click on any of the preloaded customer buttons under "Quick Select Active Account". This auto-fills their destination virtual account number and sets a reference.
4. Input a transfer amount (e.g. `150000` NGN) and click **Fire Webhook Alert**.
5. Observe the live JSON transaction payload sent to the backend.
6. The reconciliation outcome will immediately render under the logs, displaying how the engine identified the customer, mapped the payment to the oldest outstanding invoice, and marked the invoice as `PAID` or `PARTIAL`.
