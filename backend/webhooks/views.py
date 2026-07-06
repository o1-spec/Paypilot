import hmac
import hashlib
import logging
from django.conf import settings
from django.utils.crypto import constant_time_compare
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from payments.reconciliation import ReconciliationService

logger = logging.getLogger(__name__)

class NombaWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        signing_key = getattr(settings, 'NOMBA_WEBHOOK_SIGNING_KEY', '')
        if signing_key:
            signature = request.headers.get('nomba-signature')
            if not signature:
                logger.warning("Rejected webhook: Missing nomba-signature header")
                return Response({"error": "Missing nomba-signature header"}, status=status.HTTP_401_UNAUTHORIZED)
            
            raw_body = request.body
            computed_sig = hmac.new(signing_key.encode(), raw_body, hashlib.sha256).hexdigest()
            if not constant_time_compare(computed_sig, signature):
                logger.warning("Rejected webhook: Invalid webhook signature")
                return Response({"error": "Invalid webhook signature"}, status=status.HTTP_401_UNAUTHORIZED)

        payload = request.data
        if not payload:
            return Response({"error": "Empty payload"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Service processes raw events logging, idempotency checks, and matchings inside atomic transaction block
            result = ReconciliationService.process_webhook_payment(payload)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to process webhook payment: {e}")
            return Response({
                "error": "Failed to process webhook payment", 
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
