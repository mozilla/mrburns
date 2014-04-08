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

1. Setup a virtualenv using [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/):
   `mkvirtualenv smithers`
2. Install the dependencies:
   `bin/peep.py install -r requirements.txt`
3. Run the daemon of your choice.

Terminology
-----------

These are not actually `daemons` in and of themselves. They are just
programs that run forever. The plan is to use something like 
[supervisord](http://supervisord.org/) to daemonize and manage them.
