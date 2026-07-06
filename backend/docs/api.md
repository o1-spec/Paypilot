# PayPilot REST API Reference & Payload Specs

All Resource APIs require a valid JWT Access Token inside the HTTP header:
`Authorization: Bearer <your_access_token>`

---

## 🔐 1. Authentication Endpoints

### Register Merchant
`POST /api/auth/register/`

* **Request Payload:**
```json
{
  "username": "gracefoods",
  "email": "info@gracefoods.ng",
  "password": "strong_secure_password",
  "business_name": "Grace Foods Enterprises",
  "phone": "+2348011112222"
}
```
* **Response Output (201 Created):**
```json
{
  "user": {
    "id": "c61b17a1-2d7c-473d-bc8e-d900de51df67",
    "username": "gracefoods",
    "email": "info@gracefoods.ng",
    "business_name": "Grace Foods Enterprises",
    "phone": "+2348011112222",
    "created_at": "2026-07-06T21:52:10Z"
  },
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login Merchant
`POST /api/auth/login/`

* **Request Payload:**
```json
{
  "email": "info@gracefoods.ng",
  "password": "strong_secure_password"
}
```
* **Response Output (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "c61b17a1-2d7c-473d-bc8e-d900de51df67",
    "username": "gracefoods",
    "email": "info@gracefoods.ng",
    "business_name": "Grace Foods Enterprises",
    "phone": "+2348011112222",
    "created_at": "2026-07-06T21:52:10Z"
  }
}
```

---

## 👥 2. Customer Endpoints

### Create Customer (Auto-provisions Virtual Account)
`POST /api/customers/`

* **Request Payload:**
```json
{
  "full_name": "Tunde Bakare",
  "email": "tunde@bakarelogistics.com",
  "phone": "+2348033334444",
  "business_name": "Bakare Logistics Services"
}
```
* **Response Output (201 Created):**
```json
{
  "id": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
  "merchant": "c61b17a1-2d7c-473d-bc8e-d900de51df67",
  "full_name": "Tunde Bakare",
  "email": "tunde@bakarelogistics.com",
  "phone": "+2348033334444",
  "business_name": "Bakare Logistics Services",
  "status": "active",
  "virtual_account": {
    "id": "8ec22f1d-91b3-44ca-88ff-c9a1286c4e09",
    "account_number": "5056105877",
    "account_name": "PP - Tunde Bakare",
    "bank_name": "Providus Bank",
    "provider": "Nomba",
    "status": "active"
  },
  "created_at": "2026-07-06T21:54:10Z"
}
```

---

## 🧾 3. Invoicing Endpoints

### Create Invoice (Auto-numbers & Resolves State)
`POST /api/invoices/`

* **Request Payload:**
```json
{
  "customer": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
  "amount": "150000.00",
  "due_date": "2026-08-01",
  "description": "Logistics operations cycle 04 billing"
}
```
* **Response Output (201 Created):**
```json
{
  "id": "a8c9b2f3-e29d-4762-b9ea-c13f649281a3",
  "merchant": "c61b17a1-2d7c-473d-bc8e-d900de51df67",
  "customer": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
  "customer_name": "Tunde Bakare",
  "business_name": "Bakare Logistics Services",
  "account_number": "5056105877",
  "bank_name": "Providus Bank",
  "invoice_number": "INV-2026-017264",
  "amount": "150000.00",
  "amount_paid": "0.00",
  "description": "Logistics operations cycle 04 billing",
  "due_date": "2026-08-01",
  "status": "PENDING",
  "created_at": "2026-07-06T21:55:02Z"
}
```

---

## 🏦 4. Virtual Account Endpoints

### Manual Provision Virtual Account
`POST /api/virtual-accounts/provision/`

