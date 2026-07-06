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
        customer = get_object_or_404(Customer, pk=pk)
        
        # Verify customer matches active authenticated merchant
        if customer.merchant != request.user:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        invoices = Invoice.objects.filter(customer=customer).order_by('-created_at')
        payments = Payment.objects.filter(customer=customer).order_by('-created_at')

        total_invoiced = sum(inv.amount for inv in invoices)
        total_paid = sum(pay.amount for pay in payments)
        outstanding_balance = total_invoiced - total_paid

        return Response({
            "customer": CustomerSerializer(customer).data,
            "summary": {
                "total_invoiced": total_invoiced,
                "total_paid": total_paid,
                "outstanding_balance": outstanding_balance,
            },
            "invoices": InvoiceSerializer(invoices, many=True).data,
            "payments": PaymentSerializer(payments, many=True).data,
        })
