"""
Health Check and Instrument Specification Endpoints (SIH26166).
"""

from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter()

@router.get("/health")
@router.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "2.0.0",
        "device": settings.DEVICE,
        "demo_mode": settings.DEMO_MODE
    }

@router.get("/api/instruments")
def get_supported_instruments():
    return {
        "instruments": [
            {
                "id": "OHRC",
                "name": "Orbiter High Resolution Camera",
                "instrument": "OHRC",
                "gsd_m_per_pixel": 0.28,
                "modality": "Panchromatic High-Resolution",
                "bands": 1,
                "swath_km": 3.0,
                "spectral_range_um": "0.45 - 0.70",
                "description": "Very high resolution lunar optical imagery for fine hazard detection."
            },
            {
                "id": "TMC2",
                "name": "Terrain Mapping Camera-2",
                "instrument": "TMC-2",
                "gsd_m_per_pixel": 5.0,
                "modality": "Panchromatic Stereo Triplet",
                "bands": 1,
                "swath_km": 20.0,
                "spectral_range_um": "0.50 - 0.85",
                "description": "Stereo triplet mapping camera providing regional 3D context."
            },
            {
                "id": "IIRS",
                "name": "Imaging Infra-Red Spectrometer",
                "instrument": "IIRS",
                "gsd_m_per_pixel": 86.5,
                "modality": "Hyperspectral (256 bands)",
                "bands": 256,
                "swath_km": 20.0,
                "spectral_range_um": "0.80 - 5.00",
                "description": "Hyperspectral mineralogical sensor represented via calibrated panchromatic proxy."
            }
        ]
    }
