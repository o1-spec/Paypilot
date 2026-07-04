from django.urls import path
from apps.payments.views import PaymentListAPIView, MockWebhookAPIView

urlpatterns = [
    path('', PaymentListAPIView.as_view(), name='payment-list'),
    path('mock-webhook/', MockWebhookAPIView.as_view(), name='mock-webhook'),
]
