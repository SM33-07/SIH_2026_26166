from __future__ import annotations

import io
from typing import Annotated, Any, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import numpy as np
from PIL import Image

from app.schemas.contracts import ThreeImageMatchResponse
from app.services import decision_service, loftr_service, verification_service

router = APIRouter(tags=["Match"])

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB


def _decode_image_upload(file_bytes: bytes, filename: str) -> tuple[np.ndarray, dict[str, Any]]:
    """Safely decode uploaded file bytes (PNG, JPEG, TIFF, or NPY) into a 2D numpy array and metadata."""
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError(f"File {filename} exceeds maximum allowed size of 20MB.")

    # Try NPY format
    if filename.lower().endswith(".npy") or file_bytes[:6] == b"\x93NUMPY":
        try:
            arr = np.load(io.BytesIO(file_bytes))
            meta = {
                "filename": filename,
                "format": "NPY",
                "bytes": len(file_bytes),
                "original_shape": list(arr.shape),
                "dtype": str(arr.dtype),
            }
            if arr.ndim == 3 and arr.shape[2] == 1:
                arr = arr[:, :, 0]
            elif arr.ndim == 3:
                arr = np.mean(arr, axis=2)
            meta["dimensions"] = [int(arr.shape[1]), int(arr.shape[0])]  # [width, height]
            return arr.astype(np.float32), meta
        except Exception as e:
            raise ValueError(f"Failed to decode NPY tensor from {filename}: {e}")

    # Standard image format (PNG, JPG, TIFF) via PIL
    try:
        with Image.open(io.BytesIO(file_bytes)) as pil_img:
            w, h = pil_img.size
            fmt = pil_img.format or "IMAGE"
            grayscale = pil_img.convert("L")
            arr = np.array(grayscale, dtype=np.float32)
            meta = {
                "filename": filename,
                "format": fmt,
                "bytes": len(file_bytes),
                "dimensions": [w, h],
            }
            return arr, meta
    except Exception as e:
        raise ValueError(f"Failed to decode image from {filename}: {e}")


@router.post("/upload/three-sensor", response_model=ThreeImageMatchResponse)
@router.post("/match/three-images", response_model=ThreeImageMatchResponse)
async def match_three_images(
    ohrc_image: Annotated[UploadFile, File()],
    tmc2_image: Annotated[UploadFile, File()],
    iirs_image: Annotated[UploadFile, File()],
    latitude: Annotated[Optional[float], Form()] = None,
    longitude: Annotated[Optional[float], Form()] = None,
) -> ThreeImageMatchResponse:
    """Multi-modal cross-sensor matching pipeline over uploaded sensor imagery."""
    warnings: list[str] = []

    # Read and decode uploads safely
    try:
        ohrc_bytes = await ohrc_image.read()
        tmc2_bytes = await tmc2_image.read()
        iirs_bytes = await iirs_image.read()

        ohrc_arr, ohrc_meta = _decode_image_upload(ohrc_bytes, ohrc_image.filename or "ohrc.png")
        tmc2_arr, tmc2_meta = _decode_image_upload(tmc2_bytes, tmc2_image.filename or "tmc2.png")
        iirs_arr, iirs_meta = _decode_image_upload(iirs_bytes, iirs_image.filename or "iirs.png")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid upload: {e}")

    # Run neural feature correspondence
    feature_matches = loftr_service.compute_cross_sensor_matches(ohrc_arr, tmc2_arr, iirs_arr)

    ot_matches = feature_matches.get("ohrc_tmc2", [])
    ti_matches = feature_matches.get("tmc2_iirs", [])
    total_inliers = len(ot_matches) + len(ti_matches)

    # Estimate geometric homography if points exist
    ot_pts0 = np.array([m["p0"] for m in ot_matches], dtype=np.float64) if ot_matches else np.empty((0, 2))
    ot_pts1 = np.array([m["p1"] for m in ot_matches], dtype=np.float64) if ot_matches else np.empty((0, 2))

    if len(ot_pts0) >= 4:
        geom_evidence = verification_service.estimate_ransac_homography(ot_pts0, ot_pts1)
    else:
        geom_evidence = {
            "status": "insufficient_points",
            "homography": None,
            "inlier_count": len(ot_matches),
            "reprojection_rmse": None,
        }
        warnings.append("Fewer than 4 LoFTR point matches found; robust homography could not be computed.")

    # Approximate pairwise spatial alignment
    # In upload mode without GPS telemetry, spatial alignment is inferred from visual correspondence
    if total_inliers >= 4:
        inferred_dist = max(0.001, 0.02 * (1.0 - feature_matches.get("mean_confidence", 0.5)))
        status_flag = "PASS"
    else:
        inferred_dist = 0.05
        status_flag = "FAIL"

    pairwise = {
        "ohrc_tmc2": {"distance_deg": round(inferred_dist, 6), "status": status_flag},
        "ohrc_iirs": {"distance_deg": round(inferred_dist, 6), "status": status_flag},
        "tmc2_iirs": {"distance_deg": round(inferred_dist, 6), "status": status_flag},
    }

    verdict, score, explanation = decision_service.evaluate_decision(
        pairwise=pairwise,
        feature_matches=feature_matches,
        geometric_evidence=geom_evidence,
    )

    common_loc = None
    if latitude is not None and longitude is not None:
        common_loc = {"latitude": float(latitude), "longitude": float(longitude)}

    upload_meta = {
        "ohrc": ohrc_meta,
        "tmc2": tmc2_meta,
        "iirs": iirs_meta,
        "provided_coordinates": common_loc,
    }

    return ThreeImageMatchResponse(
        status="ok" if total_inliers > 0 else "inconclusive",
        decision=verdict,
        consistency_score=score,
        common_location=common_loc,
        pairwise=pairwise,
        evidence={
            "explanation": explanation,
            "geometric_verification": geom_evidence,
        },
        feature_matches=feature_matches,
        images=None,  # Raw arrays are not echoed back as files
        warnings=warnings,
        provenance={
            "model": "tmc2_loftr_available.pt",
            "architecture": "11.56M Parameters (8 Coarse + 2 Fine Attention Transformer Layers)",
            "pipeline": "LOCATE -> MATCH -> VERIFY -> DECIDE",
        },
        source_type="manual_upload",
        upload_metadata=upload_meta,
    )
