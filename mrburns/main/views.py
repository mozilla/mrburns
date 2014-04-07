# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import json
from urllib import urlencode

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.utils.translation import ugettext as _
from django.views.generic import TemplateView, View

from redis_cache import get_redis_connection


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
            'share_map_facebook': get_fb_share_url({
                'u': 'https://webwewant.mozilla.org/#web'
            }),
        })
        return context


class ShareView(View):
    def post(self, request, *args, **kwargs):
        data = request.POST.dict()
        # place holder. clearly.
        print data
        return HttpResponse()  # 200 ok


class StringsView(TemplateView):
    content_type = 'text/plain'
    template_name = 'strings.html'


class CurrentDataView(View):
    def get(self, request):
        timestamp = int(redis.get(settings.LATEST_TIMESTAMP_KEY) or 0)
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

