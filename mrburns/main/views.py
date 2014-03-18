from django.views.generic import TemplateView


class GlowView(TemplateView):
    template_name = 'base.html'
