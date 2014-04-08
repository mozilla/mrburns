
DOWNLOAD = '0'
PRIVACY = '1'
OPPORTUNITY = '2'
ACCESSIBILITY = '3'
FREEDOM = '4'
EDUCATION = '5'
CONTROL = '6'

types_map = {
    PRIVACY: 'privacy',
    OPPORTUNITY: 'opportunity',
    ACCESSIBILITY: 'access',
    FREEDOM: 'freedom',
    EDUCATION: 'learning',
    CONTROL: 'control',
}

name_to_id = {v: k for k, v in types_map.items()}
