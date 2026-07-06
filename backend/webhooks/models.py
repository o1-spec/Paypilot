from django.db import models
import uuid

class WebhookEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=100, default='Nomba')
    event_type = models.CharField(max_length=100)
    reference = models.CharField(max_length=255, blank=True, null=True)
    payload = models.JSONField()
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} - {self.processed} ({self.id})"
