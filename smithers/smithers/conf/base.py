from os import getenv


LOG_LEVEL = getenv('SMITHERS_LOG_LEVEL', 'INFO')

COUNTRY_MIN_SHARE = 20

REDIS_UNIX_SOCKET_PATH = '/var/run/redis/redis.sock'
