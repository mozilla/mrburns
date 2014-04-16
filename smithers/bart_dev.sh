#!/bin/sh

MY_DIR=`dirname $0`
LOGS_DIR=/mnt/glow/log

next_file=`ls -t ${LOGS_DIR}/glow.*.log | head -1`

if [ -z "${next_file}" ]; then
    exit 0
fi

${MY_DIR}/bart_process_log.sh ${next_file}

gzip ${next_file}
