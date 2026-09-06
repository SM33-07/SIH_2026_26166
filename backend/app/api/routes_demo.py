from __future__ import annotations

from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.schemas.contracts import DemoResponse
from app.services import (
    common_point_service,
    decision_service,
    loftr_service,
    verification_service,
    iirs_service,
)

router = APIRouter(tags=["Demo"])


@router.get("/cases")
def list_available_cases(
    limit: int = Query(default=20, ge=1, le=100, description="Max number of cases to return."),
    case_type: Optional[str] = Query(default=None, description="Filter by 'SAME' or 'DIFFERENT'."),
) -> dict[str, Any]:
    """Return a sample of available judge demonstration cases from the library.

    Cases are classified by their pairwise consistency score:
    - SAME: all three sensors within the 0.020° same-zone threshold (high consistency).
    - DIFFERENT: sensor separation exceeds the threshold.
    """
    judge_df = common_point_service.get_judge_df()
    if judge_df.empty:
        return {"cases": [], "count": 0, "note": "Judge library not loaded."}

    threshold = settings.SAME_RADIUS_DEG

    cases = []
    for _, row in judge_df.iterrows():
        sep = float(row.get("Max_Sensor_Separation_deg", 0.0))
        score = float(row.get("Consistency_Score", 0.0))
        case_class = "SAME" if sep < threshold else "DIFFERENT"

        if case_type and case_class != case_type.upper():
            continue

        judge_id = str(row.get("Judge_Point_ID", ""))
        common_id = str(row.get("Common_Point_ID", ""))
        cases.append({
            "id": judge_id,
            "common_point_id": common_id,
            "type": case_class,
            "latitude": float(row.get("Latitude", 0.0)),
            "longitude_360": float(row.get("Longitude_360", 0.0)),
            "consistency_score": round(score, 6),
            "max_sensor_separation_deg": round(sep, 6),
        })

        if len(cases) >= limit:
            break

    return {
        "cases": cases,
        "count": len(cases),
        "same_zone_threshold_deg": threshold,
    }





@router.get("/demo/{judge_id}", response_model=DemoResponse)
def get_demo_point(judge_id: str) -> DemoResponse:
    """Retrieve a controlled three-sensor judge demonstration case."""
    clean_id = judge_id.strip().upper()
    judge_row = common_point_service.get_judge_point(clean_id)

    if judge_row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Judge point '{clean_id}' not found. Valid range: JUDGE_0001 - JUDGE_0500.",
        )

    common_id = str(judge_row.get("Common_Point_ID", ""))
    master_row = common_point_service.get_common_point(common_id)
    row = master_row if master_row else judge_row

    # Load images
    try:
        images = common_point_service.load_judge_images(clean_id)
        ohrc, tmc2, iirs = common_point_service.load_raw_judge_arrays(clean_id)
        feature_matches = loftr_service.compute_cross_sensor_matches(ohrc, tmc2, iirs, cache_key=clean_id)
    except Exception as e:
        images = {}
        feature_matches = None

    pairwise = verification_service.build_pairwise_from_row(row, threshold=settings.SAME_RADIUS_DEG)
    verdict, score, _ = decision_service.evaluate_decision(
        pairwise=pairwise,
        feature_matches=feature_matches,
    )

    lat = float(judge_row.get("Latitude", row.get("Common_Latitude", 0.0)))
    lon = float(judge_row.get("Longitude_360", row.get("Longitude_360", 0.0)))

    return DemoResponse(
        judge_point_id=clean_id,
        decision=verdict,
        common_point_id=common_id,
        query={"latitude": lat, "longitude": lon},
        matched_location={
            "latitude": float(row.get("Common_Latitude", lat)),
            "longitude_360": float(row.get("Longitude_360", lon)),
        },
        sensors={
            "ohrc": {
                "tile_id": int(row["OHRC_tile_id"]) if row.get("OHRC_tile_id") is not None else None,
                "lat": float(row.get("OHRC_lat", lat)),
                "lon": float(row.get("OHRC_lon", lon)),
            },
            "tmc2": {
                "patch_id": int(row["Patch_ID"]) if row.get("Patch_ID") is not None else None,
                "patch_row": int(row.get("Patch_Row", 0)),
                "patch_col": int(row.get("Patch_Col", 0)),
                "lat": float(row.get("Latitude", lat)),
                "lon": float(row.get("Longitude_360", lon)),
            },
            "iirs": {
                "iirs_row": int(row.get("IIRS_row", 0)),
                "iirs_col": int(row.get("IIRS_col", 0)),
                "lat": float(row.get("IIRS_lat", lat)),
                "lon": float(row.get("IIRS_lon", lon)),
            },
        },
        consistency_score=round(score, 6),
        geographic_consistency_pct=round(score * 100, 4),
        images=images,
        pairwise=pairwise,
        feature_matches=feature_matches,
        note=iirs_service.get_disclaimer(),
    )


@router.get("/demo-pairs/{pair_id}")
def get_demo_pair(pair_id: str) -> dict[str, Any]:
    """Retrieve demo pair presets (2267, 3463, 5353, 7674)."""
    valid_pairs = {"2267", "3463", "5353", "7674"}
    if pair_id not in valid_pairs:
        raise HTTPException(
            status_code=404,
            detail=f"Pair '{pair_id}' not found. Valid presets: {sorted(list(valid_pairs))}",
        )
    return {
        "pair_id": pair_id,
        "status": "preserved",
        "description": f"Historical controlled demonstration pair #{pair_id}",
    }
