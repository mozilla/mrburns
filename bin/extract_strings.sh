#!/usr/bin/env bash

svn up locale
python manage.py makemessages --all -i base.py -i server.py -i local.py

