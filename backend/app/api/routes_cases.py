"""
Demonstration Cases API Endpoints (SIH26166).
Provides access to the four real Chandrayaan-2 lunar correspondence evaluation targets:
- Pair 2267
- Pair 3463
- Pair 5353
- Pair 7674
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from backend.app.schemas.contracts import CaseListResponseSchema, CaseSchema, MatchResultResponseSchema
from backend.app.services.match_service import get_precomputed_match
from backend.app.api.routes_match import JOBS_CACHE

router = APIRouter()

def _load_cases_data():
    cases_file = os.path.join(settings.DEMO_DIR, "cases.json")
    if not os.path.exists(cases_file):
        cases_file = os.path.join(settings.BASE_DIR, "backend", "data", "demo", "cases.json")
    if not os.path.exists(cases_file):
        raise HTTPException(status_code=404, detail="Demo cases file not found.")
    with open(cases_file, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/api/cases", response_model=CaseListResponseSchema)
def get_cases():
    """
    Returns lightweight metadata for all primary lunar target locations.
    Cheap endpoint for placing Moon markers.
    """
    data = _load_cases_data()
    return data

@router.get("/api/cases/{case_id}", response_model=CaseSchema)
def get_case(case_id: str):
    """
    Returns the complete selected case details, including coordinates,
    IIRS/TMC-2/OHRC metadata, GSD, scale ratios, OHRC tile counterpart,
    pair statuses, and provenance.
    Supports 'pair_3463', '3463', 'case_3463', etc.
    """
    data = _load_cases_data()
    cases = data.get("cases", [])
    
    cid_clean = case_id.lower().strip()
    # Direct match or alias match
    for c in cases:
        c_id = c.get("id", "").lower()
        c_case_id = str(c.get("case_id", "")).lower()
        if cid_clean in (c_id, c_case_id, f"pair_{cid_clean}", c_id.replace("pair_", "")):
            return c
            
    # Check legacy cases if not found in primary cases
    legacy_file = os.path.join(settings.BASE_DIR, "data", "demo", "cases_legacy.json")
    if os.path.exists(legacy_file):
        with open(legacy_file, "r", encoding="utf-8") as f:
            leg_data = json.load(f)
            for c in leg_data.get("cases", []):
                if c.get("id", "").lower() == cid_clean:
                    return c

    raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

@router.get("/api/cases/{case_id}/match/{pair_key}", response_model=MatchResultResponseSchema)
def get_case_match(case_id: str, pair_key: str):
    """
    Retrieves match result for a given case and pair key.
    Enforces zero-fabrication pending state for real pairs.
    """
    result = get_precomputed_match(case_id.lower(), pair_key)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Precomputed match for case '{case_id}' and pair '{pair_key}' not found."
        )
    # Cache job so export routes work
    JOBS_CACHE[result.job_id] = result
    return result
