from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True, default=None)
    business_name = serializers.CharField(source='customer.business_name', read_only=True, default=None)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, default=None)
    account_number = serializers.CharField(source='virtual_account.account_number', read_only=True, default=None)
    bank_name = serializers.CharField(source='virtual_account.bank_name', read_only=True, default=None)

    class Meta:
        model = Payment
        fields = [
            'id', 'merchant', 'customer', 'customer_name', 'business_name', 
            'virtual_account', 'account_number', 'bank_name', 'invoice', 'invoice_number',
            'amount', 'reference', 'sender_name', 'sender_account_number', 
            'status', 'raw_payload', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
