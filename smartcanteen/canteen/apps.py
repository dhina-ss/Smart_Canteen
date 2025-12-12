from django.apps import AppConfig

class CanteenConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'canteen'
    
    def ready(self):
        # Import signals
        import canteen.signals
        print("✅ Canteen app ready - signals connected")
    