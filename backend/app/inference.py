from __future__ import annotations

from typing import Any
import numpy as np

from app.services import loftr_service


def init_matcher(model_package_root: str) -> None:
    """Initialize LoFTR matcher once at startup."""
    loftr_service.init_matcher(model_package_root)


def compute_cross_sensor_matches(
    ohrc: np.ndarray,
    tmc2: np.ndarray,
    iirs: np.ndarray,
    cache_key: str | None = None,
) -> dict[str, Any]:
    """Delegate cross-sensor correspondence to loftr_service."""
    return loftr_service.compute_cross_sensor_matches(ohrc, tmc2, iirs, cache_key=cache_key)

