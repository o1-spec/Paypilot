from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerDemoActionView

router = DefaultRouter()
router.register(r'', CustomerViewSet, basename='customer')

urlpatterns = [
    path('demo/', CustomerDemoActionView.as_view(), name='customer-demo-action'),
    path('', include(router.urls)),
]
