from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.utils.db_manager import JSONDatabase

class CustomerReportAPIView(APIView):
    def get(self, request, customer_id):
        db = JSONDatabase.load()
        customers = db.get("customers", [])
        customer = next((c for c in customers if c["id"] == customer_id), None)
        
        if not customer:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
            
        invoices = [inv for inv in db.get("invoices", []) if inv["customer_id"] == customer_id]
        payments = [pay for pay in db.get("payments", []) if pay["customer_id"] == customer_id]
        
        # Calculate aggregates
        total_invoiced = sum([inv["amount"] for inv in invoices])
        total_paid = sum([pay["amount"] for pay in payments if pay.get("status") == "reconciled"])
        
        outstanding_balance = 0.0
        for inv in invoices:
            if inv["status"] in ["pending", "partial"]:
                inv_pays = sum([p["amount"] for p in payments if p.get("invoice_id") == inv["id"]])
                outstanding_balance += max(0.0, inv["amount"] - inv_pays)
                
        report_data = {
            "customer": customer,
            "invoices": invoices,
            "payments": payments,
            "summary": {
                "total_invoiced": total_invoiced,
                "total_paid": total_paid,
                "outstanding_balance": outstanding_balance
            }
        }
        
        return Response(report_data, status=status.HTTP_200_OK)
