"""Project the Natural Earth outlines onto the sheet (the regional map) and the inset (the roundel), clip them,
and split them into: land rings by country, the United States area (south of 49°N on the mainland + US polygons),
the Point Roberts tip, and coastline polylines (no land border, no frame edges). -> data/map.json"""
import json, math, sys, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = json.load(open(f'{D}/data/region.json'))
LAT0 = 48.6; KX = 111.32 * math.cos(math.radians(LAT0)); KY = 111.13
def proj(view):
    lon0, lat0, cx, cy, k = view   # lon/lat at screen point (cx, cy), k px per km
    return lambda lon, lat: (round(cx + (lon - lon0) * KX * k, 2), round(cy - (lat - lat0) * KY * k, 2))
def clip_half(ring, inside, inter):
    out = []
    for i in range(len(ring)):
        a, b = ring[i - 1], ring[i]; ia, ib = inside(a), inside(b)
        if ib:
            if not ia: out.append(inter(a, b))
            out.append(b)
        elif ia: out.append(inter(a, b))
    return out
def clip_rect(ring, x0, y0, x1, y1):
    def ix(a, b, x): t = (x - a[0]) / (b[0] - a[0]); return (x, a[1] + t * (b[1] - a[1]))
    def iy(a, b, y): t = (y - a[1]) / (b[1] - a[1]); return (a[0] + t * (b[0] - a[0]), y)
    for ins, it in [(lambda p: p[0] >= x0, lambda a, b: ix(a, b, x0)), (lambda p: p[0] <= x1, lambda a, b: ix(a, b, x1)),
                    (lambda p: p[1] >= y0, lambda a, b: iy(a, b, y0)), (lambda p: p[1] <= y1, lambda a, b: iy(a, b, y1))]:
        if len(ring) < 3: return []
        ring = clip_half(ring, ins, it)
    return ring
def clip_ll(ring, cond, inter):  # clip in lon/lat
    return clip_half(ring, cond, inter)
def lat_cut(lat, below=True):
    return (lambda p: p[1] < lat if below else p[1] >= lat), (lambda a, b: (a[0] + (lat - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), lat))
def lon_cut(lon, west=True):
    return (lambda p: p[0] < lon if west else p[0] >= lon), (lambda a, b: (lon, a[1] + (lon - a[0]) / (b[0] - a[0]) * (b[1] - a[1])))
# which polygons: Point Roberts (USA, tiny, near -123.06/48.98) and the Canadian mainland (contains Tsawwassen)
def bbox(r): xs = [p[0] for p in r]; ys = [p[1] for p in r]; return min(xs), min(ys), max(xs), max(ys)
usa = [p[0] for p in R['USA']]; can = [p[0] for p in R['CAN']]
pr = next(r for r in usa if (lambda b: b[0] > -123.2 and b[2] < -122.9 and b[1] > 48.9)(bbox(r)))
canm = max(can, key=len)
SPLIT = -122.95   # a meridian in Boundary Bay: west of it, the land below 49°N is the Point Roberts tip
def below49(r, west):
    c, i = lat_cut(49.0, True); r = clip_ll(r, c, i)
    c, i = lon_cut(SPLIT, west); return clip_ll(r, c, i) if len(r) > 2 else []
us_ll = [r for r in usa if r is not pr] + [below49(canm, False)]
tip_ll = [pr, below49(canm, True)]
def is_border(a, b): return 48.988 <= a[1] <= 48.9935 and 48.988 <= b[1] <= 48.9935   # NE's land border sits at 48.9925
def coast_lines(rings, P, x0, y0, x1, y1):
    out = []
    for r in rings:
        if len(r) < 3: continue
        b = bbox(r)
        cur = []
        for i in range(len(r) + 1):
            a, c = r[i - 1], r[i % len(r)]
            pa, pc = P(*a), P(*c)
            ok = not is_border(a, c) and x0 - 5 < pa[0] < x1 + 5 and y0 - 5 < pa[1] < y1 + 5 and x0 - 5 < pc[0] < x1 + 5 and y0 - 5 < pc[1] < y1 + 5
            if ok:
                if not cur: cur = [pa]
                cur.append(pc)
            elif cur:
                if len(cur) > 1: out.append(cur)
                cur = []
        if len(cur) > 1: out.append(cur)
    return out
def build(view, frame, simplify=0.8):
    P = proj(view); x0, y0, x1, y1 = frame
    def pr_rings(rings):
        res = []
        for r in rings:
            if len(r) < 3: continue
            q = clip_rect([P(*p) for p in r], x0, y0, x1, y1)
            if len(q) >= 3: res.append(thin(q, simplify))
        return res
    allr = usa + can
    return dict(view=view, frame=frame,
                land=pr_rings(allr), can=pr_rings([r for r in can]), us=pr_rings(us_ll), tip=pr_rings(tip_ll),
                coast=[thin(l, simplify) for l in coast_lines(allr, P, x0, y0, x1, y1)])
def thin(pts, tol):
    out = [pts[0]]
    for p in pts[1:]:
        if math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) >= tol: out.append(p)
    return out
MAIN = build((-125.8, 50.6, 40, 300, 1000 / (4.6 * KX)), (40, 300, 1040, 1614))
INSET = build((-122.93, 49.012, 500, 500, 1000 / 54), (-40, -40, 1040, 1040), 0.6)   # authored for radius 500 (diameter ≈ 54 km)
json.dump(dict(main=MAIN, inset=INSET, KX=KX, KY=KY), open(f'{D}/data/map.json', 'w'))
for n, M in (('main', MAIN), ('inset', INSET)):
    print(n, 'land', len(M['land']), 'pts', sum(map(len, M['land'])), 'coast', len(M['coast']), sum(map(len, M['coast'])), 'us', len(M['us']), 'tip', len(M['tip']), [len(r) for r in M['tip']])
