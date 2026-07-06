# PayPilot Database Models Tasks

- [x] Project Settings Updates
  - [x] Add `AUTH_USER_MODEL` and database configuration fallbacks in `settings.py`
  - [x] Force configure `USE_SQLITE=True` in `.env` for initial migration testing (fallback sandbox validation)
- [x] Implement Models, Serializers, and Admins
  - [x] `accounts` app (Merchant model, serializers, admin registration)
  - [x] `customers` app (Customer model, serializers, admin registration)
  - [x] `virtual_accounts` app (VirtualAccount model, serializers, admin registration)
  - [x] `invoices` app (Invoice model, serializers, admin registration)
  - [x] `payments` app (Payment model, serializers, admin registration)
  - [x] `webhooks` app (WebhookEvent model, serializers, admin registration)
  - [x] `notifications` app (Notification model, serializers, admin registration)
- [x] Schema Migrations & API URLs Wiring
  - [x] Run `makemigrations` and verify schemas
  - [x] Run `migrate` to apply schemas
  - [x] Wire up basic list-create views and routes for the apps to check DRF serialization
- [x] Verification
  - [x] Verify using Django management shell imports
  - [x] Create walkthrough.md
