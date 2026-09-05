"""
Provenance and Limitations API Endpoints (SIH26166).
Exposes explicit scientific states, caveats, approximate geometry notes, and project limitations.
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from backend.app.schemas.contracts import ProvenanceResponseSchema

router = APIRouter()

def _load_provenance_data():
    provenance_file = os.path.join(settings.DEMO_DIR, "provenance.json")
    if not os.path.exists(provenance_file):
        provenance_file = os.path.join(settings.BASE_DIR, "backend", "data", "demo", "provenance.json")
    if not os.path.exists(provenance_file):
        raise HTTPException(status_code=404, detail="Provenance configuration not found.")
    with open(provenance_file, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/api/provenance", response_model=ProvenanceResponseSchema)
def get_provenance():
    """
    Returns explicit scientific terminology definitions:
    - REAL SPATIAL SCENE
    - SYNTHETIC BENCHMARK
    - GEOGRAPHICALLY ASSOCIATED
    - APPROXIMATE GEOMETRY
    - MODEL VALIDATION PENDING
    - VALIDATED BENCHMARK
    as well as known scientific limitations.
    """
    return _load_provenance_data()

@router.get("/api/limitations")
def get_limitations():
    """
    Returns the project's scientific limitations.
    """
    data = _load_provenance_data()
    return {"limitations": data.get("limitations", [])}
