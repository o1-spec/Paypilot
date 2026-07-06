from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Sum
from customers.models import Customer
from invoices.models import Invoice
from payments.models import Payment
from notifications.models import Notification
from payments.serializers import PaymentSerializer
from notifications.serializers import NotificationSerializer

Merchant = get_user_model()

class DashboardMetricsView(APIView):
    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            user = Merchant.objects.first()

        if not user:
            return Response({
                "total_revenue": 0,
                "outstanding_balance": 0,
                "active_customers": 0,
                "unmatched_transfers": 0,
                "recent_payments": [],
                "recent_notifications": []
            })

        # Core aggregation metrics
        customers_count = Customer.objects.filter(merchant=user, status='active').count()
        
        # Total revenue is matching payments sum
        total_revenue_dict = Payment.objects.filter(merchant=user, status='MATCHED').aggregate(Sum('amount'))
        total_revenue = total_revenue_dict.get('amount__sum') or 0

        # Outstandings calculation from invoices
        invoices = Invoice.objects.filter(merchant=user)
        total_invoiced = invoices.aggregate(Sum('amount')).get('amount__sum') or 0
        total_paid_invoices = invoices.aggregate(Sum('amount_paid')).get('amount_paid__sum') or 0
        outstanding_balance = max(0, total_invoiced - total_paid_invoices)

        # Unmatched collections count
        unmatched_count = Payment.objects.filter(status='UNMATCHED').count()

        # Invoice counts
        pending_invoices_count = invoices.filter(status__in=['PENDING', 'PARTIAL']).count()
        paid_invoices_count = invoices.filter(status='PAID').count()

        # Lists for logs streams
        recent_payments = Payment.objects.filter(merchant=user).order_by('-created_at')[:5]
        recent_notifications = Notification.objects.filter(merchant=user).order_by('-created_at')[:5]

        return Response({
            "total_revenue": total_revenue,
            "outstanding_balance": outstanding_balance,
            "active_customers": customers_count,
            "unmatched_transfers": unmatched_count,
            "pending_invoices": pending_invoices_count,
            "paid_invoices": paid_invoices_count,
            "recent_payments": PaymentSerializer(recent_payments, many=True).data,
            "recent_notifications": NotificationSerializer(recent_notifications, many=True).data
        })
