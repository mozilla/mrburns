from __future__ import absolute_import
import os

from .base import *  # noqa

if 'DJANGO_SERVER_ENV' in os.environ:
    from .server import *  # noqa

try:
    from .local import *  # noqa
except ImportError:
    pass
