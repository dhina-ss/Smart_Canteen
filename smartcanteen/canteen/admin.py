from django.contrib import admin
from .models import Customer, DashboardStats, Sale, Item, SaleItem

admin.site.register(Customer)
admin.site.register(DashboardStats)
admin.site.register(Sale)
admin.site.register(Item)
admin.site.register(SaleItem)
