from django.urls import path
from .views import MerchantRegisterView, MerchantListView

urlpatterns = [
    path('register/', MerchantRegisterView.as_view(), name='merchant-register'),
    path('', MerchantListView.as_view(), name='merchant-list'),
]
