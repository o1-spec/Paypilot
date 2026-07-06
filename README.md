# PayPilot

**Dedicated Virtual Accounts & Automatic Payment Reconciliation for Nigerian Businesses**

> DevCareer × Nomba Hackathon Project — Built on Nomba's Virtual Account Infrastructure

---

## What is PayPilot?

PayPilot helps businesses assign a **dedicated virtual bank account** to every customer. When a customer makes a bank transfer, Nomba notifies PayPilot via webhook. PayPilot automatically identifies the customer, matches the payment to their oldest pending invoice, updates the invoice status, and notifies the merchant — **no manual work required**.

---

## Demo Quick Start

### 1. Login with seed credentials
| Field | Value |
|---|---|
| Email | `info@gracefoods.ng` |
| Password | `password` |

### 2. Webhook Demo (most impressive for judges)
1. Go to **Webhook Simulator** in the sidebar
2. Click **Seed Demo Data** (first time only)
3. Select a customer from the dropdown
4. Click **Simulate Incoming Transfer**
5. Watch the 6-step reconciliation pipeline animate in real time

### 3. Unmatched Payment Flow
1. In Webhook Simulator, tick **"Use unknown / unregistered account"**
2. Enter any account number not assigned to a customer (e.g. `9999999999`)
3. Simulate the transfer → payment is saved as UNMATCHED
4. Go to **Payments Feed → Review Queue** tab
5. Click **Claim** → assign to a customer → payment reconciled

---

## Full Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- SQLite (bundled) or PostgreSQL

### Backend (Django)

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

**Environment variables** — copy `.env.example` to `.env`:
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
NOMBA_API_KEY=your-nomba-api-key        # optional for sandbox
NOMBA_ACCOUNT_ID=your-account-id        # optional for sandbox
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:3000`

**Environment variables** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Seeding Demo Data

Via the **Webhook Simulator page** in the UI:
- Click **Seed Demo Data** → creates 3 customers with virtual accounts and pending invoices
- Click **Reset Demo** → wipes all customers, payments, and invoices

Via the API directly:
```bash
# Seed
curl -X POST http://localhost:8000/api/customers/demo/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "seed"}'

# Reset
curl -X POST http://localhost:8000/api/customers/demo/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "reset"}'
```

---

## Architecture

```
Customer pays → Nomba VA receives transfer
                       ↓
              Nomba sends webhook POST
                       ↓
         /api/webhooks/nomba/ (AllowAny)
                       ↓
         ReconciliationService (atomic)
         ├── Idempotency check (reference)
         ├── Match virtual account → customer
         ├── Find oldest PENDING invoice
         ├── Update invoice (PAID/PARTIAL/OVERPAID)
         ├── Create Notification
         └── Return result
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register merchant |
| POST | `/api/auth/login/` | Login, returns JWT |
| GET | `/api/customers/` | List customers |
| POST | `/api/customers/` | Create customer |
| GET | `/api/customers/{id}/` | Customer detail |
| POST | `/api/virtual-accounts/provision/` | Provision virtual account |
| GET | `/api/invoices/` | List invoices |
| POST | `/api/invoices/` | Create invoice |
| POST | `/api/invoices/{id}/cancel/` | Cancel invoice |
| GET | `/api/payments/` | List payments |
| POST | `/api/payments/{id}/assign/` | Assign unmatched payment |
| POST | `/api/payments/{id}/mark-reviewed/` | Flag for review |
| POST | `/api/webhooks/nomba/` | Webhook receiver (Nomba) |
| GET | `/api/dashboard/summary/` | Dashboard stats |
| GET | `/api/reports/customers/{id}/statement/` | Customer statement |
| GET | `/api/notifications/` | List notifications |
| POST | `/api/notifications/mark-all-read/` | Mark all read |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Django 5, Django REST Framework |
| Auth | JWT (SimpleJWT) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Virtual Accounts | Nomba API (mocked in sandbox) |
| Webhooks | Nomba webhook callbacks |

---

## Judging Criteria Coverage

| Criterion | Implementation |
|---|---|
| ✅ Account Provisioning | `POST /api/virtual-accounts/provision/` — Nomba API call per customer |
| ✅ Inbound Reconciliation | Webhook engine: idempotent, atomic, multi-status |
| ✅ Customer Statements | Full ledger: invoices + payments + running balance |
| ✅ Misdirected Payments | UNMATCHED flow → Review Queue → manual assign |
| ✅ Developer API | Full REST API with JWT auth |
| ✅ Identity Model | 1 customer → 1 persistent VA → many transactions |

---

## Project Structure

```
Paypilot/
├── backend/
│   ├── accounts/          # JWT auth, merchant profiles
│   ├── customers/         # Customer CRUD + demo seed
│   ├── virtual_accounts/  # Nomba provisioning
│   ├── invoices/          # Invoice lifecycle
│   ├── payments/          # Payment records + assignment
│   ├── webhooks/          # Nomba webhook receiver
│   ├── notifications/     # In-app notification system
│   ├── dashboard/         # Aggregated summary API
│   └── paypilot/          # Django settings + root URLs
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx                    # Landing page
        │   └── (dashboard)/
        │       ├── dashboard/              # Main dashboard
        │       ├── customers/              # Customer list + detail
        │       ├── invoices/               # Invoice list + detail
        │       ├── payments/               # Payments + review queue
        │       ├── reports/                # Statements + analytics
        │       ├── webhook-demo/           # Live reconciliation demo
        │       └── settings/               # Profile + API config
        ├── components/                     # Shared UI components
        └── lib/
            └── api.ts                      # Typed API client (axios)
```

---

## Team

Built by the PayPilot team for the DevCareer × Nomba Hackathon 2026.

> *"We're not just building another payment dashboard. We're building a payment operations platform that demonstrates how Nomba's Dedicated Virtual Accounts can simplify payment collection, automate reconciliation, and give businesses complete visibility into their incoming payments."*
