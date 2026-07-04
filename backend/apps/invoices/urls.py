from django.urls import path
from apps.invoices.views import InvoiceListCreateAPIView

urlpatterns = [
    path('', InvoiceListCreateAPIView.as_view(), name='invoice-list-create'),
]