* **Request Payload:**
```json
{
  "customer_id": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c"
}
```
* **Response Output (201 Created):**
```json
{
  "id": "8ec22f1d-91b3-44ca-88ff-c9a1286c4e09",
  "customer": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
  "customer_details": {
    "id": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
    "full_name": "Tunde Bakare",
    "email": "tunde@bakarelogistics.com",
    "phone": "+2348033334444",
    "business_name": "Bakare Logistics Services",
    "status": "active"
  },
  "account_number": "5056105877",
  "account_name": "PP - Tunde Bakare",
  "bank_name": "Providus Bank",
  "provider": "Nomba",
  "status": "active",
  "created_at": "2026-07-06T21:54:10Z"
}
```

---

## 🔄 5. Webhook Reconciliation Endpoints

### Mock Nomba Webhook (AllowAny Endpoint)
`POST /api/webhooks/nomba/`

* **Request Payload:**
```json
{
  "event": "virtual_account.payment_received",
  "data": {
    "account_number": "5056105877",
    "amount": 150000.00,
    "reference": "TXN_M1_RECON_8822",
    "sender_name": "Tunde Bakare",
    "sender_account_number": "0022334455",
    "bank_name": "Nomba Bank"
  }
}
```
* **Response Output (200 OK):**
```json
{
  "matched": true,
  "customer": {
    "id": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
    "full_name": "Tunde Bakare",
    "email": "tunde@bakarelogistics.com",
    "phone": "+2348033334444",
    "business_name": "Bakare Logistics Services",
    "status": "active"
  },
  "invoice": {
    "id": "a8c9b2f3-e29d-4762-b9ea-c13f649281a3",
    "invoice_number": "INV-2026-017264",
    "amount": "150000.00",
    "amount_paid": "150000.00",
    "status": "PAID"
  },
  "payment": {
    "id": "2fe99d81-19b3-4f9a-bbce-1c192d774a03",
    "amount": "150000.00",
    "reference": "TXN_M1_RECON_8822",
    "sender_name": "Tunde Bakare",
    "sender_account_number": "0022334455",
    "status": "MATCHED",
    "created_at": "2026-07-06T21:56:45Z"
  },
  "reconciliation_status": "MATCHED",
  "message": "Payment matched to customer Tunde Bakare. Applied to invoice INV-2026-017264 (New status: PAID)."
}
```

---

## ⚡ 6. Claim / Assignment Endpoints

### Assign Unmatched Payment
`POST /api/payments/{id}/assign/`

* **Request Payload:**
```json
{
  "customer": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
  "invoice": "a8c9b2f3-e29d-4762-b9ea-c13f649281a3"
}
```
* **Response Output (200 OK):**
```json
{
  "id": "d9f8281b-a2c9-4bd9-9e8a-78da37210bc9",
  "merchant": "c61b17a1-2d7c-473d-bc8e-d900de51df67",
  "customer": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
  "invoice": "a8c9b2f3-e29d-4762-b9ea-c13f649281a3",
  "amount": "18500.00",
  "reference": "TXN-UNMATCHED-102293",
  "sender_name": "Musa Ibrahim",
  "sender_account_number": "0033441122",
  "status": "MATCHED",
  "created_at": "2026-07-06T21:10:02Z"
}
```

---

## 📊 7. Reports & Ledger Endpoints

### Get Customer Statement report
`GET /api/reports/customers/{id}/statement/`

