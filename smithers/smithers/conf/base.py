from os import getenv

from unipath import Path


SMITHERS_BASE_DIR = Path(__file__).ancestor(3).absolute()
PROJ_BASE_DIR = SMITHERS_BASE_DIR.parent

JSON_OUTPUT_DIR = PROJ_BASE_DIR.child('static', 'data', 'stats')
GEOIP_DB_FILE = SMITHERS_BASE_DIR.child('GeoIP2-City.mmdb')
LOG_LEVEL = getenv('SMITHERS_LOG_LEVEL', 'INFO')

COUNTRY_MIN_SHARE = 500

REDIS_UNIX_SOCKET_PATH = '/var/run/redis/redis.sock'
