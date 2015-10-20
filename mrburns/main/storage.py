from whitenoise.django import DjangoWhiteNoise


class MrBurnsNoise(DjangoWhiteNoise):
    def is_immutable_file(self, path, url):
        return True
