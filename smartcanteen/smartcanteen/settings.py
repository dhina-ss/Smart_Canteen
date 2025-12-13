"""
Smart Canteen - Django Project Settings Configuration

This module contains all the settings and configuration for the Smart Canteen
Django project. It includes security settings, application configurations,
database settings, middleware, and CORS configuration.

Author: Dhinakaran Sekar
Email: dhinakaran15022000@gmail.com
Created: 2025-12-12
Last Modified: 2025-12-14 00:27:00
Description: Django settings configuration for smartcanteen project
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'
BASE_DIR = Path(__file__).resolve().parent.parent


# ======================
# SECURITY SETTINGS
# ======================

# SECURITY WARNING: keep the secret key used in production secret!
# This key should be stored in environment variables in production
SECRET_KEY = 'django-insecure-7#&0s$l(no+ptv-^#k4*8qz80bw%a+_!t-g#)%dwra9kmw8yp0'

# SECURITY WARNING: don't run with debug turned on in production!
# Set to False in production for security
DEBUG = True

# List of hosts/domain names that this Django site can serve
# Add production domains when deploying
ALLOWED_HOSTS = []


# ======================
# APPLICATION DEFINITION
# ======================

INSTALLED_APPS = [
    # Django core applications
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party applications
    'rest_framework',      # Django REST Framework for APIs
    'corsheaders',         # CORS headers for cross-origin requests
    
    # Local applications
    'canteen',             # Main canteen management application
]

MIDDLEWARE = [
    # CORS middleware must be placed as high as possible
    'corsheaders.middleware.CorsMiddleware',
    
    # Django security middleware
    'django.middleware.security.SecurityMiddleware',
    
    # Django session middleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    # Django common middleware
    'django.middleware.common.CommonMiddleware',
    
    # Django CSRF protection middleware
    'django.middleware.csrf.CsrfViewMiddleware',
    
    # Django authentication middleware
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    # Django message middleware
    'django.contrib.messages.middleware.MessageMiddleware',
    
    # Clickjacking protection middleware
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Root URL configuration
ROOT_URLCONF = 'smartcanteen.urls'

# Template configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI application for deployment
WSGI_APPLICATION = 'smartcanteen.wsgi.application'


# ======================
# DATABASE CONFIGURATION
# ======================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# For production, consider using PostgreSQL:
"""
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
"""


# ======================
# PASSWORD VALIDATION
# ======================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ======================
# INTERNATIONALIZATION
# ======================

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# ======================
# STATIC FILES
# ======================

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # For production deployment


# ======================
# DEFAULT PRIMARY KEY
# ======================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ======================
# CORS CONFIGURATION
# ======================

# Specific allowed origins (for development)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",    # Vite/React development server
    "http://127.0.0.1:5173",    # Alternative localhost
]

# WARNING: Only for development - disable in production
CORS_ALLOW_ALL_ORIGINS = True

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True

# Allowed HTTP methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Allowed HTTP headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# ======================
# REST FRAMEWORK SETTINGS
# ======================

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Adjust for production
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}


# ======================
# PRODUCTION NOTES
# ======================

"""
For production deployment, make sure to:

1. Set DEBUG = False
2. Set SECRET_KEY from environment variable
3. Set ALLOWED_HOSTS with your domain(s)
4. Set CORS_ALLOW_ALL_ORIGINS = False
5. Configure proper CORS_ALLOWED_ORIGINS
6. Use a production database (PostgreSQL/MySQL)
7. Set up proper static file serving
8. Configure SSL/HTTPS
9. Set up proper logging
10. Use environment variables for sensitive data
"""

"""
Production environment variables example:

import os
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
"""
