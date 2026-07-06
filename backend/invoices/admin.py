from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'merchant', 'amount', 'amount_paid', 'due_date', 'status', 'created_at']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['invoice_number', 'customer__full_name', 'description']
