Mr. Burns
=========

Source for the 2014 version of the Glow Firefox download stats site. 

**We bring you... Love!**

![](http://i.imgur.com/63700IZ.png)

Installation
============

1. Clone the repo: `git clone https://github.com/mozilla/mrburns.git`
2. `cd mrburns`
3. Assuming you have [virtualenv](http://www.virtualenv.org/en/latest/) and [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/) installed: `mkvirtualenv mrburns`
4. `pip install -r requirements.txt`
5. `cp mrburns/settings/local.py{-dist,}`
6. Assuming you have [node.js](http://nodejs.org/) and [npm](https://www.npmjs.org/) installed: `npm install -g less`
7. `./manage.py runserver`
8. Open a browser to [http://localhost:8000/](http://localhost:8000/).
9. PROFIT!
