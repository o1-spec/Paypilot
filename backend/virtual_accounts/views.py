from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from customers.models import Customer
from .models import VirtualAccount
from .serializers import VirtualAccountSerializer
from .services import VirtualAccountService

class VirtualAccountViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VirtualAccount.objects.all().order_by('-created_at')
    serializer_class = VirtualAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scope virtual accounts strictly to the authenticated merchant
        return self.queryset.filter(customer__merchant=self.request.user)

    @action(detail=False, methods=['post'], url_path='provision')
    def provision(self, request):
        customer_id = request.data.get('customer_id')
        if not customer_id:
            return Response({"error": "customer_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve customer and verify ownership scoping
        customer = get_object_or_404(Customer, pk=customer_id)
        if customer.merchant != request.user:
            return Response({"error": "This customer does not belong to your merchant profile."}, status=status.HTTP_403_FORBIDDEN)

        # Prevent duplicate virtual accounts for the same customer
        if hasattr(customer, 'virtual_account') or VirtualAccount.objects.filter(customer=customer).exists():
            return Response({"error": "A virtual account has already been provisioned for this customer."}, status=status.HTTP_400_BAD_REQUEST)

        # Provision account using service layer
        try:
            virtual_acc = VirtualAccountService.provision_account(customer)
            serializer = self.get_serializer(virtual_acc)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": "Failed to provision virtual account", "detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
