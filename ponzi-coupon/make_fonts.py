"""Fonts for the film (SIL OFL 1.1), fetched once from github.com/google/fonts: IM FELL English (roman, italic, small caps) and Courier Prime."""
import os, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(HERE, 'fonts'); os.makedirs(F, exist_ok=True)
GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
FILES = {'IMFeENrm28P.ttf': 'imfellenglish', 'IMFeENit28P.ttf': 'imfellenglish', 'IMFeENsc28P.ttf': 'imfellenglishsc',
         'CourierPrime-Regular.ttf': 'courierprime', 'CourierPrime-Bold.ttf': 'courierprime'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'font-fetch/1.0'}), timeout=60).read()
for name, fam in FILES.items():
    p = os.path.join(F, name)
    if not os.path.exists(p): open(p, 'wb').write(get(GF + fam + '/' + name)); print('font', name)
for lic, fam in (('OFL-imfell.txt', 'imfellenglish'), ('OFL-courierprime.txt', 'courierprime')):
    p = os.path.join(F, lic)
    if not os.path.exists(p): open(p, 'wb').write(get(GF + fam + '/OFL.txt'))
