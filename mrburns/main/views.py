# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from django.http import HttpResponse
from django.views.generic import TemplateView, View


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
