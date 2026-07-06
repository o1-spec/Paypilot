import os
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "paypilot.settings")
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from customers.models import Customer
from invoices.models import Invoice
from payments.models import Payment
from webhooks.models import WebhookEvent

Merchant = get_user_model()

def run_tests():
    print("Initializing Django JWT API test suite...")
    
    # Reset test merchants, payments, & webhook events to ensure fresh environment
    Merchant.objects.filter(email='test_m1@paypilot.ng').delete()
    Merchant.objects.filter(email='test_m2@paypilot.ng').delete()
    Payment.objects.filter(reference__startswith='TXN_M1_').delete()
    Payment.objects.filter(reference__startswith='TXN_M2_').delete()
    WebhookEvent.objects.filter(reference__startswith='TXN_M1_').delete()
    WebhookEvent.objects.filter(reference__startswith='TXN_M2_').delete()
    
    client = Client()

    # 1. Verify that accessing a protected endpoint without credentials fails
    print("\n--- Testing Access Control (Unauthenticated block) ---")
    res = client.get("/api/customers/")
    assert res.status_code == 401
    err_data = res.json()
    print("Success! Request blocked with 401. Response:", err_data)
    assert "error" in err_data

    # 2. Test Merchant Registration (POST /api/auth/register/)
    print("\n--- Testing Merchant Registration (POST /api/auth/register/) ---")
    m1_payload = {
        "username": "test_m1",
        "email": "test_m1@paypilot.ng",
        "password": "m1_password",
        "business_name": "M1 Logistics Co.",
        "phone": "+2348011111111"
    }
    res = client.post("/api/auth/register/", m1_payload, content_type="application/json")
    assert res.status_code == 201
    reg_data = res.json()
    print("Success! Merchant registered. Email:", reg_data["user"]["email"])
    assert "access" in reg_data
    assert "refresh" in reg_data
    
    # 3. Test Merchant Login (POST /api/auth/login/)
    print("\n--- Testing Merchant Login (POST /api/auth/login/) ---")
    login_payload = {
        "email": "test_m1@paypilot.ng",
        "password": "m1_password"
    }
    res = client.post("/api/auth/login/", login_payload, content_type="application/json")
    assert res.status_code == 200
    login_data = res.json()
    print("Success! Login succeeded, tokens issued.")
    assert "access" in login_data
    assert "refresh" in login_data
    
    m1_access = login_data["access"]
    m1_refresh = login_data["refresh"]
    auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {m1_access}"}

    # 4. Test Authenticated Profile (GET /api/auth/me/)
    print("\n--- Testing Profile Endpoint (GET /api/auth/me/) ---")
    res = client.get("/api/auth/me/", **auth_headers)
    assert res.status_code == 200
    profile = res.json()
    print("Success! Profile retrieved. Business name:", profile["business_name"])
    assert profile["email"] == "test_m1@paypilot.ng"

    # 5. Create Customer for Merchant 1
    print("\n--- Testing Scoped Customer Creation ---")
    cust_payload = {
        "full_name": "Femi Otedola",
        "email": "femi@zenon.com",
        "phone": "+2348022222222",
        "business_name": "Zenon Oil"
    }
    res = client.post("/api/customers/", cust_payload, content_type="application/json", **auth_headers)
    assert res.status_code == 201
    cust_data = res.json()
    print("Success! Created customer for M1:", cust_data["full_name"])
    assert cust_data["merchant"] == profile["id"]
    
    cust_id = cust_data["id"]
    account_number = cust_data["virtual_account"]["account_number"]
    va_id = cust_data["virtual_account"]["id"]

    # 5b. Test GET /api/virtual-accounts/
    print("\n--- Testing GET /api/virtual-accounts/ (List) ---")
    res = client.get("/api/virtual-accounts/", **auth_headers)
    assert res.status_code == 200
    va_list = res.json()
    assert len(va_list) >= 1
    print("Success! Found virtual accounts list. Nested customer details:", va_list[0]["customer_details"]["full_name"])

    # 5c. Test GET /api/virtual-accounts/{id}/
    print("\n--- Testing GET /api/virtual-accounts/{id}/ (Detail) ---")
    res = client.get(f"/api/virtual-accounts/{va_id}/", **auth_headers)
    assert res.status_code == 200
    va_detail = res.json()
    assert va_detail["account_number"] == account_number
    assert "customer_details" in va_detail
    print("Success! Retrieved virtual account details for account number:", va_detail["account_number"])

    # 5d. Test duplicate provision attempt POST /api/virtual-accounts/provision/
    print("\n--- Testing Duplicate Provision Prevention ---")
    res = client.post("/api/virtual-accounts/provision/", {"customer_id": cust_id}, content_type="application/json", **auth_headers)
    assert res.status_code == 400
    print("Success! Duplicate provisioning request rejected with 400. Response:", res.json())

    # 6. Create Invoice for Merchant 1 (Auto-generated invoice number)
    print("\n--- Testing Scoped Invoice Creation (Auto-generated Number) ---")
    invoice_payload = {
        "customer": cust_id,
        "amount": 500000.00,
        "description": "Fuel delivery invoice",
        "due_date": "2026-08-01"
    }
    res = client.post("/api/invoices/", invoice_payload, content_type="application/json", **auth_headers)
    assert res.status_code == 201
    inv_data = res.json()
    assert inv_data["invoice_number"].startswith("INV-2026-")
    print("Success! Created invoice. Auto-generated invoice number:", inv_data["invoice_number"])

    # 6b. Test Positive Amount Constraint
    print("\n--- Testing Negative Amount Constraint ---")
    bad_invoice_payload = {
        "customer": cust_id,
        "amount": -50.00,
        "due_date": "2026-08-01"
    }
    res = client.post("/api/invoices/", bad_invoice_payload, content_type="application/json", **auth_headers)
    assert res.status_code == 400
    print("Success! Negative amount invoice creation blocked (400). Response:", res.json())

    # 6c. Create a second invoice to test Listing & Cancellation
    print("\n--- Testing Second Invoice (For cancel checks) ---")
    res = client.post("/api/invoices/", {
        "customer": cust_id,
        "amount": 25000.00,
        "due_date": "2026-09-01"
    }, content_type="application/json", **auth_headers)
    assert res.status_code == 201
    inv2_data = res.json()
    inv2_id = inv2_data["id"]

    # 6d. Test GET /api/customers/{id}/invoices/
    print("\n--- Testing Customer Invoices List endpoint ---")
    res = client.get(f"/api/customers/{cust_id}/invoices/", **auth_headers)
    assert res.status_code == 200
    cust_invoices = res.json()
    assert len(cust_invoices) == 2
    print("Success! Retrieved 2 customer invoices.")

    # 6e. Test Cancel Invoice POST /api/invoices/{id}/cancel/
    print("\n--- Testing Cancel Invoice ---")
    res = client.post(f"/api/invoices/{inv2_id}/cancel/", **auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "CANCELLED"
    print("Success! Second invoice status is CANCELLED.")

    # 7. Webhook Auto-Reconciliation Flow (AllowAny webhook)
    print("\n--- Testing Nomba Webhook (Unauthenticated matching) ---")
    webhook_payload = {
        "event": "virtual_account.payment_received",
        "data": {
            "account_number": account_number,
            "amount": 500000.00,
            "reference": "TXN_M1_RECON_8822",
            "sender_name": "Femi Otedola",
            "sender_account_number": "0022334455",
            "bank_name": "Nomba Bank"
        }
    }
    # Webhook does NOT send authorization headers
    res = client.post("/api/webhooks/nomba/", webhook_payload, content_type="application/json")
    assert res.status_code == 200
    web_res = res.json()
    print("Success! Webhook processed. Reconciliation outcome:", web_res["reconciliation_status"])
    assert web_res["reconciliation_status"] == "MATCHED"

    # Verify invoice status changed to PAID
    res = client.get(f"/api/invoices/{inv_data['id']}/", **auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "PAID"
    print("Success! Invoice verified as PAID.")

    # 7b. Test Cancel block on PAID invoices
    print("\n--- Testing Block Cancellation on Paid Invoices ---")
    res = client.post(f"/api/invoices/{inv_data['id']}/cancel/", **auth_headers)
    assert res.status_code == 400
    print("Success! Rejection block verified for paid invoice cancellation.")

    # 7c. Test GET /api/invoices/?status=CANCELLED filter
    print("\n--- Testing GET /api/invoices/ Filter by Status ---")
    res = client.get("/api/invoices/?status=CANCELLED", **auth_headers)
    assert res.status_code == 200
    cancelled_list = res.json()
    assert len(cancelled_list) == 1
    assert cancelled_list[0]["id"] == inv2_id
    print("Success! Verified filtered invoice listing results.")

    # 7d. Test Duplicate Webhook Idempotency (same reference)
    print("\n--- Testing Webhook Idempotency (Duplicate reference) ---")
    res = client.post("/api/webhooks/nomba/", webhook_payload, content_type="application/json")
    assert res.status_code == 200
    dup_res = res.json()
    assert "duplicate reference" in dup_res["message"]
    assert dup_res["reconciliation_status"] == "MATCHED"
    print("Success! Duplicate webhook returned safe idempotent response.")

    # 7e. Test Unmatched Payment Flow
    print("\n--- Testing Unmatched Payment ---")
    unmatched_payload = {
        "event": "virtual_account.payment_received",
        "data": {
            "account_number": "9999999999", # Non-existent account
            "amount": 15000.00,
            "reference": "TXN_M1_UNMATCHED_88",
            "sender_name": "Unknown Person",
            "sender_account_number": "112233",
            "bank_name": "Zenith Bank"
        }
    }
    res = client.post("/api/webhooks/nomba/", unmatched_payload, content_type="application/json")
    assert res.status_code == 200
    un_res = res.json()
    assert un_res["matched"] is False
    assert un_res["reconciliation_status"] == "UNMATCHED"
    print("Success! Unmatched payment registered correctly.")

    # 7f. Test Partial and Overpayment Flow
    print("\n--- Testing Partial & Overpayment Flows ---")
    # Create a new invoice for NGN 100,000.00
    res = client.post("/api/invoices/", {
        "customer": cust_id,
        "amount": 100000.00,
        "due_date": "2026-10-01"
    }, content_type="application/json", **auth_headers)
    assert res.status_code == 201
    inv3_data = res.json()
    inv3_id = inv3_data["id"]

    # Send partial webhook payment of NGN 40,000.00
    partial_payload = {
        "event": "virtual_account.payment_received",
        "data": {
            "account_number": account_number,
            "amount": 40000.00,
            "reference": "TXN_M1_PARTIAL_777",
            "sender_name": "Femi Otedola",
            "sender_account_number": "0022334455",
            "bank_name": "Nomba Bank"
        }
    }
    res = client.post("/api/webhooks/nomba/", partial_payload, content_type="application/json")
    assert res.status_code == 200
    part_res = res.json()
    assert part_res["reconciliation_status"] == "MATCHED"
    
    # Verify invoice status is PARTIAL
    res = client.get(f"/api/invoices/{inv3_id}/", **auth_headers)
    assert res.json()["status"] == "PARTIAL"
    assert float(res.json()["amount_paid"]) == 40000.00
    print("Success! Partial payment successfully applied. Invoice is PARTIAL.")

    # Send overpayment webhook payment of NGN 80,000.00 (exceeds remaining balance)
    overpay_payload = {
        "event": "virtual_account.payment_received",
        "data": {
            "account_number": account_number,
            "amount": 80000.00,
            "reference": "TXN_M1_OVERPAY_999",
            "sender_name": "Femi Otedola",
            "sender_account_number": "0022334455",
            "bank_name": "Nomba Bank"
        }
    }
    res = client.post("/api/webhooks/nomba/", overpay_payload, content_type="application/json")
    assert res.status_code == 200
    
    # Verify invoice status is OVERPAID
    res = client.get(f"/api/invoices/{inv3_id}/", **auth_headers)
    assert res.json()["status"] == "OVERPAID"
    assert float(res.json()["amount_paid"]) == 120000.00
    print("Success! Overpayment successfully applied. Invoice is OVERPAID.")

    # 8. Create Merchant 2 & Verify Data Isolation
    print("\n--- Testing Multi-tenant Scoping Isolation (Merchant 2 check) ---")
    m2_payload = {
        "username": "test_m2",
        "email": "test_m2@paypilot.ng",
        "password": "m2_password",
        "business_name": "M2 Ventures",
        "phone": "+2348022222222"
    }
    res = client.post("/api/auth/register/", m2_payload, content_type="application/json")
    assert res.status_code == 201
    m2_data = res.json()
    m2_access = m2_data["access"]
    m2_headers = {"HTTP_AUTHORIZATION": f"Bearer {m2_access}"}

    # Merchant 2 queries customers - should not see Merchant 1's customer
    res = client.get("/api/customers/", **m2_headers)
    assert res.status_code == 200
    m2_customers = res.json()
    print(f"Success! Merchant 2 customer list has {len(m2_customers)} records.")
    assert len(m2_customers) == 0

    # Merchant 2 queries Merchant 1's customer detail - should fail with 404
    res = client.get(f"/api/customers/{cust_id}/", **m2_headers)
    assert res.status_code == 404
    print("Success! Merchant 2 blocked from viewing Merchant 1's customer profile details (404).")

    # Merchant 2 attempts to register invoice for Merchant 1's customer - should fail with 404/validation check
    bad_invoice_payload = {
        "customer": cust_id,
        "amount": 10000.00,
        "due_date": "2026-09-01",
        "invoice_number": "INV-M2-HAXX"
    }
    res = client.post("/api/invoices/", bad_invoice_payload, content_type="application/json", **m2_headers)
    assert res.status_code == 404 or res.status_code == 400
    # Merchant 2 attempts to provision virtual account for Merchant 1's customer - should fail with 403 Forbidden
    res = client.post("/api/virtual-accounts/provision/", {"customer_id": cust_id}, content_type="application/json", **m2_headers)
    assert res.status_code == 403
    print("Success! Merchant 2 blocked from provisioning account for Merchant 1's customer.")

    # 9. Test Token Logout (POST /api/auth/logout/)
    print("\n--- Testing Token Logout (POST /api/auth/logout/) ---")
    logout_payload = {"refresh": m1_refresh}
    res = client.post("/api/auth/logout/", logout_payload, content_type="application/json", **auth_headers)
    assert res.status_code == 200
    print("Success! Merchant 1 logged out.")

    # Try accessing profile with old token after logout - should still work since logout blacklists refresh, not access token
    res = client.get("/api/auth/me/", **auth_headers)
    assert res.status_code == 200

    # Try refreshing access token using blacklisted refresh token - should fail!
    print("\n--- Testing Blacklisted Refresh Token ---")
    refresh_payload = {"refresh": m1_refresh}
    res = client.post("/api/auth/token/refresh/", refresh_payload, content_type="application/json")
    assert res.status_code == 401
    print("Success! Blacklisted refresh token rejected on rotation.")

    print("\nALL BACKEND API AUTH & SCAPPING TESTS PASSED SUCCESSFULLY!")

    # Cleanup database records
    Merchant.objects.filter(email='test_m1@paypilot.ng').delete()
    Merchant.objects.filter(email='test_m2@paypilot.ng').delete()

if __name__ == "__main__":
    run_tests()
