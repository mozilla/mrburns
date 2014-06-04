import redis

from smithers import conf


if conf.REDIS_UNIX_SOCKET_PATH:
    client = redis.StrictRedis(unix_socket_path=conf.REDIS_UNIX_SOCKET_PATH)
else:
    client = redis.StrictRedis(host=conf.REDIS_HOST, port=conf.REDIS_PORT)
