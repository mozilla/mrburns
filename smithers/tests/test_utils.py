from mock import patch
from nose.tools import eq_

from smithers import utils


@patch('smithers.utils._get_fx_version_from_json')
def test_get_firefox_version_with_patch(fx_version_mock):
    """Function should strip all but Major and Minor version."""
    fx_version_mock.return_value = '29.0.1'
    eq_(utils.get_firefox_version(), '29.0')
    fx_version_mock.reset_mock()
    fx_version_mock.return_value = '30.1.1.1'
    eq_(utils.get_firefox_version(), '30.1')


@patch('smithers.utils._get_fx_version_from_json')
def test_get_firefox_version_no_patch(fx_version_mock):
    """Function should work properly with no patch version."""
    fx_version_mock.return_value = '29.0'
    eq_(utils.get_firefox_version(), '29.0')


@patch.object(utils.conf, 'FIREFOX_VERSION', '30.0.1')
@patch('smithers.utils._get_fx_version_from_json')
def test_get_firefox_version_default(fx_version_mock):
    """Function should fall back to configured default."""
    fx_version_mock.return_value = None
    eq_(utils.get_firefox_version(), '30.0')
