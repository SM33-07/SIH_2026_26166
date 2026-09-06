from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.contracts import CoordinateRequest, CoordinateResponse
from app.services import (
    common_point_service,
    coordinate_service,
    decision_service,
    loftr_service,
    verification_service,
    iirs_service,
)

router = APIRouter(tags=["Coordinate"])


@router.post("/coordinate/search", response_model=CoordinateResponse)
def search_coordinate(body: CoordinateRequest) -> CoordinateResponse:
    """Search registered lunar observations by latitude and longitude."""
    lat = body.latitude
    lon = coordinate_service.normalize_longitude(body.longitude)

    if not (-90.0 <= lat <= 90.0):
        raise HTTPException(status_code=400, detail="Latitude must be in [-90, 90].")
    if not (0.0 <= lon <= 360.0):
        raise HTTPException(status_code=400, detail="Longitude must be in [0, 360] after normalisation.")

    try:
        row, judge_id, dist_deg = coordinate_service.query_coordinate(lat, lon, max_distance_deg=5.0)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=f"LOCATION_NOT_FOUND: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Load images
    images: dict[str, str] = {}
    feature_matches = None
    if judge_id:
        try:
            images = common_point_service.load_judge_images(judge_id)
            ohrc, tmc2, iirs = common_point_service.load_raw_judge_arrays(judge_id)
            feature_matches = loftr_service.compute_cross_sensor_matches(ohrc, tmc2, iirs, cache_key=judge_id)
        except Exception:
            images = {}
            feature_matches = None

    pairwise = verification_service.build_pairwise_from_row(row, threshold=settings.SAME_RADIUS_DEG)
    verdict, score, _ = decision_service.evaluate_decision(
        pairwise=pairwise,
        feature_matches=feature_matches,
    )

    return CoordinateResponse(
        decision=verdict,
        common_point_id=str(row.get("Common_Point_ID", "")),
        query={"latitude": lat, "longitude": lon},
        matched_location={
            "latitude": float(row.get("Common_Latitude", row.get("Latitude", lat))),
            "longitude_360": float(row.get("Longitude_360", row.get("Common_Longitude", lon))),
        },
        sensors={
            "ohrc": {
                "tile_id": int(row["OHRC_tile_id"]) if row.get("OHRC_tile_id") is not None else None,
                "lat": float(row.get("OHRC_lat", 0.0)),
                "lon": float(row.get("OHRC_lon", 0.0)),
            },
            "tmc2": {
                "patch_id": int(row["Patch_ID"]) if row.get("Patch_ID") is not None else None,
                "patch_row": int(row.get("Patch_Row", 0)),
                "patch_col": int(row.get("Patch_Col", 0)),
                "lat": float(row.get("Latitude", 0.0)),
                "lon": float(row.get("Longitude_360", 0.0)),
            },
            "iirs": {
                "iirs_row": int(row.get("IIRS_row", 0)),
                "iirs_col": int(row.get("IIRS_col", 0)),
                "lat": float(row.get("IIRS_lat", 0.0)),
                "lon": float(row.get("IIRS_lon", 0.0)),
            },
        },
        consistency_score=round(score, 6),
        geographic_consistency_pct=round(score * 100, 4),
        images=images,
        pairwise=pairwise,
        feature_matches=feature_matches,
        note=iirs_service.get_disclaimer(),
    )
