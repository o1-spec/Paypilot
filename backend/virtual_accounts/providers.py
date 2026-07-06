from abc import ABC, abstractmethod
import random
from .models import VirtualAccount

class VirtualAccountProvider(ABC):
    @abstractmethod
    def create_virtual_account(self, customer) -> dict:
        """
        Provision a virtual account for the given customer.
        Returns a dict containing:
          - account_number
          - account_name
          - bank_name
          - provider
        """
        pass

class MockNombaProvider(VirtualAccountProvider):
    def create_virtual_account(self, customer) -> dict:
        # Generate unique prefix & digits
        prefix = random.choice(["101", "202", "303", "505"])
        digits = "".join([str(random.randint(0, 9)) for _ in range(7)])
        account_number = f"{prefix}{digits}"

        # Ensure uniqueness across existing accounts
        while VirtualAccount.objects.filter(account_number=account_number).exists():
            digits = "".join([str(random.randint(0, 9)) for _ in range(7)])
            account_number = f"{prefix}{digits}"

        bank_name = random.choice(["Nomba Bank", "Providus Bank", "Wema Bank"])
        account_name = f"PP - {customer.full_name}"

        return {
            "account_number": account_number,
            "account_name": account_name,
            "bank_name": bank_name,
            "provider": "Nomba"
        }
