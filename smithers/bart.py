#!/usr/bin/env python

"""
Process logs from syslog and throw them at Lisa via Redis.
"""

import argparse
import logging
import os
import re
import sched
import signal
import sys
import time
from collections import Counter
from subprocess import call

from pathlib import Path

from smithers import conf
from smithers import redis_keys as rkeys
from smithers.redis_client import client as redis
from smithers.statsd_client import statsd
from smithers.utils import register_signals


log = logging.getLogger('lisa')
firefox_re = re.compile(r'firefox-(?:latest|{})'.format(conf.FIREFOX_VERSION),
                        re.IGNORECASE)

# has the system requested shutdown
KILLED = False

SERVER_ENV = os.getenv('DJANGO_SERVER_ENV', 'dev')

# NOTE: Not thread safe. There must be only one bart at a time.
scheduler = sched.scheduler(time.time, time.sleep)
current_event = None

parser = argparse.ArgumentParser(description='Bart flings IPs at Lisa.')
parser.add_argument('--log', default=conf.LOG_LEVEL, metavar='LOG_LEVEL',
                    help='Log level (default: %s)' % conf.LOG_LEVEL)
parser.add_argument('--logfile', default=None, help='Log file to process')
parser.add_argument('--env', default=SERVER_ENV, choices=['dev', 'prod'],
                    help='Running mode (default: %s)' % SERVER_ENV)
parser.add_argument('-v', '--verbose', action='store_true')
args = parser.parse_args()

logging.basicConfig(level=getattr(logging, args.log.upper()),
                    format='%(asctime)s: %(message)s')


def handle_signals(signum, frame):
    try:
        scheduler.cancel(current_event)
    except ValueError:
        pass
    global KILLED
    KILLED = True
    log.info('Attempting to shut down')


def get_syslog_pid(pid_file=None):
    """Return the process ID for rsyslogd."""
    pid_file = Path(pid_file or conf.SYSLOG_PID_FILE)
    with pid_file.open() as fh:
        try:
            return fh.read().strip()
        except IOError:
            raise IOError('Can not get syslog PID from {}'.format(pid_file))


def poke_syslogd(sig=signal.SIGHUP):
    pid = get_syslog_pid()
    os.kill(pid, sig)


def get_newest_shared_log():
    """Return the name of the newest non-gzipped log file in NFS."""
    if args.logfile:
        return Path(args.logfile)

    return conf.ARCHIVE_LOG_PATH / redis.get(rkeys.LATEST_LOG_FILE)


def get_fresh_log_file():
    """Do the env-appropriate thing to get a new log file."""
    if args.env == 'prod':
        return rotate_syslog_file()

    if args.env == 'dev':
        return get_newest_shared_log()

    # Fatal error
    log.error('Unknown server environment: %s' % args.env)
    sys.exit(1)


def rotate_syslog_file():
    """Move the main syslog file to a new one, signal syslogd, and return new file."""
    log.debug('Rotating Syslog')
    new_log_file = conf.TMP_DIR / 'glow.{}.log'.format(time.time())
    conf.MAIN_LOG_FILE.rename(new_log_file)
    poke_syslogd()
    return new_log_file


def filter_logs(log_file):
    """Extract valid downlods from logs and return IPs."""
    log.debug('Filtering logs in {}'.format(log_file))
    with log_file.open() as fh:
        ip_counter = Counter()
        for line in fh:
            try:
                _, timestamp, ip, status_code, request = line.strip().split()
            except ValueError:
                # wrong format
                continue

            if status_code != conf.LOG_HTTP_STATUS:
                log.debug('Not the status code we want: {}'.format(status_code))
                continue

            if not firefox_re.search(request):
                log.debug('Not the Firefox we\'re looking for: {}'.format(request))
                continue

            if ip_counter[ip] >= conf.IP_RATE_LIMIT_MAX:
                log.info('Skipped {} due to rate limit'.format(ip))
                statsd.incr('bart.ratelimit')
                continue

            ip_counter[ip] += 1

            yield ip


def throw_at_lisa(log_file):
    """Put IPs on a queue in redis for Lisa to process."""
    log.debug('Throwing {} at Lisa'.format(log_file))
    if not log_file.exists():
        raise IOError('Log file not found: {}'.format(log_file))

    count = 0
    pipe = redis.pipeline()
    for ip in filter_logs(log_file):
        pipe.lpush(rkeys.IPLOGS, '0,' + ip)
        count += 1

    pipe.execute()
    statsd.incr('bart.ips_processed', count)


def finalize_log_file(log_file):
    """Do the appropriate thing to the log file for the server env."""
    log.debug('Finalizing {}'.format(log_file))
    if args.env == 'prod':
        # move it to the shared drive
        log_file.rename(conf.ARCHIVE_LOG_PATH / log_file.name)
        redis.set(rkeys.LATEST_LOG_FILE, log_file.name)
    else:
        # gzip the file on dev
        call(['gzip', str(log_file)])


def main():
    global current_event
    if KILLED:
        log.info('Shutdown successful')
        sys.exit(0)

    current_event = scheduler.enter(60, 1, main, ())
    try:
        log_file = get_fresh_log_file()
        throw_at_lisa(log_file)
        finalize_log_file(log_file)
    except Exception as e:
        log.error('ERROR: ' + e.message)

    log.debug('Waiting...')


if __name__ == '__main__':
    register_signals(handle_signals)
    current_event = scheduler.enter(0, 1, main, ())
    scheduler.run()
