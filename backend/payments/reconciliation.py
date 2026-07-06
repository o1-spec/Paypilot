from decimal import Decimal
from django.db import transaction
from django.contrib.auth import get_user_model
from virtual_accounts.models import VirtualAccount
from invoices.models import Invoice
from payments.models import Payment
from notifications.models import Notification

Merchant = get_user_model()

class ReconciliationService:
    @staticmethod
    def process_webhook_payment(payload):
        """
        Receives Nomba transaction webhook payload, locates matching Virtual Account,
        applies payment to invoice, and generates notifications.
        Returns the created Payment record.
        """
        data = payload.get('data', {})
        account_number = data.get('account_number')
        amount = Decimal(str(data.get('amount', 0)))
        reference = data.get('reference')
        sender_name = data.get('sender_name', 'Unknown Sender')
        sender_account_number = data.get('sender_account_number', '')
        bank_name = data.get('bank_name', 'Unknown Bank')

        # Check if reference already exists to prevent duplicate webhook processing
        existing_payment = Payment.objects.filter(reference=reference).first()
        if existing_payment:
            return existing_payment

        # Locate matching Virtual Account
        virtual_acc = VirtualAccount.objects.filter(account_number=account_number).first()

        with transaction.atomic():
            if virtual_acc:
                customer = virtual_acc.customer
                merchant = customer.merchant

                # Find oldest PENDING or PARTIAL invoice for the customer
                target_invoice = Invoice.objects.filter(
                    customer=customer,
                    status__in=['PENDING', 'PARTIAL']
                ).order_by('due_date', 'created_at').first()

                reconciled_invoice = None
                payment_status = 'MATCHED'
                reconciliation_detail = f"Successfully matched and reconciled payment from {customer.full_name}."

                if target_invoice:
                    reconciled_invoice = target_invoice
                    
                    # Update invoice paid balance
                    target_invoice.amount_paid += amount
                    
                    # Determine new status
                    if target_invoice.amount_paid >= target_invoice.amount:
                        if target_invoice.amount_paid > target_invoice.amount:
                            target_invoice.status = 'OVERPAID'
                            reconciliation_detail += f" Invoice {target_invoice.invoice_number} marked as Overpaid."
                        else:
                            target_invoice.status = 'PAID'
                            reconciliation_detail += f" Invoice {target_invoice.invoice_number} marked as Fully Paid."
                    else:
                        target_invoice.status = 'PARTIAL'
                        reconciliation_detail += f" Invoice {target_invoice.invoice_number} updated to Partially Paid."
                    
                    target_invoice.save()
                else:
                    reconciliation_detail += " No pending or partial invoice found for this customer; payment logged to profile."

                # Create Payment Record
                payment = Payment.objects.create(
                    merchant=merchant,
                    customer=customer,
                    virtual_account=virtual_acc,
                    invoice=reconciled_invoice,
                    amount=amount,
                    reference=reference,
                    sender_name=sender_name,
                    sender_account_number=sender_account_number,
                    status=payment_status,
                    raw_payload=payload
                )

                # Create Notification
                Notification.objects.create(
                    merchant=merchant,
                    title="Payment Reconciled Automatically" if reconciled_invoice else "Unapplied Payment Logged",
                    message=f"A transfer of NGN {amount:,.2f} to {virtual_acc.account_name} ({bank_name}) was processed. {reconciliation_detail}",
                    type='payment_reconciled' if reconciled_invoice else 'payment_received'
                )
            else:
                # UNMATCHED transfer flow
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

            return payment
