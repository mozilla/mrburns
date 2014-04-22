Mr. Burns
=========

Source for the 2014 version of the Glow Firefox download stats site.

[![Build Status](https://travis-ci.org/mozilla/mrburns.svg?branch=master)](https://travis-ci.org/mozilla/mrburns)
[![Coverage Status](https://coveralls.io/repos/mozilla/mrburns/badge.png)](https://coveralls.io/r/mozilla/mrburns)

**We bring you... Love!**

![](http://i.imgur.com/63700IZ.png)

Installation
============

1. Clone the repo: `git clone https://github.com/mozilla/mrburns.git`
2. `cd mrburns`
3. Assuming you have [virtualenv](http://www.virtualenv.org/en/latest/) and [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/) installed: `mkvirtualenv mrburns`
    * If you don't have virtualenv(wrapper) you can install them: `pip install virtualenvwrapper`
4. Upgrade pip: `pip install -U pip`
5. `bin/peep.py install -r requirements/mrburns.txt`
6. `pip install -r requirements/github.txt`
   peep.py can't handle github urls as of yet.
7. `cp mrburns/settings/local.py{-dist,}`
8. Assuming you have [node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) installed: `npm install -g less`
9. `./manage.py update_product_details`
10. `./manage.py runserver`
11. Open a browser to [http://localhost:8000/](http://localhost:8000/).
12. PROFIT!
