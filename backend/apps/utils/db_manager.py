import json
import os

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'db.json')

class JSONDatabase:
    @staticmethod
    def load():
        if not os.path.exists(DB_FILE):
            # Seed initial realistic Nigerian business data
            initial_data = {
                "customers": [
                    {
                        "id": "cust_1",
                        "name": "Grace Foods",
                        "email": "info@gracefoods.ng",
                        "phone": "+2348011111111",
                        "business_name": "Grace Foods Enterprises",
                        "virtual_account": {
                            "account_number": "1023456789",
                            "bank_name": "Nomba Bank",
                            "account_name": "PP - Grace Foods",
                            "customer_id": "cust_1"
                        },
                        "status": "active"
                    },
                    {
                        "id": "cust_2",
                        "name": "Tunde Logistics",
                        "email": "tunde@tundelogistics.com",
                        "phone": "+2348022222222",
                        "business_name": "Tunde Logistics Ltd",
                        "virtual_account": {
                            "account_number": "2034567890",
                            "bank_name": "Providus Bank",
                            "account_name": "PP - Tunde Logistics",
                            "customer_id": "cust_2"
                        },
                        "status": "active"
                    },
                    {
                        "id": "cust_3",
                        "name": "Amaka Stores",
                        "email": "amaka@amakastores.co",
                        "phone": "+2348033333333",
                        "business_name": "Amaka Retail Stores",
                        "virtual_account": {
                            "account_number": "3045678901",
                            "bank_name": "Wema Bank",
                            "account_name": "PP - Amaka Stores",
                            "customer_id": "cust_3"
                        },
                        "status": "active"
                    },
                    {
                        "id": "cust_4",
                        "name": "Prime Tutors",
                        "email": "contact@primetutors.edu.ng",
                        "phone": "+2348044444444",
                        "business_name": "Prime Tutors Academy",
                        "virtual_account": {
                            "account_number": "4056789012",
                            "bank_name": "Nomba Bank",
                            "account_name": "PP - Prime Tutors",
                            "customer_id": "cust_4"
                        },
                        "status": "active"
                    },
                    {
                        "id": "cust_5",
                        "name": "Bayo Pharmacy",
                        "email": "bayo@bayopharm.com",
                        "phone": "+2348055555555",
                        "business_name": "Bayo Pharmacy & Stores",
                        "virtual_account": {
                            "account_number": "5067890123",
                            "bank_name": "Wema Bank",
                            "account_name": "PP - Bayo Pharmacy",
                            "customer_id": "cust_5"
                        },
                        "status": "active"
                    }
                ],
                "invoices": [
                    {
                        "id": "inv_1",
                        "customer_id": "cust_1",
                        "amount": 150000.0,
                        "description": "Quarterly supplies delivery",
                        "due_date": "2026-07-15",
                        "status": "pending"
                    },
                    {
                        "id": "inv_2",
                        "customer_id": "cust_2",
                        "amount": 85000.0,
                        "description": "Intra-state distribution logs",
                        "due_date": "2026-06-30",
                        "status": "paid"
                    },
                    {
                        "id": "inv_3",
                        "customer_id": "cust_3",
                        "amount": 200000.0,
                        "description": "Bulk retail inventory",
                        "due_date": "2026-07-20",
                        "status": "pending"
                    },
                    {
                        "id": "inv_4",
                        "customer_id": "cust_4",
                        "amount": 50000.0,
                        "description": "LMS subscription & setup fee",
                        "due_date": "2026-07-01",
                        "status": "partial"
                    }
                ],
                "payments": [
                    {
                        "id": "pay_1",
                        "customer_id": "cust_2",
                        "invoice_id": "inv_2",
                        "amount": 85000.0,
                        "account_number": "2034567890",
                        "status": "reconciled",
                        "date": "2026-06-29T14:30:00Z"
                    },
                    {
                        "id": "pay_2",
                        "customer_id": "cust_4",
                        "invoice_id": "inv_4",
                        "amount": 20000.0,
                        "account_number": "4056789012",
                        "status": "reconciled",
                        "date": "2026-07-01T09:15:00Z"
                    }
                ],
                "webhook_events": [],
                "notifications": []
            }
            with open(DB_FILE, 'w') as f:
                json.dump(initial_data, f, indent=4)
            return initial_data
        
        with open(DB_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                initial_data = {
                    "customers": [],
                    "invoices": [],
                    "payments": [],
                    "webhook_events": [],
                    "notifications": []
                }
                with open(DB_FILE, 'w') as out:
                    json.dump(initial_data, out, indent=4)
                return initial_data
            
    @staticmethod
    def save(data):
        with open(DB_FILE, 'w') as f:
            json.dump(data, f, indent=4)
