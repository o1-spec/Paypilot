import random

class NombaVirtualAccountService:
    @staticmethod
    def provision_account(customer_name, customer_id):
        """
        Provisions a Nomba Virtual Account for a customer.
        In production, this would perform a request to Nomba's API:
        POST https://api.nomba.com/v1/virtual-accounts
        
        For the hackathon MVP, we generate a mock virtual account.
        """
        prefix = random.choice(["10", "20", "30", "40", "50"])
        digits = "".join([str(random.randint(0, 9)) for _ in range(8)])
        account_number = f"{prefix}{digits}"
        
        bank_name = random.choice(["Nomba Bank", "Providus Bank", "Wema Bank"])
        account_name = f"PP - {customer_name}"
        
        return {
            "account_number": account_number,
            "bank_name": bank_name,
            "account_name": account_name,
            "customer_id": customer_id
        }
