from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VirtualAccountViewSet

router = DefaultRouter()
router.register(r'', VirtualAccountViewSet, basename='virtual-account')

urlpatterns = [
    path('', include(router.urls)),
]
