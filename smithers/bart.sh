#!/bin/sh

MY_DIR=`dirname $0`
EPOCH=`date +%s`
MAIN_LOG_FILE="/var/log/glow.log"
LOG_FILE_NAME="glow.${EPOCH}.log"
NEW_LOG="/tmp/${LOG_FILE_NAME}"
ARCHIVE_LOG="/mnt/glow/log/${LOG_FILE_NAME}"

mv -f ${MAIN_LOG_FILE} ${NEW_LOG}
kill -HUP `cat /var/run/syslogd.pid`

${MY_DIR}/bart_process_log.sh ${NEW_LOG}

mv ${NEW_LOG} ${ARCHIVE_LOG}
