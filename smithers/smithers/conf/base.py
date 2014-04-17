import os.path
from os import getenv


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

JSON_OUTPUT_DIR = os.path.join(BASE_DIR, 'JSON')
GEOIP_DB_FILE = os.path.join(BASE_DIR, 'GeoIP2-City.mmdb')
LOG_LEVEL = getenv('SMITHERS_LOG_LEVEL', 'INFO')

COUNTRY_MIN_SHARE = 500

# rate limit geo IPs. don't allow more than
# MAX of the same IP per minute
IP_RATE_LIMIT_MAX = 20

REDIS_UNIX_SOCKET_PATH = '/var/run/redis/redis.sock'
