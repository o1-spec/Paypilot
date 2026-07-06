from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from customers.models import Customer
from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scope all invoices to the authenticated merchant, ordered by newest first
        queryset = self.queryset.filter(merchant=self.request.user)

        # Filters
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        customer_param = self.request.query_params.get('customer')
        if customer_param:
            queryset = queryset.filter(customer_id=customer_param)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(created_at__date__range=[start_date, end_date])

        return queryset

    def perform_create(self, serializer):
        # Validate customer ownership scoping
        customer_id = self.request.data.get('customer')
        if customer_id:
            customer = get_object_or_404(Customer, pk=customer_id)
            if customer.merchant != self.request.user:
                raise serializers.ValidationError({
                    "customer": "This customer does not belong to your merchant profile."
                })
        serializer.save(merchant=self.request.user)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        
        # Verify scoping (handled implicitly by get_object querying scoped get_queryset)
        if invoice.status in ['PAID', 'OVERPAID']:
            return Response(
                {"error": "Cannot cancel an invoice that has been fully paid or overpaid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice.status = 'CANCELLED'
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_200_OK)
