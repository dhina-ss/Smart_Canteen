"""
Django App Configuration for Canteen Application

This module configures the Canteen Django application, including
settings for auto-generated primary keys and signal initialization.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: Application configuration for the canteen management system
"""

from django.apps import AppConfig


class CanteenConfig(AppConfig):
    """
    Configuration class for the Canteen Django application.
    
    This class handles application-specific settings and initialization
    including signal registration and database field configuration.
    
    Attributes:
        default_auto_field (str): Type of auto-generated primary key field
        name (str): Application name as defined in INSTALLED_APPS
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'canteen'
    
    def ready(self):
        """
        Initialize application when Django starts.
        
        This method is called when the application is ready. It imports
        signals to ensure they are registered and connected properly.
        
        Actions:
            - Imports the signals module to connect signal handlers
            - Prints confirmation message to console for debugging
        """
        # Import signals to ensure they are registered
        import canteen.signals
        print("✅ Canteen app ready - signals connected")
        