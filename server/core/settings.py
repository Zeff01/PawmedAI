"""
Django settings for core project.
"""

import os
from pathlib import Path

import dj_database_url

from config.pysecrets import (
    DJANGO_ALLOWED_HOSTS,
    DJANGO_CORS_ALLOWED_ORIGINS,
    DJANGO_CSRF_COOKIE_SECURE,
    DJANGO_CSRF_TRUSTED_ORIGINS,
    DJANGO_DEBUG,
    DJANGO_SECRET_KEY,
    DJANGO_SECURE_SSL_REDIRECT,
    DJANGO_SESSION_COOKIE_SECURE,
    GAPI_KEY,
    GEMINI_MODEL,
    HUGGING_FACE_ENDPOINT_URL,
    HUGGING_FACE_KEY,
    HUGGING_FACE_MODEL,
)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
DEBUG = DJANGO_DEBUG
SECRET_KEY = DJANGO_SECRET_KEY
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "dev-insecure-change-me"
    else:
        raise RuntimeError("DJANGO_SECRET_KEY is required when DEBUG is False.")

ALLOWED_HOSTS = [host.strip() for host in DJANGO_ALLOWED_HOSTS if host.strip()]
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in DJANGO_CORS_ALLOWED_ORIGINS if origin.strip()
]
CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in DJANGO_CSRF_TRUSTED_ORIGINS if origin.strip()
]


# Application definition

INSTALLED_APPS = [
    'rest_framework',
    'classify_dss',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

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

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

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


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = DJANGO_SECURE_SSL_REDIRECT
SESSION_COOKIE_SECURE = DJANGO_SESSION_COOKIE_SECURE if not DEBUG else False
CSRF_COOKIE_SECURE = DJANGO_CSRF_COOKIE_SECURE if not DEBUG else False

REDIS_URL = os.getenv('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'disease-classify-throttle',
        }
    }

REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'disease_classify': '3/day',
    }
}
