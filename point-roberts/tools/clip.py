"""Clip Natural Earth 10m countries (USA, Canada) to the Pacific Northwest box -> data/region.json"""
import json, sys
src, out = sys.argv[1], sys.argv[2]
BOX = (-128.0, 45.3, -118.0, 52.0)   # lon0, lat0, lon1, lat1
G = json.load(open(src))
res = {}
for f in G['features']:
    iso = f['properties'].get('ADM0_A3')
    if iso not in ('USA', 'CAN'): continue
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    keep = []
    for poly in polys:
        ring = poly[0]
        xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
        if max(xs) < BOX[0] or min(xs) > BOX[2] or max(ys) < BOX[1] or min(ys) > BOX[3]: continue
        keep.append([[[round(x, 5), round(y, 5)] for x, y in r] for r in poly])
    res[iso] = keep
    print(iso, len(keep), 'polygons', sum(len(p[0]) for p in keep), 'pts')
json.dump(res, open(out, 'w'))
