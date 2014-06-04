from os import getenv

from pathlib import Path


SMITHERS_BASE_DIR = Path(__file__).resolve().parents[2]
PROJ_BASE_DIR = SMITHERS_BASE_DIR.parent

JSON_OUTPUT_DIR = PROJ_BASE_DIR.joinpath('static', 'data', 'stats')
GEOIP_DB_FILE = SMITHERS_BASE_DIR.joinpath('GeoIP2-City.mmdb')
LOG_LEVEL = getenv('MRBURNS_LOG_LEVEL', 'INFO')
LAUNCH_STATE = getenv('MRBURNS_LAUNCH_STATE', 'dev')  # dev, pre, final

PROD_DETAILS_DIR = PROJ_BASE_DIR / 'prod_details_json'

COUNTRY_MIN_SHARE = 500

# rate limit geo IPs. don't allow more than
# MAX of the same IP per minute
IP_RATE_LIMIT_MAX = 50

REDIS_UNIX_SOCKET_PATH = getenv('REDIS_UNIX_SOCKET_PATH', None)
REDIS_HOST = getenv('REDIS_HOST', 'localhost')
REDIS_PORT = getenv('REDIS_PORT', 6379)

# bart
MAIN_LOG_FILE = Path('/var/log/glow.log')
LOG_FILE_NAME = 'glow.{}.log'
TMP_DIR = Path('/tmp')
ARCHIVE_DIR = Path('/mnt/glow')
ARCHIVE_LOG_PATH = ARCHIVE_DIR / 'log'
ARCHIVE_LOG_LATEST_FILE = ARCHIVE_LOG_PATH / 'latest_log_file.txt'
ARCHIVE_JSON_PATH = ARCHIVE_DIR / 'json'
SYSLOG_PID_FILE = '/var/run/syslogd.pid'
FIREFOX_VERSION = '29.0'
LOG_HTTP_STATUS = '302'  # only redirects count for d.m.o logs
