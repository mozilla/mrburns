from statsd import StatsClient

from smithers import conf


if hasattr(conf, 'STATSD_HOST'):
    statsd = StatsClient(host=conf.STATSD_HOST,
                         port=conf.STATSD_PORT,
                         prefix=conf.STATSD_PREFIX)
else:
    # default values don't error
    statsd = StatsClient()
