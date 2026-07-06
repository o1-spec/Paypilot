from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Payment
from .serializers import PaymentSerializer

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scope payments to this merchant, but also allow viewing unmatched payments
        return self.queryset.filter(Q(merchant=self.request.user) | Q(status='UNMATCHED'))
