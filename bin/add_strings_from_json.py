#!/usr/bin/env python
"""
Take english string and a JSON file as arguments and include the strings in the .po files
in the appropriate locales.

Example JSON:
http://transvision.mozfr.org/string/?entity=mozilla_org/main.lang:06a0d0cf&repo=mozilla_org&json
"""

from __future__ import unicode_literals, print_function

import json
import sys

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]

LOCALES_DIR = BASE_DIR / 'locale'
LOCALES_MAP = {
    'es': 'es-ES',
    'nb': 'nb-NO',
}
IGNORE_DIRS = ('xx', 'templates', '.svn', 'en')
PO_LINE_TEMPLATE = '\nmsgid "{en_str}"\nmsgstr "{locale_str}"\n'


def fix_locale(locale):
    return locale.replace('_', '-')


def get_all_locales():
    return [locale.name for locale in LOCALES_DIR.iterdir() if locale.is_dir()
            and locale.name not in IGNORE_DIRS]


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: add_strings_from_json.py EN_STRING JSON_FILE')
        sys.exit(1)

    en_string, filename = sys.argv[1:]
    with Path(filename).open() as fh:
        strings_data = json.load(fh)

    for locale in get_all_locales():
        file_locale = fix_locale(locale)
        if file_locale in LOCALES_MAP:
            file_locale = LOCALES_MAP[file_locale]

        try:
            locale_string = strings_data[file_locale]
            locale_string = locale_string.replace(' {ok}', '')
        except KeyError:
            print('No string for: {}'.format(file_locale))
            locale_string = ''

        po_line = PO_LINE_TEMPLATE.format(en_str=en_string,
                                          locale_str=locale_string)
        po_file = LOCALES_DIR / locale / 'LC_MESSAGES' / 'django.po'
        print('Writing {} string to {}...'.format(file_locale, po_file))
        with po_file.open('a') as fh:
            fh.write(po_line)
