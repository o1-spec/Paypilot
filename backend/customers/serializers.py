from rest_framework import serializers
from .models import Customer
from virtual_accounts.serializers import VirtualAccountSerializer

class CustomerSerializer(serializers.ModelSerializer):
    virtual_account = VirtualAccountSerializer(read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'merchant', 'full_name', 'email', 'phone', 
            'business_name', 'status', 'virtual_account', 'created_at'
        ]
        read_only_fields = ['id', 'merchant', 'created_at']
