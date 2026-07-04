from django.urls import path
from apps.dashboard.views import DashboardMetricsAPIView

urlpatterns = [
    path('', DashboardMetricsAPIView.as_view(), name='dashboard-metrics'),
]
