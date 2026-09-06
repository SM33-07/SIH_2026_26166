from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image


def npy_to_base64_png(arr: np.ndarray) -> str:
    """Convert a numpy array to a high-contrast base64-encoded PNG string.

    Applies dynamic range contrast normalization so lunar craters and
    features are crisp and clearly visible across all 3 sensors.
    """
    arr_f = arr.astype(np.float32)
    arr_min = float(arr_f.min())
    arr_max = float(arr_f.max())

    if arr_max > arr_min:
        arr_norm = ((arr_f - arr_min) / (arr_max - arr_min) * 255.0).clip(0, 255).astype(np.uint8)
    else:
        arr_norm = np.zeros(arr.shape[:2], dtype=np.uint8)

    if arr_norm.ndim == 2:
        img = Image.fromarray(arr_norm, mode="L")
    elif arr_norm.ndim == 3 and arr_norm.shape[2] == 1:
        img = Image.fromarray(arr_norm[:, :, 0], mode="L")
    else:
        img = Image.fromarray(arr_norm)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")
