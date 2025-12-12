from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import DashboardStats, Sale, Customer, SaleItem

def update_dashboard_stats():
    """Update dashboard statistics"""
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
    """Update stats when a sale is saved"""
    if created:  # Only update for new sales
        update_dashboard_stats()

@receiver(post_delete, sender=Sale)
def update_stats_on_sale_delete(sender, instance, **kwargs):
    """Update stats when a sale is deleted"""
    update_dashboard_stats()

@receiver(post_save, sender=Customer)
def update_stats_on_customer_save(sender, instance, created, **kwargs):
    """Update stats when a customer is saved"""
    if created:  # Only update for new customers
        update_dashboard_stats()

@receiver(post_delete, sender=Customer)
def update_stats_on_customer_delete(sender, instance, **kwargs):
    """Update stats when a customer is deleted"""
    update_dashboard_stats()
    