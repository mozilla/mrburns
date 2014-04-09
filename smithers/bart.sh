#!/bin/sh

EPOCH=`date +%s`
NEW_LOG="/var/log/glowmo/syslog/glow.${EPOCH}.log"

mv -f /var/log/glow.log ${NEW_LOG}
kill -HUP `cat /var/run/syslogd.pid`

cat ${NEW_LOG} | grep ' 302 ' | grep -iE 'firefox-(28|latest|stub)' | awk '{print "lpush geoip 0," $3}' >> /tmp/redis-commands.txt

cat /tmp/redis-commands.txt | redis-cli && rm /tmp/redis-commands.txt

gzip ${NEW_LOG}
