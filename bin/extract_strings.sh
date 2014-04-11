#!/usr/bin/env bash

svn up locale
python manage.py makemessages --all

