#!/bin/bash

source /data/venvs/mrburns/bin/activate
source /home/mrburns/mrburns_env

svn up locale

REV_FILE=".locale_revision"
test ! -e $REV_FILE && touch $REV_FILE

locale_revision=$(cat $REV_FILE)
new_revision=$(svn info locale | grep "Revision:")

if [ "$locale_revision" != "$new_revision" ]; then
    echo $new_revision > $REV_FILE
    if dennis-cmd lint locale; then
        if python manage.py compilemessages; then
            sudo supervisorctl restart mrburns
        else
            echo "The .po files failed to compile in r${new_revision}." | mail -s "Glow l10n error" pmac@mozilla.com
        fi
    else
        echo "Dennis found a problem with the .po files in r${new_revision}." | mail -s "Glow l10n error" pmac@mozilla.com
    fi
fi
