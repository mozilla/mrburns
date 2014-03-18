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
