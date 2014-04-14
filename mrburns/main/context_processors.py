from django.conf import settings


def glow_variables(request):
    return {
        'MAP_DATA_URL': settings.MAP_DATA_URL,
        'LATEST_TIMESTAMP_URL': settings.LATEST_TIMESTAMP_URL,
    }
