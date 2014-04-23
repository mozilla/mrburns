#!/bin/bash

source /data/venvs/mrburns/bin/activate
source /home/mrburns/mrburns_env

svn up locale

REV_FILE=".locale_revision"
test ! -e $REV_FILE && touch $REV_FILE

locale_revision=$(cat $REV_FILE)
new_revision=$(svnversion -cn locale | cut -d ':' -f 2)

if [ "$locale_revision" != "$new_revision" ]; then
    echo $new_revision > $REV_FILE
    errors=$(dennis-cmd lint locale)
    if [ $? -eq 0 ]; then
        errors=$(python manage.py compilemessages 2>&1 > /dev/null)
        if [ $? -eq 0 ]; then
            sudo supervisorctl restart mrburns
        else
            echo "Some .po files failed to compile in r${new_revision}.\n\n$errors" | \
                mail -s "Glow l10n error" pmac@mozilla.com
        fi
    else
        echo "Dennis found a problem with the .po files in r${new_revision}.\n\n$errors" | mail -s "Glow l10n error" pmac@mozilla.com
    fi
fi
