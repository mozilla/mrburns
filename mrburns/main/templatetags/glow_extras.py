from django import template
from django.template.defaultfilters import title, stringfilter
from django.utils import translation


register = template.Library()


@register.filter(is_safe=True)
@stringfilter
def title_lang(value, locale='en'):
    """Convert to title case only for given locale."""
    lang = translation.get_language()
    if lang.startswith(locale):
        return title(value)

    return value
