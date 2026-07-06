from rest_framework import serializers
from .models import WebhookEvent

class WebhookEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEvent
        fields = ['id', 'provider', 'event_type', 'reference', 'payload', 'processed', 'created_at']
        read_only_fields = ['id', 'created_at']
