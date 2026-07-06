from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    MerchantRegisterView,
    CustomTokenObtainPairView,
    MerchantProfileView,
    MerchantLogoutView
)

urlpatterns = [
    path('register/', MerchantRegisterView.as_view(), name='merchant-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='merchant-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MerchantProfileView.as_view(), name='merchant-profile'),
    path('logout/', MerchantLogoutView.as_view(), name='merchant-logout'),
]
