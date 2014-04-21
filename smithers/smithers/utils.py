"""
Utilities common to all of Smithers' little minions.
"""

import math
import signal
import time
from os.path import basename


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
