from os import getenv

GEOIP_DB_FILE = '/usr/local/share/GeoIP/GeoIP2-City.mmdb'

STATSD_HOST = 'graphite1.private.phx1.mozilla.com'
STATSD_PORT = 8125
STATSD_PREFIX = 'glow-workers-{}'.format(getenv('DJANGO_SERVER_ENV'))
