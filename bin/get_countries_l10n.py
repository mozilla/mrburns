#!/usr/bin/env python

"""Get countries list from Firefox source translated into our locales."""

import json
import os
import sys
import os.path as path
import re

import requests
from requests.exceptions import RequestException


BASE_DIR = path.abspath(path.dirname(path.dirname(__file__)))
OUTPUT_DIR = path.join(BASE_DIR, 'countries_l10n')
OUTPUT_FILE = path.join(OUTPUT_DIR, 'countries.{locale}.json')
LOCALE_DIR = path.join(BASE_DIR, 'locale')

FILE_URL = 'http://hg.mozilla.org/releases/l10n/mozilla-release/{locale}/raw-file/' \
           'tip/toolkit/chrome/global/regionNames.properties'
DATA_RE = re.compile(r'(\w{2})\s*=\s*(.*)$')


def get_locales():
    return [dir.replace('_', '-') for dir in os.listdir(LOCALE_DIR)
            if not dir.startswith('.')]


def get_locale_data(locale):
    locale_url = FILE_URL.format(locale=locale)
    try:
        resp = requests.get(locale_url)
    except RequestException:
        print 'Could not get:', locale_url
        return

    data = {}
    for line in resp.text.splitlines():
        match = DATA_RE.match(line)
        if match:
            country, name = match.groups()
            data[country] = name

    return data


def write_locale_files():
    try:
        os.mkdir(OUTPUT_DIR)
    except OSError:
        # might just already exist
        pass
    for locale in get_locales():
        data = get_locale_data(locale)
        with open(OUTPUT_FILE.format(locale=locale), 'w') as fh:
            print 'Writing file for:', locale
            json.dump(data, fh)


if __name__ == '__main__':
    write_locale_files()
