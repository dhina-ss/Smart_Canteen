"""
Dashboard Statistics Signals Module

This module handles automatic updates of dashboard statistics when related models
(Sale, Customer) are created, updated, or deleted.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: Signal handlers for updating dashboard statistics in real-time
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import DashboardStats, Sale, Customer, SaleItem


def update_dashboard_stats():
    """
    Update dashboard statistics with current data.
    
    Calculates and updates key metrics including total sales, revenue,
    customers, items sold, and average sale value.
    
    Returns:
        None: Updates the DashboardStats model directly
        
    Raises:
        Exception: Logs any errors encountered during calculation
    """
    print("🔄 Updating dashboard stats...")
    
    try:
        # Calculate total sales
        total_sales = Sale.objects.count()
        
        # Calculate total revenue
        total_revenue_result = Sale.objects.aggregate(total=Sum('total_amount'))
        total_revenue = total_revenue_result['total'] or 0
        
        # Calculate total customers
        total_customers = Customer.objects.count()
        
        # Calculate total items sold
        total_items_sold_result = SaleItem.objects.aggregate(total=Sum('quantity'))
        total_items_sold = total_items_sold_result['total'] or 0
        
        # Calculate average sale value
        avg_sale_value = total_revenue / total_sales if total_sales > 0 else 0
        
        # Get or create the DashboardStats record
        stats, created = DashboardStats.objects.get_or_create(id=1)
        
        # Update the stats
        stats.total_sales = total_sales
        stats.total_revenue = total_revenue
        stats.total_customers = total_customers
        stats.total_items_sold = total_items_sold
        stats.avg_sale_value = avg_sale_value
        stats.save()
        
        print(f"✅ Dashboard stats updated:")
        print(f"   Sales: {total_sales}")
        print(f"   Revenue: {total_revenue}")
        print(f"   Customers: {total_customers}")
        print(f"   Items Sold: {total_items_sold}")
        
    except Exception as e:
        print(f"❌ Error updating dashboard stats: {e}")


@receiver(post_save, sender=Sale)
def update_stats_on_sale_save(sender, instance, created, **kwargs):
    """
    Signal handler to update dashboard stats when a Sale is saved.
    
    Args:
        sender: The model class (Sale)
        instance: The actual instance being saved
        created: Boolean indicating if this is a new record
        **kwargs: Additional keyword arguments
    """
    if created:  # Only update for new sales
        update_dashboard_stats()


@receiver(post_delete, sender=Sale)
def update_stats_on_sale_delete(sender, instance, **kwargs):
    """
    Signal handler to update dashboard stats when a Sale is deleted.
    
    Args:
        sender: The model class (Sale)
        instance: The actual instance being deleted
        **kwargs: Additional keyword arguments
    """
    update_dashboard_stats()


@receiver(post_save, sender=Customer)
def update_stats_on_customer_save(sender, instance, created, **kwargs):
    """
    Signal handler to update dashboard stats when a Customer is saved.
    
    Args:
        sender: The model class (Customer)
        instance: The actual instance being saved
        created: Boolean indicating if this is a new record
        **kwargs: Additional keyword arguments
    """
    if created:  # Only update for new customers
        update_dashboard_stats()


@receiver(post_delete, sender=Customer)
def update_stats_on_customer_delete(sender, instance, **kwargs):
    """
    Signal handler to update dashboard stats when a Customer is deleted.
    
    Args:
        sender: The model class (Customer)
        instance: The actual instance being deleted
        **kwargs: Additional keyword arguments
    """
    update_dashboard_stats()
