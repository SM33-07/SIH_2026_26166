from __future__ import annotations

import os
from typing import Any, Optional, Tuple
import numpy as np

from app.config import settings

_IIRS_NOTE = "IIRS geolocation is approximate in the current proxy product."

# Regional bounds specification
REGIONAL_BOUNDS = {
    "CH2_LANDING_ZONE": {
        "name": "Chandrayaan-2 Landing Zone",
        "lat_min": -73.0,
        "lat_max": -68.0,
        "lon_min": 20.0,
        "lon_max": 25.0,
        "center_lat": -70.5,
        "center_lon": 22.5,
        "center_status": "derived_from_bounds",
    },
    "BOGUSLAWSKY_CRATER": {
        "name": "Boguslawsky Crater",
        "lat_min": -75.0,
        "lat_max": -70.0,
        "lon_min": 40.0,
        "lon_max": 45.0,
        "center_lat": -72.5,
        "center_lon": 42.5,
        "center_status": "derived_from_bounds",
    },
    "CH3_LANDING_ZONE": {
        "name": "Chandrayaan-3 Landing Zone",
        "lat_min": -72.0,
        "lat_max": -67.0,
        "lon_min": 30.0,
        "lon_max": 35.0,
        "center_lat": -69.5,
        "center_lon": 32.5,
        "center_status": "derived_from_bounds",
    },
}

_PROXY_IMAGE: Optional[np.ndarray] = None
_PIXEL_LAT_LON: Optional[np.ndarray] = None
_IS_LOADED: bool = False


class ReplaceableIIRSGeometryService:
    """Replaceable IIRS geometry service.

    NOTE: IIRS geometry in the proxy product is approximate product-level
    interpolation from product corners. It does not carry an independent ±80 m
    instrument-grade accuracy guarantee.
    """

    def __init__(self, geo_array: Optional[np.ndarray] = None):
        self.geo_array = geo_array

    def pixel_to_lat_lon(self, row: int, col: int) -> Tuple[float, float, str]:
        """Convert IIRS (row, col) to approximate lunar coordinates."""
        if self.geo_array is not None and 0 <= row < self.geo_array.shape[0] and 0 <= col < self.geo_array.shape[1]:
            lat = float(self.geo_array[row, col, 0])
            lon = float(self.geo_array[row, col, 1])
            return lat, lon, "approximate_product_level"
        return 0.0, 0.0, "unresolved"


_GEOMETRY_SERVICE = ReplaceableIIRSGeometryService()


def load_proxy_data() -> None:
    """Load real IIRS proxy imagery and approximate geolocation arrays if mounted."""
    global _PROXY_IMAGE, _PIXEL_LAT_LON, _GEOMETRY_SERVICE, _IS_LOADED

    if settings.IIRS_IMAGE and os.path.exists(settings.IIRS_IMAGE):
        try:
            _PROXY_IMAGE = np.load(settings.IIRS_IMAGE)
        except Exception:
            _PROXY_IMAGE = None

    if settings.IIRS_GEO and os.path.exists(settings.IIRS_GEO):
        try:
            _PIXEL_LAT_LON = np.load(settings.IIRS_GEO)
            _GEOMETRY_SERVICE = ReplaceableIIRSGeometryService(_PIXEL_LAT_LON)
        except Exception:
            _PIXEL_LAT_LON = None

    _IS_LOADED = True


def get_disclaimer() -> str:
    return _IIRS_NOTE


def get_regional_bounds() -> dict[str, dict[str, Any]]:
    return REGIONAL_BOUNDS


def is_in_region(lat: float, lon: float, region_key: str) -> bool:
    reg = REGIONAL_BOUNDS.get(region_key)
    if not reg:
        return False
    return (reg["lat_min"] <= lat <= reg["lat_max"]) and (reg["lon_min"] <= lon <= reg["lon_max"])


def is_loaded() -> bool:
    return _IS_LOADED
