from django.contrib import admin
from .models import WebhookEvent

@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'provider', 'reference', 'processed', 'created_at']
    list_filter = ['processed', 'event_type', 'created_at']
    search_fields = ['reference']
