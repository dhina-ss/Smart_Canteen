from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ItemViewSet, SaleViewSet

router = DefaultRouter()
router.register('customers', CustomerViewSet)
router.register('items', ItemViewSet)
router.register('sales', SaleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('items/low_stock/', ItemViewSet.as_view({'get': 'low_stock'}), name='items-low-stock'),
    path('sales/monthly_summary/', SaleViewSet.as_view({'get': 'monthly_summary'}), name='sales-monthly-summary'),
    path('sales/top_items/', SaleViewSet.as_view({'get': 'top_items'}), name='sales-top-items'),
    path('sales/dashboard_stats/', SaleViewSet.as_view({'get': 'dashboard_stats'}), name='sales-dashboard-stats'),
]