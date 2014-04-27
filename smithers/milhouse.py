#!/usr/bin/env python

from __future__ import division

import argparse
import json
import logging
import sys
import time

from smithers import conf
from smithers import data_types
from smithers import redis_keys as rkeys
from smithers.redis_client import client as redis
from smithers.statsd_client import statsd
from smithers.utils import register_signals, set_process_name


set_process_name(__file__)
log = logging.getLogger('milhouse')

parser = argparse.ArgumentParser(description='Milhouse makes things Lisa tells him to.')
parser.add_argument('--log', default=conf.LOG_LEVEL, metavar='LOG_LEVEL',
                    help='Log level (default: %s)' % conf.LOG_LEVEL)
parser.add_argument('-v', '--verbose', action='store_true')
args = parser.parse_args()

logging.basicConfig(level=getattr(logging, args.log.upper()),
                    format='%(asctime)s: %(message)s')

# has the system requested shutdown
KILLED = False

CONTINENTS = {
    'AF': 'Africa',
    'AS': 'Asia',
    'EU': 'Europe',
    'NA': 'North America',
    'OC': 'Oceania',
    'SA': 'South America',
    'AN': 'Antarctica',
}


def handle_signals(signum, frame):
    # NOTE: Makes this thing non-thread-safe
    # Should not be too difficult to fix if we
    # need/want threads.
    global KILLED
    KILLED = True
    log.info('Attempting to shut down')


def get_timestamps_to_process():
    """Return the timestamp(s) ready to output to JSON.

    Basic idea is:

    1. Get all but the most recent timestamp from the
       redis sorted set. This should allow for them to be
       sure to be done filling.
    2. Process the list.
    """
    return redis.zrange(rkeys.MAP_TIMESTAMPS, 0, -2)


def get_issue_dict(value_type):
    return {issue: value_type() for issue in data_types.types_map.itervalues()}


def get_percent(part, total):
    """Return a percentage rounded to hundredths."""
    return round(part / total, 4)


def get_data_for_timestamp(timestamp):
    """
    Return aggregate map and share data dict for a timestamp.
    """
    issue_countries = get_issue_dict(list)
    data = {
        'map_total': int(redis.get(rkeys.MAP_TOTAL) or 0),
        'map_previous_total': int(redis.get(rkeys.MAP_TOTAL_SNAPSHOT) or 0),
        'map_geo': [],
        'share_total': int(redis.get(rkeys.SHARE_TOTAL) or 0),
        # prefill for bug 999729
        'continent_issues': {c: get_issue_dict(int) for c in CONTINENTS},
        'country_issues': {},
        'issue_countries': issue_countries,
    }
    statsd.gauge('milhouse.map_total', data['map_total'])
    redis.set(rkeys.MAP_TOTAL_SNAPSHOT, data['map_total'])
    map_geo_key = rkeys.MAP_GEO.format(timestamp)
    geo_data = redis.hgetall(map_geo_key)
    for latlon, count in geo_data.iteritems():
        lat, lon = latlon.split(':')
        data['map_geo'].append({
            'lat': float(lat),
            'lon': float(lon),
            'count': int(count),
        })

    # CONTINENTS #
    continent_totals = redis.hgetall(rkeys.SHARE_CONTINENTS)
    continent_issues = data['continent_issues']
    for continent, count in continent_totals.iteritems():
        count = int(count)
        issues = redis.hgetall(rkeys.SHARE_CONTINENT_ISSUES.format(continent))
        for issue, issue_count in issues.iteritems():
            issue_count = int(issue_count)
            issue = data_types.types_map[issue]
            percent = get_percent(issue_count, count)
            continent_issues[continent][issue] = percent

    # prefill issue_continents: bug 999729
    data['issue_continents'] = {
        issue: [{'continent': code, 'count': continent_issues[code][issue]}
                for code in CONTINENTS]
        for issue in data_types.types_map.itervalues()
    }

    # COUNTRIES #
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

    # GLOBAL #
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
    jsonfile = conf.JSON_OUTPUT_DIR / '{}.json'.format(timestamp)
    with jsonfile.open('wb') as fh:
        json.dump(data, fh)

    # update the last processed timestamp for use in mrburns.
    redis.set(rkeys.LATEST_TIMESTAMP, timestamp)
    log.debug('Wrote file for {}'.format(timestamp))
    log.debug(jsonfile)


def main():
    counter = 0

    # make sure output dir exists
    try:
        if not conf.JSON_OUTPUT_DIR.exists():
            conf.JSON_OUTPUT_DIR.mkdir(parents=True)
    except OSError:
        log.exception('Can not create output dir: {}'.format(conf.JSON_OUTPUT_DIR))
        return 1

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
    register_signals(handle_signals)
    sys.exit(main())
