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
    kwargs.setdefault('hashtags', '#firefox')
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
            'share_map_facebook': get_fb_share_url('http://mzl.la/1oKbBCb'),
            'share_stats_facebook': get_fb_share_url('http://mzl.la/1sxET6z'),
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
