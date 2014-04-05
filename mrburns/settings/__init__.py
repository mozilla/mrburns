# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import os


if os.getenv('TRAVIS', False):
    from .travis import *  # noqa
else:
    try:
        from .local import *  # noqa
    except ImportError as exc:
        exc.args = tuple(['%s (did you rename mrburns/settings/local.py-dist?)' %
                          exc.args[0]])
        raise exc


COMPRESS_OFFLINE = not DEBUG
