#!/usr/bin/env python

"""
Grab IP addresses from Redis and lookup Geo info.
"""
from __future__ import division

import argparse
import logging
import math
import sys

import maxminddb
from redis import RedisError

from smithers import conf
from smithers import data_types
from smithers import redis_keys as rkeys
from smithers.redis_client import client as redis
from smithers.statsd_client import statsd
from smithers.utils import get_epoch_minute, register_signals


log = logging.getLogger('lisa')

# has the system requested shutdown
KILLED = False

parser = argparse.ArgumentParser(description='Lisa does smart things with IPs.')
parser.add_argument('--file', default=str(conf.GEOIP_DB_FILE),
                    help='path to mmdb file (default: %s)' % conf.GEOIP_DB_FILE)
parser.add_argument('--log', default=conf.LOG_LEVEL, metavar='LOG_LEVEL',
                    help='Log level (default: %s)' % conf.LOG_LEVEL)
parser.add_argument('-v', '--verbose', action='store_true')
args = parser.parse_args()

logging.basicConfig(level=getattr(logging, args.log.upper()),
                    format='%(asctime)s: %(message)s')


def handle_signals(signum, frame):
    # NOTE: Makes this thing non-thread-safe
    # Should not be too difficult to fix if we
    # need/want threads.
    global KILLED
    KILLED = True
    log.info('Attempting to shut down')


def rate_limit_ip(ip, timestamp):
    """Return boolean whether the IP is rate limited"""
    key = 'ratelimit:{}:{}'.format(ip, timestamp)
    current = int(redis.get(key) or 0)
    if current >= conf.IP_RATE_LIMIT_MAX:
        log.warning('Rate limited {}'.format(ip))
        statsd.incr('lisa.ratelimit')
        return True

    pipe = redis.pipeline()
    pipe.incr(key).expire(key, 60)
    pipe.execute()

    return False


def round_map_coord(coord):
    return math.floor(coord * 100) / 100


def process_map(geo_data, timestamp):
    """Add download aggregate data to redis."""
    redis.incr(rkeys.MAP_TOTAL)
    try:
        # rounding to aid in geo aggregation
        location = {
            'lat': round_map_coord(geo_data['location']['latitude']),
            'lon': round_map_coord(geo_data['location']['longitude']),
        }
    except (KeyError, TypeError):
        # this appears to mostly happen with anonymous proxies
        log.info('Geo data contained no location.')
        log.debug(geo_data)
        return

    geo_key = '{lat}:{lon}'.format(**location)
    log.debug('Got location: ' + geo_key)
    time_key = rkeys.MAP_GEO.format(timestamp)
    log.debug('Got timestamp: %s' % timestamp)
    redis.hincrby(time_key, geo_key, 1)

    # store the timestamp used in a sorted set for use in milhouse
    redis.zadd(rkeys.MAP_TIMESTAMPS, timestamp, timestamp)


def process_share(geo_data, share_type):
    """Add share aggregate data to redis."""
    log.debug('Processing as SHARE')
    redis.incr(rkeys.SHARE_TOTAL)
    redis.hincrby(rkeys.SHARE_ISSUES, share_type)
    country = geo_data.get('country', geo_data.get('registered_country'))
    if country:
        country = country['iso_code']
        redis.hincrby(rkeys.SHARE_COUNTRIES, country)
        redis.hincrby(rkeys.SHARE_COUNTRY_ISSUES.format(country), share_type)

    continent = geo_data.get('continent')
    if continent:
        continent = continent['code']
        redis.hincrby(rkeys.SHARE_CONTINENTS, continent)
        redis.hincrby(rkeys.SHARE_CONTINENT_ISSUES.format(continent), share_type)


def main():
    counter = 0

    while True:
        if KILLED:
            log.info('Shutdown successful')
            return 0

        try:
            ip_info = redis.brpop(rkeys.IPLOGS)
        except RedisError as e:
            log.error('Error with Redis: {}'.format(e))
            return 1

        log.debug('Got log data: ' + ip_info[1])
        try:
            rtype, ip = ip_info[1].split(',')
        except ValueError:
            continue

        timestamp = get_epoch_minute()

        if rate_limit_ip(ip, timestamp):
            continue

        record = geo.get(ip)
        if record:
            # everything goes for total count and map
            process_map(record, timestamp)
            # only shares get more processing
            if rtype != data_types.DOWNLOAD:
                process_share(record, rtype)

        if args.verbose:
            sys.stdout.write('.')
            sys.stdout.flush()

        counter += 1
        if counter >= 1000:
            counter = 0
            statsd.gauge('queue.geoip', redis.llen(rkeys.IPLOGS))


if __name__ == '__main__':
    register_signals(handle_signals)
    try:
        geo = maxminddb.Reader(args.file)
    except IOError:
        log.error('ERROR: Can\'t find MaxMind Database file (%s). '
                  'Try setting the --file flag.' % args.file)
        sys.exit(1)
    sys.exit(main())
