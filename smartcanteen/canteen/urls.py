"""
URL Configuration for Canteen API Endpoints

This module defines the URL routing for the canteen management system API,
mapping URLs to corresponding viewset actions and custom endpoints.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: URL patterns for REST API endpoints in the canteen application
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ItemViewSet, SaleViewSet

# Initialize DefaultRouter for automatic URL routing of viewsets
router = DefaultRouter()

# Register viewsets with the router
# These will generate standard CRUD endpoints automatically:
# - GET /api/customers/ - List all customers
# - POST /api/customers/ - Create new customer
# - GET /api/customers/{id}/ - Retrieve specific customer
# - PUT/PATCH /api/customers/{id}/ - Update customer
# - DELETE /api/customers/{id}/ - Delete customer
# Similar patterns for items and sales
router.register('customers', CustomerViewSet)
router.register('items', ItemViewSet)
router.register('sales', SaleViewSet)

urlpatterns = [
    # Include all router-generated URLs
    path('', include(router.urls)),
    
    # Custom action endpoints (beyond standard CRUD)
    
    # GET /api/items/low_stock/ - Retrieve items with low stock
    path('items/low_stock/', 
         ItemViewSet.as_view({'get': 'low_stock'}), 
         name='items-low-stock'),
    
    # GET /api/sales/monthly_summary/ - Get monthly sales summary
    path('sales/monthly_summary/', 
         SaleViewSet.as_view({'get': 'monthly_summary'}), 
         name='sales-monthly-summary'),
    
    # GET /api/sales/top_items/ - Get top 10 best-selling items
    path('sales/top_items/', 
         SaleViewSet.as_view({'get': 'top_items'}), 
         name='sales-top-items'),
    
    # GET /api/sales/dashboard_stats/ - Get dashboard statistics
    path('sales/dashboard_stats/', 
         SaleViewSet.as_view({'get': 'dashboard_stats'}), 
         name='sales-dashboard-stats'),
]

"""
URL Patterns Summary:
-------------------
Standard CRUD endpoints (via router):
- /api/customers/
- /api/items/
- /api/sales/

Custom action endpoints:
- /api/items/low_stock/           - Low stock items
- /api/sales/monthly_summary/     - Monthly sales summary
- /api/sales/top_items/          - Top selling items
- /api/sales/dashboard_stats/    - Dashboard statistics

Individual sale endpoints (via router):
- /api/sales/{id}/invoice/        - Get invoice details (available via router)
"""
