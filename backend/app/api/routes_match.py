"""
Match Execution and Results Retrieval Endpoints (SIH26166).
"""

import os
from fastapi import APIRouter, HTTPException
from backend.app.schemas.contracts import MatchRequestSchema, MatchResultResponseSchema
from backend.app.services.match_service import execute_matching_job
from backend.app.config import settings

router = APIRouter()

# In-memory job store for fast retrieval
JOBS_CACHE = {}

@router.post("/api/match", response_model=MatchResultResponseSchema)
def match_images(request: MatchRequestSchema):
    demo_dir = os.path.join(settings.DATA_DIR, "demo")

    # Locate Image A
    path_a = os.path.join(demo_dir, request.image_a_id)
    if not os.path.exists(path_a):
        # Try raw upload path
        path_a = os.path.join(settings.DATA_DIR, "raw", request.modality_a.lower(), request.image_a_id)

    # Locate Image B
    path_b = os.path.join(demo_dir, request.image_b_id)
    if not os.path.exists(path_b):
        path_b = os.path.join(settings.DATA_DIR, "raw", request.modality_b.lower(), request.image_b_id)

    if not os.path.exists(path_a):
        raise HTTPException(status_code=404, detail=f"Image A ({request.image_a_id}) not found at {path_a}")
    if not os.path.exists(path_b):
        raise HTTPException(status_code=404, detail=f"Image B ({request.image_b_id}) not found at {path_b}")

    result = execute_matching_job(request, path_a, path_b)
    JOBS_CACHE[result.job_id] = result
    return result

@router.get("/api/match/{job_id}", response_model=MatchResultResponseSchema)
def get_match_job(job_id: str):
    if job_id not in JOBS_CACHE:
        raise HTTPException(status_code=404, detail=f"Job ID {job_id} not found.")
    return JOBS_CACHE[job_id]
