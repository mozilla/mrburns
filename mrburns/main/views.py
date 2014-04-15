# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from urllib import urlencode

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.utils.translation import ugettext as _
from django.views.generic import TemplateView, View

from redis_cache import get_redis_connection
from smithers import data_types
from smithers import redis_keys as rkeys


if settings.ENABLE_REDIS:
    redis = get_redis_connection('smithers')
else:
    redis = False

TWITTER_URL = 'https://twitter.com/share'
FB_URL = 'https://www.facebook.com/sharer/sharer.php'
COUNT_FOOTNOTE = (u'<a href="#number-modal" class="number-help" '
                  u'data-toggle="modal" title="{}">'
                  u'<span class="share_total"></span>'
                  u'<i class="fa fa-question-circle"></i></a>')


def get_tw_share_url(**kwargs):
    kwargs.setdefault('hashtags', 'firefox')
    kwargs.setdefault('dnt', 'true')
    text = kwargs.get('text')
    if text:
        kwargs['text'] = text.encode('utf8')
    return '?'.join([TWITTER_URL, urlencode(kwargs)])


def get_fb_share_url(url):
    return '?'.join([FB_URL, urlencode({'u': url})])


class GlowView(TemplateView):
    template_name = 'base.html'

    def get_context_data(self, **kwargs):
        if redis:
            timestamp = int(redis.get(rkeys.LATEST_TIMESTAMP) or 0)
        else:
            timestamp = 0
        context = super(GlowView, self).get_context_data(**kwargs)
        context.update({
            'data_timestamp': timestamp,
            'share_map_twitter': get_tw_share_url(
                url='http://mzl.la/1g5k6OK',
                text=_('Join millions of Firefox users around the world '
                       'who are shaping the future of the Web.'),
            ),
            'share_stats_twitter': get_tw_share_url(
                url='http://mzl.la/1n0x8lA',
                text=_('Join millions of Firefox users around the world '
                       'who are shaping the future of the Web.'),
            ),
            'share_twitter_access': get_tw_share_url(
                url='http://mzl.la/1irtltn',
                text=_('The Web I want is accessible to anyone and everyone. '
                       'What kind of Web do you want?'),
            ),
            'share_twitter_control': get_tw_share_url(
                url='http://mzl.la/Ozq8jb',
                text=_("I don't believe that other companies should control my "
                       "online experience. Join me in fighting for user control."),
            ),
            'share_twitter_freedom': get_tw_share_url(
                url='http://mzl.la/1gJ5La4',
                text=_('Join me in supporting a Web that promotes freedom and democracy!'),
            ),
            'share_twitter_learning': get_tw_share_url(
                url='http://mzl.la/1kHRIWk',
                text=_('I want a Web that people today and future generations can learn from. '
                       'What about you?'),
            ),
            'share_twitter_opportunity': get_tw_share_url(
                url='http://mzl.la/1kHRC0K',
                text=_("Shouldn't the Web provide people with more opportunity? "
                       "Join us if you think so too."),
            ),
            'share_twitter_privacy': get_tw_share_url(
                url='http://mzl.la/1hpPf50',
                text=_('Join me in fighting for privacy on the Web.'),
            ),
            'share_map_facebook': get_fb_share_url('http://mzl.la/1oKbBCb'),
            'share_stats_facebook': get_fb_share_url('http://mzl.la/1sxET6z'),
            'share_facebook_privacy': get_fb_share_url('http://mzl.la/1lOxH4s'),
            'share_facebook_opportunity': get_fb_share_url('http://mzl.la/1sxE79C'),
            'share_facebook_access': get_fb_share_url('http://mzl.la/1lOxLRw'),
            'share_facebook_freedom': get_fb_share_url('http://mzl.la/1iugfNc'),
            'share_facebook_learning': get_fb_share_url('http://mzl.la/1egbqu6'),
            'share_facebook_control': get_fb_share_url('http://mzl.la/1kHRq1y'),
            'count_footnote': COUNT_FOOTNOTE.format(_('What does this number mean?')),
        })
        return context


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
