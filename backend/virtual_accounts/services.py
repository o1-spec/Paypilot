from django.conf import settings
from django.db import transaction
from django.utils.module_loading import import_string
from .models import VirtualAccount
from .providers import MockNombaProvider

class VirtualAccountService:
    @staticmethod
    def get_provider():
        # Allow setting provider path via settings.py (e.g. for Stage 2 Nomba API swap)
        provider_path = getattr(settings, 'VIRTUAL_ACCOUNT_PROVIDER', 'virtual_accounts.providers.MockNombaProvider')
        try:
            provider_class = import_string(provider_path)
            return provider_class()
        except ImportError:
            return MockNombaProvider()

    @classmethod
    def provision_account(cls, customer):
        """
        Provisions a virtual account for a customer if not already exists.
        Returns the VirtualAccount instance.
        """
        # Return existing account if already provisioned
        if hasattr(customer, 'virtual_account'):
            return customer.virtual_account

        provider = cls.get_provider()
        account_data = provider.create_virtual_account(customer)

        with transaction.atomic():
            # Double check inside atomic transaction to prevent race condition duplicates
            existing = VirtualAccount.objects.filter(customer=customer).first()
            if existing:
                return existing

            # Double check account number uniqueness
            if VirtualAccount.objects.filter(account_number=account_data["account_number"]).exists():
                account_data = provider.create_virtual_account(customer)

            virtual_account = VirtualAccount.objects.create(
                customer=customer,
                account_number=account_data["account_number"],
                account_name=account_data["account_name"],
                bank_name=account_data["bank_name"],
                provider=account_data["provider"],
                status='active'
            )

        return virtual_account
