"""
Real Lunar Assets and OHRC Tile Extraction Script (SIH26166).

Extracts:
1. Four real IIRS and TMC-2 cross-sensor image pairs from C:\\Users\\SOHAM\\Downloads\\final_4_pairs.zip
2. Authoritative metadata from selected_4_pairs.csv
3. Geographically closest OHRC tiles from C:\\Users\\SOHAM\\Downloads\\ohrc_full_13770.h5
   using C:\\Users\\SOHAM\\Downloads\\ohrc_tile_metadata_final_geo_hdf5.csv
4. Saves normalized PNGs and metadata to data/demo/pairs/{pair_id}/
"""

import os
import csv
import json
import math
import shutil
import zipfile
import h5py
from PIL import Image
import numpy as np

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    demo_dir = os.path.join(root_dir, "data", "demo")
    pairs_dir = os.path.join(demo_dir, "pairs")
    os.makedirs(pairs_dir, exist_ok=True)

    zip_path = r"C:\Users\SOHAM\Downloads\final_4_pairs.zip"
    h5_path = r"C:\Users\SOHAM\Downloads\ohrc_full_13770.h5"
    ohrc_meta_path = r"C:\Users\SOHAM\Downloads\ohrc_tile_metadata_final_geo_hdf5.csv"

    print("Step 1: Extracting final_4_pairs.zip...")
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(pairs_dir)

    # Read selected_4_pairs.csv
    csv_path = os.path.join(pairs_dir, "selected_4_pairs.csv")
    pairs = []
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pairs.append({
                "pair_index": row["Pair_Index"].strip(),
                "latitude": float(row["Latitude"].strip()),
                "longitude": float(row["Longitude"].strip()),
                "tmc2_filename": os.path.basename(row["TMC2_File"].strip()),
                "iirs_filename": os.path.basename(row["IIRS_File"].strip())
            })

    print(f"Loaded {len(pairs)} pairs from selected_4_pairs.csv:")
    for p in pairs:
        print(f"  - Pair {p['pair_index']}: Lat {p['latitude']:.6f}, Lon {p['longitude']:.6f}")

    print("\nStep 2: Loading OHRC tile metadata...")
    with open(ohrc_meta_path, "r") as f:
        ohrc_rows = list(csv.DictReader(f))
    print(f"Loaded {len(ohrc_rows)} OHRC tile metadata records.")

    print("\nStep 3: Opening OHRC HDF5 and extracting closest tiles...")
    with h5py.File(h5_path, "r") as hf:
        images_ds = hf["images"]

        for p in pairs:
            pair_id = p["pair_index"]
            t_lat = p["latitude"]
            t_lon = p["longitude"]
            t_lon_360 = t_lon if t_lon >= 0 else t_lon + 360.0

            # Find nearest OHRC tile
            best_tile = None
            min_dist = float("inf")

            for r in ohrc_rows:
                c_lat = float(r["lat_center"])
                c_lon = float(r["lon_center"])
                # Lunar distance in meters (Moon radius ~1737.4 km)
                dlat = (c_lat - t_lat) * 30323.0
                dlon = (c_lon - t_lon_360) * 30323.0 * math.cos(math.radians(t_lat))
                dist = math.sqrt(dlat * dlat + dlon * dlon)

                if dist < min_dist:
                    min_dist = dist
                    best_tile = r

            hdf5_idx = int(best_tile["hdf5_index"])
            tile_id = int(best_tile["tile_id"])
            tile_lat = float(best_tile["lat_center"])
            tile_lon = float(best_tile["lon_center"]) - 360.0

            print(f"Pair {pair_id} -> Nearest OHRC Tile ID {tile_id} (hdf5_idx {hdf5_idx}) at distance {min_dist:.1f} m")

            # Create destination folder: data/demo/pairs/{pair_id}/
            dest_dir = os.path.join(pairs_dir, pair_id)
            os.makedirs(dest_dir, exist_ok=True)

            # Move/copy IIRS image
            src_iirs = os.path.join(pairs_dir, p["iirs_filename"])
            dest_iirs = os.path.join(dest_dir, "iirs.png")
            if os.path.exists(src_iirs):
                shutil.copy2(src_iirs, dest_iirs)

            # Move/copy TMC-2 image
            src_tmc2 = os.path.join(pairs_dir, p["tmc2_filename"])
            dest_tmc2 = os.path.join(dest_dir, "tmc2.png")
            if os.path.exists(src_tmc2):
                shutil.copy2(src_tmc2, dest_tmc2)

            # Extract OHRC tile from HDF5
            tile_img_data = images_ds[hdf5_idx]
            dest_ohrc = os.path.join(dest_dir, "ohrc.png")
            img = Image.fromarray(tile_img_data)
            img.save(dest_ohrc, "PNG")

            # Save pair metadata
            meta = {
                "pair_id": f"pair_{pair_id}",
                "case_id": pair_id,
                "display_name": f"Pair {pair_id}",
                "location": {
                    "latitude": t_lat,
                    "longitude": t_lon
                },
                "sensors": {
                    "IIRS": {
                        "image_url": f"/static/demo/pairs/{pair_id}/iirs.png",
                        "modality": "Hyperspectral (256 bands)",
                        "gsd_m_per_px": 86.5,
                        "status": "available",
                        "raw_file": p["iirs_filename"]
                    },
                    "TMC2": {
                        "image_url": f"/static/demo/pairs/{pair_id}/tmc2.png",
                        "modality": "Panchromatic Stereo",
                        "gsd_m_per_px": 5.0,
                        "status": "available",
                        "raw_file": p["tmc2_filename"]
                    },
                    "OHRC": {
                        "image_url": f"/static/demo/pairs/{pair_id}/ohrc.png",
                        "modality": "Panchromatic High-Res",
                        "gsd_m_per_px": 0.28,
                        "status": "geographically_associated",
                        "tile_id": tile_id,
                        "hdf5_index": hdf5_idx,
                        "lat_center": round(tile_lat, 6),
                        "lon_center": round(tile_lon, 6),
                        "distance_to_target_m": round(min_dist, 1),
                        "note": f"Closest OHRC tile (offset {min_dist:.1f} m) from ohrc_full_13770.h5"
                    }
                },
                "pair_state": {
                    "IIRS_TMC2": "spatially_paired",
                    "TMC2_OHRC": "geographic_counterpart_selected",
                    "IIRS_OHRC": "geographic_counterpart_selected",
                    "three_way": "integration_pending"
                },
                "provenance": {
                    "source": "real_processed",
                    "type": "spatially_paired_scene",
                    "confidence": None,
                    "accuracy_validated": False,
                    "notes": "Real spatially corresponding IIRS and TMC-2 scene with geographically closest OHRC counterpart tile."
                }
            }

            with open(os.path.join(dest_dir, "metadata.json"), "w") as mf:
                json.dump(meta, mf, indent=2)

    # Clean up top-level loose pngs from zip
    for p in pairs:
        for fname in [p["iirs_filename"], p["tmc2_filename"]]:
            fpath = os.path.join(pairs_dir, fname)
            if os.path.exists(fpath):
                try:
                    os.remove(fpath)
                except Exception:
                    pass

    print("\nStep 4: Copying pairs directory to backend/data/demo/pairs/ for synchronization...")
    backend_demo_dir = os.path.join(root_dir, "backend", "data", "demo", "pairs")
    os.makedirs(os.path.dirname(backend_demo_dir), exist_ok=True)
    if os.path.exists(backend_demo_dir):
        shutil.rmtree(backend_demo_dir)
    shutil.copytree(pairs_dir, backend_demo_dir)

    print("\nAll assets extracted and synchronized successfully!")

if __name__ == "__main__":
    main()
