from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from payments.reconciliation import ReconciliationService

class NombaWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data
        if not payload:
            return Response({"error": "Empty payload"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Service processes raw events logging, idempotency checks, and matchings inside atomic transaction block
            result = ReconciliationService.process_webhook_payment(payload)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": "Failed to process webhook payment", 
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
