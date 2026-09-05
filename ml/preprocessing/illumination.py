"""
Illumination Normalization for Lunar Optical Imagery (SIH26166).

Includes:
- Min-Max & Percentile Normalization
- Contrast Limited Adaptive Histogram Equalization (CLAHE)
- Photometric Lunar-Lambertian Approximation for Sun-Angle Variation
"""

import cv2
import numpy as np
from typing import Optional, Dict, Any, Tuple

def normalize_intensity(image: np.ndarray, percentile_range: Tuple[float, float] = (1.0, 99.0)) -> np.ndarray:
    """Percentile clipping and min-max normalization to uint8 [0, 255]."""
    if image.dtype != np.float32 and image.dtype != np.float64:
        img_float = image.astype(np.float32)
    else:
        img_float = image.copy()
        
    p_low, p_high = np.percentile(img_float, percentile_range)
    if p_high > p_low:
        img_clipped = np.clip(img_float, p_low, p_high)
        img_norm = ((img_clipped - p_low) / (p_high - p_low) * 255.0).astype(np.uint8)
    else:
        img_norm = ((img_float - img_float.min()) / max(1e-5, (img_float.max() - img_float.min())) * 255.0).astype(np.uint8)
    return img_norm

def apply_clahe(image: np.ndarray, clip_limit: float = 3.0, tile_grid_size: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """Adaptive contrast enhancement suited for low-contrast lunar regions."""
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
        
    if gray.dtype != np.uint8:
        gray = normalize_intensity(gray)
        
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    return clahe.apply(gray)

def lunar_lambertian_correction(
    image: np.ndarray,
    sun_elevation_deg: Optional[float] = None,
    sun_azimuth_deg: Optional[float] = None,
    dem_normal_map: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Photometric illumination normalization.
    Uses physical Lunar-Lambertian model when sun angles/normals are present,
    or local gradient-based photometric suppression as robust fallback.
    """
    if image.dtype != np.uint8:
        img_gray = normalize_intensity(image)
    else:
        img_gray = image.copy()

    if sun_elevation_deg is not None and sun_azimuth_deg is not None:
        # Convert angles to solar incidence vector
        el_rad = np.radians(sun_elevation_deg)
        az_rad = np.radians(sun_azimuth_deg)
        s_x = np.cos(el_rad) * np.sin(az_rad)
        s_y = np.cos(el_rad) * np.cos(az_rad)
        s_z = np.sin(el_rad)

        if dem_normal_map is not None:
            # Physical dot product between surface normals and sun direction
            cos_i = np.maximum(0.1, dem_normal_map[:, :, 0]*s_x + dem_normal_map[:, :, 1]*s_y + dem_normal_map[:, :, 2]*s_z)
            corrected = (img_gray.astype(np.float32) / (cos_i + 1e-5))
            return normalize_intensity(corrected)

    # Robust local photometric normalization fallback (multi-scale Gaussian quotient)
    img_f = img_gray.astype(np.float32) + 1.0
    blur_large = cv2.GaussianBlur(img_f, (0, 0), sigmaX=31)
    normalized_f = img_f / (blur_large + 1e-5)
    return normalize_intensity(normalized_f)

def preprocess_illumination(
    image: np.ndarray,
    use_clahe: bool = True,
    use_lambertian: bool = True,
    sun_elevation_deg: Optional[float] = None,
    sun_azimuth_deg: Optional[float] = None
) -> np.ndarray:
    """Full preprocessing pipeline for illumination invariance."""
    processed = image
    if len(processed.shape) == 3:
        processed = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
        
    if use_lambertian:
        processed = lunar_lambertian_correction(processed, sun_elevation_deg, sun_azimuth_deg)
        
    if use_clahe:
        processed = apply_clahe(processed, clip_limit=2.5)
        
    return processed
