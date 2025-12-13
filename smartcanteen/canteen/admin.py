"""
Django Admin Configuration for Canteen Application

This module registers application models with the Django admin interface,
making them manageable through the admin panel.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: Admin configuration for canteen management system models
"""

from django.contrib import admin
from .models import Customer, DashboardStats, Sale, Item, SaleItem


# Register all models with the default admin configuration
admin.site.register(Customer)
admin.site.register(DashboardStats)
admin.site.register(Sale)
admin.site.register(Item)
admin.site.register(SaleItem)

"""
Note: This is a basic registration. For more advanced admin features,
consider creating custom ModelAdmin classes for each model to provide:
- Custom display fields
- Search functionality
- List filters
- Inline editing
- Custom actions
"""
