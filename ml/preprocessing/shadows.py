"""
Shadow Detection and Feature Masking for Lunar Imagery (SIH26166).

Identifies near-zero signal shadowed regions in lunar optical imagery
and generates valid feature masks to prevent match hallucination.
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Any

def detect_shadow_mask(
    image: np.ndarray,
    intensity_threshold: int = 25,
    adaptive_block_size: int = 31,
    morph_kernel_size: int = 5
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns:
        shadow_mask: uint8 array (255 = shadow, 0 = illuminated)
        valid_mask: uint8 array (255 = valid terrain, 0 = shadow/invalid)
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
        
    if gray.dtype != np.uint8:
        gray = ((gray - gray.min()) / max(1e-5, (gray.max() - gray.min())) * 255.0).astype(np.uint8)

    # Combined absolute thresholding + local contrast thresholding
    abs_shadow = (gray < intensity_threshold).astype(np.uint8) * 255
    
    # Local adaptive thresholding for deep crater shadows
    adaptive_thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, adaptive_block_size, 15
    )
    
    # Combined shadow candidate
    raw_shadow = cv2.bitwise_and(abs_shadow, adaptive_thresh)
    
    # Morphological cleaning
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (morph_kernel_size, morph_kernel_size))
    shadow_mask = cv2.morphologyEx(raw_shadow, cv2.MORPH_CLOSE, kernel)
    shadow_mask = cv2.morphologyEx(shadow_mask, cv2.MORPH_OPEN, kernel)
    
    valid_mask = cv2.bitwise_not(shadow_mask)
    return shadow_mask, valid_mask
