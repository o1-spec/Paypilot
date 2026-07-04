from django.urls import path
from apps.customers.views import CustomerListCreateAPIView, CustomerDetailAPIView

urlpatterns = [
    path('', CustomerListCreateAPIView.as_view(), name='customer-list-create'),
    path('<str:pk>/', CustomerDetailAPIView.as_view(), name='customer-detail'),
]
