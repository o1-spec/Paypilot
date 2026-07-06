from rest_framework import generics
from django.contrib.auth import get_user_model
from .models import Notification
from .serializers import NotificationSerializer

Merchant = get_user_model()

class NotificationListCreateView(generics.ListCreateAPIView):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            default_merchant = Merchant.objects.first()
            if default_merchant:
                return self.queryset.filter(merchant=default_merchant)
            return self.queryset.none()
        return self.queryset.filter(merchant=user)

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            user = Merchant.objects.first()
            if not user:
                user = Merchant.objects.create_user(
                    username='demo_merchant',
                    email='info@gracefoods.ng',
                    password='password',
                    business_name='Grace Foods Enterprises'
                )
        serializer.save(merchant=user)
