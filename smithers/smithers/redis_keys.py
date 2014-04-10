# Common store for redis keys
from os import getenv


IPLOGS = getenv('REDIS_KEY_IPLOGS', 'geoip')

# integer to increment
MAP_TOTAL = 'map:total'

# hash with keys == 'lat:lon', values == count, per minute
MAP_GEO = 'map:geo:{}'

# sorted set of timestamps ready for processing
MAP_TIMESTAMPS = 'map:timestamps'

# last timestamp processed
LATEST_TIMESTAMP = 'latest:timestamp'

# SHARE #

SHARE_TOTAL = 'share:total'

# shares per issue
SHARE_ISSUES = 'share:issues'

# shares per country
SHARE_COUNTRIES = 'share:countries'
# shares per country per issue
SHARE_COUNTRY_ISSUES = 'share:country:{}'

# shares per continent
SHARE_CONTINENTS = 'share:continents'
# shares per continent per issue
SHARE_CONTINENT_ISSUES = 'share:continent:{}'
