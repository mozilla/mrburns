#!/bin/bash

source /data/venvs/mrburns/bin/activate
source /home/mrburns/mrburns_env

#svn up locale

SUBJECT="[Glow2014-${DJANGO_SERVER_ENV}] l10n update error"
REV_FILE=".locale_revision"
test ! -e $REV_FILE && touch $REV_FILE

locale_revision=$(cat $REV_FILE)
new_revision=$(svnversion -cn locale | cut -d ':' -f 2)

function report_error() {
    if [ -n "$L10N_ERROR_EMAILS" ]; then
        printf "$1" | mail -s "$SUBJECT" "$L10N_ERROR_EMAILS"
    else
        printf "$1"
    fi
}

if [ "$locale_revision" != "$new_revision" ]; then
    echo $new_revision > $REV_FILE
    errors=$(dennis-cmd lint locale)
    if [ $? -eq 0 ]; then
        errors=$(python manage.py compilemessages 2>&1 > /dev/null)
        if [ $? -eq 0 ]; then
            sudo supervisorctl restart mrburns
        else
            report_error "Some .po files failed to compile in r${new_revision}.\n\n$errors"

        fi
    else
        report_error "Dennis found a problem with the .po files in r${new_revision}.\n\n$errors"
    fi
fi
