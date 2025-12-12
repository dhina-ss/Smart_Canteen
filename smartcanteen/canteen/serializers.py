from rest_framework import serializers
from .models import Customer, Item, Sale, SaleItem
import uuid
from django.db import transaction


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class SaleItemSerializer(serializers.ModelSerializer):
    item_detail = ItemSerializer(source='item', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id','item','item_detail','quantity','unit_price']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)

    class Meta:
        model = Sale
        fields = ['id','invoice_number','customer','customer_detail','created_at','items','total_amount']

def create(self, validated_data):
    items_data = validated_data.pop('items')
    # generate invoice number
    
    validated_data['invoice_number'] = f"INV-{uuid.uuid4().hex[:8].upper()}"
    sale = Sale.objects.create(**validated_data)
    total = 0
    
    with transaction.atomic():
        for it in items_data:
            item_obj = Item.objects.select_for_update().get(pk=it['item'].id if isinstance(it['item'], Item) else it['item'])
            quantity = int(it['quantity'])
            if item_obj.stock < quantity:
                raise serializers.ValidationError({ 'stock': f"Not enough stock for {item_obj.name}. Available: {item_obj.stock}" })
            item_obj.stock -= quantity
            item_obj.save()
            unit_price = it.get('unit_price') or item_obj.price
            SaleItem.objects.create(sale=sale, item=item_obj, quantity=quantity, unit_price=unit_price)
            total += quantity * unit_price
        sale.total_amount = total
        sale.save()
    return sale

def to_representation(self, instance):
    data = super().to_representation(instance)
    data['items'] = SaleItemSerializer(instance.items.all(), many=True).data
    return data
