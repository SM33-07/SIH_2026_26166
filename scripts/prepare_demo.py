"""
Offline Demo Dataset Generator (SIH26166).

Generates high-quality lunar imagery chips and metadata for hackathon demonstration:
1. OHRC Illumination Pair (OHRC 0.25m, Sun Elev 15° vs 50°)
2. OHRC ↔ TMC-2 Scale Pair (OHRC 0.25m vs TMC-2 5.0m - 20x GSD gap)
3. IIRS Hyperspectral Proxy Pair (IIRS 80m 256-band composite vs OHRC 0.25m)

Run:
python scripts/prepare_demo.py
"""

import os
import sys
import json
import cv2
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.synthetic.relit_generator import generate_synthetic_lunar_surface, relight_lunar_dem
from ml.preprocessing.iirs_proxy import build_iirs_proxy

def prepare_demo_dataset():
    data_dir = os.path.join("data", "demo")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(os.path.join("data", "raw", "ohrc"), exist_ok=True)
    os.makedirs(os.path.join("data", "raw", "tmc2"), exist_ok=True)
    os.makedirs(os.path.join("data", "raw", "iirs"), exist_ok=True)

    print("Generating synthetic lunar DEM terrain...")
    dem = generate_synthetic_lunar_surface(height=768, width=768, crater_density=35, seed=2026)

    # 1. OHRC Illumination Pair
    print("Generating Demo Pair 1: OHRC Illumination Difference...")
    img_ohrc_a, meta_ohrc_a = relight_lunar_dem(dem, sun_elevation_deg=18.0, sun_azimuth_deg=45.0)
    img_ohrc_b, meta_ohrc_b = relight_lunar_dem(dem, sun_elevation_deg=52.0, sun_azimuth_deg=65.0)

    # Apply minor affine shift to simulate orbit acquisition alignment difference
    M_rot = cv2.getRotationMatrix2D((384, 384), angle=3.5, scale=0.98)
    M_rot[0, 2] += 12.0
    M_rot[1, 2] -= 8.0
    img_ohrc_b = cv2.warpAffine(img_ohrc_b, M_rot, (768, 768))

    path_ohrc_a = os.path.join(data_dir, "ohrc_sun18deg.png")
    path_ohrc_b = os.path.join(data_dir, "ohrc_sun52deg.png")
    cv2.imwrite(path_ohrc_a, img_ohrc_a)
    cv2.imwrite(path_ohrc_b, img_ohrc_b)

    # 2. OHRC vs TMC-2 Scale Gap Pair (~20x GSD ratio)
    print("Generating Demo Pair 2: OHRC (0.25m) vs TMC-2 (5.0m) Scale Gap...")
    crop_ohrc = img_ohrc_a[128:640, 128:640] # OHRC crop
    # Downsample to simulate TMC-2 ~5m resolution
    h_crop, w_crop = crop_ohrc.shape
    tmc2_small = cv2.resize(crop_ohrc, (w_crop // 16, h_crop // 16), interpolation=cv2.INTER_AREA)
    tmc2_upscaled = cv2.resize(tmc2_small, (w_crop, h_crop), interpolation=cv2.INTER_NEAREST)

    path_ohrc_scale = os.path.join(data_dir, "ohrc_highres_025m.png")
    path_tmc2_scale = os.path.join(data_dir, "tmc2_lowres_5m.png")
    cv2.imwrite(path_ohrc_scale, crop_ohrc)
    cv2.imwrite(path_tmc2_scale, tmc2_upscaled)

    # 3. IIRS 256-band Hyperspectral Proxy Pair
    print("Generating Demo Pair 3: IIRS Hyperspectral 256-Band Proxy...")
    # Create 3D synthetic cube H x W x 256
    cube_h, cube_w = 256, 256
    cube_dem = cv2.resize(dem, (cube_w, cube_h))
    iirs_cube = np.zeros((cube_h, cube_w, 256), dtype=np.float32)

    for b in range(256):
        # Wavelength dependent absorption feature simulation
        wave_um = 0.8 + (b / 256.0) * 4.2
        band_img, _ = relight_lunar_dem(cube_dem, sun_elevation_deg=35.0 + np.sin(b * 0.05) * 5.0, sun_azimuth_deg=50.0)
        # Add absorption band attenuation around 1.0um and 2.0um pyroxene bands
        attenuation = 1.0 - 0.3 * np.exp(-((wave_um - 1.0) ** 2) / 0.08) - 0.4 * np.exp(-((wave_um - 2.0) ** 2) / 0.15)
        iirs_cube[:, :, b] = band_img.astype(np.float32) * attenuation

    iirs_proxy_img, proxy_meta = build_iirs_proxy(iirs_cube)
    path_iirs_proxy = os.path.join(data_dir, "iirs_composite_proxy.png")
    cv2.imwrite(path_iirs_proxy, iirs_proxy_img)

    # Save metadata index manifest
    manifest = {
        "pairs": [
            {
                "id": "pair1_ohrc_illumination",
                "name": "OHRC Multi-Sun Angle (18° vs 52°)",
                "image_a": "ohrc_sun18deg.png",
                "image_b": "ohrc_sun52deg.png",
                "instrument_a": "OHRC",
                "instrument_b": "OHRC",
                "gsd_a": 0.25,
                "gsd_b": 0.25,
                "sun_elevation_a": 18.0,
                "sun_elevation_b": 52.0,
                "description": "Examines illumination robustness across extreme solar incidence variation."
            },
            {
                "id": "pair2_ohrc_tmc2_scale",
                "name": "OHRC (0.25m) ↔ TMC-2 (5.0m) Scale Gap",
                "image_a": "ohrc_highres_025m.png",
                "image_b": "tmc2_lowres_5m.png",
                "instrument_a": "OHRC",
                "instrument_b": "TMC2",
                "gsd_a": 0.25,
                "gsd_b": 5.0,
                "sun_elevation_a": 25.0,
                "sun_elevation_b": 25.0,
                "description": "Tests multi-scale pyramid matching across a 20x spatial resolution gap."
            },
            {
                "id": "pair3_iirs_proxy",
                "name": "IIRS (256-band Composite Proxy) ↔ OHRC",
                "image_a": "ohrc_highres_025m.png",
                "image_b": "iirs_composite_proxy.png",
                "instrument_a": "OHRC",
                "instrument_b": "IIRS",
                "gsd_a": 0.25,
                "gsd_b": 80.0,
                "sun_elevation_a": 25.0,
                "sun_elevation_b": 35.0,
                "spectral_bands": list(range(256)),
                "description": "Evaluates cross-modal correspondence using synthesized panchromatic proxy."
            }
        ]
    }

    manifest_path = os.path.join(data_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Successfully generated demo dataset in {data_dir}!")

if __name__ == "__main__":
    prepare_demo_dataset()
