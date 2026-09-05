"""
Export Endpoints for JSON/CSV Correspondences and Metrics (SIH26166).
"""

import io
import csv
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from backend.app.api.routes_match import JOBS_CACHE

router = APIRouter()

@router.get("/api/export/{job_id}/json")
def export_job_json(job_id: str):
    if job_id not in JOBS_CACHE:
        raise HTTPException(status_code=404, detail=f"Job ID {job_id} not found.")
    job_data = JOBS_CACHE[job_id].dict()
    return JSONResponse(content=job_data, headers={"Content-Disposition": f"attachment; filename=lunar_match_{job_id}.json"})

@router.get("/api/export/{job_id}/csv")
def export_job_csv(job_id: str):
    if job_id not in JOBS_CACHE:
        raise HTTPException(status_code=404, detail=f"Job ID {job_id} not found.")
    job_data = JOBS_CACHE[job_id]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["index", "pt_a_x", "pt_a_y", "pt_b_x", "pt_b_y", "is_inlier", "confidence"])

    for idx, (idx_a, idx_b) in enumerate(job_data.correspondences):
        pt_a = job_data.keypoints_a[idx_a]
        pt_b = job_data.keypoints_b[idx_b]
        is_inlier = job_data.inlier_mask[idx] if idx < len(job_data.inlier_mask) else False
        conf = 1.0 if is_inlier else 0.5
        writer.writerow([idx, round(pt_a[0], 2), round(pt_a[1], 2), round(pt_b[0], 2), round(pt_b[1], 2), is_inlier, conf])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=lunar_correspondences_{job_id}.csv"}
    )
