from django.conf import settings


def glow_variables(request):
    return {
        'MAP_DATA_URL': settings.MAP_DATA_URL,
        'OG_ABS_URL': 'https://{}{}'.format(request.get_host(),
                                            request.path)
    }
