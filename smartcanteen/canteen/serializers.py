"""
Django REST Framework Serializers for Sales Management System

This module defines serializers for converting model instances to/from JSON,
handling data validation, and managing business logic during serialization.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: Serializers for Customer, Item, Sale, SaleItem, and DashboardStats models
"""

from rest_framework import serializers
from .models import Customer, Item, Sale, SaleItem, DashboardStats
import uuid
from django.db import transaction


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model.
    
    Handles serialization/deserialization of Customer objects with all fields.
    """
    class Meta:
        model = Customer
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    """
    Serializer for Item model.
    
    Handles serialization/deserialization of Item objects with all fields.
    """
    class Meta:
        model = Item
        fields = '__all__'


class SaleItemSerializer(serializers.ModelSerializer):
    """
    Serializer for SaleItem model with nested item details.
    
    Includes a read-only field for detailed item information.
    """
    item_detail = ItemSerializer(source='item', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'item', 'item_detail', 'quantity', 'unit_price']


class SaleSerializer(serializers.ModelSerializer):
    """
    Serializer for Sale model with nested items and customer details.
    
    Handles creation of sales with inventory management and automatic invoice generation.
    Includes atomic transaction for data consistency.
    """
    items = SaleItemSerializer(many=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'invoice_number', 'customer', 'customer_detail', 
                 'created_at', 'items', 'total_amount']

    def create(self, validated_data):
        """
        Create a new Sale instance with associated SaleItems.
        
        Args:
            validated_data: Validated data for the sale including items
            
        Returns:
            Sale: The created sale instance
            
        Raises:
            serializers.ValidationError: If stock is insufficient for any item
        """
        items_data = validated_data.pop('items')
        
        # Generate unique invoice number
        validated_data['invoice_number'] = f"INV-{uuid.uuid4().hex[:8].upper()}"
        sale = Sale.objects.create(**validated_data)
        total = 0
        
        # Use atomic transaction to ensure data consistency
        with transaction.atomic():
            for it in items_data:
                # Lock the item for update to prevent race conditions
                item_obj = Item.objects.select_for_update().get(
                    pk=it['item'].id if isinstance(it['item'], Item) else it['item']
                )
                quantity = int(it['quantity'])
                
                # Check stock availability
                if item_obj.stock < quantity:
                    raise serializers.ValidationError({
                        'stock': f"Not enough stock for {item_obj.name}. Available: {item_obj.stock}"
                    })
                
                # Update stock
                item_obj.stock -= quantity
                item_obj.save()
                
                # Use provided unit price or default to item price
                unit_price = it.get('unit_price') or item_obj.price
                
                # Create sale item
                SaleItem.objects.create(
                    sale=sale,
                    item=item_obj,
                    quantity=quantity,
                    unit_price=unit_price
                )
                total += quantity * unit_price
            
            # Update sale total
            sale.total_amount = total
            sale.save()
        
        # Trigger dashboard stats update
        from .signals import update_dashboard_stats
        update_dashboard_stats()
        
        return sale

    def to_representation(self, instance):
        """
        Convert Sale instance to dictionary representation.
        
        Args:
            instance: Sale instance to serialize
            
        Returns:
            dict: Serialized sale data with nested items
        """
        data = super().to_representation(instance)
        data['items'] = SaleItemSerializer(instance.items.all(), many=True).data
        return data


class DashboardStatsSerializer(serializers.ModelSerializer):
    """
    Serializer for DashboardStats model.
    
    Provides read-only access to dashboard statistics with all relevant metrics.
    """
    class Meta:
        model = DashboardStats
        fields = ['id', 'total_sales', 'total_revenue', 'total_customers', 
                 'total_items_sold', 'avg_sale_value', 'last_updated']
        