from django.db import models
import uuid

class VirtualAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.OneToOneField('customers.Customer', on_delete=models.CASCADE, related_name='virtual_account')
    account_number = models.CharField(max_length=50, unique=True)
    account_name = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=100)
    provider = models.CharField(max_length=100, default='Nomba')
    status = models.CharField(max_length=50, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.bank_name} - {self.account_number} ({self.customer.full_name})"
