import os

from .base import *  # noqa


SERVER_ENV = os.getenv('DJANGO_SERVER_ENV')
ADMINS = (
    ('pmac', 'pmac@mozilla.com'),
)
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = TEMPLATE_DEBUG = False
ALLOWED_HOSTS = [
    'webwewant.mozilla.org',
    'webwewant.allizom.org',
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
