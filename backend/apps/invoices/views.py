from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.utils.db_manager import JSONDatabase
import uuid

class InvoiceListCreateAPIView(APIView):
    def get(self, request):
        db = JSONDatabase.load()
        invoices = db.get("invoices", [])
        customers = db.get("customers", [])
        
        # Hydrate invoices with customer info for convenience
        hydrated_invoices = []
        for inv in invoices:
            cust = next((c for c in customers if c["id"] == inv["customer_id"]), None)
            hydrated_invoices.append({
                **inv,
                "customer_name": cust["name"] if cust else "Unknown Customer",
                "business_name": cust["business_name"] if cust else "Unknown",
                "virtual_account": cust["virtual_account"] if cust else None
            })
            
        return Response(hydrated_invoices, status=status.HTTP_200_OK)
        
    def post(self, request):
        db = JSONDatabase.load()
        customer_id = request.data.get("customer_id")
        amount = request.data.get("amount")
        description = request.data.get("description")
        due_date = request.data.get("due_date")
        
        if not customer_id or not amount or not due_date:
            return Response(
                {"error": "customer_id, amount, and due_date fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verify customer exists
        customers = db.get("customers", [])
        customer = next((c for c in customers if c["id"] == customer_id), None)
        if not customer:
            return Response({"error": "Customer not found"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            amount_val = float(amount)
            if amount_val <= 0:
                raise ValueError()
        except ValueError:
            return Response({"error": "Amount must be a positive number"}, status=status.HTTP_400_BAD_REQUEST)
            
        invoice_id = f"inv_{uuid.uuid4().hex[:8]}"
        
        new_invoice = {
            "id": invoice_id,
            "customer_id": customer_id,
            "amount": amount_val,
            "description": description or "No description",
            "due_date": due_date,
            "status": "pending"
        }
        
        db["invoices"].append(new_invoice)
        JSONDatabase.save(db)
        
        response_data = {
            **new_invoice,
            "customer_name": customer["name"],
            "business_name": customer["business_name"]
        }
        return Response(response_data, status=status.HTTP_201_CREATED)
