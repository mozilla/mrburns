import os
import socket

from django.utils.translation import ugettext_lazy as _

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

    LANGUAGES = (
        ('cs', _('Czech')),
        ('de', _('German')),
        ('en', _('English')),
        ('es', _('Spanish')),
        ('fr', _('French')),
        ('he', _('Hebrew')),
        ('hu', _('Hungarian')),
        ('id', _('Indonesian')),
        ('it', _('Italian')),
        ('ja', _('Japanese')),
        ('ko', _('Korean')),
        ('lt', _('Lithuanian')),
        ('nl', _('Dutch')),
        ('pl', _('Polish')),
        ('pt-br', _('Brazilian Portuguese')),
        ('ro', _('Romanian')),
        ('ru', _('Russian')),
        ('sk', _('Slovak')),
        ('sl', _('Slovenian')),
        ('sq', _('Albanian')),
        ('sr', _('Serbian')),
        ('zh-cn', _('Simplified Chinese')),
        ('zh-tw', _('Traditional Chinese')),
        ('xx', 'Pirate'),
    )
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
