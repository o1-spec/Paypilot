import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random

from customers.models import Customer
from virtual_accounts.models import VirtualAccount
from invoices.models import Invoice
from payments.models import Payment
from notifications.models import Notification
from virtual_accounts.services import VirtualAccountService

Merchant = get_user_model()

class Command(BaseCommand):
    help = 'Seeds sample data for local PayPilot demonstration.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database with demo PayPilot records...')

        # 1. Create Default Demo Merchant
        merchant, created = Merchant.objects.get_or_create(
            email='info@gracefoods.ng',
            defaults={
                'username': 'gracefoods',
                'business_name': 'Grace Foods Enterprises',
                'phone': '+2348012345678',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            merchant.set_password('password')
            merchant.save()
            self.stdout.write(self.style.SUCCESS(f'Created merchant: {merchant.email} (Password: "password")'))
        else:
            self.stdout.write(f'Using existing merchant: {merchant.email}')

        # Clean existing customer data to avoid conflicts on repeat runs
        Customer.objects.filter(merchant=merchant).delete()
        Payment.objects.filter(status='UNMATCHED').delete()
        Notification.objects.filter(merchant=merchant).delete()

        # 2. Seed Customers & Virtual Accounts
        sample_customers = [
            {'full_name': 'Tunde Bakare', 'email': 'tunde@logistics.ng', 'phone': '+2348031112222', 'business_name': 'Tunde Logistics'},
            {'full_name': 'Amaka Okeke', 'email': 'amaka@stores.ng', 'phone': '+2348032223333', 'business_name': 'Amaka Stores'},
            {'full_name': 'Bayo Shonibare', 'email': 'bayo@pharmacy.ng', 'phone': '+2348033334444', 'business_name': 'Bayo Pharmacy Ltd'},
            {'full_name': 'Helen Adebayo', 'email': 'helen@tutors.ng', 'phone': '+2348034445555', 'business_name': 'Prime Tutors'},
            {'full_name': 'Uche Nwosu', 'email': 'uche@retail.ng', 'phone': '+2348035556666', 'business_name': 'Nwosu Retail Ventures'},
        ]

        customers = []
        for cust_data in sample_customers:
            cust = Customer.objects.create(
                merchant=merchant,
                full_name=cust_data['full_name'],
                email=cust_data['email'],
                phone=cust_data['phone'],
                business_name=cust_data['business_name'],
                status='active'
            )
            # Provision Virtual Account via Nomba Mock Service
            VirtualAccountService.provision_account(cust)
            customers.append(cust)
            self.stdout.write(f"Created customer '{cust.full_name}' -> Account: {cust.virtual_account.account_number}")

        # 3. Seed Invoices & Matched Payments
        self.stdout.write('Generating sample invoices...')
        due_in_10_days = timezone.now().date() + datetime.timedelta(days=10)
        overdue_5_days = timezone.now().date() - datetime.timedelta(days=5)

        for i, cust in enumerate(customers):
            # Invoice A: Fully Paid
            inv1 = Invoice.objects.create(
                merchant=merchant,
                customer=cust,
                invoice_number=f"INV-2026-00{i+1}A",
                amount=Decimal(random.randint(5000, 25000)),
                amount_paid=0,
                description=f"Logistics / Supply Delivery order 0{i+1}",
                due_date=overdue_5_days,
                status='PENDING'
            )
            # Reconcile invoice 1 with a matched payment
            pay1_amount = inv1.amount
            inv1.amount_paid = pay1_amount
            inv1.status = 'PAID'
            inv1.save()

            Payment.objects.create(
                merchant=merchant,
                customer=cust,
                virtual_account=cust.virtual_account,
                invoice=inv1,
                amount=pay1_amount,
                reference=f"TXN-{random.randint(100000, 999999)}",
                sender_name=cust.full_name,
                sender_account_number=f"0012{random.randint(1000, 9999)}",
                status='MATCHED',
                raw_payload={"mock": "payload"}
            )

            # Invoice B: Pending or Partial
            is_partial = i % 2 == 0
            inv2 = Invoice.objects.create(
                merchant=merchant,
                customer=cust,
                invoice_number=f"INV-2026-00{i+1}B",
                amount=Decimal(random.randint(10000, 50000)),
                amount_paid=Decimal(5000) if is_partial else Decimal(0),
                description=f"Monthly service billing - Cycle 0{i+1}",
                due_date=due_in_10_days,
                status='PARTIAL' if is_partial else 'PENDING'
            )

            if is_partial:
                Payment.objects.create(
                    merchant=merchant,
                    customer=cust,
                    virtual_account=cust.virtual_account,
                    invoice=inv2,
                    amount=Decimal(5000),
                    reference=f"TXN-{random.randint(100000, 999999)}",
                    sender_name=cust.full_name,
                    sender_account_number=f"0012{random.randint(1000, 9999)}",
                    status='MATCHED',
                    raw_payload={"mock": "payload"}
                )

        # 4. Seed an Unmatched payment
        self.stdout.write('Generating unmatched collection transactions...')
        Payment.objects.create(
            merchant=None,
            customer=None,
            virtual_account=None,
            invoice=None,
            amount=Decimal(18500.00),
            reference=f"TXN-UNMATCHED-{random.randint(100000, 999999)}",
            sender_name="Musa Ibrahim",
            sender_account_number="0033441122",
            status='UNMATCHED',
            raw_payload={"mock": "payload", "error": "Unknown destination account number"}
        )

        # 5. Seed some notifications
        Notification.objects.create(
            merchant=merchant,
            title="System Active",
            message="PayPilot Dedicated Virtual Account reconciliation engine initialized.",
            type="info"
        )
        Notification.objects.create(
            merchant=merchant,
            title="Unmatched Payment Warning",
            message="An inbound transfer of NGN 18,500.00 from Musa Ibrahim could not be matched. Please review unmatched logs.",
            type="warning"
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all sample demo records!'))
