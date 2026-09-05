"""
Scale Pyramid & Multi-Scale Normalization for Lunar Image Correspondence (SIH26166).

Handles scale gaps up to ~20x GSD ratio between OHRC (0.25m) and TMC-2 (5m).
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any

class ScalePyramid:
    def __init__(self, num_levels: int = 5, scale_factor: float = 0.5):
        self.num_levels = num_levels
        self.scale_factor = scale_factor

    def build_pyramid(self, image: np.ndarray) -> List[np.ndarray]:
        """Generates Gaussian pyramid levels from Level 0 (original) to Level N-1."""
        pyramid = [image]
        current = image
        for level in range(1, self.num_levels):
            h, w = current.shape[:2]
            new_h, new_w = int(h * self.scale_factor), int(w * self.scale_factor)
            if new_h < 32 or new_w < 32:
                break
            current = cv2.resize(current, (new_w, new_h), interpolation=cv2.INTER_AREA)
            pyramid.append(current)
        return pyramid

def estimate_scale_ratio(
    gsd_a: Optional[float] = None,
    gsd_b: Optional[float] = None,
    image_a_shape: Tuple[int, int] = (512, 512),
    image_b_shape: Tuple[int, int] = (512, 512)
) -> float:
    """Estimates relative resolution scale factor between Image A and Image B."""
    if gsd_a is not None and gsd_b is not None and gsd_a > 0 and gsd_b > 0:
        return gsd_b / gsd_a  # e.g., 5.0 / 0.25 = 20.0
    
    # Fallback to dimension ratio assumption
    ratio_h = image_a_shape[0] / max(1, image_b_shape[0])
    ratio_w = image_a_shape[1] / max(1, image_b_shape[1])
    return (ratio_h + ratio_w) / 2.0

def resize_for_matching(
    image: np.ndarray,
    target_scale: float = 1.0,
    max_dimension: int = 1024
) -> Tuple[np.ndarray, float]:
    """Resizes image by target_scale and caps at max_dimension to safeguard GPU/CPU VRAM."""
    h, w = image.shape[:2]
    effective_scale = target_scale
    
    if int(w * target_scale) > max_dimension or int(h * target_scale) > max_dimension:
        effective_scale = max_dimension / float(max(h, w))

    if abs(effective_scale - 1.0) > 1e-3:
        new_w = max(16, int(w * effective_scale))
        new_h = max(16, int(h * effective_scale))
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA if effective_scale < 1.0 else cv2.INTER_CUBIC)
        return resized, effective_scale
    return image, 1.0
