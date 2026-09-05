"""
Methodology API Endpoints (SIH26166).
Exposes the 7-stage processing pipeline for multi-modal lunar co-registration.
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from backend.app.schemas.contracts import MethodologyResponseSchema

router = APIRouter()

def _load_methodology_data():
    methodology_file = os.path.join(settings.DEMO_DIR, "methodology.json")
    if not os.path.exists(methodology_file):
        methodology_file = os.path.join(settings.BASE_DIR, "backend", "data", "demo", "methodology.json")
    if not os.path.exists(methodology_file):
        raise HTTPException(status_code=404, detail="Methodology configuration not found.")
    with open(methodology_file, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/api/methodology", response_model=MethodologyResponseSchema)
def get_methodology():
    """
    Returns the 7-stage multi-modal co-registration methodology:
    1. Data Ingestion & Calibration
    2. Multi-Scale Pyramid Rescaling
    3. Illumination Normalization
    4. Learned Coarse-to-Fine LoFTR Matching
    5. Spatial Confidence Heatmap Generation
    6. Robust Projective Fitting / MAGSAC++
    7. Hierarchical Tri-Sensor Co-Registration
    """
    return _load_methodology_data()
