"""
Utilities common to all of Smithers' little minions.
"""

import json
import math
import signal
import time
from os.path import basename

from smithers import conf


DEFAULT_SIGNALS = (
    signal.SIGHUP,
    signal.SIGTERM,
    signal.SIGINT,
)


def get_epoch_minute():
    """Return seconds since unix epoch rounded down to the nearest minute."""
    return int(math.floor(time.time() / 60) * 60)


def register_signals(callback, signals=None):
    """Register the callback function for the given signals."""
    signals = signals or DEFAULT_SIGNALS
    for sig in signals:
        signal.signal(sig, callback)


def set_process_name(title):
    """Set the process name if setproctitle is available."""
    try:
        from setproctitle import setproctitle
        setproctitle(basename(title))
    except ImportError:
        pass


def _get_fx_version_from_json():
    try:
        with conf.PROD_DETAILS_DIR.joinpath('firefox_versions.json').open() as fh:
            return json.load(fh).get('LATEST_FIREFOX_VERSION', None)
    except IOError:
        return None


def get_firefox_version():
    """Return latest version from product details JSON."""
    version = _get_fx_version_from_json() or conf.FIREFOX_VERSION
    # we don't care about the point release
    return '.'.join(version.split('.')[:2])
