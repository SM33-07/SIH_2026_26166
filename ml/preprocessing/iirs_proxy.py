"""
IIRS Hyperspectral Band-Compositing Proxy Engine for Lunar Image Correspondence (SIH26166).

Constructs a synthetic panchromatic-like composite image from selected IIRS 256 bands (0.8–5.0 µm)
to enable cross-modal correspondence with panchromatic OHRC/TMC-2 sensors.
"""

import numpy as np
import cv2
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass

@dataclass
class ProxyImageMetadata:
    source_bands: List[int]
    weights: List[float]
    normalization: str
    output_shape: Tuple[int, int]
    modality_label: str = "IIRS-PAN-PROXY"

def build_iirs_proxy(
    cube: np.ndarray,
    band_indices: Optional[List[int]] = None,
    weights: Optional[List[float]] = None,
    normalization: str = "percentile"
) -> Tuple[np.ndarray, ProxyImageMetadata]:
    """
    Synthesizes a panchromatic-like proxy image from a 3D IIRS hyperspectral cube (H x W x Bands)
    or a multi-channel/2D representation.
    """
    if cube.ndim == 2:
        # Single 2D slice or pseudo-cube
        proxy_img = cube.astype(np.float32)
        selected_bands = [0]
        used_weights = [1.0]
    elif cube.ndim == 3:
        num_bands = cube.shape[2]
        if band_indices is None or len(band_indices) == 0:
            # Default: sample evenly across near-IR, short-wave IR, and thermal IR range
            selected_bands = list(np.linspace(10, num_bands - 10, num=min(16, num_bands), dtype=int))
        else:
            selected_bands = [b for b in band_indices if 0 <= b < num_bands]
            if len(selected_bands) == 0:
                selected_bands = [0]

        if weights is None or len(weights) != len(selected_bands):
            # Equal weighting across selected spectral bands
            used_weights = [1.0 / len(selected_bands)] * len(selected_bands)
        else:
            weight_sum = float(sum(weights))
            used_weights = [w / max(1e-5, weight_sum) for w in weights]

        # Accumulate weighted spectral bands
        composite = np.zeros(cube.shape[:2], dtype=np.float32)
        for idx, band_idx in enumerate(selected_bands):
            band_data = cube[:, :, band_idx].astype(np.float32)
            # Clip band noise outliers
            p2, p98 = np.percentile(band_data, (2.0, 98.0))
            if p98 > p2:
                band_norm = (np.clip(band_data, p2, p98) - p2) / (p98 - p2)
            else:
                band_norm = band_data
            composite += band_norm * used_weights[idx]
        proxy_img = composite
    else:
        raise ValueError(f"Invalid IIRS cube shape: {cube.shape}")

    # Final normalization to uint8
    if normalization == "percentile":
        p_low, p_high = np.percentile(proxy_img, (1.0, 99.0))
        if p_high > p_low:
            proxy_uint8 = (np.clip((proxy_img - p_low) / (p_high - p_low), 0, 1) * 255.0).astype(np.uint8)
        else:
            proxy_uint8 = ((proxy_img - proxy_img.min()) / max(1e-5, (proxy_img.max() - proxy_img.min())) * 255.0).astype(np.uint8)
    else:
        proxy_uint8 = cv2.normalize(proxy_img, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)

    metadata = ProxyImageMetadata(
        source_bands=selected_bands if cube.ndim == 3 else [0],
        weights=used_weights if cube.ndim == 3 else [1.0],
        normalization=normalization,
        output_shape=proxy_uint8.shape
    )

    return proxy_uint8, metadata
