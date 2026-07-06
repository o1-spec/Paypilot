from django.urls import path
from .views import DashboardMetricsView

urlpatterns = [
    path('summary/', DashboardMetricsView.as_view(), name='dashboard-summary'),
]
