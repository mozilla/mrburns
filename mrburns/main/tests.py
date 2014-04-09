from django.test import TestCase

from nose.tools import ok_

from mrburns.main import views


class TestViewHelpers(TestCase):
    def test_twitter_share_url_fn(self):
        """Should return a proper and endoded twitter share url."""
        url = views.get_tw_share_url(url='http://example.com', text='The Dude abides.')
        ok_(url.startswith(views.TWITTER_URL + '?'))
        ok_('dnt=true' in url)
        ok_('hashtags=%23firefox' in url)
        ok_('url=http%3A%2F%2Fexample.com' in url)
        ok_('text=The+Dude+abides.' in url)

    def test_facebook_share_url_fn(self):
        """Should return a proper and encoded facebook share url."""
        url = views.get_fb_share_url('http://example.com')
        ok_(url.startswith(views.FB_URL + '?'))
        ok_('u=http%3A%2F%2Fexample.com' in url)
