from rest_framework import serializers
from .models import VirtualAccount
from customers.models import Customer

class CustomerMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'full_name', 'email', 'phone', 'business_name', 'status']

class VirtualAccountSerializer(serializers.ModelSerializer):
    customer_details = CustomerMiniSerializer(source='customer', read_only=True)

    class Meta:
        model = VirtualAccount
        fields = [
            'id', 'customer', 'customer_details', 'account_number', 
            'account_name', 'bank_name', 'provider', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
