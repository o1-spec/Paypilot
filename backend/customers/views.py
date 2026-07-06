from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, decorators
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Customer
from .serializers import CustomerSerializer
from virtual_accounts.services import VirtualAccountService
from invoices.models import Invoice
from payments.models import Payment
from invoices.serializers import InvoiceSerializer
from payments.serializers import PaymentSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(merchant=self.request.user)

    def perform_create(self, serializer):
        customer = serializer.save(merchant=self.request.user)
        # Automatically provision virtual account through service layer
        VirtualAccountService.provision_account(customer)

    @decorators.action(detail=True, methods=['get'], url_path='invoices')
    def invoices(self, request, pk=None):
        customer = self.get_object()
        invoices = Invoice.objects.filter(customer=customer).order_by('-created_at')
        
        status_param = request.query_params.get('status')
        if status_param:
            invoices = invoices.filter(status=status_param)
            
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            invoices = invoices.filter(created_at__date__range=[start_date, end_date])
            
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CustomerStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from decimal import Decimal
        from virtual_accounts.serializers import VirtualAccountSerializer

        customer = get_object_or_404(Customer, pk=pk)
        
        # Verify customer matches active authenticated merchant
        if customer.merchant != request.user:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve invoices and payments chronologically
        invoices = Invoice.objects.filter(customer=customer).order_by('created_at')
        payments = Payment.objects.filter(customer=customer).order_by('created_at')

        # Combine into statement lines
        lines = []
        for inv in invoices:
            lines.append({
                "date": inv.created_at.strftime("%Y-%m-%d"),
                "created_at": inv.created_at,
                "type": "INVOICE",
                "description": inv.description or f"Invoice {inv.invoice_number} issued",
                "debit": inv.amount,
                "credit": Decimal('0.00'),
                "reference": inv.invoice_number
            })

        for p in payments:
            lines.append({
                "date": p.created_at.strftime("%Y-%m-%d"),
                "created_at": p.created_at,
                "type": "PAYMENT",
                "description": f"Payment received from {p.sender_name or 'customer'}",
                "debit": Decimal('0.00'),
                "credit": p.amount,
                "reference": p.reference
            })

        # Sort combined list by created_at date
        lines.sort(key=lambda x: x["created_at"])

        # Calculate running balances
        running_balance = Decimal('0.00')
        for line in lines:
            running_balance = running_balance + line["debit"] - line["credit"]
            line["running_balance"] = running_balance
            del line["created_at"]

        total_invoice_amount = sum(inv.amount for inv in invoices)
        total_paid = sum(p.amount for p in payments)
        outstanding_balance = total_invoice_amount - total_paid

        virtual_acc = getattr(customer, 'virtual_account', None)
        virtual_acc_data = VirtualAccountSerializer(virtual_acc).data if virtual_acc else None

        return Response({
            "customer": CustomerSerializer(customer).data,
            "virtual_account": virtual_acc_data,
            "total_invoice_amount": total_invoice_amount,
            "total_paid": total_paid,
            "outstanding_balance": outstanding_balance,
            "invoices": InvoiceSerializer(invoices, many=True).data,
            "payments": PaymentSerializer(payments, many=True).data,
            "statement_lines": lines
        }, status=status.HTTP_200_OK)
