from django.db import models
from django.core.exceptions import ValidationError
import uuid
import random

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('PARTIAL', 'Partial'),
        ('OVERPAID', 'Overpaid'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey('accounts.Merchant', on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=100, unique=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.amount is not None and self.amount <= 0:
            raise ValidationError({"amount": "Invoice amount must be positive."})
        if self.amount_paid is not None and self.amount_paid < 0:
            raise ValidationError({"amount_paid": "Amount paid cannot be negative."})

    def save(self, *args, **kwargs):
        # Enforce validations
        self.full_clean()
        
        # 1. Auto-generate invoice number
        if not self.invoice_number:
            prefix = "INV-2026"
            serial = "".join([str(random.randint(0, 9)) for _ in range(6)])
            self.invoice_number = f"{prefix}-{serial}"
            while Invoice.objects.filter(invoice_number=self.invoice_number).exists():
                serial = "".join([str(random.randint(0, 9)) for _ in range(6)])
                self.invoice_number = f"{prefix}-{serial}"

        # 2. Update status based on paid balance
        if self.status != 'CANCELLED':
            if self.amount_paid == 0:
                self.status = 'PENDING'
            elif 0 < self.amount_paid < self.amount:
                self.status = 'PARTIAL'
            elif self.amount_paid == self.amount:
                self.status = 'PAID'
            elif self.amount_paid > self.amount:
                self.status = 'OVERPAID'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - NGN {self.amount} ({self.customer.full_name})"
