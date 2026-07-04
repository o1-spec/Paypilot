# PayPilot MVP

**PayPilot** is an automated virtual account provisioning and payment reconciliation engine designed for the **DevCareer × Nomba Hackathon**. 

It enables businesses to automatically issue dedicated virtual accounts to their customers. When payments are transferred to these virtual accounts, the system automatically catches webhook alerts, identifies the customer, maps the payments to outstanding invoices, and keeps ledger sheets in real time.

---

## ⚡ Problem & Solution

### The Problem
Traditional business billing in Africa requires customer service agents and accounting teams to manually check banking notifications (SMS alerts, PDF bank statements) and manually verify who sent a transfer, what invoice it relates to, and update records. This process is:
1. **Error-prone** (incorrectly matched payments).
2. **Slow** (invoices remain marked unpaid while payment clears).
3. **Unscalable** (requires more workforce as the transaction volume grows).

### The Solution
PayPilot leverages **Nomba's Dedicated Virtual Account API** infrastructure to assign a unique, persistent virtual account to every customer. 
* Whenever funds enter a customer's specific virtual account, the system receives a real-time webhook.
* PayPilot's reconciliation service matches the account to the customer and the oldest pending invoice.
* Payment status is updated instantly (**Paid**, **Partial**, or **Overpaid**), completely removing manual matching errors and lag time.

---

## 🚀 Features Implemented

### 📱 Frontend (Next.js 15+ App Router)
* **Landing Page**: Landing page with description, sandbox setup forms, and architectural breakdowns.
* **Merchant Dashboard**: Central panel featuring financial metrics (Total Revenue, Outstanding Balances, Unmatched Deposits, Invoice Ratios) and recent transactions.
* **Customer Directory**: Customer profiles, email, phone, active statuses, and Nomba virtual accounts.
* **Customer Profile Ledger**: Credit card-style virtual account mockup, outstanding invoice trackers, transaction ledger records, and statement cards.
* **Invoices Registry**: Register of all billing records, tracking status transitions with quick-generation controls.
* **Payments Feed**: Real-time deposit register showing auto-matched and unmatched transaction details.
* **Webhook Simulator**: Floating dialog tool on the dashboard and payments feed that allows developers/judges to copy a customer's virtual account, enter a mock amount, and fire a simulated bank transfer webhook to see instant auto-reconciliation.

### ⚙️ Backend (Django + Django REST Framework)
* **Dedicated API Endpoints**: REST convention routes for customers, invoices, payments, reporting, and dashboard metrics.
* **Persistent Mock Database (`db.json`)**: An atomic, file-based JSON database manager that persists data across page reloads and server restarts without local PostgreSQL configuration hassles. Pre-seeded with realistic Nigerian business profiles (Grace Foods, Tunde Logistics, Amaka Stores, Prime Tutors, Bayo Pharmacy).
* **Nomba Virtual Account Service Layer**: A cleanly decoupled service class (`NombaVirtualAccountService`) that provisions virtual accounts. Designed for minimal refactoring when replacing the sandbox with real Nomba production credentials.
* **Automatic Payment Reconciliation Engine**: Webhook processor service that matches incoming transfers to virtual accounts, calculates unpaid balances, updates corresponding invoice states, and log audit trails.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15+, React 19, Tailwind CSS v4, TypeScript, Lucide Icons.
* **Backend**: Django 6.0+, Django REST Framework (DRF), Django CORS Headers.
* **Database**: Persistent JSON mock database (designed for seamless PostgreSQL drop-in replacement).

---

## 📂 Project Structure

```
paypilot/
├── backend/
│   ├── apps/
│   │   ├── customers/        # Customer directory & Virtual Account service
│   │   ├── invoices/         # Invoice records registry
│   │   ├── payments/         # Payment stream & Webhook listener services
│   │   ├── dashboard/        # Global financial calculations
│   │   ├── reports/          # Individual statement sheets
│   │   └── utils/
│   │       └── db_manager.py # JSON database manager
│   ├── paypilot/             # Core project configurations
│   ├── db.json               # Sandbox database file
│   ├── test_api.py           # Automated integration test script
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router folders
│   │   │   ├── (dashboard)/  # Shared sidebar layout & subpages
│   │   │   ├── src/lib/api.ts# API clients and formatting tools
│   │   │   └── page.tsx      # Landing page
│   │   └── components/       # Layout components (Sidebar, TopNavbar)
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
└── README.md
```

---

## ⚙️ Installation & Running Locally

### Prerequisites
* Python 3.10+
* Node.js 18+ & npm

### 1. Run the Backend API
Navigate to the `backend/` folder and setup your Python environment:

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install django djangorestframework django-cors-headers

# Initialize/seed database & run tests to verify
python test_api.py

# Start Django development server
python manage.py runserver
```
The backend API will run on **`http://localhost:8000`**.

### 2. Run the Frontend App
Navigate to the `frontend/` folder and set up npm:

```bash
# Install packages
npm install

# Start Next.js development server
npm run dev
```
Open **`http://localhost:3000`** in your browser to access PayPilot.

---

## 🔌 API Route Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/customers/` | List all customer profiles and virtual accounts |
| **POST** | `/api/customers/` | Create a customer and auto-generate Nomba Virtual Account details |
| **GET** | `/api/customers/<id>/` | Fetch details for a specific customer profile |
| **GET** | `/api/invoices/` | List all invoices hydrated with customer metadata |
| **POST** | `/api/invoices/` | Generate a billing invoice for a customer |
| **GET** | `/api/payments/` | Retrieve a stream of all transaction histories |
| **POST** | `/api/payments/mock-webhook/` | Webhook listener simulating inbound Nomba transfer |
| **GET** | `/api/dashboard/` | Fetch global metrics for dashboard cards |
| **GET** | `/api/reports/customer/<id>/` | Retrieve customer ledger summaries and statements |

---

## 🔁 Webhook Reconciliation Flow Simulation

To demonstrate automated settlement during the hackathon:
1. **Add Customer**: Go to **Customers** and click **Add New Customer**. A dedicated virtual account (e.g. Providus Bank) is automatically created.
2. **Issue Invoice**: Click **Issue Invoice**, select the customer, enter `150000` NGN, and submit. The invoice status is **Pending**.
3. **Simulate Transfer**: Go to **Dashboard** or **Payments Feed**, click **Simulate Webhook**, select the customer, enter `150000` NGN, and click **Fire Webhook Event**.
4. **Instant Match**: Under the hood, the backend processes the transfer webhook:
   * It maps the destination virtual account to the customer.
   * It locates the pending invoice.
   * It marks the invoice status as **Paid** and writes a payment transaction record.
   * The dashboard metrics, payment feed, and customer statement ledger update in real time.

---

## 🔮 Future Roadmap

### 📦 Database Migration Plan
* Replace the JSON `db_manager.py` with standard **Django models** linked to a **PostgreSQL** database.
* Utilize Django migrations (`makemigrations` and `migrate`) for schema tracking.

### 💳 Real Nomba API Integration
* Replace the `NombaVirtualAccountService.provision_account` logic with actual calls to the Nomba virtual account endpoint.
* Authenticate API calls using a secure client token header.
* Secure webhook listener endpoint (`/api/mock-webhook/` -> `/api/webhook/`) using payload signature verification.

---

## 📄 License & Contributors

* **Contributors**: Built by a Senior Software Engineer for the DevCareer × Nomba Hackathon.
* **License**: MIT License.
