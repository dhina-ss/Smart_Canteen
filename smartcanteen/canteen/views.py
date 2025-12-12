from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F
from .models import Customer, Item, Sale
from .serializers import CustomerSerializer, ItemSerializer, SaleSerializer
from django.db.models.functions import TruncMonth

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by('name')
    serializer_class = ItemSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        items = Item.objects.filter(stock__lte=F('reorder_threshold'))
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
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
        from django.db.models import Sum
        
        data = Sale.objects.values(
            'items__item__name'
        ).annotate(
            qty=Sum('items__quantity')
        ).order_by('-qty')[:10]
        return Response(data)
    
    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        sale = self.get_object()
        serializer = self.get_serializer(sale)
        return Response(serializer.data)