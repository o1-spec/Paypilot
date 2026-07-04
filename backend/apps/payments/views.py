from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.utils.db_manager import JSONDatabase
from apps.payments.services import PaymentReconciliationService

class PaymentListAPIView(APIView):
    def get(self, request):
        db = JSONDatabase.load()
        payments = db.get("payments", [])
        customers = db.get("customers", [])
        
        # Hydrate payments with customer details
        hydrated_payments = []
        for pay in payments:
            cust = next((c for c in customers if c["id"] == pay["customer_id"]), None) if pay["customer_id"] else None
            hydrated_payments.append({
                **pay,
                "customer_name": cust["name"] if cust else "Unmatched Deposit",
                "business_name": cust["business_name"] if cust else "None",
                "email": cust["email"] if cust else None,
                "phone": cust["phone"] if cust else None,
            })
            
        return Response(hydrated_payments, status=status.HTTP_200_OK)

class MockWebhookAPIView(APIView):
    def post(self, request):
        # Handle inbound webhook transfer
        account_number = request.data.get("account_number")
        amount = request.data.get("amount")
        bank_name = request.data.get("bank_name")
        reference = request.data.get("reference")
        
        if not account_number or amount is None:
            return Response(
                {"error": "account_number and amount fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            amount_val = float(amount)
            if amount_val <= 0:
                raise ValueError()
        except ValueError:
            return Response({"error": "Amount must be a positive number"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Reconcile via service layer
        payment_record = PaymentReconciliationService.process_webhook_payment(
            account_number=account_number,
            amount=amount_val,
            bank_name=bank_name,
            reference=reference
        )
        
        return Response({
            "message": "Webhook received and reconciled successfully",
            "payment": payment_record
        }, status=status.HTTP_200_OK)
