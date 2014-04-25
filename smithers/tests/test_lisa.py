import time
from unittest import TestCase

from mock import patch
from nose.tools import eq_, ok_

import lisa


class TestLisaHelpers(TestCase):
    def test_round_coord(self):
        """Should return a float rounded down to 1 decimal"""
        eq_(lisa.round_map_coord(12.345), 12.3)
        eq_(lisa.round_map_coord(12.888), 12.8)
        eq_(lisa.round_map_coord(-12.888), -12.9)

    @patch.object(lisa.conf, 'IP_RATE_LIMIT_MAX', 2)
    @patch.object(lisa.rate_limiter, 'default_timeout', 1)
    def test_rate_limiter(self):
        """Rate limitor should allow only 2 in quick succession"""
        lisa.rate_limiter.clear()
        ip = '127.0.0.1'
        ok_(not lisa.rate_limit_ip(ip))
        ok_(not lisa.rate_limit_ip(ip))
        ok_(lisa.rate_limit_ip(ip))

    @patch.object(lisa.conf, 'IP_RATE_LIMIT_MAX', 2)
    @patch.object(lisa.rate_limiter, 'default_timeout', 1)
    def test_rate_limiter_timeout(self):
        """Rate limitor should allow IP again after timeout"""
        lisa.rate_limiter.clear()
        ip = '127.0.0.1'
        ok_(not lisa.rate_limit_ip(ip))
        ok_(not lisa.rate_limit_ip(ip))
        time.sleep(1)
        ok_(not lisa.rate_limit_ip(ip))
