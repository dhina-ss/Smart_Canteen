"""
Smart Canteen Project - Main URL Configuration

This is the main URL configuration for the Smart Canteen Django project.
It routes URLs to the appropriate applications and admin interface.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: Root URL patterns for the smartcanteen project
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django Admin Interface
    # URL: /admin/
    # Provides administrative interface for managing the application
    path('admin/', admin.site.urls),
    
    # Canteen API Endpoints
    # URL: /api/
    # Routes all API requests to the canteen application's URL configuration
    # See canteen/urls.py for detailed API endpoint mappings
    path('api/', include('canteen.urls')),
]

"""
Project URL Structure:
---------------------
/                - Project root (currently not used)
/admin/          - Django admin interface
/api/            - REST API endpoints for canteen management

API Endpoints (via /api/):
- /api/customers/          - Customer management
- /api/items/             - Inventory management
- /api/sales/             - Sales transactions
- /api/items/low_stock/   - Low stock items
- /api/sales/monthly_summary/ - Monthly sales reports
- /api/sales/top_items/   - Top selling items
- /api/sales/dashboard_stats/ - Dashboard statistics

Note: Additional applications can be added by including their URL configurations
with appropriate path prefixes.
"""
