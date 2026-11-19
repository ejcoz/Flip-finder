# Cover images for Shorts / Reels (1080x1920). Everything that matters sits inside the middle 1080x1440 (the Instagram grid's 3:4 crop).
# Pet Cam: a clean close-up from the film (rendered with window.COVER = true) + the hook as a big two-tier title.
# Pixel Scan: the film's own title-slam frame (t = 2 s), nudged down so the title clears the crop.
import sys, os
from PIL import Image, ImageDraw, ImageFont
SRC, OUT = sys.argv[1], os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(OUT, '..', 'pet-cam-test', 'fonts', 'Inter.ttf')
def inter(size, wght):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([32, wght])   # axes: optical size, weight
    return f
ACC = {'ask': (255, 201, 77), 'fact': (90, 180, 255)}
PET = [  # film frame, lead line, key phrase, meaning colour, output name
    ('dog-stare_0.6.png', 'why does your dog', 'stare at you?', 'ask', 'pet-stare'),
    ('pet-cam-test_1.3.png', 'why does your dog', 'tilt its head?', 'ask', 'pet-head-tilt'),
    ('dog-words_1.3.png', 'your dog knows', '89 words', 'fact', 'pet-89-words'),
]
for src, lead, key, kind, name in PET:
    im = Image.open(os.path.join(SRC, src)).convert('RGBA')
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    fl, fk = inter(60, 500), inter(132, 800)
    wl = d.textlength(lead, font=fl); wk = d.textlength(key, font=fk)
    cy = 470; pw = max(wl, wk) + 120
    d.rounded_rectangle([540 - pw / 2, cy - 150, 540 + pw / 2, cy + 160], 40, fill=(8, 14, 28, 190))
    d.text((540, cy - 95), lead, font=fl, fill=(206, 214, 232, 255), anchor='mm')
    col = ACC[kind]; bx0, by0, bx1, by1 = 540 - wk / 2 - 34, cy - 30, 540 + wk / 2 + 34, cy + 120
    d.rectangle([bx0, by0, bx1, by1], fill=(10, 16, 30, 140), outline=col + (255,), width=4)
    for x, y in [(bx0, by0), (bx1, by0), (bx0, by1), (bx1, by1)]: d.ellipse([x - 11, y - 11, x + 11, y + 11], fill=(255, 255, 255, 255), outline=col + (255,), width=4)
    d.text((540, cy + 45), key, font=fk, fill=(255, 255, 255, 255), anchor='mm')
    fh = inter(34, 600); hw = d.textlength('@pupexplained', font=fh) + 44
    d.rounded_rectangle([540 - hw / 2, 1580, 540 + hw / 2, 1636], 28, fill=(8, 14, 28, 150))
    d.text((540, 1608), '@pupexplained', font=fh, fill=(242, 245, 255, 230), anchor='mm')
    Image.alpha_composite(im, ov).convert('RGB').save(os.path.join(OUT, name + '.jpg'), quality=93)
for film in ['quit-alcohol', 'quit-vaping', 'quit-sugar']:
    im = Image.open(os.path.join(SRC, film + '_2.png')).convert('RGB')
    sm = im.resize((1026, 1824), Image.LANCZOS); out = im.copy(); out.paste(sm, (27, 48))   # 95%, centred: title and booth plate both inside the crop
    out.save(os.path.join(OUT, 'pixel-' + film.replace('quit-', 'quit-') + '.jpg'), quality=93)
print('ok')
