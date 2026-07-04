from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.utils.db_manager import JSONDatabase
from apps.customers.services import NombaVirtualAccountService
import uuid

class CustomerListCreateAPIView(APIView):
    def get(self, request):
        db = JSONDatabase.load()
        return Response(db.get("customers", []), status=status.HTTP_200_OK)
        
    def post(self, request):
        db = JSONDatabase.load()
        name = request.data.get("name")
        email = request.data.get("email")
        phone = request.data.get("phone")
        business_name = request.data.get("business_name")
        
        if not name or not email or not phone:
            return Response(
                {"error": "name, email, and phone fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        customer_id = f"cust_{uuid.uuid4().hex[:8]}"
        
        # Provision virtual account using Nomba service layer
        virtual_account = NombaVirtualAccountService.provision_account(name, customer_id)
        
        new_customer = {
            "id": customer_id,
            "name": name,
            "email": email,
            "phone": phone,
            "business_name": business_name or name,
            "virtual_account": virtual_account,
            "status": "active"
        }
        
        db["customers"].append(new_customer)
        JSONDatabase.save(db)
        
        return Response(new_customer, status=status.HTTP_201_CREATED)

class CustomerDetailAPIView(APIView):
    def get(self, request, pk):
        db = JSONDatabase.load()
        customers = db.get("customers", [])
        customer = next((c for c in customers if c["id"] == pk), None)
        if not customer:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(customer, status=status.HTTP_200_OK)
