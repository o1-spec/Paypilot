import os
import sys
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "paypilot.settings")
django.setup()

from django.test import Client
from apps.utils.db_manager import JSONDatabase, DB_FILE

def run_tests():
    print("Initializing test environment and database...")
    # Force reset DB
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    
    db = JSONDatabase.load()
    print(f"Database seeded with {len(db['customers'])} customers.")
    
    client = Client()
    
    # 1. Test GET /api/customers/
    print("\n--- Testing GET /api/customers/ ---")
    res = client.get("/api/customers/")
    assert res.status_code == 200
    customers = res.json()
    print(f"Success! Found {len(customers)} customers.")
    
    # 2. Test POST /api/customers/
    print("\n--- Testing POST /api/customers/ ---")
    new_cust_payload = {
        "name": "Bayo Logistics",
        "email": "bayo@logistics.ng",
        "phone": "+2348099999999",
        "business_name": "Bayo Logistics Services"
    }
    res = client.post("/api/customers/", new_cust_payload, content_type="application/json")
    assert res.status_code == 201
    created_cust = res.json()
    print("Success! Created customer:", created_cust["name"])
    assert "virtual_account" in created_cust
    print("Generated Virtual Account:", created_cust["virtual_account"])
    
    # 3. Test GET /api/customers/:id/
    print("\n--- Testing GET /api/customers/:id/ ---")
    cust_id = created_cust["id"]
    res = client.get(f"/api/customers/{cust_id}/")
    assert res.status_code == 200
    assert res.json()["name"] == "Bayo Logistics"
    print("Success! Retrieved detail for Bayo Logistics.")
    
    # 4. Test GET /api/invoices/
    print("\n--- Testing GET /api/invoices/ ---")
    res = client.get("/api/invoices/")
    assert res.status_code == 200
    print(f"Success! Found {len(res.json())} invoices.")
    
    # 5. Test POST /api/invoices/
    print("\n--- Testing POST /api/invoices/ ---")
    invoice_payload = {
        "customer_id": cust_id,
        "amount": 250000.0,
        "description": "Logistics operations deposit",
        "due_date": "2026-08-01"
    }
    res = client.post("/api/invoices/", invoice_payload, content_type="application/json")
    assert res.status_code == 201
    created_inv = res.json()
    print("Success! Created invoice:", created_inv["id"], "Amount:", created_inv["amount"])
    
    # 6. Test GET /api/dashboard/ before reconciliation
    print("\n--- Testing GET /api/dashboard/ (Initial) ---")
    res = client.get("/api/dashboard/")
    assert res.status_code == 200
    dash_data = res.json()
    initial_revenue = dash_data["total_revenue"]
    initial_outstanding = dash_data["outstanding_balance"]
    print(f"Total Customers: {dash_data['total_customers']}")
    print(f"Total Revenue: NGN {initial_revenue:,.2f}")
    print(f"Outstanding Balance: NGN {initial_outstanding:,.2f}")
    
    # 7. Test POST /api/payments/mock-webhook/ (reconciliation matching the invoice)
    print("\n--- Testing POST /api/payments/mock-webhook/ (Matched) ---")
    account_number = created_cust["virtual_account"]["account_number"]
    webhook_payload = {
        "account_number": account_number,
        "amount": 250000.0,
        "bank_name": created_cust["virtual_account"]["bank_name"],
        "reference": "TXN_TEST_MATCH_001"
    }
    res = client.post("/api/payments/mock-webhook/", webhook_payload, content_type="application/json")
    assert res.status_code == 200
    webhook_res = res.json()
    print("Success! Webhook responded:", webhook_res["message"])
    payment = webhook_res["payment"]
    print("Payment status:", payment["status"])
    print("Reconciliation detail:", payment["reconciliation_detail"])
    assert payment["invoice_id"] == created_inv["id"]
    
    # 8. Test GET /api/dashboard/ after reconciliation
    print("\n--- Testing GET /api/dashboard/ (After Matched Payment) ---")
    res = client.get("/api/dashboard/")
    dash_data = res.json()
    print(f"Updated Revenue: NGN {dash_data['total_revenue']:,.2f}")
    print(f"Updated Outstanding: NGN {dash_data['outstanding_balance']:,.2f}")
    assert dash_data["total_revenue"] == initial_revenue + 250000.0
    
    # 9. Test POST /api/payments/mock-webhook/ (Unmatched)
    print("\n--- Testing POST /api/payments/mock-webhook/ (Unmatched) ---")
    unmatched_payload = {
        "account_number": "9999999999",
        "amount": 50000.0,
        "bank_name": "Unknown Bank",
        "reference": "TXN_TEST_UNMATCH_999"
    }
    res = client.post("/api/payments/mock-webhook/", unmatched_payload, content_type="application/json")
    assert res.status_code == 200
    payment = res.json()["payment"]
    print("Payment status:", payment["status"])
    print("Reconciliation detail:", payment["reconciliation_detail"])
    assert payment["status"] == "unmatched"
    
    # 10. Test GET /api/reports/customer/:id/
    print("\n--- Testing GET /api/reports/customer/:id/ ---")
    res = client.get(f"/api/reports/customer/{cust_id}/")
    assert res.status_code == 200
    report = res.json()
    print("Customer Name in Report:", report["customer"]["name"])
    print("Summary:", report["summary"])
    assert len(report["invoices"]) == 1
    assert len(report["payments"]) == 1
    
    print("\nALL BACKEND API TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
