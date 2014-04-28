import re
from unittest import TestCase

import bart


class TestFirefoxRegex(TestCase):
    fx_pre_re = re.compile(bart.PRE_LAUNCH_RE)
    fx_re = re.compile(bart.LAUNCH_RE.format('29.0'))

    def test_beta_builds(self):
        """Should not match beta builds."""
        product = 'product=firefox-29.0b1'
        self.assertFalse(self.fx_pre_re.search(product))
        self.assertFalse(self.fx_re.search(product))

    def test_partial_builds(self):
        """Should match partial builds."""
        product = 'product=firefox-29.0-partial-28.0.1'
        self.assertTrue(self.fx_pre_re.search(product))
        self.assertTrue(self.fx_re.search(product))

    def test_complete_builds(self):
        """Should match complete auto and normal downloads."""
        product = 'product=firefox-29.0-complete'
        self.assertTrue(self.fx_pre_re.search(product))
        self.assertTrue(self.fx_re.search(product))
        product = 'product=firefox-29.0&lang'
        self.assertTrue(self.fx_pre_re.search(product))
        self.assertTrue(self.fx_re.search(product))
        # at the end of the string
        product = 'product=firefox-29.0'
        self.assertTrue(self.fx_pre_re.search(product))
        self.assertTrue(self.fx_re.search(product))

    def test_latest(self):
        """Prod mode should match "latest", but pre mode should not."""
        product = 'product=firefox-latest'
        self.assertFalse(self.fx_pre_re.search(product))
        self.assertTrue(self.fx_re.search(product))

    def test_stub(self):
        """Neither of them should match stub installer"""
        product = 'product=firefox-stub'
        self.assertFalse(self.fx_pre_re.search(product))
        self.assertFalse(self.fx_re.search(product))