* **Response Output (200 OK):**
```json
{
  "customer": {
    "id": "4b9a22f3-10ac-4ebd-a8de-51d087b2f63c",
    "full_name": "Tunde Bakare",
    "email": "tunde@bakarelogistics.com",
    "phone": "+2348033334444",
    "business_name": "Bakare Logistics Services",
    "status": "active"
  },
  "virtual_account": {
    "id": "8ec22f1d-91b3-44ca-88ff-c9a1286c4e09",
    "account_number": "5056105877",
    "account_name": "PP - Tunde Bakare",
    "bank_name": "Providus Bank",
    "provider": "Nomba",
    "status": "active"
  },
  "total_invoice_amount": 150000.00,
  "total_paid": 150000.00,
  "outstanding_balance": 0.00,
  "invoices": [
    {
      "id": "a8c9b2f3-e29d-4762-b9ea-c13f649281a3",
      "invoice_number": "INV-2026-017264",
      "amount": "150000.00",
      "amount_paid": "150000.00",
      "status": "PAID",
      "created_at": "2026-07-06T21:55:02Z"
    }
  ],
  "payments": [
    {
      "id": "2fe99d81-19b3-4f9a-bbce-1c192d774a03",
      "amount": "150000.00",
      "reference": "TXN_M1_RECON_8822",
      "status": "MATCHED",
      "created_at": "2026-07-06T21:56:45Z"
    }
  ],
  "statement_lines": [
    {
      "date": "2026-07-06",
      "type": "INVOICE",
      "description": "Logistics operations cycle 04 billing",
      "debit": "150000.00",
      "credit": "0.00",
      "reference": "INV-2026-017264",
      "running_balance": 150000.00
    },
    {
      "date": "2026-07-06",
      "type": "PAYMENT",
      "description": "Payment received from Tunde Bakare",
      "debit": "0.00",
      "credit": "150000.00",
      "reference": "TXN_M1_RECON_8822",
      "running_balance": 0.00
    }
  ]
}
```

---

## 📊 8. Dashboard Summary Endpoints

### Get Dashboard summary Metrics
`GET /api/dashboard/summary/`

* **Response Output (200 OK):**
```json
{
  "total_customers": 5,
  "total_virtual_accounts": 5,
  "total_revenue": 650000.00,
  "todays_revenue": 150000.00,
  "outstanding_balance": 85000.00,
  "pending_invoices_count": 2,
  "paid_invoices_count": 8,
  "partial_invoices_count": 1,
  "overpaid_invoices_count": 0,
  "unmatched_payments_count": 3,
  "recent_payments": [
    {
      "id": "2fe99d81-19b3-4f9a-bbce-1c192d774a03",
      "amount": "150000.00",
      "reference": "TXN_M1_RECON_8822",
      "status": "MATCHED",
      "created_at": "2026-07-06T21:56:45Z"
    }
  ],
  "recent_invoices": [
    {
      "id": "a8c9b2f3-e29d-4762-b9ea-c13f649281a3",
      "invoice_number": "INV-2026-017264",
      "amount": "150000.00",
      "amount_paid": "150000.00",
      "status": "PAID",
      "created_at": "2026-07-06T21:55:02Z"
    }
  ],
  "recent_notifications": [
    {
      "id": "9ecb2d81-0f2c-47bb-a9ee-89ca88a20bc9",
      "title": "Payment Received & Reconciled",
      "message": "Received NGN 150,000.00 from Tunde Bakare for customer Tunde Bakare. Applied to invoice INV-2026-017264 (New status: PAID).",
      "type": "INVOICE_PAID",
      "read": false,
      "created_at": "2026-07-06T21:56:45Z"
    }
  ],
  "monthly_revenue_summary": [
    {"month": "Jan", "amount": "0.00"},
    {"month": "Feb", "amount": "0.00"},
    {"month": "Mar", "amount": "0.00"},
    {"month": "Apr", "amount": "0.00"},
    {"month": "May", "amount": "0.00"},
    {"month": "Jun", "amount": "0.00"},
    {"month": "Jul", "amount": "650000.00"},
    {"month": "Aug", "amount": "0.00"},
    {"month": "Sep", "amount": "0.00"},
    {"month": "Oct", "amount": "0.00"},
    {"month": "Nov", "amount": "0.00"},
    {"month": "Dec", "amount": "0.00"}
  ],
  "invoice_status_breakdown": {
    "PENDING": 2,
    "PARTIAL": 1,
    "PAID": 8,
    "OVERPAID": 0,
    "CANCELLED": 1
  }
}
```
