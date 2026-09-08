"""Derive only vetted path attributes from Simplemaps SVG. Never redraw boundaries.
Usage: python3 scripts/prepare-travel-map.py /path/to/downloaded/kz.svg
Source: https://simplemaps.com/static/svg/country/kz/admin1/kz.svg
"""
import json, sys, hashlib, xml.etree.ElementTree as ET
from pathlib import Path
source=Path(sys.argv[1]); data=source.read_bytes(); root=ET.fromstring(data)
paths=[{k:p.attrib[k] for k in ('id','name','d')} for p in root.iter() if p.tag.endswith('path')]
assert len(paths)==20 and len({p['id'] for p in paths})==20
assert {'KZ10','KZ33','KZ62','KZ71','KZ75','KZ79'} <= {p['id'] for p in paths}
Path('public/travel/boundaries.json').write_text(json.dumps(paths,separators=(',',':')))
print('20 geographic features; source SHA256:',hashlib.sha256(data).hexdigest())
