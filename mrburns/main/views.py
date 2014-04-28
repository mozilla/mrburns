# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
from __future__ import unicode_literals

from operator import itemgetter
from urllib import urlencode

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.utils.translation import ugettext as _
from django.views.generic import TemplateView, View

from product_details import product_details
from pyuca import Collator
from redis_cache import get_redis_connection

from smithers import data_types
from smithers import redis_keys as rkeys
from smithers.utils import get_epoch_minute


if settings.ENABLE_REDIS:
    redis = get_redis_connection('smithers')
else:
    redis = False

TWITTER_URL = 'https://twitter.com/share'
FB_URL = 'https://www.facebook.com/sharer/sharer.php'
COUNT_FOOTNOTE = ('<a href="#number-modal" class="number-help" '
                  'data-toggle="modal" title="{}">'
                  '<span class="share_total"></span>'
                  '<i class="fa fa-question-circle"></i></a>')
uca_collator = Collator()


def uca_sort_key(country):
    """Sort key function using pyuca on the 2nd element of the argument."""
    return uca_collator.sort_key(country[1])


def get_tw_share_url(**kwargs):
    kwargs.setdefault('dnt', 'true')
    text = kwargs.get('text')
    if text:
        kwargs['text'] = text.encode('utf8')
    return '?'.join([TWITTER_URL, urlencode(kwargs)])


def get_fb_share_url(url):
    return '?'.join([FB_URL, urlencode({'u': url})])


def fix_locale(locale):
    """Return locale suitable for product details."""
    if locale == 'es':
        return 'es-ES'

    locale_parts = locale.split('-')
    if len(locale_parts) == 2:
        return '-'.join([locale_parts[0], locale_parts[1].upper()])

    return locale


def get_sorted_countries_list(locale):
    """Return a localized list of all countries sorted by name."""
    locale = fix_locale(locale)
    countries = product_details.get_regions(locale)
    countries.update(settings.EXTRA_COUNTRIES)
    for c_new, c_old in settings.COUNTRY_CODE_MAP.items():
        c_old = c_old.lower()
        if c_old in countries:
            countries[c_new] = countries[c_old]
    countries_list = ((code.upper(), name) for code, name in countries.iteritems())
    key_function = itemgetter(1) if locale.startswith('en') else uca_sort_key
    return sorted(countries_list, key=key_function)


class GlowView(TemplateView):
    template_name = 'base.html'

    def get_context_data(self, **kwargs):
        if redis:
            timestamp = int(redis.get(rkeys.LATEST_TIMESTAMP) or 0)
        else:
            timestamp = get_epoch_minute() - 600  # 10 min ago
        context = super(GlowView, self).get_context_data(**kwargs)
        context.update({
            'data_timestamp': timestamp,
            'share_map_twitter': get_tw_share_url(
                url='http://mzl.la/1g5k6OK',
                text=_('Join millions of Firefox users around the world '
                       'who are shaping the future of the Web:'),
                hashtags='firefox',
            ),
            'share_stats_twitter': get_tw_share_url(
                url='http://mzl.la/1n0x8lA',
                text=_('Join millions of Firefox users around the world '
                       'who are shaping the future of the Web:'),
                hashtags='firefox',
            ),
            'share_video_twitter': get_tw_share_url(
                url='http://mzl.la/1rtoRsE',
                text=_('Watch the next generation of Internet users talk '
                       'about the Web they want!'),
                hashtags='firefox',
            ),
            'share_stats_twitter_privacy': get_tw_share_url(
                url='http://mzl.la/1i6jEol',
                text='#Firefox {}'
                     .format(_('fights for government surveillance reform '
                               'and was the only major browser not targeted by the NSA scandal.')),
            ),
            'share_stats_twitter_opportunity': get_tw_share_url(
                url='http://mzl.la/1nEMbBx',
                text='#Firefox {}'
                     .format(_('is made by a global volunteer community 6,000 strong, '
                               'open to participation from anyone.')),
            ),
            'share_stats_twitter_access': get_tw_share_url(
                url='http://mzl.la/1k45Dae',
                text='#Firefox {}'
                     .format(_('disrupted the mobile industry with the first Web-based OS to '
                               'help bring the next billion people online')),
            ),
            'share_stats_twitter_freedom': get_tw_share_url(
                url='http://mzl.la/1rfuE59',
                text='#Firefox {}'
                     .format(_('protested against SOPA and PIPA, dangerous copyright legislation '
                               'that threatened the freedom of the Web.')),
            ),
            'share_stats_twitter_learning': get_tw_share_url(
                url='http://mzl.la/1ty5Ffu',
                text='#Firefox {}'
                     .format(_('teaches digital skills to millions of people to help them move '
                               'from using the Web to actively making it.')),
            ),
            'share_stats_twitter_control': get_tw_share_url(
                url='http://mzl.la/Qvn21j',
                text='#Firefox {}'
                     .format(_('leads the way in giving users greater control online. '
                               'They pioneered features like Do Not Track and Lightbeam.')),
            ),
            'share_map_facebook': get_fb_share_url('http://mzl.la/1oKbBCb'),
            'share_video_facebook': get_fb_share_url('http://mzl.la/1lNAxrc'),
            'share_stats_facebook': get_fb_share_url('http://mzl.la/1sxET6z'),
            'share_stats_facebook_privacy': get_fb_share_url('http://mzl.la/1kXIpU8'),
            'share_stats_facebook_opportunity': get_fb_share_url('http://mzl.la/1jEWeE7'),
            'share_stats_facebook_access': get_fb_share_url('http://mzl.la/1ty5r7W'),
            'share_stats_facebook_freedom': get_fb_share_url('http://mzl.la/1icscuJ'),
            'share_stats_facebook_learning': get_fb_share_url('http://mzl.la/1rkanJU'),
            'share_stats_facebook_control': get_fb_share_url('http://mzl.la/1k45KCq'),
            'count_footnote': COUNT_FOOTNOTE.format(_('What does this number mean?')),
            'countries_list': self.get_countries_list(),
            'is_long_headline': self.is_long_headline(),
        })
        return context

    def get_countries_list(self):
        lang = getattr(self.request, 'LANGUAGE_CODE', 'en-US')
        return get_sorted_countries_list(lang)

    def is_long_headline(self):
        trans_str = _('\n        Join %(count)s people shaping the future of the Web')
        trans_str = trans_str.strip() % {'count': 1}
        return len(trans_str) >= 55


class ShareView(View):
    def post(self, request):
        issue = request.POST.get('issue')
        if issue not in data_types.name_to_id:
            return HttpResponseBadRequest('invalid issue id',
                                          content_type='text/plain')

        client_ip = request.META.get('HTTP_X_CLUSTER_CLIENT_IP',
                                     request.META.get('REMOTE_ADDR'))
        if redis and client_ip:
            redis.lpush(rkeys.IPLOGS, '{},{}'.format(data_types.name_to_id[issue],
                                                     client_ip))

        return HttpResponse(status=204)  # 204 no content


class StringsView(TemplateView):
    content_type = 'text/plain'
    template_name = 'strings.html'
