#!/bin/bash

# Activate the virtual environment
source /data/venvs/mrburns/bin/activate
# most of the vars below come from here
source /home/mrburns/mrburns_env

NAME="mrburns" # Name of the application
USER=mrburns # the user to run as
GROUP=mrburns # the group to run as

echo "Starting $NAME"

cd $PROJECT_DIR
export PYTHONPATH=$PROJECT_DIR:$PYTHONPATH

# Start your Django Unicorn
# Programs meant to be run under supervisor should not daemonize themselves (do not use --daemon)
exec newrelic-admin run-program gunicorn mrburns.wsgi:application \
        --name $NAME \
        --workers $MRBURNS_NUM_WORKERS \
        --user $USER --group $GROUP \
        --log-level $MRBURNS_LOG_LEVEL \
        --bind unix:$MRBURNS_SOCKET
