from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from customers.models import Customer
from .services import NombaVirtualAccountService
from .serializers import VirtualAccountSerializer

class VirtualAccountProvisionView(APIView):
    def post(self, request):
        customer_id = request.data.get('customer_id')
        if not customer_id:
            return Response({"error": "customer_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(Customer, pk=customer_id)
        
        # Provision virtual account using Nomba service
        virtual_acc = NombaVirtualAccountService.provision_account(customer)
        
        serializer = VirtualAccountSerializer(virtual_acc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
