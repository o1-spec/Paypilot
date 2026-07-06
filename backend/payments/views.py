from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from customers.models import Customer
from invoices.models import Invoice
from notifications.models import Notification
from .models import Payment
from .serializers import PaymentSerializer
from payments.reconciliation import ReconciliationService

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scope payments to this merchant, but also allow viewing unmatched payments
        queryset = self.queryset.filter(Q(merchant=self.request.user) | Q(status='UNMATCHED'))

        # Filters
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        customer_param = self.request.query_params.get('customer')
        if customer_param:
            queryset = queryset.filter(customer_id=customer_param)

        invoice_param = self.request.query_params.get('invoice')
        if invoice_param:
            queryset = queryset.filter(invoice_id=invoice_param)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(created_at__date__range=[start_date, end_date])

        min_amount = self.request.query_params.get('min_amount')
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)

        max_amount = self.request.query_params.get('max_amount')
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)

        return queryset

    @action(detail=False, methods=['get'], url_path='unmatched')
    def unmatched(self, request):
        # Unmatched payments do not belong to any merchant (merchant=None)
        queryset = self.queryset.filter(status='UNMATCHED')

        # Apply amount range filters if requested
        min_amount = request.query_params.get('min_amount')
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)

        max_amount = request.query_params.get('max_amount')
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        payment = self.get_object()

        # Enforce that only UNMATCHED payments can be claimed/assigned
        if payment.status != 'UNMATCHED':
            return Response(
                {"error": "Only UNMATCHED payments can be assigned manually."},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer_id = request.data.get('customer')
        if not customer_id:
            return Response(
                {"error": "customer is required to assign payment."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure customer belongs to authenticated merchant
        customer = get_object_or_404(Customer, pk=customer_id)
        if customer.merchant != request.user:
            return Response(
                {"error": "This customer does not belong to your merchant profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verify invoice if provided
        invoice_id = request.data.get('invoice')
        invoice = None
        if invoice_id:
            invoice = get_object_or_404(Invoice, pk=invoice_id)
            # Ensure invoice belongs to same customer
            if invoice.customer != customer:
                return Response(
                    {"error": "This invoice does not belong to the selected customer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Ensure invoice belongs to authenticated merchant
            if invoice.merchant != request.user:
                return Response(
                    {"error": "This invoice does not belong to your merchant profile."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Perform atomic claim and reconciliation mapping updates
        with transaction.atomic():
            payment.customer = customer
            payment.merchant = request.user
            payment.status = 'MATCHED'

            if invoice:
                payment.invoice = invoice
                invoice.amount_paid += payment.amount
                invoice.save()  # Triggers model save transitions

            payment.save()

            # Create notification
            notification_type = 'PAYMENT_RECEIVED'
            if invoice:
                if invoice.status == 'PAID':
                    notification_type = 'INVOICE_PAID'
                elif invoice.status == 'PARTIAL':
                    notification_type = 'PARTIAL_PAYMENT'

            Notification.objects.create(
                merchant=request.user,
                title="Unmatched Payment Claimed",
                message=f"Payment {payment.reference} of NGN {payment.amount:,.2f} has been manually matched to customer {customer.full_name}.",
                type=notification_type
            )

        serializer = self.get_serializer(payment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='mark-reviewed')
    def mark_reviewed(self, request, pk=None):
        payment = self.get_object()

        # Enforce that only UNMATCHED payments can be marked reviewed/for-review
        if payment.status != 'UNMATCHED':
            return Response(
                {"error": "Only UNMATCHED payments can be marked for review."},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.status = 'REVIEW'
        payment.save()

        serializer = self.get_serializer(payment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='verify-nomba')
    def verify_nomba_transaction(self, request, pk=None):
        payment = self.get_object()
        
        # Instantiate NombaProvider
        from virtual_accounts.providers import NombaProvider
        provider = NombaProvider()
        
        try:
            tx_data = provider.get_transaction(payment.reference)
            if tx_data.get("status") == "SUCCESS":
                # Re-run reconciliation mapping cleanly
                mapped_payload = {
                    "event": "virtual_account.payment_received",
                    "data": {
                        "account_number": payment.virtual_account.account_number if payment.virtual_account else "",
                        "amount": tx_data.get("amount", payment.amount),
                        "reference": payment.reference,
                        "sender_name": tx_data.get("sender_name", payment.sender_name),
                        "sender_account_number": payment.sender_account_number,
                        "bank_name": tx_data.get("bank_name", "Nomba Bank")
                    }
                }
                result = ReconciliationService.process_webhook_payment(mapped_payload)
                payment.refresh_from_db()
                serializer = self.get_serializer(payment)
                return Response({
                    "status": "SUCCESS",
                    "message": "Payment verified and reconciled with Nomba.",
                    "payment": serializer.data,
                    "reconciliation_details": result
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "status": "FAILED",
                    "message": tx_data.get("message", "Nomba reports this transaction is not successful or not found.")
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "status": "ERROR",
                "message": f"Verification call failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

