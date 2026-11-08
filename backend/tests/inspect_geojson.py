import os, sys, json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import SessionLocal
from app.api.v1.endpoints.wards import get_wards_geojson

db = SessionLocal()
gj = get_wards_geojson(db)
print(f"Total features: {len(gj.features)}")

all_lons = []
all_lats = []

for i, f in enumerate(gj.features):
    props = f.properties
    geom = f.geometry
    coords = geom.get("coordinates", [])
    num_coords = len(coords[0]) if coords else 0
    lons = [c[0] for c in coords[0]] if coords else []
    lats = [c[1] for c in coords[0]] if coords else []
    all_lons.extend(lons)
    all_lats.extend(lats)
    bbox = [min(lons), min(lats), max(lons), max(lats)] if lons else []
    is_closed = (coords[0][0] == coords[0][-1]) if coords and len(coords[0]) > 0 else False

    # Check ring validity (at least 4 points including closure, closed)
    is_valid = len(coords[0]) >= 4 and is_closed

    print(f"--- Feature {i+1} ---")
    print(f"ID: {f.id}")
    print(f"Study Area ID: {props.get('study_area_id')}")
    print(f"Code: {props.get('code')}")
    print(f"Name: {props.get('name')}")
    print(f"Geometry Type: {geom.get('type')}")
    print(f"Coordinates Count: {num_coords}")
    print(f"Ring Closed: {is_closed}")
    print(f"Geometry Valid: {is_valid}")
    print(f"Bounding Box: [min_lon={bbox[0]:.4f}, min_lat={bbox[1]:.4f}, max_lon={bbox[2]:.4f}, max_lat={bbox[3]:.4f}]")
    print(f"Climate Debt Score: {props.get('climate_debt_score')}")
    print(f"Risk Category: {props.get('status_badge')}")
    print(f"First Coord: {coords[0][0] if coords else None}")
    print(f"Last Coord:  {coords[0][-1] if coords else None}")

print(f"\nCOMBINED BOUNDS:")
print(f"SW: [{min(all_lons):.4f}, {min(all_lats):.4f}]")
print(f"NE: [{max(all_lons):.4f}, {max(all_lats):.4f}]")
print(f"Center: [{(min(all_lons)+max(all_lons))/2:.4f}, {(min(all_lats)+max(all_lats))/2:.4f}]")
