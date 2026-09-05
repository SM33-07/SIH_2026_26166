"""
Match Execution and Results Retrieval Endpoints (SIH26166).
"""

import os
from fastapi import APIRouter, HTTPException
from backend.app.schemas.contracts import MatchRequestSchema, MatchResultResponseSchema
from backend.app.services.match_service import execute_matching_job, get_precomputed_match, build_pending_match_result
from backend.app.config import settings

router = APIRouter()

# In-memory job store for fast retrieval
JOBS_CACHE = {}

@router.get("/api/matches/{case_id}/{sensor0}/{sensor1}", response_model=MatchResultResponseSchema)
def get_sensor_match(case_id: str, sensor0: str, sensor1: str):
    """
    Returns correspondence results for a specific case and sensor pair.
    Adheres strictly to the zero-fabrication rule:
    - If measured correspondence exists, returns keypoints, inliers, transform, and metrics.
    - If pending (e.g. for real pairs without executed inference), returns an explicit pending
      state with null metrics, empty match lists, and scientific reason.
    """
    s0 = sensor0.upper().replace("-", "")
    s1 = sensor1.upper().replace("-", "")
    pair_key = f"{s0}_{s1}"

    # Try exact pair
    result = get_precomputed_match(case_id.lower(), pair_key)
    if result is None:
        # Try reverse pair
        rev_key = f"{s1}_{s0}"
        result = get_precomputed_match(case_id.lower(), rev_key)

    if result is None:
        # Build strict zero-fabrication pending result
        result = build_pending_match_result(case_id, s0, s1)

    JOBS_CACHE[result.job_id] = result
    return result

@router.post("/api/match", response_model=MatchResultResponseSchema)
def match_images(request: MatchRequestSchema):
    demo_dir = os.path.join(settings.DATA_DIR, "demo")

    # Locate Image A
    path_a = os.path.join(demo_dir, request.image_a_id)
    if not os.path.exists(path_a):
        path_a = os.path.join(settings.DATA_DIR, "raw", request.modality_a.lower(), request.image_a_id)

    # Locate Image B
    path_b = os.path.join(demo_dir, request.image_b_id)
    if not os.path.exists(path_b):
        path_b = os.path.join(settings.DATA_DIR, "raw", request.modality_b.lower(), request.image_b_id)

    if not os.path.exists(path_a):
        if settings.DEMO_MODE:
            path_a = os.path.join(demo_dir, "ohrc_sun18deg.png")
        else:
            raise HTTPException(status_code=404, detail=f"Image A ({request.image_a_id}) not found at {path_a}")
    if not os.path.exists(path_b):
        if settings.DEMO_MODE:
            path_b = os.path.join(demo_dir, "ohrc_sun52deg.png")
        else:
            raise HTTPException(status_code=404, detail=f"Image B ({request.image_b_id}) not found at {path_b}")

    result = execute_matching_job(request, path_a, path_b)
    JOBS_CACHE[result.job_id] = result
    return result

@router.get("/api/match/{job_id}", response_model=MatchResultResponseSchema)
def get_match_job(job_id: str):
    if job_id not in JOBS_CACHE:
        raise HTTPException(status_code=404, detail=f"Job ID {job_id} not found.")
    return JOBS_CACHE[job_id]
