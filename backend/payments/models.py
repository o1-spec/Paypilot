from django.db import models
import uuid

class Payment(models.Model):
    STATUS_CHOICES = [
        ('MATCHED', 'Matched'),
        ('UNMATCHED', 'Unmatched'),
        ('REVIEW', 'Review'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey('accounts.Merchant', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    virtual_account = models.ForeignKey('virtual_accounts.VirtualAccount', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=255, unique=True)
    sender_name = models.CharField(max_length=255, blank=True, null=True)
    sender_account_number = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='MATCHED')
    raw_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference} - NGN {self.amount}"
