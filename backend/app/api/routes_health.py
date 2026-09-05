"""
Health Check and Instrument Specification Endpoints (SIH26166).
"""

from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "device": settings.DEVICE
    }

@router.get("/api/instruments")
def get_supported_instruments():
    return {
        "instruments": [
            {
                "id": "OHRC",
                "name": "Orbiter High Resolution Camera",
                "gsd_m_per_pixel": 0.25,
                "modality": "Panchromatic",
                "swath_km": 3.0,
                "description": "Very high resolution lunar optical imagery for fine hazard detection."
            },
            {
                "id": "TMC2",
                "name": "Terrain Mapping Camera-2",
                "gsd_m_per_pixel": 5.0,
                "modality": "Panchromatic Stereo",
                "swath_km": 20.0,
                "description": "Stereo triplet mapping camera providing regional 3D context."
            },
            {
                "id": "IIRS",
                "name": "Imaging Infra-Red Spectrometer",
                "gsd_m_per_pixel": 80.0,
                "modality": "Hyperspectral (256 bands)",
                "swath_km": 20.0,
                "spectral_range_um": "0.8 - 5.0",
                "description": "Hyperspectral mineralogical sensor represented via synthetic panchromatic proxy."
            }
        ]
    }
