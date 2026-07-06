from rest_framework import serializers
from .models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    business_name = serializers.CharField(source='customer.business_name', read_only=True, default=None)
    account_number = serializers.CharField(source='customer.virtual_account.account_number', read_only=True, default=None)
    bank_name = serializers.CharField(source='customer.virtual_account.bank_name', read_only=True, default=None)

    class Meta:
        model = Invoice
        fields = [
            'id', 'merchant', 'customer', 'customer_name', 'business_name', 
            'account_number', 'bank_name', 'invoice_number', 'amount', 'amount_paid', 
            'description', 'due_date', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
