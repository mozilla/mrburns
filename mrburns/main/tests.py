from django.test import TestCase

from mock import patch
from nose.tools import ok_

from mrburns.main import views


class TestViewHelpers(TestCase):
    def test_twitter_share_url_fn(self):
        """Should return a proper and endoded twitter share url."""
        url = views.get_tw_share_url(url='http://example.com', text='The Dude abides.',
                                     hashtags='firefox')
        ok_(url.startswith(views.TWITTER_URL + '?'))
        ok_('dnt=true' in url)
        ok_('hashtags=firefox' in url)
        ok_('url=http%3A%2F%2Fexample.com' in url)
        ok_('text=The+Dude+abides.' in url)

    def test_facebook_share_url_fn(self):
        """Should return a proper and encoded facebook share url."""
        url = views.get_fb_share_url('http://example.com')
        ok_(url.startswith(views.FB_URL + '?'))
        ok_('u=http%3A%2F%2Fexample.com' in url)

    def test_sorted_countries_list_en(self):
        """Should return a properly sorted list of countries by name."""
        with patch.object(views, 'product_details') as mock_get:
            mock_get.get_regions.return_value = {
                'us': 'United States',
                'ca': 'Canada',
                'mx': 'Mexico',
            }
            c_list = views.get_sorted_countries_list('en-us')
            self.assertListEqual(c_list, [('CA', 'Canada'),
                                          ('MX', 'Mexico'),
                                          ('US', 'United States')])

    def test_sorted_countries_list_unicode(self):
        """Should return a properly sorted list of countries by name."""
        with patch.object(views, 'product_details') as mock_get:
            mock_get.get_regions.return_value = {
                'us': u'\xc9tats-Unis',
                'ca': u'Canada',
                'mx': u'Mexique',
            }
            c_list = views.get_sorted_countries_list('fr')
            self.assertListEqual(c_list, [(u'CA', u'Canada'),
                                          (u'US', u'\xc9tats-Unis'),
                                          (u'MX', u'Mexique')])
