from decimal import Decimal
from django.db import transaction
from django.contrib.auth import get_user_model
from virtual_accounts.models import VirtualAccount
from invoices.models import Invoice
from payments.models import Payment
from notifications.models import Notification
from webhooks.models import WebhookEvent

Merchant = get_user_model()

class ReconciliationService:
    @staticmethod
    def process_webhook_payment(payload):
        """
        Receives Nomba transaction webhook payload, logs raw event first,
        performs duplicate checking (idempotency), locates matching Virtual Account,
        applies payment to invoice within a database transaction, and maps responses.
        """
        data = payload.get('data', {})
        reference = data.get('reference')
        event_type = payload.get('event', 'payment.received')

        # 1. Save the raw webhook event first
        webhook_event = WebhookEvent.objects.create(
            provider='Nomba',
            event_type=event_type,
            reference=reference,
            payload=payload,
            processed=False
        )

        # 2. Check if reference already exists
        is_duplicate = False
        if reference:
            already_processed = WebhookEvent.objects.filter(reference=reference, processed=True).exists()
            payment_exists = Payment.objects.filter(reference=reference).exists()
            if already_processed or payment_exists:
                is_duplicate = True

        # 3. If duplicate, return a safe idempotent response and do not create duplicate payments
        if is_duplicate:
            existing_payment = Payment.objects.filter(reference=reference).first()
            
            from customers.serializers import CustomerSerializer
            from invoices.serializers import InvoiceSerializer
            from payments.serializers import PaymentSerializer

            customer = existing_payment.customer if existing_payment else None
            invoice = existing_payment.invoice if existing_payment else None

            # Mark webhook event as duplicate but processed
            webhook_event.processed = True
            webhook_event.save()

            return {
                "matched": existing_payment.status == 'MATCHED' if existing_payment else False,
                "customer": CustomerSerializer(customer).data if customer else None,
                "invoice": InvoiceSerializer(invoice).data if invoice else None,
                "payment": PaymentSerializer(existing_payment).data if existing_payment else None,
                "reconciliation_status": existing_payment.status if existing_payment else 'REVIEW',
                "message": "Idempotent payment notification processed successfully (duplicate reference)."
            }

        # Retrieve payload fields
        account_number = data.get('account_number')
        amount = Decimal(str(data.get('amount', 0)))
        sender_name = data.get('sender_name', 'Unknown Sender')
        sender_account_number = data.get('sender_account_number', '')
        bank_name = data.get('bank_name', 'Unknown Bank')

        # 4. Find virtual account by destination account number
        virtual_acc = VirtualAccount.objects.filter(account_number=account_number).first()

        # 5. If no virtual account exists
        if not virtual_acc:
            with transaction.atomic():
                # create unmatched payment
                payment = Payment.objects.create(
                    merchant=None,
                    customer=None,
                    virtual_account=None,
                    invoice=None,
                    amount=amount,
                    reference=reference,
                    sender_name=sender_name,
                    sender_account_number=sender_account_number,
                    status='UNMATCHED',
                    raw_payload=payload
                )

                # create notification
                default_merchant = Merchant.objects.first()
                Notification.objects.create(
                    merchant=default_merchant,
                    title="Unmatched Payment Received",
                    message=f"An incoming payment of NGN {amount:,.2f} to account {account_number} could not be matched to any customer.",
                    type='UNMATCHED_PAYMENT'
                )

                # mark event as processed
                webhook_event.processed = True
                webhook_event.save()

            from payments.serializers import PaymentSerializer
            return {
                "matched": False,
                "customer": None,
                "invoice": None,
                "payment": PaymentSerializer(payment).data,
                "reconciliation_status": "UNMATCHED",
                "message": f"Payment logged as unmatched. Destination account {account_number} not found."
            }

        # 6. If virtual account exists: find customer, merchant, and oldest pending/partial invoice
        customer = virtual_acc.customer
        merchant = customer.merchant

        with transaction.atomic():
            target_invoice = Invoice.objects.filter(
                customer=customer,
                status__in=['PENDING', 'PARTIAL']
            ).order_by('due_date', 'created_at').first()

            message = f"Payment matched to customer {customer.full_name}."
            reconciled_invoice = None

            # 7. Apply payment to invoice
            if target_invoice:
                reconciled_invoice = target_invoice
                target_invoice.amount_paid += amount
                # Invoice save automatically recalculates and sets PENDING, PARTIAL, PAID, or OVERPAID
                target_invoice.save()
                message += f" Applied to invoice {target_invoice.invoice_number} (New status: {target_invoice.status})."
            else:
                message += " No pending or partial invoice found; logged as customer credit."

            # 8. Create payment record
            payment = Payment.objects.create(
                merchant=merchant,
                customer=customer,
                virtual_account=virtual_acc,
                invoice=reconciled_invoice,
                amount=amount,
                reference=reference,
                sender_name=sender_name,
                sender_account_number=sender_account_number,
                status='MATCHED',
                raw_payload=payload
            )

            # 9. Create notification
            notification_type = 'PAYMENT_RECEIVED'
            if reconciled_invoice:
                if reconciled_invoice.status == 'PAID':
                    notification_type = 'INVOICE_PAID'
                elif reconciled_invoice.status == 'PARTIAL':
                    notification_type = 'PARTIAL_PAYMENT'
                elif reconciled_invoice.status == 'OVERPAID':
                    notification_type = 'OVERPAYMENT'

            Notification.objects.create(
                merchant=merchant,
                title="Payment Received & Reconciled" if reconciled_invoice else "Unapplied Payment Mapped",
                message=f"Received NGN {amount:,.2f} from {sender_name} for customer {customer.full_name}. {message}",
                type=notification_type
            )

            # 10. Mark webhook event as processed
            webhook_event.processed = True
            webhook_event.save()

        # 11. Return a clear response
        from customers.serializers import CustomerSerializer
        from invoices.serializers import InvoiceSerializer
        from payments.serializers import PaymentSerializer

        return {
            "matched": True,
            "customer": CustomerSerializer(customer).data,
            "invoice": InvoiceSerializer(reconciled_invoice).data if reconciled_invoice else None,
            "payment": PaymentSerializer(payment).data,
            "reconciliation_status": "MATCHED",
            "message": message
        }
