"""
Utilities common to all of Smithers' little minions.
"""

import math
import time
from datetime import datetime


def get_epoch_minute():
    """Return the unix time in UTC rounded down to the nearest minute."""
    unixtime = time.mktime(datetime.utcnow().timetuple())
    return int(math.floor(unixtime / 60) * 60)
