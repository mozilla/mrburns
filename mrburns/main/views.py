# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import json

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.views.generic import TemplateView, View

from redis_cache import get_redis_connection


redis = get_redis_connection('smithers')


class GlowView(TemplateView):
    template_name = 'base.html'


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

