# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""
Django settings for mrburns project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

from pathlib import Path


# Build paths inside the project like this: BASE_DIR.child('sub', 'dirs')
BASE_DIR = Path(__file__).resolve().parents[2]

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = TEMPLATE_DEBUG = False

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'mrburns.db',
    }
}

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.cache.RedisCache',
        'LOCATION': '127.0.0.1:6379:0',
    },
    'smithers': {
        'BACKEND': 'redis_cache.cache.RedisCache',
        'LOCATION': '127.0.0.1:6379:0',
    }
}

# Application definition

INSTALLED_APPS = (
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',

    # 3rd party
    'pipeline',
    'django_extensions',
    'product_details',
    'django_nose',

    # project apps
    'mrburns.main',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.http.ConditionalGetMiddleware',
    'django.middleware.common.CommonMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.static',
    'django.core.context_processors.tz',
    'django.contrib.messages.context_processors.messages',
    'mrburns.main.context_processors.glow_variables',
)

ROOT_URLCONF = 'mrburns.urls'

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
LOCALE_PATHS = (
    str(BASE_DIR / 'locale'),
)

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = str(BASE_DIR / 'static')
STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)
PIPELINE_COMPILERS = (
    'pipeline.compilers.less.LessCompiler',
)
PIPELINE_JS_COMPRESSOR = 'pipeline.compressors.slimit.SlimItCompressor'

DJANGO_REDIS_IGNORE_EXCEPTIONS = True
ENABLE_REDIS = False
TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

PROD_DETAILS_DIR = str(BASE_DIR / 'prod_details_json')

# Source: http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
EXTRA_COUNTRIES = {}

# codes that are nearly the same as a code we have
# put them here intstead of above to get translations
COUNTRY_CODE_MAP = {}


# MEDIA

PIPELINE_CSS = {
    'main': {
        'source_filenames': (
            'css/bootstrap/bootstrap.less',
            'css/main.less',
        ),
        'output_filename': 'css/main.min.css'
    }
}

PIPELINE_JS = {
    'main': {
        'source_filenames': (
            'js/libs/jquery-2.1.0.js',
            'js/libs/d3.v3.min.js',
            'js/libs/topojson.v1.min.js',
            'js/libs/bootstrap.js',
            'js/libs/select2.js',
            'js/libs/jQuery.tubeplayer.js',
            'js/main.js',
            'js/map.js',
            'js/stats.js',
            'js/ga_event-tracking.js',
        ),
        'output_filename': 'js/main.min.js'
    }
}
