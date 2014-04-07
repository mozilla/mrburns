#!/usr/bin/env python
import os
import site
import sys


BASE_DIR = os.path.dirname(__file__)
SMITHERS_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'smithers'))


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mrburns.settings")
    smithers_dir = os.environ.setdefault("SMITHERS_DIR", SMITHERS_DIR)
    site.addsitedir(smithers_dir)

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
