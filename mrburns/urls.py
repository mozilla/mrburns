# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from django.conf.urls import patterns, url

from mrburns.main.views import GlowView


urlpatterns = patterns('',
    url('^$', GlowView.as_view(), name='glow.home')
)
