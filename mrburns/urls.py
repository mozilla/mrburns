from django.conf.urls import patterns, include, url

from mrburns.main.views import GlowView


urlpatterns = patterns('',
    url('^$', GlowView.as_view(), name='glow.home')
)
