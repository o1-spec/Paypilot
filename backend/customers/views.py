from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Customer
from .serializers import CustomerSerializer
from virtual_accounts.services import NombaVirtualAccountService
from invoices.models import Invoice
from payments.models import Payment
from invoices.serializers import InvoiceSerializer
from payments.serializers import PaymentSerializer

Merchant = get_user_model()

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            default_merchant = Merchant.objects.first()
            if default_merchant:
                return self.queryset.filter(merchant=default_merchant)
            return self.queryset.none()
        return self.queryset.filter(merchant=user)

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            user = Merchant.objects.first()
            if not user:
                user = Merchant.objects.create_user(
                    username='demo_merchant',
                    email='info@gracefoods.ng',
                    password='password',
                    business_name='Grace Foods Enterprises'
                )

        customer = serializer.save(merchant=user)
        # Automatically provision virtual account through service layer
        NombaVirtualAccountService.provision_account(customer)


class CustomerStatementView(APIView):
    def get(self, request, pk):
        user = request.user
        if not user.is_authenticated:
            user = Merchant.objects.first()

        customer = get_object_or_404(Customer, pk=pk)
        
        # Verify customer matches fallback user
        if user and customer.merchant != user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

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
