"""
Smart Canteen Sales Management API Views

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:24:00
Description: Django REST Framework viewsets for samrt canteen sales management system
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F
from .models import Customer, Item, Sale, DashboardStats
from .serializers import CustomerSerializer, ItemSerializer, SaleSerializer, DashboardStatsSerializer
from django.db.models.functions import TruncMonth


class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Customers.
    
    Provides CRUD operations for Customer model with ordering by name.
    """
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer


class ItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Items.
    
    Provides CRUD operations for Item model with ordering by name.
    Includes additional endpoint for retrieving low stock items.
    """
    queryset = Item.objects.all().order_by('name')
    serializer_class = ItemSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Retrieve items with stock at or below reorder threshold.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: Serialized list of low stock items
        """
        items = Item.objects.filter(stock__lte=F('reorder_threshold'))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class SaleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Sales.
    
    Provides CRUD operations for Sale model with ordering by created_at (descending).
    Includes endpoints for monthly summaries, top items, dashboard stats, and invoice details.
    """
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """
        Get monthly sales summary with total amounts.
        
        Groups sales by month and calculates total sales amount for each month.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: List of dictionaries containing month and total sales amount
        """
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth
        
        qs = Sale.objects.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Sum('total_amount')
        ).order_by('month')
        return Response(list(qs))
    
    @action(detail=False, methods=['get'])
    def top_items(self, request):
        """
        Get top 10 best-selling items by quantity.
        
        Aggregates sales data to find the most sold items based on quantity.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: List of dictionaries containing item names and quantities sold
        """
        from django.db.models import Sum
        
        data = Sale.objects.values(
            'items__item__name'
        ).annotate(
            qty=Sum('items__quantity')
        ).order_by('-qty')[:10]
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Get comprehensive dashboard statistics.
        
        Retrieves pre-calculated dashboard statistics. If no stats exist,
        triggers an update to generate them.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: Serialized dashboard statistics
        """
        # Get the dashboard stats
        stats = DashboardStats.objects.first()
        
        if not stats:
            # Create default stats
            from .signals import update_dashboard_stats
            update_dashboard_stats()
            stats = DashboardStats.objects.first()
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        """
        Get detailed invoice information for a specific sale.
        
        Args:
            request: HTTP request object
            pk: Primary key of the sale to retrieve
            
        Returns:
            Response: Serialized sale object with invoice details
        """
        sale = self.get_object()
        serializer = self.get_serializer(sale)
        return Response(serializer.data)
    