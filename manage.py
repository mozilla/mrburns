#!/usr/bin/env python
import os
import site
import sys


BASE_DIR = os.path.dirname(__file__)
site.addsitedir(os.path.join(BASE_DIR, 'smithers'))


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mrburns.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
