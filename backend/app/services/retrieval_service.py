from __future__ import annotations

from typing import Any, Optional
import numpy as np

from app.services import common_point_service, coordinate_service


def retrieve_candidates_for_coordinate(
    lat: float,
    lon: float,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """Generate candidate observations ranked by spatial proximity.

    Pipeline:
        query -> candidate generation -> candidate ranking
    """
    valid_lat, norm_lon = coordinate_service.validate_coordinates(lat, lon)
    master_df = common_point_service.get_master_df()

    if master_df.empty:
        return []

    # Calculate angular distance to all points
    coords = master_df[["Latitude", "Longitude_360"]].to_numpy(dtype=float)
    dists = np.hypot(coords[:, 0] - valid_lat, coords[:, 1] - norm_lon)

    # Top-K indices
    top_indices = np.argsort(dists)[:top_k]
    candidates: list[dict[str, Any]] = []

    for rank, idx in enumerate(top_indices, start=1):
        row = master_df.iloc[idx].to_dict()
        dist_deg = float(dists[idx])
        # Normalized similarity metric (evidence only, not classifier)
        similarity = float(np.exp(-dist_deg / 0.05))
        candidates.append({
            "rank": rank,
            "common_point_id": str(row["Common_Point_ID"]),
            "patch_id": int(row.get("Patch_ID", 0)),
            "ohrc_tile_id": int(row.get("OHRC_tile_id", 0)) if row.get("OHRC_tile_id") is not None else None,
            "latitude": float(row["Latitude"]),
            "longitude_360": float(row["Longitude_360"]),
            "distance_deg": round(dist_deg, 6),
            "retrieval_similarity": round(similarity, 4),
        })

    return candidates
