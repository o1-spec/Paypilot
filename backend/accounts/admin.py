from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Merchant

class MerchantAdmin(UserAdmin):
    model = Merchant
    list_display = ['email', 'username', 'business_name', 'phone', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Merchant details', {'fields': ('business_name', 'phone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Merchant details', {'fields': ('business_name', 'phone')}),
    )

admin.site.register(Merchant, MerchantAdmin)
