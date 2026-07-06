from rest_framework import serializers
from .models import VirtualAccount

class VirtualAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualAccount
        fields = ['id', 'customer', 'account_number', 'account_name', 'bank_name', 'provider', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
