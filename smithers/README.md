Smithers
========

Python Daemons that seek out and deliver data to Mr. Burns (Glow 2014)

The Daemons
-----------

1. **Bart** - I take millions of lines of web server logs and throw them at Lisa. HAHA! Eat my IPs!
2. **Lisa** - I turn Bart's fun into geolocated data organized into aggregated buckets.
3. **Milhouse** - I do what Lisa tells me. In this case it's to take her data and package it into well-organized JSON files in 1 minute increments.

Installation
------------

1. Hopefully you already have a virtualenv setup for mrburns, so just use that. If not follow that readme to get it going, you'll need all of those requirements as well.
2. Install the smithers dependencies from the base of the repo:
   `bin/peep.py install -r requirements/smithers.txt`
3. Run the daemon of your choice.

Terminology
-----------

These are not actually `daemons` in and of themselves. They are just
programs that run forever. The plan is to use something like 
[supervisord](http://supervisord.org/) to daemonize and manage them.
