from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .serializers import MerchantSerializer, MerchantRegistrationSerializer

Merchant = get_user_model()

class MerchantRegisterView(generics.CreateAPIView):
    queryset = Merchant.objects.all()
    serializer_class = MerchantRegistrationSerializer
    permission_classes = [AllowAny]

class MerchantListView(generics.ListAPIView):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer
