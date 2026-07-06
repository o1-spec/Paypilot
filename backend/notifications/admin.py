from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'merchant', 'type', 'read', 'created_at']
    list_filter = ['read', 'type', 'created_at']
    search_fields = ['title', 'message']
