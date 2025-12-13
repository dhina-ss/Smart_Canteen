"""
Django Models for Sales Management System

This module defines the database models for the sales management system,
including Customer, Item, Sale, SaleItem, and DashboardStats.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: Database models for sales tracking, inventory management, and dashboard statistics
"""

from django.db import models
from django.utils import timezone


class Customer(models.Model):
    """
    Customer model for storing client/customer information.
    
    Attributes:
        name (str): Full name of the customer
        contact_person (str): Primary contact person name
        phone (str): Contact phone number
        email (str): Contact email address
        company (str): Company/organization name
        address (str): Physical address
        notes (str): Additional notes/comments
    """
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    company = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        """
        String representation of Customer object.
        
        Returns:
            str: Customer name
        """
        return self.name


class Item(models.Model):
    """
    Item model for product/inventory management.
    
    Attributes:
        name (str): Product/item name
        sku (str): Stock Keeping Unit identifier
        price (Decimal): Unit price of the item
        stock (int): Current inventory quantity
        reorder_threshold (int): Minimum stock level before reordering
        active (bool): Item status (active/inactive)
    """
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    reorder_threshold = models.IntegerField(default=5)
    active = models.BooleanField(default=True)

    def __str__(self):
        """
        String representation of Item object.
        
        Returns:
            str: Item name
        """
        return self.name


class Sale(models.Model):
    """
    Sale model representing a complete sales transaction.
    
    Attributes:
        customer (ForeignKey): Reference to Customer who made the purchase
        created_at (DateTime): Timestamp of sale creation
        total_amount (Decimal): Total sale amount including taxes
        invoice_number (str): Unique invoice identifier
        payment_method (str): Payment method used (cash, card, etc.)
        payment_status (str): Current payment status
        tax_amount (Decimal): Total tax amount
        discount_amount (Decimal): Total discount applied
        notes (str): Additional sale notes
    """
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, related_name='sales')
    created_at = models.DateTimeField(default=timezone.now)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    invoice_number = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=50, default='cash')
    payment_status = models.CharField(max_length=50, default='paid')
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    def __str__(self):
        """
        String representation of Sale object.
        
        Returns:
            str: Invoice number with date
        """
        return f"Sale {self.invoice_number} - {self.created_at.date()}"


class SaleItem(models.Model):
    """
    SaleItem model representing individual line items within a sale.
    
    Attributes:
        sale (ForeignKey): Reference to parent Sale
        item (ForeignKey): Reference to Item sold
        quantity (int): Number of units sold
        unit_price (Decimal): Price per unit at time of sale
        
    Properties:
        line_total: Calculated total for this line item (quantity * unit_price)
    """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def line_total(self):
        """
        Calculate total amount for this sale line item.
        
        Returns:
            Decimal: Line total (quantity * unit_price)
        """
        return self.quantity * self.unit_price

    def __str__(self):
        """
        String representation of SaleItem object.
        
        Returns:
            str: Item name with quantity
        """
        return f"{self.item.name} x {self.quantity}"


class DashboardStats(models.Model):
    """
    DashboardStats model for storing aggregated statistics.
    
    Pre-calculated metrics for dashboard display to optimize performance.
    
    Attributes:
        total_sales (int): Total number of sales transactions
        total_revenue (Decimal): Sum of all sale amounts
        total_customers (int): Total number of unique customers
        total_items_sold (int): Sum of all items sold across sales
        avg_sale_value (Decimal): Average value per sale
        last_updated (DateTime): Timestamp of last statistics update
    """
    total_sales = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_customers = models.IntegerField(default=0)
    total_items_sold = models.IntegerField(default=0)
    avg_sale_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        """
        Metadata options for DashboardStats model.
        """
        verbose_name_plural = "Dashboard Statistics"
    
    def __str__(self):
        """
        String representation of DashboardStats object.
        
        Returns:
            str: Last updated timestamp
        """
        return f"Dashboard Stats - Last Updated: {self.last_updated}"
    