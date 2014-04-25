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


def get_firefox_version():
    """Return latest version from product details JSON."""
    try:
        with conf.PROD_DETAILS_DIR.joinpath('firefox_versions.json').open() as fh:
            prod_details = json.load(fh)
    except IOError:
        return conf.FIREFOX_VERSION

    return prod_details.get('LATEST_FIREFOX_VERSION', conf.FIREFOX_VERSION)
