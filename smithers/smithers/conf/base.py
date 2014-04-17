from os import getenv

from pathlib import Path


SMITHERS_BASE_DIR = Path(__file__).resolve().parents[2]
PROJ_BASE_DIR = SMITHERS_BASE_DIR.parent

JSON_OUTPUT_DIR = PROJ_BASE_DIR.joinpath('static', 'data', 'stats')
GEOIP_DB_FILE = SMITHERS_BASE_DIR.joinpath('GeoIP2-City.mmdb')
LOG_LEVEL = getenv('SMITHERS_LOG_LEVEL', 'INFO')

COUNTRY_MIN_SHARE = 500

REDIS_UNIX_SOCKET_PATH = '/var/run/redis/redis.sock'
