# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
"""
WSGI config for mrburns project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/howto/deployment/wsgi/
"""

import os
import site

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
site.addsitedir(os.path.join(BASE_DIR, 'smithers'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mrburns.settings")

from django.core.wsgi import get_wsgi_application
from mrburns.main.storage import MrBurnsNoise

application = MrBurnsNoise(get_wsgi_application())
