# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import os


if 'TRAVIS' in os.environ:
    from .travis import *  # noqa
else:
    try:
        from .local import *  # noqa
    except ImportError as exc:
        from .base import *  # noqa

COMPRESS_OFFLINE = not DEBUG

if 'MAP_DATA_URL' not in locals():
    # Set MAP_DATA_URL in local.py to override.
    MAP_DATA_URL = STATIC_URL + 'data/'
