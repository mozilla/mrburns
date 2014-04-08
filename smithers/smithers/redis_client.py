import redis

from smithers import conf


client = redis.StrictRedis(unix_socket_path=conf.REDIS_UNIX_SOCKET_PATH)
