import csv
import math

pairs = [
    {'id': '2267', 'lat': 60.989399854, 'lon': -4.677456283250024},
    {'id': '3463', 'lat': 60.839792389, 'lon': -4.6951810540500105},
    {'id': '5353', 'lat': 60.6036142065, 'lon': -4.695332187824988},
    {'id': '7674', 'lat': 60.217857712, 'lon': -4.695636387849959}
]

with open(r'C:\Users\SOHAM\Downloads\ohrc_tile_metadata_final_geo_hdf5.csv', 'r') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f'Total OHRC tiles: {len(rows)}')

for p in pairs:
    target_lat = p['lat']
    target_lon = p['lon']
    target_lon_360 = target_lon if target_lon >= 0 else target_lon + 360.0
    
    best_tile = None
    min_dist = float('inf')
    
    for r in rows:
        t_lat = float(r['lat_center'])
        t_lon = float(r['lon_center'])
        # Lunar surface distance in meters (Moon radius ~ 1737.4 km)
        # 1 deg latitude = 1737400 * pi / 180 ≈ 30323 meters
        dlat = (t_lat - target_lat) * 30323.0
        dlon = (t_lon - target_lon_360) * 30323.0 * math.cos(math.radians(target_lat))
        dist_m = math.sqrt(dlat*dlat + dlon*dlon)
        
        if dist_m < min_dist:
            min_dist = dist_m
            best_tile = r
            
    lon_deg = float(best_tile['lon_center']) - 360.0
    print(f"Pair {p['id']}: Target ({target_lat:.6f}, {target_lon:.6f}) -> Best Tile ID {best_tile['tile_id']} (hdf5_idx: {best_tile['hdf5_index']}), Center ({float(best_tile['lat_center']):.6f}, {lon_deg:.6f}), Distance: {min_dist:.1f} m, x={best_tile['x']}, y={best_tile['y']}")
