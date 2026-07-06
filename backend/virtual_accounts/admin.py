from django.contrib import admin
from .models import VirtualAccount

@admin.register(VirtualAccount)
class VirtualAccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'customer', 'account_name', 'bank_name', 'provider', 'status', 'created_at']
    list_filter = ['status', 'bank_name', 'provider']
    search_fields = ['account_number', 'account_name']
