#!/bin/sh

read -p "Are you really sure? (type YES) " yn
if [ "$yn" == "YES" ]; then
    read -p "Are you really REALLY sure?!?! (type YES) " yn
    if [ "$yn" == "YES" ]; then
        echo "You asked for it! O_O"
    else
        echo "Oh good... Shoooo! Close one!"
        exit
    fi
else
    echo "Okay. No harm no foul."
    exit
fi

echo "Stopping all the things"
sudo supervisorctl stop all

echo "Deleting all the Redis things"
redis-cli flushall

echo "Deleting all the JSON things"
rm static/data/stats/*

echo "Restarting all the things!"
sudo supervisorctl start all

echo "DONE! Enjoy your fresh system :)"
