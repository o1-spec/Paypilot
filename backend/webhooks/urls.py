from django.urls import path
from .views import NombaWebhookView

urlpatterns = [
    path('nomba/', NombaWebhookView.as_view(), name='webhook-nomba'),
]
