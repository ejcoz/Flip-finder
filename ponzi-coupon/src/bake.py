"""The Coupon - bake every paper part into parts/*.png + parts/manifest.json.
Table paper, torn colour sheets, cut-outs of the archive prints (coupon front and back, lire note, 2c stamp, $5 note),
halftone clippings (Ponzi 1920, mug shot), investor silhouettes, paper arrow, postmark, typed slips, ransom letters, subtitle slips.
Fixed seeds: deterministic. Run: $LIB/.venv/bin/python src/bake.py
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import collage_lib as cl
from collage_lib import fbm, torn, paper_texture, poly_mask, ellipse_mask

RAW = os.path.join(ROOT, 'raw'); OUT = os.path.join(ROOT, 'parts'); FONTS = os.path.join(ROOT, 'fonts')
os.makedirs(OUT, exist_ok=True)
B = 1.5          # parts stored at 1.5 px per world unit
BG_B = 1.25

hexc = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
PAPER, CARD, INK = hexc('#ECDFC2'), hexc('#F6EEDB'), hexc('#221C17')
OCHRE, TEAL, MUSTARD = hexc('#C65F3A'), hexc('#2F7F7A'), hexc('#E1AB3B')
RED = hexc('#B8403A')          # postmark and stamp red
GREEN = hexc('#3E6B55')        # greenback, re-inked close to the teal
NEWS = hexc('#E6E0D2')
cl.PAPER, cl.PAPER_HI, cl.INK = PAPER, CARD, INK
M = {}
font = lambda f, s: ImageFont.truetype(os.path.join(FONTS, f), int(s))
CP, CPB = 'CourierPrime-Regular.ttf', 'CourierPrime-Bold.ttf'
FELL, FELLI, FELLSC = 'IMFeENrm28P.ttf', 'IMFeENit28P.ttf', 'IMFeENsc28P.ttf'


def save(name, rgb, alpha, **meta):
    a = np.clip(alpha, 0, 1)
    ys, xs = np.nonzero(a > 0.004)
    y0, y1, x0, x1 = max(0, ys.min() - 2), min(a.shape[0], ys.max() + 3), max(0, xs.min() - 2), min(a.shape[1], xs.max() + 3)
    im = np.dstack([np.clip(rgb, 0, 255), a * 255])[y0:y1, x0:x1].astype(np.uint8)
    Image.fromarray(im, 'RGBA').save(os.path.join(OUT, name + '.png'), compress_level=3)
    m = dict(w=int(x1 - x0), h=int(y1 - y0), crop=[int(x0), int(y0)], **meta)
    M[name] = m
    return m


def rs(a, w, h):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((int(w), int(h)), Image.LANCZOS), float) / 255


# ---------- table paper ----------
def bake_paper():
    W, H = int(2016 * BG_B), int(1134 * BG_B)
    tex = paper_texture(H, W, seed=1, fibers=1400)
    tex = 1 + (tex - 1) * 0.75
    col = PAPER[None, None, :] * tex[..., None]
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'paper.jpg'), quality=93)
    M['paper'] = dict(w=W, h=H, x=-48, y=-27, scale=BG_B)


# ---------- torn colour sheets (world coordinates) ----------
def tear_sprite(mask, color, seed, rough, mottle=0.06):
    body, fr = torn(mask, rough=rough, seed=seed)
    h, w = mask.shape
    t = 1 + mottle * fbm(h, w, scales=(3 * B, 12 * B, 40 * B), weights=(0.3, 0.4, 0.3), seed=seed + 11)
    col = color[None, None, :] * t[..., None]
    a = np.maximum(body, fr * 0.92)
    w_ = np.clip(fr * 0.92 - body, 0, 1) / np.maximum(a, 1e-6)
    col = col * (1 - w_[..., None]) + CARD * 1.01 * w_[..., None]
    return col, a


def flat(name, poly=None, ell=None, color=None, seed=0, rough=4, mottle=0.06):
    if poly is not None:
        xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    else:
        cx, cy, r = ell; xs = [cx - r, cx + r]; ys = [cy - r, cy + r]
    pad = 30
    X0, Y0 = min(xs) - pad, min(ys) - pad
    w, h = int((max(xs) - X0 + pad) * B), int((max(ys) - Y0 + pad) * B)
    if poly is not None:
        m = poly_mask(h, w, [((x - X0) * B, (y - Y0) * B) for x, y in poly]) > 0.5
    else:
        m = ellipse_mask(h, w, (cx - X0) * B, (cy - Y0) * B, r * B, r * B)
    col, a = tear_sprite(m, color, seed, rough * B, mottle)
    mm = save(name, col, a)
    mm['x'] = X0 + mm['crop'][0] / B; mm['y'] = Y0 + mm['crop'][1] / B


def bake_flats():
    # Italy: a teal sheet on the left half of the first scene
    flat('italy', poly=[(-260, 120), (640, 60), (1010, 140), (1180, 420), (1120, 760), (900, 1000), (300, 1060), (-260, 990)], color=TEAL, seed=41)
    # America: a mustard sheet two screens to the right
    flat('usa', poly=[(2090, 80), (2900, 40), (3420, 120), (3500, 560), (3420, 1000), (2600, 1060), (2120, 960), (2020, 520)], color=MUSTARD, seed=43)
    # the sea between them: a cream strip crossing the table
    flat('sea', poly=[(1000, 470), (1500, 420), (2100, 450), (2100, 640), (1500, 620), (1000, 660)], color=CARD * 0.985, seed=45, rough=3, mottle=0.04)
    # Ponzi: an ochre disc behind his portrait
    flat('sun', ell=(4060, 470, 330), color=OCHRE, seed=47)
    # the pyramid: a teal sheet
    flat('pyr', poly=[(5240, 1240), (6350, 1210), (6420, 2140), (5230, 2170)], color=TEAL, seed=49)


# ---------- cut-outs from the archive prints ----------
def reink(rgb_or_gray, mask, scale, ink_col, wash=None, wash_amt=0.0, margin=4, seed=0, paper=CARD, gain=1.0, gamma=0.9):
    """Grey scan -> two-tone print: ink amount in ink_col on card, optional flat wash inside the cut. Returns rgb, alpha (scaled)."""
    g = rgb_or_gray
    ys, xs = np.nonzero(mask > 0.5)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    g, m = g[y0:y1, x0:x1], mask[y0:y1, x0:x1]
    ink = cl.ink_from_gray(g, m, paper_q=85, black_q=2) * gain
    ink = np.clip(ink, 0, 1) ** gamma
    tw, th = int((x1 - x0) * scale), int((y1 - y0) * scale)
    ink, m = rs(ink, tw, th), rs(m, tw, th)
    P = int(margin) + 8
    ink = np.pad(ink, P); m = np.pad(m, P)
    dil = ndi.binary_dilation(m > 0.5, iterations=max(1, int(margin)))
    body, _ = torn(dil, rough=1.2, seed=seed, amp=0.25)
    alpha = np.maximum(body, m)
    h, w = m.shape
    tex = 1 + 0.03 * fbm(h, w, scales=(2, 8), weights=(0.5, 0.5), seed=seed + 3)
    base = np.ones((h, w, 3)) * paper * tex[..., None]
    if wash is not None:
        base = base * (1 - wash_amt * m[..., None]) + wash * wash_amt * m[..., None]
    ink = ink * m
    col = base * (1 - ink[..., None]) + ink_col * ink[..., None]
    return col, alpha


def gray_of(name):
    return np.asarray(Image.open(os.path.join(RAW, name)).convert('L'), float)


# ---------- hand-made engraved prints (our own designs, not facsimiles) ----------
def guilloche(d, x0, y0, x1, y1, s, waves=3, amp=6, per=22, lw=1):
    """Engraved border band: interlaced sine lines running round a rectangle (all in px)."""
    for k in range(waves):
        ph = k * 2 * math.pi / waves
        for (ax, ay, bx, by) in ((x0, y0, x1, y0), (x1, y0, x1, y1), (x1, y1, x0, y1), (x0, y1, x0, y0)):
            L = math.hypot(bx - ax, by - ay); n = int(L / 3) + 2
            nx, ny = -(by - ay) / L, (bx - ax) / L
            pts = []
            for i in range(n):
                u = i / (n - 1); off = amp * s * math.sin(u * L / (per * s) * 2 * math.pi + ph)
                pts.append((ax + (bx - ax) * u + nx * off, ay + (by - ay) * u + ny * off))
            d.line(pts, fill=255, width=max(1, int(lw * s)))


def hatch_oval(d, cx, cy, rx, ry, s, step=5, lw=1):
    for y in np.arange(cy - ry, cy + ry, step * s):
        t = (y - cy) / ry; w = rx * math.sqrt(max(0, 1 - t * t))
        d.line([(cx - w, y), (cx + w, y)], fill=255, width=max(1, int(lw * s)))


def ctext(d, cx, y, txt, f):
    d.text((cx - d.textlength(txt, font=f) / 2, y), txt, font=f, fill=255)


def card(name, ww, hh, ink_col, draw, seed, wash=None, wash_amt=0.0, perf=False, paper=CARD):
    """A printed piece of world size ww x hh: draw(d, w, h, s) draws ink (255) into an L image; cut with a thin white margin."""
    s = B; w, h = int(ww * s), int(hh * s); P = int(14 * s)
    img = Image.new('L', (w + 2 * P, h + 2 * P), 0)
    draw(ImageDraw.Draw(img), w, h, s, P)
    ink = ndi.gaussian_filter(np.asarray(img, float) / 255, 0.5)
    rng = np.random.default_rng(seed)
    ink *= 0.8 + 0.2 * np.clip(ndi.gaussian_filter(rng.random(ink.shape), 1.0) * 3 - 1, 0, 1)   # uneven plate ink
    m = np.zeros(ink.shape, bool); m[P:P + h, P:P + w] = True
    if perf:                                                   # perforation teeth on a stamp
        r = 4.2 * s; yy, xx = np.mgrid[:m.shape[0], :m.shape[1]]
        for x in np.arange(P, P + w + 1, 11 * s):
            for y in (P, P + h): m &= (xx - x) ** 2 + (yy - y) ** 2 > r * r
        for y in np.arange(P, P + h + 1, 11 * s):
            for x in (P, P + w): m &= (xx - x) ** 2 + (yy - y) ** 2 > r * r
    body, _ = torn(m, rough=0.7 * s, seed=seed, amp=0.15)
    H_, W_ = m.shape
    tex = paper_texture(H_, W_, seed=seed + 1, fibers=max(20, int(w * h / 4000))); tex = 1 + (tex - 1) * 0.5
    col = paper[None, None, :] * tex[..., None]
    if wash is not None:
        col = col * (1 - wash_amt) + wash * wash_amt
    col = col * (1 - ink[..., None]) + ink_col * ink[..., None]
    save(name, col, body)


def bake_cutouts():
    f = lambda n, z: font(n, z * B)
    def coupon_front(d, w, h, s, P):
        x0, y0, x1, y1 = P + 10 * s, P + 10 * s, P + w - 10 * s, P + h - 10 * s
        d.rectangle([x0, y0, x1, y1], outline=255, width=int(3 * s)); d.rectangle([x0 + 7 * s, y0 + 7 * s, x1 - 7 * s, y1 - 7 * s], outline=255, width=int(1 * s))
        guilloche(d, x0 + 16 * s, y0 + 16 * s, x1 - 16 * s, y1 - 16 * s, s, amp=4, per=14)
        cx = P + w / 2
        ctext(d, cx, P + 38 * s, 'UNION POSTALE UNIVERSELLE', f(FELLSC, 17))
        ctext(d, cx, P + 72 * s, 'COUPON-RÉPONSE', f(FELLSC, 30))
        ctext(d, cx, P + 112 * s, 'INTERNATIONAL', f(FELLSC, 25))
        hatch_oval(d, cx, P + 205 * s, 64 * s, 46 * s, s, step=4)
        d.ellipse([cx - 70 * s, P + 153 * s, cx + 70 * s, P + 257 * s], outline=255, width=int(2 * s))
        ctext(d, cx, P + 270 * s, 'Ce coupon peut être échangé', f(FELLI, 15))
        ctext(d, cx, P + 292 * s, 'contre un timbre-poste', f(FELLI, 15))
        ctext(d, cx, P + 314 * s, "dans tous les pays de l'Union.", f(FELLI, 15))
    card('coupon_front', 360, 360, INK, coupon_front, 501, wash=MUSTARD, wash_amt=0.2)
    def coupon_back(d, w, h, s, P):
        x0, y0, x1, y1 = P + 10 * s, P + 10 * s, P + w - 10 * s, P + h - 10 * s
        d.rectangle([x0, y0, x1, y1], outline=110, width=int(1 * s))
        cx = P + w / 2
        d.ellipse([cx - 60 * s, P + 120 * s, cx + 60 * s, P + 240 * s], outline=110, width=int(1 * s))
        ctext(d, cx, P + 250 * s, "timbre du bureau d'origine", font(FELLI, 16 * s))
    card('coupon_back', 360, 360, INK, coupon_back, 503, wash=MUSTARD, wash_amt=0.08)
    def stamp(d, w, h, s, P):
        x0, y0, x1, y1 = P + 9 * s, P + 9 * s, P + w - 9 * s, P + h - 9 * s
        d.rectangle([x0, y0, x1, y1], fill=255)
        cx = P + w / 2
        d.ellipse([cx - 42 * s, P + 40 * s, cx + 42 * s, P + 140 * s], fill=0)
        hatch_oval(d, cx, P + 90 * s, 38 * s, 46 * s, s, step=4)
        d.rectangle([x0 + 6 * s, y0 + 6 * s, x1 - 6 * s, P + 34 * s], fill=0); ctext(d, cx, P + 13 * s, 'U.S. POSTAGE', f(CPB, 15))
        d.rectangle([x0 + 6 * s, P + 148 * s, x1 - 6 * s, y1 - 6 * s], fill=0); ctext(d, cx, P + 152 * s, 'TWO CENTS', f(CPB, 17))
        for xx in (x0 + 6 * s, x1 - 30 * s):
            d.ellipse([xx, P + 120 * s, xx + 24 * s, P + 144 * s], fill=0); d.text((xx + 6 * s, P + 121 * s), '2', font=f(CPB, 20), fill=255)
    card('stamp', 150, 190, RED, stamp, 521, perf=True)
    def lire(d, w, h, s, P):
        x0, y0, x1, y1 = P + 8 * s, P + 8 * s, P + w - 8 * s, P + h - 8 * s
        d.rectangle([x0, y0, x1, y1], outline=255, width=int(3 * s))
        guilloche(d, x0 + 12 * s, y0 + 12 * s, x1 - 12 * s, y1 - 12 * s, s, amp=5, per=18)
        cx = P + w / 2
        ctext(d, cx - 70 * s, P + 40 * s, 'BIGLIETTO DI STATO', f(FELLSC, 20))
        ctext(d, cx - 70 * s, P + 78 * s, 'LIRE DUE', f(FELLSC, 38))
        ox = P + w - 72 * s
        d.ellipse([ox - 46 * s, P + 50 * s, ox + 46 * s, P + 160 * s], outline=255, width=int(2 * s)); hatch_oval(d, ox, P + 105 * s, 40 * s, 50 * s, s, step=4)
        d.text((P + 34 * s, P + 128 * s), '2', font=f(CPB, 46), fill=255)
    card('lire', 420, 200, INK, lire, 511, wash=TEAL, wash_amt=0.18)
    def note(d, w, h, s, P):
        x0, y0, x1, y1 = P + 8 * s, P + 8 * s, P + w - 8 * s, P + h - 8 * s
        d.rectangle([x0, y0, x1, y1], outline=255, width=int(3 * s))
        guilloche(d, x0 + 12 * s, y0 + 12 * s, x1 - 12 * s, y1 - 12 * s, s, amp=4, per=12)
        cx = P + w / 2
        d.ellipse([cx - 46 * s, P + 34 * s, cx + 46 * s, P + 142 * s], outline=255, width=int(2 * s)); hatch_oval(d, cx, P + 88 * s, 40 * s, 50 * s, s, step=4)
        ctext(d, cx, P + 24 * s, 'FEDERAL RESERVE NOTE', f(FELLSC, 15))
        for xx in (P + 28 * s, P + w - 62 * s):
            d.ellipse([xx, P + 56 * s, xx + 36 * s, P + 92 * s], outline=255, width=int(2 * s)); d.text((xx + 9 * s, P + 56 * s), '5', font=f(CPB, 30), fill=255)
        ctext(d, cx, P + 150 * s, 'FIVE DOLLARS', f(FELLSC, 20))
    card('note', 400, 180, GREEN * 0.8, note, 531, wash=GREEN, wash_amt=0.10)


def halftone_clip(name, file, box, width, caption, seed, cell=7.0, contrast=(0.08, 0.85), news=NEWS):
    g = gray_of(file)[box[1]:box[3], box[0]:box[2]]
    Wd = int(width * B); Hd = int(Wd * g.shape[0] / g.shape[1])
    g = np.asarray(Image.fromarray(g.astype(np.uint8)).resize((Wd, Hd), Image.LANCZOS), float) / 255
    g = np.clip((g - contrast[0]) / contrast[1], 0, 1) ** 1.05
    yy, xx = np.mgrid[:Hd, :Wd].astype(float)
    cellp = cell * B
    c, s = math.cos(math.pi / 4), math.sin(math.pi / 4)
    u, v = (xx * c + yy * s) / cellp, (-xx * s + yy * c) / cellp
    d = np.sqrt(((u % 1) - 0.5) ** 2 + ((v % 1) - 0.5) ** 2)
    rad = np.sqrt(np.clip(1 - g, 0, 1) / math.pi) * 1.05
    dots = np.clip((rad - d) * cellp * 0.9 + 0.5, 0, 1)
    P = int(22 * B); capH = int(50 * B) if caption else 0
    Hc, Wc = Hd + 2 * P + capH, Wd + 2 * P
    m = np.zeros((Hc + 20, Wc + 20), bool); m[10:10 + Hc, 10:10 + Wc] = True
    body, _ = torn(m, rough=1.6 * B, seed=seed, amp=0.5)
    tex = paper_texture(Hc + 20, Wc + 20, seed=seed + 2, fibers=300); tex = 1 + (tex - 1) * 0.7
    col = news[None, None, :] * tex[..., None]
    ink = np.zeros(body.shape); ink[10 + P:10 + P + Hd, 10 + P:10 + P + Wd] = dots * 0.92
    if caption:
        img = Image.new('L', (Wc + 20, Hc + 20), 0)
        ImageDraw.Draw(img).text((10 + P, 10 + P + Hd + 12 * B), caption, font=font(CP, 22 * B), fill=235)
        ink = np.maximum(ink, np.asarray(img, float) / 255)
    col = col * (1 - ink[..., None]) + INK * ink[..., None]
    save(name, col, body, text=caption)


def bake_clippings():
    halftone_clip('ponzi', 'ponzi1920.jpg', (0, 0, 600, 360), 760, 'CHARLES PONZI  ·  BOSTON, 1920', 541, cell=5.5)
    halftone_clip('face', 'ponzi1920.jpg', (230, 0, 420, 190), 520, None, 543, cell=6.5)


# ---------- investor silhouettes (black paper, bowler hats) ----------
def bake_silhouettes():
    s = B; w, h = int(240 * s), int(330 * s)
    m = np.zeros((h, w), bool)
    m |= ellipse_mask(h, w, 120 * s, 120 * s, 40 * s, 50 * s)                  # head
    m |= ellipse_mask(h, w, 120 * s, 66 * s, 44 * s, 38 * s) & (np.mgrid[:h, :w][0] < 74 * s)   # bowler crown
    m |= ellipse_mask(h, w, 120 * s, 76 * s, 70 * s, 9 * s)                    # brim
    m |= poly_mask(h, w, [(x * s, y * s) for x, y in [(106, 150), (134, 150), (138, 205), (102, 205)]]) > 0.5   # neck
    m |= poly_mask(h, w, [(x * s, y * s) for x, y in [(26, 330), (34, 262), (64, 222), (110, 206), (130, 206), (176, 222), (206, 262), (214, 330)]]) > 0.5
    m = ndi.gaussian_filter(m.astype(float), 2.0 * s) > 0.5
    for name, band, seed in (('inv_old', OCHRE, 551), ('inv_new', TEAL * 1.15, 553)):
        mm = np.pad(m, 10)
        body, _ = torn(mm, rough=0.8 * B, seed=seed, amp=0.2)
        H_, W_ = mm.shape
        tex = 1 + 0.06 * fbm(H_, W_, scales=(2, 10, 40), weights=(0.3, 0.4, 0.3), seed=seed + 2)
        col = INK[None, None, :] * 1.08 * tex[..., None]
        bnd = poly_mask(H_, W_, [((x + 0) * s + 10, y * s + 10) for x, y in [(76, 58), (164, 58), (164, 70), (76, 70)]]) * body
        col = col * (1 - bnd[..., None]) + band * bnd[..., None]
        save(name, col, body)


def bake_arrow():
    s = B; w, h = int(70 * s), int(170 * s)
    pts = [(35, 0), (70, 52), (47, 52), (47, 170), (23, 170), (23, 52), (0, 52)]
    m = np.pad(poly_mask(h, w, [(x * s, y * s) for x, y in pts]) > 0.5, 12)
    col, a = tear_sprite(m, OCHRE, 561, 1.2 * B, 0.05)
    save('arrow', col, a)


# ---------- postmark: red double ring, town and date, wavy cancel lines ----------
def bake_postmark():
    s = B; R = 150; w, h = int(760 * s), int(360 * s); cx, cy = 180 * s, 180 * s
    img = Image.new('L', (w, h), 0); d = ImageDraw.Draw(img)
    for r, wd in ((R, 7), (R - 18, 3)):
        d.ellipse([cx - r * s, cy - r * s, cx + r * s, cy + r * s], outline=255, width=int(wd * s))
    f = font(FELLSC, 30 * s)
    txt = 'BOSTON  MASS.'
    span = 150; n = len(txt)
    for i, ch in enumerate(txt):
        if ch == ' ': continue
        ang = math.radians(-90 - span / 2 + span * (i + 0.5) / n)
        x, y = cx + (R - 34) * s * math.cos(ang), cy + (R - 34) * s * math.sin(ang)
        T = int(60 * s); tile = Image.new('L', (T, T), 0); td = ImageDraw.Draw(tile)
        tw_ = td.textlength(ch, font=f); td.text((T / 2 - tw_ / 2, T / 2 - 18 * s), ch, font=f, fill=255)
        tile = tile.rotate(-math.degrees(ang) - 90, Image.BICUBIC)
        img.paste(255, (int(x - T / 2), int(y - T / 2)), tile)
    fb = font(CPB, 46 * s)
    for txt_, yy in (('AUG', 18), ('1920', 72)):
        tw = d.textlength(txt_, font=fb); d.text((cx - tw / 2, cy - 30 * s + yy * s - 20 * s), txt_, font=fb, fill=255)
    for k in range(5):
        pts = [(cx + (R + 24 + x) * s, cy + (k - 2) * 26 * s + 9 * s * math.sin(x / 34.0)) for x in range(0, 380, 4)]
        d.line(pts, fill=255, width=int(6 * s))
    ink = np.asarray(img, float) / 255
    rng = np.random.default_rng(571)
    grain = ndi.gaussian_filter(rng.random(ink.shape), 1.2)
    grain = np.clip((grain - grain.mean()) / grain.std() * 0.5 + 0.75, 0, 1)
    blot = 0.7 + 0.3 * np.clip(fbm(h, w, scales=(20, 60), weights=(0.5, 0.5), seed=573) * 0.5 + 0.5, 0, 1)
    a = ndi.gaussian_filter(ink, 0.7) * grain * blot * 0.93
    save('postmark', RED[None, None, :] * np.ones((h, w, 1)), a)


# ---------- slips ----------
def strip(name, text, fnt, size, paper, ink, seed, padx=14, pady=8, mono=False, blank=False):
    f = font(fnt, size * B)
    asc, desc = f.getmetrics()
    tw = int(f.getlength(text)); th = asc + desc
    px, py = int(padx * B), int(pady * B)
    w, h = tw + 2 * px, th + 2 * py
    P = int(8 * B)
    m = np.zeros((h + 2 * P, w + 2 * P), bool); m[P:P + h, P:P + w] = True
    body, _ = torn(m, rough=1.2 * B, seed=seed, amp=0.45)
    tex = paper_texture(h + 2 * P, w + 2 * P, seed=seed, fibers=max(10, int(w * h / 1800))); tex = 1 + (tex - 1) * 0.6
    col = paper[None, None, :] * tex[..., None]
    if blank:
        save(name + '_bg', col, body)
    img = Image.new('L', (w + 2 * P, h + 2 * P), 0)
    x0, y0 = P + px, P + py
    ImageDraw.Draw(img).text((x0, y0), text, font=f, fill=255)
    tx = np.asarray(img, float) / 255
    r_ = np.random.default_rng(seed)
    tx *= (0.85 + 0.15 * (r_.random(tx.shape) > 0.25)) if mono else (0.92 + 0.08 * (r_.random(tx.shape) > 0.2))
    col = col * (1 - tx[..., None]) + ink * tx[..., None]
    mm = save(name, col, body, text=text)
    mm['tx'] = (x0 - mm['crop'][0]) / B
    mm['adv'] = f.getlength('M') / B if mono else 0
    mm['n'] = len(text)
    return mm


RANSOM = [(FELLSC, INK * 1.05, CARD), (FELL, CARD, INK), (CPB, MUSTARD, INK), (FELLI, NEWS, INK),
          (FELLSC, OCHRE, CARD), (FELL, TEAL, CARD), (CPB, CARD, RED), (FELLSC, NEWS, INK)]


def ransom(prefix, text, size, seed0):
    out = []
    for i, ch in enumerate(text):
        if ch == ' ':
            out.append(None); continue
        f, pa, ik = RANSOM[(i * 3 + seed0) % len(RANSOM)]
        if (ch.isdigit() or ch == '%') and f.startswith('IMFe'):
            f = CPB                          # old-style figures read badly: digits from a lining face
        s = size * (0.86 + 0.28 * ((i * 7 + seed0) % 5) / 4)
        strip(f'{prefix}{i}', ch, f, s, pa, ik, seed0 * 31 + i, padx=10, pady=4)
        out.append(f'{prefix}{i}')
    return out


def bake_strips():
    T = [('t_boston', 'BOSTON, 1920', CPB, 44, CARD, INK, True),
         ('t_italy', 'ITALY', FELLSC, 64, INK * 1.05, CARD, False),
         ('t_cents', 'a few cents', CP, 36, CARD, INK, False),
         ('t_usa', 'U.S.A.', FELLSC, 64, INK * 1.05, CARD, False),
         ('t_day', '$250,000 a day', CPB, 52, CARD, INK, True),
         ('t_old', 'old investors', CP, 34, CARD, INK, False),
         ('t_new', 'new investors', CP, 34, NEWS, INK, False),
         ('t_need', '160,000,000 coupons needed', CPB, 230, CARD, INK, False),
         ('t_exist', '≈ 27,000 existed', CPB, 200, MUSTARD, INK, False)]
    for i, (n, tx, f, s, pa, ik, blank) in enumerate(T):
        strip(n, tx, f, s, pa, ik, 400 + i, mono=f.startswith('Courier'), blank=blank)
    strip('title', 'The Ponzi Scheme', FELLI, 92, INK * 1.05, CARD, 441, padx=30, pady=12)
    M['_ransom'] = dict(pct=ransom('rp', '50%', 150, 3), days=ransom('rd', 'IN 45 DAYS', 110, 5))


def subtitles():
    cues = json.load(open(os.path.join(HERE, 'cues.json')))
    for i, c in enumerate(cues):
        strip(f'sub{i:02d}', c['en'], CP, 38, CARD, INK, 600 + i, padx=14, pady=6, mono=True, blank=True)


if __name__ == '__main__':
    bake_paper(); bake_flats(); bake_cutouts(); bake_clippings(); bake_silhouettes(); bake_arrow(); bake_postmark(); bake_strips(); subtitles()
    M['_'] = dict(B=B)
    json.dump(M, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
    print('parts', len(M))
