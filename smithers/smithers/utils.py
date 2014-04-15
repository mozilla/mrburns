"""
Utilities common to all of Smithers' little minions.
"""

import math
import time


def get_epoch_minute():
    """Return seconds since unix epoch rounded down to the nearest minute."""
    return int(math.floor(time.time() / 60) * 60)
