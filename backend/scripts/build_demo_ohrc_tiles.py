"""
Deterministic OHRC Tile Counterpart Selector and Extractor (SIH26166).
Loads ohrc_tile_metadata_final_geo_hdf5.csv and extracts corresponding tiles
from ohrc_full_13770.h5 for the 4 real target coordinates using lunar surface distance.
"""

import os
import math
import pandas as pd
import numpy as np
from PIL import Image

try:
    import h5py
except ImportError:
    h5py = None

TARGET_COORDINATES = {
    "pair_2267": {"lat": 60.989399854, "lon": -4.677456283250024},
    "pair_3463": {"lat": 60.839792389, "lon": -4.6951810540500105},
    "pair_5353": {"lat": 60.6036142065, "lon": -4.695332187824988},
    "pair_7674": {"lat": 60.217857712, "lon": -4.695636387849959}
}

R_MOON_M = 1737400.0  # Mean lunar radius in meters

def lunar_surface_distance_m(lat1_deg, lon1_deg, lat2_deg, lon2_deg):
    """Computes great-circle distance on the Moon in meters."""
    phi1 = math.radians(lat1_deg)
    phi2 = math.radians(lat2_deg)
    dphi = math.radians(lat2_deg - lat1_deg)
    dlambda = math.radians(lon2_deg - lon1_deg)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R_MOON_M * c

def find_nearest_ohrc_tiles(csv_path):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"OHRC metadata CSV not found: {csv_path}")
    
    df = pd.read_csv(csv_path)
    # Detect coordinate column names
    lat_col = [c for c in df.columns if "lat" in c.lower()][0]
    lon_col = [c for c in df.columns if "lon" in c.lower()][0]

    results = {}
    for pair_id, coords in TARGET_COORDINATES.items():
        t_lat = coords["lat"]
        t_lon_360 = coords["lon"] + 360.0 if coords["lon"] < 0 else coords["lon"]

        min_dist = float("inf")
        best_row = None
        best_idx = -1

        for idx, row in df.iterrows():
            r_lat = row[lat_col]
            r_lon = row[lon_col]
            dist_m = lunar_surface_distance_m(t_lat, t_lon_360, r_lat, r_lon)
            if dist_m < min_dist:
                min_dist = dist_m
                best_row = row
                best_idx = idx

        results[pair_id] = {
            "pair_id": pair_id,
            "hdf5_index": int(best_idx),
            "tile_id": int(best_row.get("tile_id", best_idx)),
            "lat_center": round(float(best_row[lat_col]), 6),
            "lon_center": round(float(best_row[lon_col] - 360.0 if best_row[lon_col] > 180 else best_row[lon_col]), 6),
            "distance_to_target_m": round(min_dist, 1)
        }
    return results

def extract_tile_image(h5_path, hdf5_index, output_png_path):
    if h5py is None:
        print("h5py is not installed; cannot extract from HDF5.")
        return False
    if not os.path.exists(h5_path):
        print(f"HDF5 file not found at {h5_path}")
        return False

    with h5py.File(h5_path, "r") as f:
        ds_names = list(f.keys())
        ds = f[ds_names[0]]
        tile = ds[hdf5_index]
        # Normalize and save as PNG
        if tile.dtype != np.uint8:
            t_min, t_max = float(np.min(tile)), float(np.max(tile))
            if t_max > t_min:
                tile = ((tile - t_min) / (t_max - t_min) * 255.0).astype(np.uint8)
            else:
                tile = np.zeros_like(tile, dtype=np.uint8)
        
        os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
        img = Image.fromarray(tile)
        img.save(output_png_path, "PNG")
        print(f"Extracted and saved: {output_png_path}")
        return True

if __name__ == "__main__":
    print("OHRC Counterpart Selection Utility for SIH26166")
