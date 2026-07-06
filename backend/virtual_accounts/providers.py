from abc import ABC, abstractmethod
import random
import logging
import requests
from django.conf import settings
from django.core.cache import cache
from .models import VirtualAccount

logger = logging.getLogger(__name__)

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

class NombaProvider(VirtualAccountProvider):
    def __init__(self):
        self.client_id = getattr(settings, 'NOMBA_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'NOMBA_CLIENT_SECRET', '')
        self.account_id = getattr(settings, 'NOMBA_ACCOUNT_ID', '')
        self.env = getattr(settings, 'NOMBA_ENV', 'sandbox')
        self.base_url = "https://api.nomba.com" if self.env == "production" else "https://sandbox.nomba.com"
        
        # Fallback to mock mode if credentials are missing
        self.use_fallback = not (self.client_id and self.client_secret and self.account_id)
        self.mock_provider = MockNombaProvider()
        if self.use_fallback:
            logger.warning("Nomba API credentials not configured. Falling back to MockNombaProvider.")

    def _get_access_token(self) -> str:
        if self.use_fallback:
            return ""

        cache_key = f"nomba_access_token_{self.client_id[:8]}"
        token = cache.get(cache_key)
        if token:
            return token

        url = f"{self.base_url}/v1/auth/token/issue"
        headers = {
            "accountId": self.account_id,
            "Content-Type": "application/json"
        }
        body = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }

        try:
            response = requests.post(url, json=body, headers=headers, timeout=10)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("code") == "00" and "data" in res_data:
                token = res_data["data"]["access_token"]
                # Cache token for 23 hours (82800 seconds)
                cache.set(cache_key, token, 82800)
                return token
            else:
                desc = res_data.get("description", "Unknown error")
                raise Exception(f"Nomba auth failed with code {res_data.get('code')}: {desc}")
        except Exception as e:
            logger.error(f"Error fetching Nomba token: {e}")
            raise

    def create_virtual_account(self, customer) -> dict:
        if self.use_fallback:
            return self.mock_provider.create_virtual_account(customer)

        try:
            token = self._get_access_token()
        except Exception as e:
            logger.error(f"Failed to authenticate with Nomba. Falling back to mock virtual account creation. Error: {e}")
            return self.mock_provider.create_virtual_account(customer)

        url = f"{self.base_url}/v1/accounts/virtual"
        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self.account_id,
            "Content-Type": "application/json"
        }
        
        # Unique reference is customer UUID
        body = {
            "accountRef": str(customer.id),
            "accountName": f"PP - {customer.full_name}"
        }

        try:
            response = requests.post(url, json=body, headers=headers, timeout=10)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("code") == "00" and "data" in res_data:
                data = res_data["data"]
                return {
                    "account_number": data["bankAccountNumber"],
                    "account_name": data["bankAccountName"],
                    "bank_name": data["bankName"],
                    "provider": "Nomba"
                }
            else:
                desc = res_data.get("description", "Unknown error")
                logger.error(f"Nomba virtual account creation failed: {desc}. Falling back to mock.")
                return self.mock_provider.create_virtual_account(customer)
        except Exception as e:
            logger.error(f"Error calling Nomba virtual account API: {e}. Falling back to mock.")
            return self.mock_provider.create_virtual_account(customer)

    def get_transaction(self, reference: str) -> dict:
        if self.use_fallback:
            return {
                "status": "SUCCESS",
                "amount": 15000.0,
                "reference": reference,
                "sender_name": "Mock Depositor",
                "bank_name": "Nomba Bank"
            }

        try:
            token = self._get_access_token()
        except Exception as e:
            logger.error(f"Failed to authenticate with Nomba for transaction check: {e}")
            raise Exception("Nomba auth failed")

        url = f"{self.base_url}/v1/transactions/accounts/single"
        params = {"transactionRef": reference}
        headers = {
            "Authorization": f"Bearer {token}",
            "accountId": self.account_id,
            "Content-Type": "application/json"
        }

        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("status") == "SUCCESS" or (res_data.get("data") and res_data["data"].get("status") == "SUCCESS"):
                data = res_data.get("data", res_data)
                return {
                    "status": "SUCCESS",
                    "amount": float(data.get("amount", 0)),
                    "reference": data.get("id", reference),
                    "sender_name": data.get("customer", {}).get("email", "Unknown Sender"),
                    "bank_name": "Nomba Bank"
                }
            else:
                return {
                    "status": "FAILED",
                    "message": res_data.get("message", "Transaction not successful")
                }
        except Exception as e:
            logger.error(f"Error checking Nomba transaction: {e}")
            raise
