import random
from virtual_accounts.models import VirtualAccount

class NombaVirtualAccountService:
    @staticmethod
    def provision_account(customer):
        """
        Mock service to simulate Nomba dedicated virtual account creation.
        Returns a VirtualAccount instance.
        """
        # Return existing account if already provisioned
        if hasattr(customer, 'virtual_account'):
            return customer.virtual_account

        # Generate unique 10-digit account number
        prefix = random.choice(["101", "202", "303", "505"])
        digits = "".join([str(random.randint(0, 9)) for _ in range(7)])
        account_number = f"{prefix}{digits}"

        # Ensure uniqueness
        while VirtualAccount.objects.filter(account_number=account_number).exists():
            digits = "".join([str(random.randint(0, 9)) for _ in range(7)])
            account_number = f"{prefix}{digits}"

        bank_name = random.choice(["Nomba Bank", "Providus Bank", "Wema Bank"])
        account_name = f"PP - {customer.full_name}"

        virtual_account = VirtualAccount.objects.create(
            customer=customer,
            account_number=account_number,
            account_name=account_name,
            bank_name=bank_name,
            provider='Nomba',
            status='active'
        )

        return virtual_account
