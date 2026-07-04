from django.urls import path
from apps.reports.views import CustomerReportAPIView

urlpatterns = [
    path('customer/<str:customer_id>/', CustomerReportAPIView.as_view(), name='customer-report'),
]
