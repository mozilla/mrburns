#!/bin/sh

LOG_FILE=$1

if [ -z "$LOG_FILE" ]; then
    exit 1
fi

cat ${LOG_FILE} | grep ' 302 ' | grep -iE 'firefox-(28|latest)' | awk '{print "lpush geoip 0," $3}' >> /tmp/redis-commands.txt

cat /tmp/redis-commands.txt | redis-cli && rm /tmp/redis-commands.txt
