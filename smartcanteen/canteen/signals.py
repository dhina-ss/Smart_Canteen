from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Sale, SaleItem, Item


@receiver(post_save, sender=Sale)
def sale_post_save(sender, instance, created, **kwargs):
    # ensure total_amount equals sum of items
    total = 0
    for si in instance.items.all():
        total += si.quantity * si.unit_price
        if instance.total_amount != total:
            instance.total_amount = total
            instance.save(update_fields=['total_amount'])

@receiver(post_save, sender=SaleItem)
def saleitem_post_save(sender, instance, created, **kwargs):
    # reduce stock when a sale item is created
    if created:
        item = instance.item
        item.stock = item.stock - instance.quantity
        if item.stock < 0:
            item.stock = 0 # optionally, raise exception instead
            item.save()
    