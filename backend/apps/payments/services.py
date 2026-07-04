from apps.utils.db_manager import JSONDatabase
from datetime import datetime
import uuid

class PaymentReconciliationService:
    @staticmethod
    def process_webhook_payment(account_number, amount, bank_name=None, reference=None):
        """
        Core payment reconciliation service.
        1. Find virtual account match.
        2. Find customer match.
        3. Match to oldest pending or partial invoice (if any).
        4. Calculate invoice payments and update status:
           - Paid (amount matches or clears due balance)
           - Partial (amount is less than due)
           - Overpaid (amount is more than due)
        5. Support unmatched flow if no customer matches the account.
        """
        db = JSONDatabase.load()
        
        # 1. Search for customer by virtual account number
        customers = db.get("customers", [])
        customer = None
        for cust in customers:
            va = cust.get("virtual_account")
            if va and va.get("account_number") == account_number:
                customer = cust
                break
                
        payment_id = f"pay_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        if customer:
            customer_id = customer["id"]
            # 2. Search for pending/partial invoices for this customer
            invoices = db.get("invoices", [])
            customer_invoices = [inv for inv in invoices if inv["customer_id"] == customer_id and inv["status"] in ["pending", "partial"]]
            
            # Sort by due_date to pay the oldest invoice first
            customer_invoices.sort(key=lambda x: x.get("due_date", ""))
            
            reconciled_invoice_id = None
            reconciliation_detail = "Reconciled with customer profile"
            
            if customer_invoices:
                target_invoice = customer_invoices[0]
                reconciled_invoice_id = target_invoice["id"]
                
                # Calculate current payments against this invoice
                payments = db.get("payments", [])
                invoice_payments_sum = sum([p["amount"] for p in payments if p.get("invoice_id") == reconciled_invoice_id])
                
                remaining_balance = target_invoice["amount"] - invoice_payments_sum
                
                if amount >= remaining_balance:
                    if amount > remaining_balance:
                        target_invoice["status"] = "overpaid"
                        reconciliation_detail = f"Overpaid invoice {reconciled_invoice_id}. Remaining balance was {remaining_balance:.2f}."
                    else:
                        target_invoice["status"] = "paid"
                        reconciliation_detail = f"Fully paid invoice {reconciled_invoice_id}."
                else:
                    target_invoice["status"] = "partial"
                    reconciliation_detail = f"Partially paid invoice {reconciled_invoice_id}. Remaining balance is {remaining_balance - amount:.2f}."
            else:
                reconciliation_detail = "Reconciled to customer (no pending invoice found)"
                
            payment_record = {
                "id": payment_id,
                "customer_id": customer_id,
                "invoice_id": reconciled_invoice_id,
                "amount": amount,
                "account_number": account_number,
                "status": "reconciled",
                "date": timestamp,
                "reconciliation_detail": reconciliation_detail,
                "reference": reference or f"TXN_{uuid.uuid4().hex[:10].upper()}"
            }
        else:
            # Unmatched payment flow
            payment_record = {
                "id": payment_id,
                "customer_id": None,
                "invoice_id": None,
                "amount": amount,
                "account_number": account_number,
                "status": "unmatched",
                "date": timestamp,
                "reconciliation_detail": "Unmatched transaction (Virtual Account not found)",
                "reference": reference or f"TXN_{uuid.uuid4().hex[:10].upper()}"
            }
            
        # Log webhook event
        webhook_event = {
            "id": f"evt_{uuid.uuid4().hex[:8]}",
            "received_at": timestamp,
            "payload": {
                "account_number": account_number,
                "amount": amount,
                "bank_name": bank_name,
                "reference": reference
            },
            "status": "processed",
            "matched": customer is not None
        }
        
        db.setdefault("webhook_events", []).append(webhook_event)
        db["payments"].append(payment_record)
        JSONDatabase.save(db)
        
        return payment_record
