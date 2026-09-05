"""
Synthetic Lunar Relighting & Multi-Illumination Generator (SIH26166).

Simulates physically-based lunar surface shading (Lambertian / Lommel-Seeliger)
under varying sun elevation & azimuth angles from surface normal digital elevation models (DEMs).
"""

import cv2
import numpy as np
from typing import Tuple, List, Dict, Any, Optional

def generate_synthetic_lunar_surface(
    height: int = 512,
    width: int = 512,
    crater_density: int = 25,
    seed: int = 42
) -> np.ndarray:
    """Generates a synthetic lunar elevation DEM containing realistic impact craters."""
    np.random.seed(seed)
    dem = np.zeros((height, width), dtype=np.float32)

    # Base low-frequency undulating terrain
    x = np.linspace(0, 4 * np.pi, width)
    y = np.linspace(0, 4 * np.pi, height)
    xx, yy = np.meshgrid(x, y)
    dem += np.sin(xx) * np.cos(yy) * 15.0

    # Add craters of varying radii
    for _ in range(crater_density):
        cx = np.random.randint(20, width - 20)
        cy = np.random.randint(20, height - 20)
        radius = np.random.randint(8, 60)
        depth = np.random.uniform(10.0, 45.0)

        y_indices, x_indices = np.ogrid[:height, :width]
        dist_sq = (x_indices - cx) ** 2 + (y_indices - cy) ** 2
        crater_mask = dist_sq <= radius ** 2

        # Bowl-shaped crater profile with raised rim
        r_norm = np.sqrt(dist_sq[crater_mask].astype(np.float32)) / radius
        bowl = -depth * (1.0 - r_norm ** 2)
        rim = (depth * 0.25) * np.exp(-((r_norm - 1.0) ** 2) / 0.05)
        dem[crater_mask] += (bowl + rim)

    # Add multi-scale fractal noise
    noise = np.random.normal(0, 1.5, (height, width)).astype(np.float32)
    dem += cv2.GaussianBlur(noise, (5, 5), 1.0)
    return dem

def compute_dem_normals(dem: np.ndarray) -> np.ndarray:
    """Computes unit surface normal vectors (H x W x 3) from DEM."""
    dz_dx = cv2.Sobel(dem, cv2.CV_32F, 1, 0, ksize=3)
    dz_dy = cv2.Sobel(dem, cv2.CV_32F, 0, 1, ksize=3)

    normals = np.zeros((dem.shape[0], dem.shape[1], 3), dtype=np.float32)
    normals[:, :, 0] = -dz_dx
    normals[:, :, 1] = -dz_dy
    normals[:, :, 2] = 1.0

    # Normalize vectors
    norm = np.linalg.norm(normals, axis=2, keepdims=True)
    normals /= np.maximum(1e-5, norm)
    return normals

def relight_lunar_dem(
    dem: np.ndarray,
    sun_elevation_deg: float,
    sun_azimuth_deg: float,
    albedo: float = 0.12
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Renders synthetic optical image under specific solar elevation & azimuth."""
    normals = compute_dem_normals(dem)

    el_rad = np.radians(sun_elevation_deg)
    az_rad = np.radians(sun_azimuth_deg)

    # Sun direction vector
    s_x = np.cos(el_rad) * np.sin(az_rad)
    s_y = np.cos(el_rad) * np.cos(az_rad)
    s_z = np.sin(el_rad)

    sun_vec = np.array([s_x, s_y, s_z], dtype=np.float32)

    # Lambertian shading (dot product N . S)
    cos_i = np.sum(normals * sun_vec, axis=2)
    cos_i = np.maximum(0.0, cos_i)

    # Lommel-Seeliger lunar photometric approximation: I = albedo * cos_i / (cos_i + cos_e)
    # For near-nadir viewing, cos_e ~ 1.0
    intensity = albedo * (cos_i / (cos_i + 1.0 + 1e-5))

    # Scale to uint8 [0, 255]
    p1, p99 = np.percentile(intensity, (0.5, 99.5))
    if p99 > p1:
        img_uint8 = (np.clip((intensity - p1) / (p99 - p1), 0, 1) * 255.0).astype(np.uint8)
    else:
        img_uint8 = ((intensity - intensity.min()) / max(1e-5, intensity.max() - intensity.min()) * 255.0).astype(np.uint8)

    meta = {
        "sun_elevation_deg": sun_elevation_deg,
        "sun_azimuth_deg": sun_azimuth_deg,
        "albedo": albedo,
        "height": dem.shape[0],
        "width": dem.shape[1]
    }
    return img_uint8, meta
