from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, decorators
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Customer
from .serializers import CustomerSerializer
from virtual_accounts.services import VirtualAccountService
from invoices.models import Invoice
from payments.models import Payment
from invoices.serializers import InvoiceSerializer
from payments.serializers import PaymentSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(merchant=self.request.user)

    def perform_create(self, serializer):
        customer = serializer.save(merchant=self.request.user)
        # Automatically provision virtual account through service layer
        VirtualAccountService.provision_account(customer)

    @decorators.action(detail=True, methods=['get'], url_path='invoices')
    def invoices(self, request, pk=None):
        customer = self.get_object()
        invoices = Invoice.objects.filter(customer=customer).order_by('-created_at')
        
        status_param = request.query_params.get('status')
        if status_param:
            invoices = invoices.filter(status=status_param)
            
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            invoices = invoices.filter(created_at__date__range=[start_date, end_date])
            
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CustomerStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from decimal import Decimal
        from virtual_accounts.serializers import VirtualAccountSerializer

        customer = get_object_or_404(Customer, pk=pk)
        
        # Verify customer matches active authenticated merchant
        if customer.merchant != request.user:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve invoices and payments chronologically
        invoices = Invoice.objects.filter(customer=customer).order_by('created_at')
        payments = Payment.objects.filter(customer=customer).order_by('created_at')

        # Combine into statement lines
        lines = []
        for inv in invoices:
            lines.append({
                "date": inv.created_at.strftime("%Y-%m-%d"),
                "created_at": inv.created_at,
                "type": "INVOICE",
                "description": inv.description or f"Invoice {inv.invoice_number} issued",
                "debit": inv.amount,
                "credit": Decimal('0.00'),
                "reference": inv.invoice_number
            })

        for p in payments:
            lines.append({
                "date": p.created_at.strftime("%Y-%m-%d"),
                "created_at": p.created_at,
                "type": "PAYMENT",
                "description": f"Payment received from {p.sender_name or 'customer'}",
                "debit": Decimal('0.00'),
                "credit": p.amount,
                "reference": p.reference
            })

        # Sort combined list by created_at date
        lines.sort(key=lambda x: x["created_at"])

        # Calculate running balances
        running_balance = Decimal('0.00')
        for line in lines:
            running_balance = running_balance + line["debit"] - line["credit"]
            line["running_balance"] = running_balance
            del line["created_at"]

        total_invoice_amount = sum(inv.amount for inv in invoices)
        total_paid = sum(p.amount for p in payments)
        outstanding_balance = total_invoice_amount - total_paid

        virtual_acc = getattr(customer, 'virtual_account', None)
        virtual_acc_data = VirtualAccountSerializer(virtual_acc).data if virtual_acc else None

        return Response({
            "customer": CustomerSerializer(customer).data,
            "virtual_account": virtual_acc_data,
            "total_invoice_amount": total_invoice_amount,
            "total_paid": total_paid,
            "outstanding_balance": outstanding_balance,
            "invoices": InvoiceSerializer(invoices, many=True).data,
            "payments": PaymentSerializer(payments, many=True).data,
            "statement_lines": lines
        }, status=status.HTTP_200_OK)


class CustomerDemoActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        action = request.data.get('action')
        if action == 'seed':
            from decimal import Decimal
            import random
            import datetime
            from django.utils import timezone
            from notifications.models import Notification
            from virtual_accounts.models import VirtualAccount
            
            merchant = request.user
            
            # Clean first to prevent double-seed conflicts
            Customer.objects.filter(merchant=merchant).delete()
            Payment.objects.filter(merchant=merchant).delete()
            Payment.objects.filter(status='UNMATCHED').delete()
            Notification.objects.filter(merchant=merchant).delete()
            
            # Seed Customers
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
                # Automatically provision mock virtual account details
                VirtualAccountService.provision_account(cust)
                customers.append(cust)
                
            # Seed Invoices and payments
            due_in_10_days = timezone.now().date() + datetime.timedelta(days=10)
            overdue_5_days = timezone.now().date() - datetime.timedelta(days=5)

            for i, cust in enumerate(customers):
                # Invoice A (PAID)
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
                inv1.amount_paid = inv1.amount
                inv1.status = 'PAID'
                inv1.save()

                Payment.objects.create(
                    merchant=merchant,
                    customer=cust,
                    virtual_account=cust.virtual_account,
                    invoice=inv1,
                    amount=inv1.amount,
                    reference=f"TXN-{random.randint(100000, 999999)}",
                    sender_name=cust.full_name,
                    sender_account_number=f"0012{random.randint(1000, 9999)}",
                    status='MATCHED',
                    raw_payload={"mock": "payload"}
                )

                # Invoice B (PENDING / PARTIAL)
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

            # Unmatched payment
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

            # Notifications
            Notification.objects.create(
                merchant=merchant,
                title="System Active",
                message="PayPilot Dedicated Virtual Account reconciliation engine initialized.",
                type="SYSTEM"
            )
            Notification.objects.create(
                merchant=merchant,
                title="Unmatched Payment Warning",
                message="An inbound transfer of NGN 18,500.00 from Musa Ibrahim could not be matched. Please review unmatched logs.",
                type="UNMATCHED_PAYMENT"
            )
            return Response({"message": "Successfully seeded demo dataset!"}, status=status.HTTP_200_OK)

        elif action == 'reset':
            from notifications.models import Notification
            
            # Wipes out all merchant resources to demonstrate clean empty states
            Invoice.objects.filter(merchant=request.user).delete()
            Payment.objects.filter(merchant=request.user).delete()
            Payment.objects.filter(status='UNMATCHED').delete()
            Customer.objects.filter(merchant=request.user).delete()
            Notification.objects.filter(merchant=request.user).delete()
            return Response({"message": "Successfully wiped demo records clean!"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid action. Supported: 'seed', 'reset'."}, status=status.HTTP_400_BAD_REQUEST)
