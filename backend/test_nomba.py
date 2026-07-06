import os
import django
import hmac
import hashlib
import unittest
from unittest.mock import patch, MagicMock

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "paypilot.settings")
django.setup()

from django.conf import settings
from virtual_accounts.providers import NombaProvider, MockNombaProvider
from django.core.cache import cache

class NombaIntegrationTest(unittest.TestCase):
    def setUp(self):
        cache.clear()
        # Save original settings
        self.orig_client_id = getattr(settings, 'NOMBA_CLIENT_ID', '')
        self.orig_client_secret = getattr(settings, 'NOMBA_CLIENT_SECRET', '')
        self.orig_account_id = getattr(settings, 'NOMBA_ACCOUNT_ID', '')
        self.orig_webhook_signing_key = getattr(settings, 'NOMBA_WEBHOOK_SIGNING_KEY', '')

    def tearDown(self):
        # Restore settings
        settings.NOMBA_CLIENT_ID = self.orig_client_id
        settings.NOMBA_CLIENT_SECRET = self.orig_client_secret
        settings.NOMBA_ACCOUNT_ID = self.orig_account_id
        settings.NOMBA_WEBHOOK_SIGNING_KEY = self.orig_webhook_signing_key
        cache.clear()

    def test_mock_fallback_when_credentials_absent(self):
        settings.NOMBA_CLIENT_ID = ""
        settings.NOMBA_CLIENT_SECRET = ""
        settings.NOMBA_ACCOUNT_ID = ""
        
        provider = NombaProvider()
        self.assertTrue(provider.use_fallback)
        
        # Verify it uses MockNombaProvider internally
        customer = MagicMock()
        customer.full_name = "Test User"
        res = provider.create_virtual_account(customer)
        self.assertEqual(res["provider"], "Nomba")
        self.assertTrue(res["account_number"].startswith(("101", "202", "303", "505")))

    @patch('requests.post')
    def test_token_retrieval_and_caching(self, mock_post):
        settings.NOMBA_CLIENT_ID = "real_client_id"
        settings.NOMBA_CLIENT_SECRET = "real_client_secret"
        settings.NOMBA_ACCOUNT_ID = "real_account_id"
        
        # Setup mock response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": "00",
            "description": "Success",
            "data": {
                "access_token": "mocked_jwt_token_123"
            }
        }
        mock_post.return_value = mock_response
        
        provider = NombaProvider()
        self.assertFalse(provider.use_fallback)
        
        # Retrieve token
        token1 = provider._get_access_token()
        self.assertEqual(token1, "mocked_jwt_token_123")
        self.assertEqual(mock_post.call_count, 1)
        
        # Retrieve token again - should be cached
        token2 = provider._get_access_token()
        self.assertEqual(token2, "mocked_jwt_token_123")
        self.assertEqual(mock_post.call_count, 1) # call_count still 1

    @patch('requests.post')
    def test_virtual_account_provision_mapping(self, mock_post):
        settings.NOMBA_CLIENT_ID = "real_client_id"
        settings.NOMBA_CLIENT_SECRET = "real_client_secret"
        settings.NOMBA_ACCOUNT_ID = "real_account_id"
        
        # Mock token & provision responses
        mock_auth_res = MagicMock()
        mock_auth_res.json.return_value = {
            "code": "00",
            "description": "Success",
            "data": {"access_token": "jwt_token"}
        }
        
        mock_prov_res = MagicMock()
        mock_prov_res.json.return_value = {
            "code": "00",
            "description": "Success",
            "data": {
                "bankAccountNumber": "9988776655",
                "bankName": "Nomba Bank MFB",
                "bankAccountName": "Grace Foods"
            }
        }
        
        def side_effect(url, *args, **kwargs):
            if "auth/token/issue" in url:
                return mock_auth_res
            return mock_prov_res
            
        mock_post.side_effect = side_effect
        
        provider = NombaProvider()
        customer = MagicMock()
        customer.id = "some-uuid"
        customer.full_name = "Grace Foods"
        
        res = provider.create_virtual_account(customer)
        self.assertEqual(res["account_number"], "9988776655")
        self.assertEqual(res["bank_name"], "Nomba Bank MFB")
        self.assertEqual(res["account_name"], "Grace Foods")

    def test_webhook_signature_verification(self):
        from django.test import Client
        client = Client()
        
        # Enable signing key
        settings.NOMBA_WEBHOOK_SIGNING_KEY = "test_signing_secret"
        
        payload_bytes = b'{"event":"payment.received","data":{"reference":"tx_123"}}'
        
        # 1. Test missing signature
        response = client.post(
            "/api/webhooks/nomba/",
            payload_bytes,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)
        
        # 2. Test invalid signature
        response = client.post(
            "/api/webhooks/nomba/",
            payload_bytes,
            content_type="application/json",
            HTTP_NOMBA_SIGNATURE="invalid_sig"
        )
        self.assertEqual(response.status_code, 401)
        
        # 3. Test valid signature
        valid_signature = hmac.new(b"test_signing_secret", payload_bytes, hashlib.sha256).hexdigest()
        response = client.post(
            "/api/webhooks/nomba/",
            payload_bytes,
            content_type="application/json",
            HTTP_NOMBA_SIGNATURE=valid_signature
        )
        # Webhook process_webhook_payment should return 200 (reconciled or duplicate or unmatched)
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
