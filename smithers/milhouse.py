#!/usr/bin/env python

from __future__ import division

import argparse
import json
import logging
import signal
import sys
import time
from os import path

from statsd import StatsClient

from smithers import conf
from smithers import data_types
from smithers.redis_client import client as redis
from smithers import redis_keys as rkeys


log = logging.getLogger('milhouse')

parser = argparse.ArgumentParser(description='Milhouse makes things Lisa tells him to.')
parser.add_argument('--log', default=conf.LOG_LEVEL, metavar='LOG_LEVEL',
                    help='Log level (default: %s)' % conf.LOG_LEVEL)
parser.add_argument('-v', '--verbose', action='store_true')
args = parser.parse_args()

logging.basicConfig(level=getattr(logging, args.log.upper()),
                    format='%(asctime)s: %(message)s')

statsd = StatsClient(host=conf.STATSD_HOST,
                     port=conf.STATSD_PORT,
                     prefix=conf.STATSD_PREFIX)

# has the system requested shutdown
KILLED = False


def handle_signals(signum, frame):
    # NOTE: Makes this thing non-thread-safe
    # Should not be too difficult to fix if we
    # need/want threads.
    global KILLED
    KILLED = True
    log.info('Attempting to shut down')


# register signals
signal.signal(signal.SIGHUP, handle_signals)
signal.signal(signal.SIGINT, handle_signals)
signal.signal(signal.SIGTERM, handle_signals)


def get_timestamps_to_process():
    """Return the timestamp(s) ready to output to JSON.

    Basic idea is:

    1. Get all but the most recent timestamp from the
       redis sorted set. This should allow for them to be
       sure to be done filling.
    2. Process the list.
    """
    return redis.zrange(rkeys.MAP_TIMESTAMPS, 0, -2)


def get_issue_dict():
    return dict((issue, []) for issue in data_types.types_map.values())


def get_percent(part, total):
    """Return a percentage rounded to hundredths."""
    return round(part / total, 4)


def get_data_for_timestamp(timestamp):
    """
    Return aggregate map and share data dict for a timestamp.
    """
    issue_continents = get_issue_dict()
    issue_countries = get_issue_dict()
    data = {
        'map_total': int(redis.get(rkeys.MAP_TOTAL) or 0),
        'map_geo': [],
        'share_total': int(redis.get(rkeys.SHARE_TOTAL) or 0),
        'continent_issues': {},
        'issue_continents': issue_continents,
        'country_issues': {},
        'issue_countries': issue_countries,
    }
    map_geo_key = rkeys.MAP_GEO.format(timestamp)
    geo_data = redis.hgetall(map_geo_key)
    for latlon, count in geo_data.iteritems():
        lat, lon = latlon.split(':')
        data['map_geo'].append({
            'lat': float(lat),
            'lon': float(lon),
            'count': int(count),
        })

    ## CONTINENTS ##
    continent_totals = redis.hgetall(rkeys.SHARE_CONTINENTS)
    continent_issues = data['continent_issues']
    for continent, count in continent_totals.iteritems():
        count = int(count)
        issues = redis.hgetall(rkeys.SHARE_CONTINENT_ISSUES.format(continent))
        continent_issues[continent] = {}
        for issue, issue_count in issues.iteritems():
            issue_count = int(issue_count)
            issue = data_types.types_map[issue]
            percent = get_percent(issue_count, count)
            continent_issues[continent][issue] = percent
            issue_continents[issue].append({
                'continent': continent,
                'count': percent,
            })

    ## COUNTRIES ##
    country_totals = redis.hgetall(rkeys.SHARE_COUNTRIES)
    country_issues = data['country_issues']
    for country, count in country_totals.iteritems():
        count = int(count)
        if count < conf.COUNTRY_MIN_SHARE:
            continue
        issues = redis.hgetall(rkeys.SHARE_COUNTRY_ISSUES.format(country))
        country_issues[country] = {}
        for issue, issue_count in issues.iteritems():
            issue_count = int(issue_count)
            issue = data_types.types_map[issue]
            percent = get_percent(issue_count, count)
            country_issues[country][issue] = percent
            issue_countries[issue].append({
                'country': country,
                'count': percent,
            })

    ## GLOBAL ##
    share_issues = redis.hgetall(rkeys.SHARE_ISSUES)
    share_total = data['share_total']
    global_issues = country_issues['GLOBAL'] = {}
    for issue, count in share_issues.iteritems():
        count = int(count)
        issue = data_types.types_map[issue]
        global_issues[issue] = get_percent(count, share_total)

    return data


def write_json_for_timestamp(timestamp):
    """
    Write a json file for the given timestamp and data.
    """
    data = get_data_for_timestamp(timestamp)
    filename = path.join(conf.JSON_OUTPUT_DIR, 'stats_{}.json'.format(timestamp))
    with open(filename, 'w') as fh:
        json.dump(data, fh)

    # update the last processed timestamp for use in mrburns.
    redis.set(rkeys.LATEST_TIMESTAMP, timestamp)
    log.debug('Wrote file for {}'.format(timestamp))
    log.debug(filename)


def main():
    counter = 0

    while True:
        if KILLED:
            log.info('Shutdown successful')
            return 0

        for timestamp in get_timestamps_to_process():
            write_json_for_timestamp(timestamp)
            redis.zrem(rkeys.MAP_TIMESTAMPS, timestamp)
            map_geo_key = rkeys.MAP_GEO.format(timestamp)
            redis.delete(map_geo_key)

        # don't run constantly since we'll only have something
        # to do every ~1 minute
        counter += 1
        time.sleep(10)


if __name__ == '__main__':
    sys.exit(main())
