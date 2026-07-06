import calendar
from decimal import Decimal
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from customers.models import Customer
from virtual_accounts.models import VirtualAccount
from invoices.models import Invoice
from payments.models import Payment
from notifications.models import Notification

from invoices.serializers import InvoiceSerializer
from payments.serializers import PaymentSerializer
from notifications.serializers import NotificationSerializer

class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        current_year = timezone.now().year

        # 1. Total Customers count
        total_customers = Customer.objects.filter(merchant=user).count()

        # 2. Total Virtual Accounts count
        total_virtual_accounts = VirtualAccount.objects.filter(customer__merchant=user).count()

        # 3. Total Revenue (Matched payments sum)
        total_revenue_dict = Payment.objects.filter(merchant=user, status='MATCHED').aggregate(Sum('amount'))
        total_revenue = total_revenue_dict.get('amount__sum') or Decimal('0.00')

        # 4. Today's Revenue (Matched payments sum received today)
        todays_revenue_dict = Payment.objects.filter(
            merchant=user, 
            status='MATCHED',
            created_at__date=today
        ).aggregate(Sum('amount'))
        todays_revenue = todays_revenue_dict.get('amount__sum') or Decimal('0.00')

        # 5. Outstanding Balance (Due sum minus paid sum)
        invoices = Invoice.objects.filter(merchant=user)
        total_invoiced = invoices.aggregate(Sum('amount')).get('amount__sum') or Decimal('0.00')
        total_paid_invoices = invoices.aggregate(Sum('amount_paid')).get('amount_paid__sum') or Decimal('0.00')
        outstanding_balance = max(Decimal('0.00'), total_invoiced - total_paid_invoices)

        # 6. Invoice Status Counts
        pending_invoices_count = invoices.filter(status='PENDING').count()
        paid_invoices_count = invoices.filter(status='PAID').count()
        partial_invoices_count = invoices.filter(status='PARTIAL').count()
        overpaid_invoices_count = invoices.filter(status='OVERPAID').count()

        # 7. Unmatched Payments count (global system-wide count)
        unmatched_payments_count = Payment.objects.filter(status='UNMATCHED').count()

        # 8. Lists for logs streams (newest first)
        recent_payments = Payment.objects.filter(merchant=user).order_by('-created_at')[:5]
        recent_invoices = invoices.order_by('-created_at')[:5]
        recent_notifications = Notification.objects.filter(merchant=user).order_by('-created_at')[:5]

        # 9. Monthly Revenue Summary (grouped for the current year, pre-populated with zero)
        monthly_rev = Payment.objects.filter(
            merchant=user,
            status='MATCHED',
            created_at__year=current_year
        ).annotate(month=TruncMonth('created_at')).values('month').annotate(total=Sum('amount')).order_by('month')

        monthly_data = {calendar.month_abbr[i]: Decimal('0.00') for i in range(1, 13)}
        for item in monthly_rev:
            month_date = item['month']
            if month_date:
                month_name = calendar.month_abbr[month_date.month]
                monthly_data[month_name] = item['total'] or Decimal('0.00')
                
        monthly_revenue_summary = [{"month": m, "amount": amt} for m, amt in monthly_data.items()]

        # 10. Invoice Status Breakdown counts dict
        invoice_status_breakdown = {
            "PENDING": pending_invoices_count,
            "PARTIAL": partial_invoices_count,
            "PAID": paid_invoices_count,
            "OVERPAID": overpaid_invoices_count,
            "CANCELLED": invoices.filter(status='CANCELLED').count()
        }

        return Response({
            "total_customers": total_customers,
            "total_virtual_accounts": total_virtual_accounts,
            "total_revenue": total_revenue,
            "todays_revenue": todays_revenue,
            "outstanding_balance": outstanding_balance,
            "pending_invoices_count": pending_invoices_count,
            "paid_invoices_count": paid_invoices_count,
            "partial_invoices_count": partial_invoices_count,
            "overpaid_invoices_count": overpaid_invoices_count,
            "unmatched_payments_count": unmatched_payments_count,
            "recent_payments": PaymentSerializer(recent_payments, many=True).data,
            "recent_invoices": InvoiceSerializer(recent_invoices, many=True).data,
            "recent_notifications": NotificationSerializer(recent_notifications, many=True).data,
            "monthly_revenue_summary": monthly_revenue_summary,
            "invoice_status_breakdown": invoice_status_breakdown
        }, status=200)
