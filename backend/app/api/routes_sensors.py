from __future__ import annotations

from typing import Any
from fastapi import APIRouter

from app.config import settings
from app.services import iirs_service

router = APIRouter(tags=["Sensors"])


@router.get("/sensors/characteristics")
def get_sensor_characteristics() -> dict[str, Any]:
    """Return authoritative scientific metadata for Chandrayaan-2 sensors."""
    return {
        "sensors": {
            "tmc2": {
                "name": "Terrain Mapping Camera-2",
                "spectral_band": "Panchromatic (0.5 - 0.85 um)",
                "gsd_m_per_px": settings.TMC2_GSD_M_PER_PX,
                "swath_width_km": 20.0,
                "usable_patches": 339735,
                "shards": 34,
                "patch_dimensions": "48 x 48 px",
            },
            "ohrc": {
                "name": "Orbital High Resolution Camera",
                "spectral_band": "Panchromatic (0.45 - 0.90 um)",
                "gsd_m_per_px": settings.OHRC_GSD_M_PER_PX,
                "swath_width_km": 3.0,
                "tiles_in_catalog": 13770,
                "tile_dimensions": "512 x 512 px",
            },
            "iirs": {
                "name": "Imaging Infrared Spectrometer",
                "spectral_band": "Hyperspectral (0.8 - 5.0 um, 256 bands)",
                "gsd_m_per_px": settings.IIRS_GSD_M_PER_PX,
                "proxy_dimensions": "11868 x 250 px",
                "geolocation_status": "approximate_product_level",
                "note": iirs_service.get_disclaimer(),
            },
        },
        "scale_invariance": {
            "ohrc_to_tmc2_ratio": settings.SCALE_RATIO_OHRC_TMC2,
            "tmc2_to_iirs_ratio": round(settings.IIRS_GSD_M_PER_PX / settings.TMC2_GSD_M_PER_PX, 2),
            "cumulative_scale_disparity": round(settings.IIRS_GSD_M_PER_PX / settings.OHRC_GSD_M_PER_PX, 2),
        },
    }


@router.get("/regions")
def get_regional_presets() -> dict[str, Any]:
    """Return predefined regional bounds for key lunar landing sites."""
    return {
        "regions": iirs_service.get_regional_bounds(),
        "disclaimer": "Regional centers are derived from rectangular region bounds for navigation convenience.",
    }
