import os
import socket

from .base import *  # noqa


SERVER_ENV = os.getenv('DJANGO_SERVER_ENV')
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = TEMPLATE_DEBUG = False
ALLOWED_HOSTS = [
    # the server's IP (for monitors)
    socket.gethostbyname(socket.gethostname()),
]

if SERVER_ENV == 'prod':
    ALLOWED_HOSTS.extend([
        'webwewant.mozilla.org',
        'glow.cdn.mozilla.net',
        'glow-origin.cdn.mozilla.net',
    ])
    STATIC_URL = 'https://glow.cdn.mozilla.net/static/'
elif SERVER_ENV == 'dev':
    ALLOWED_HOSTS.append('webwewant.allizom.org')

CACHES = {
    # DB 1 is for the site cache
    'default': {
        'BACKEND': 'redis_cache.cache.RedisCache',
        'LOCATION': 'unix:/var/run/redis/redis.sock:1',
        'OPTIONS': {
            'PARSER_CLASS': 'redis.connection.HiredisParser',
        }
    },
    # DB 0 is for the glow data
    'smithers': {
        'BACKEND': 'redis_cache.cache.RedisCache',
        'LOCATION': 'unix:/var/run/redis/redis.sock:0',
        'OPTIONS': {
            'PARSER_CLASS': 'redis.connection.HiredisParser',
        }
    }
}

DJANGO_REDIS_IGNORE_EXCEPTIONS = False
ENABLE_REDIS = True

# Sentry
INSTALLED_APPS += ('raven.contrib.django.raven_compat',)
RAVEN_CONFIG = {
    'dsn': os.getenv('SENTRY_DSN'),
}
