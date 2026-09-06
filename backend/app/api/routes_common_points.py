from __future__ import annotations

import random
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.contracts import CommonPointDetailResponse
from app.services import common_point_service

router = APIRouter(tags=["CommonPoints"])


@router.get("/common-points")
def list_common_points(
    limit: Optional[int] = Query(default=50, ge=1, le=500, description="Maximum number of points to return."),
    sample: bool = Query(default=False, description="If true, return a geographically spread random sample."),
    min_score: Optional[float] = Query(default=None, ge=0.0, le=1.0, description="Minimum consistency score filter."),
) -> dict[str, Any]:
    """Return a catalog of available three-sensor common observation points.

    Use ?sample=true&limit=100 for representative Moon markers.
    Use ?limit=500 to get the full high-consistency subset.
    """
    df = common_point_service.get_master_df()
    if df.empty:
        return {"points": [], "count": 0, "total_in_catalog": 0}

    working = df.copy()

    # Optionally filter by consistency score
    if min_score is not None and "Consistency_Score" in working.columns:
        working = working[working["Consistency_Score"] >= min_score]

    total_after_filter = len(working)

    if sample:
        # Return a geographically distributed sample: sort by lat/lon then stride
        if "Latitude" in working.columns:
            working = working.sort_values("Latitude")
        stride = max(1, len(working) // limit)
        working = working.iloc[::stride].head(limit)
    else:
        working = working.head(limit)

    points = []
    for _, row in working.iterrows():
        points.append({
            "id": str(row.get("Common_Point_ID", "")),
            "latitude": float(row.get("Common_Latitude", row.get("Latitude", 0.0))),
            "longitude_360": float(row.get("Longitude_360", 0.0)),
            "ohrc_tile_id": int(row["OHRC_tile_id"]) if row.get("OHRC_tile_id") is not None else None,
            "patch_id": int(row["Patch_ID"]) if row.get("Patch_ID") is not None else None,
            "consistency_score": float(row.get("Consistency_Score", 0.0)),
            "three_sensor_common": bool(row.get("ThreeSensor_Common", True)),
            "ohrc_available": row.get("OHRC_tile_id") is not None,
            "tmc2_available": row.get("Patch_ID") is not None,
            "iirs_available": row.get("IIRS_row") is not None,
        })

    return {
        "points": points,
        "count": len(points),
        "total_in_catalog": total_after_filter,
    }


@router.get("/common-points/{common_point_id}", response_model=CommonPointDetailResponse)
def get_common_point(common_point_id: str) -> CommonPointDetailResponse:
    """Retrieve full authoritative common-point master record."""
    clean_id = common_point_id.strip().upper()
    row = common_point_service.get_common_point(clean_id)

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Common point '{clean_id}' not found in master catalog (valid range: CP_000001 - CP_001514).",
        )

    return CommonPointDetailResponse(
        common_point_id=str(row["Common_Point_ID"]),
        patch_id=int(row["Patch_ID"]) if row.get("Patch_ID") is not None else None,
        dataset_index=int(row["Dataset_Index"]) if row.get("Dataset_Index") is not None else None,
        ohrc_tile_id=int(row["OHRC_tile_id"]) if row.get("OHRC_tile_id") is not None else None,
        iirs_row=int(row["IIRS_row"]) if row.get("IIRS_row") is not None else None,
        iirs_col=int(row["IIRS_col"]) if row.get("IIRS_col") is not None else None,
        common_latitude=float(row.get("Common_Latitude", row.get("Latitude", 0.0))),
        common_longitude=float(row.get("Common_Longitude", row.get("Longitude_360", 0.0))),
        latitude=float(row.get("Latitude", 0.0)),
        longitude_360=float(row.get("Longitude_360", 0.0)),
        ohrc_lat=float(row["OHRC_lat"]) if row.get("OHRC_lat") is not None else None,
        ohrc_lon=float(row["OHRC_lon"]) if row.get("OHRC_lon") is not None else None,
        iirs_lat=float(row["IIRS_lat"]) if row.get("IIRS_lat") is not None else None,
        iirs_lon=float(row["IIRS_lon"]) if row.get("IIRS_lon") is not None else None,
        ohrc_distance_deg=float(row["OHRC_distance_deg"]) if row.get("OHRC_distance_deg") is not None else None,
        iirs_distance_deg=float(row["IIRS_distance_deg"]) if row.get("IIRS_distance_deg") is not None else None,
        ohrc_iirs_distance_deg=float(row["OHRC_IIRS_distance_deg"]) if row.get("OHRC_IIRS_distance_deg") is not None else None,
        max_sensor_separation_deg=float(row["Max_Sensor_Separation_deg"]) if row.get("Max_Sensor_Separation_deg") is not None else None,
        consistency_score=float(row.get("Consistency_Score", 0.0)),
        three_sensor_common=bool(row.get("ThreeSensor_Common", True)),
    )
