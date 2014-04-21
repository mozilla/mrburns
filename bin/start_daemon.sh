#!/bin/bash

source /data/venvs/mrburns/bin/activate
source /home/mrburns/mrburns_env

NAME=$1

echo "Starting $NAME"

exec python ${PROJECT_DIR}/smithers/${NAME}.py
