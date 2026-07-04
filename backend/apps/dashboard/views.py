from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.utils.db_manager import JSONDatabase

class DashboardMetricsAPIView(APIView):
    def get(self, request):
        db = JSONDatabase.load()
        customers = db.get("customers", [])
        invoices = db.get("invoices", [])
        payments = db.get("payments", [])
        
        # Total revenue is the sum of reconciled payments
        total_revenue = sum([p["amount"] for p in payments if p.get("status") == "reconciled"])
        
        # Counts of invoice and payment categories
        pending_count = sum([1 for inv in invoices if inv.get("status") in ["pending", "partial"]])
        paid_count = sum([1 for inv in invoices if inv.get("status") == "paid"])
        unmatched_count = sum([1 for p in payments if p.get("status") == "unmatched"])
        
        # Outstanding balances calculation
        outstanding_balance = 0.0
        for inv in invoices:
            if inv.get("status") in ["pending", "partial"]:
                inv_pays = sum([p["amount"] for p in payments if p.get("invoice_id") == inv["id"]])
                outstanding_balance += max(0.0, inv["amount"] - inv_pays)
                
        # Top 5 recent payments
        sorted_payments = sorted(payments, key=lambda x: x.get("date", ""), reverse=True)[:5]
        recent_payments = []
        for pay in sorted_payments:
            cust = next((c for c in customers if c["id"] == pay["customer_id"]), None) if pay["customer_id"] else None
            recent_payments.append({
                **pay,
                "customer_name": cust["name"] if cust else "Unmatched Deposit",
                "business_name": cust["business_name"] if cust else "None",
            })
            
        data = {
            "total_customers": len(customers),
            "total_revenue": total_revenue,
            "pending_invoices": pending_count,
            "paid_invoices": paid_count,
            "unmatched_payments": unmatched_count,
            "outstanding_balance": outstanding_balance,
            "recent_payments": recent_payments
        }
        
        return Response(data, status=status.HTTP_200_OK)
