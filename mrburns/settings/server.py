import os
import socket

from .base import *  # noqa


SERVER_ENV = os.getenv('DJANGO_SERVER_ENV')
SECRET_KEY = os.getenv('SECRET_KEY')
STATIC_URL = os.getenv('STATIC_URL', STATIC_URL)
DEBUG = TEMPLATE_DEBUG = False
ALLOWED_HOSTS = [
    'webwewant.mozilla.org',
    'webwewant.allizom.org',
    # the server's IP (for monitors)
    socket.gethostbyname(socket.gethostname()),
]

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.cache.RedisCache',
        'LOCATION': 'unix:/var/run/redis/redis.sock:1',
        'OPTIONS': {
            'PARSER_CLASS': 'redis.connection.HiredisParser',
        }
    },
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
