# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import json
from urllib import urlencode

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.utils.translation import ugettext as _
from django.views.generic import TemplateView, View

from redis_cache import get_redis_connection
from smithers import data_types
from smithers import redis_keys as rkeys


redis = get_redis_connection('smithers')

TWITTER_URL = 'https://twitter.com/share'
FB_URL = 'https://www.facebook.com/sharer/sharer.php'


def get_tw_share_url(params):
    return '?'.join([TWITTER_URL, urlencode(params)])


def get_fb_share_url(params):
    return '?'.join([FB_URL, urlencode(params)])


class GlowView(TemplateView):
    template_name = 'base.html'

    def get_context_data(self, **kwargs):
        context = super(GlowView, self).get_context_data(**kwargs)
        context.update({
            'share_map_twitter': get_tw_share_url({
                'url': 'https://webwewant.mozilla.org/#web',
                'hashtags': '#firefox',
                'dnt': True,
                'text': _('Join millions of Firefox users around the world '
                          'who are shaping the future of the Web.'),
            }),
            'share_map_twitter_access': get_tw_share_url({
                'url': 'https://webwewant.mozilla.org/#web',
                'hashtags': '#firefox',
                'dnt': True,
                'text': _('ACCESS'),
            }),
            'share_map_twitter_control': get_tw_share_url({
                'url': 'https://webwewant.mozilla.org/#web',
                'hashtags': '#firefox',
                'dnt': True,
                'text': _('CONTROL'),
            }),
            'share_map_twitter_freedom': get_tw_share_url({
                'url': 'https://webwewant.mozilla.org/#web',
                'hashtags': '#firefox',
                'dnt': True,
                'text': _('FREEDOM'),
            }),
            'share_map_twitter_learning': get_tw_share_url({
                'url': 'https://webwewant.mozilla.org/#web',
                'hashtags': '#firefox',
                'dnt': True,
                'text': _('LEARNING'),
            }),
            'share_map_twitter_opportunity': get_tw_share_url({
                'url': 'https://webwewant.mozilla.org/#web',
                'hashtags': '#firefox',
                'dnt': True,
                'text': _('OPPORTUNITY'),
            }),
            'share_map_twitter_privacy': get_tw_share_url({
                'url': 'https://webwewant.mozilla.org/#web',
                'hashtags': '#firefox',
                'dnt': True,
                'text': _('PRIVACY'),
            }),
            'share_map_facebook': get_fb_share_url({
                'u': 'https://webwewant.mozilla.org/#web'
            }),
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
        if client_ip:
            redis.lpush(rkeys.IPLOGS, '{},{}'.format(data_types.name_to_id[issue],
                                                     client_ip))

        return HttpResponse(status=204)  # 204 no content


class StringsView(TemplateView):
    content_type = 'text/plain'
    template_name = 'strings.html'


class CurrentDataView(View):
    def get(self, request):
        timestamp = int(redis.get(rkeys.LATEST_TIMESTAMP) or 0)
        if timestamp:
            response_data = {
                'status': 'OK',
                'timestamp': timestamp,
                'filename': '/static/data/stats_{}.json'.format(timestamp),
            }
            return HttpResponse(json.dumps(response_data),
                                content_type='application/json')

        response_data = {
            'status': 'NOT FOUND',
        }
        return HttpResponseNotFound(json.dumps(response_data),
                                    content_type='application/json')

