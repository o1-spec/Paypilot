from rest_framework import viewsets
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Payment
from .serializers import PaymentSerializer

Merchant = get_user_model()

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            default_merchant = Merchant.objects.first()
            if default_merchant:
                return self.queryset.filter(Q(merchant=default_merchant) | Q(status='UNMATCHED'))
            return self.queryset.none()
        return self.queryset.filter(Q(merchant=user) | Q(status='UNMATCHED'))
