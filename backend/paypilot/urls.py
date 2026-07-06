from django.contrib import admin
from django.urls import path, include
from customers.views import CustomerStatementView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/virtual-accounts/', include('virtual_accounts.urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/webhooks/', include('webhooks.urls')),
    
    # Reports Endpoint
    path('api/reports/customers/<uuid:pk>/statement/', CustomerStatementView.as_view(), name='customer-statement'),
]
