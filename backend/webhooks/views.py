from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import WebhookEvent
from payments.reconciliation import ReconciliationService

class NombaWebhookView(APIView):
    def post(self, request):
        payload = request.data
        if not payload:
            return Response({"error": "Payload is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Log Webhook Event in audit database table
        event_type = payload.get('event', 'virtual_account.payment_received')
        data = payload.get('data', {})
        reference = data.get('reference')

        webhook_event = WebhookEvent.objects.create(
            provider='Nomba',
            event_type=event_type,
            reference=reference,
            payload=payload,
            processed=False
        )

        try:
            # Process reconciliation business logic
            payment = ReconciliationService.process_webhook_payment(payload)
            
            # Mark event as processed successfully
            webhook_event.processed = True
            webhook_event.save()

            return Response({
                "message": "Webhook processed successfully",
                "payment_id": payment.id,
                "status": payment.status
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": "Error processing reconciliation",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
