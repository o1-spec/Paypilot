from django.urls import path
from .views import VirtualAccountProvisionView

urlpatterns = [
    path('provision/', VirtualAccountProvisionView.as_view(), name='virtual-account-provision'),
]
