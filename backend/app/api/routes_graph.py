"""
Sensor Graph API Endpoints (SIH26166).
Provides the 3-sensor graph registration topology (OHRC, TMC-2, IIRS) and pair statuses.
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.schemas.contracts import (
    SensorGraphResponseSchema,
    GraphNodeSchema,
    GraphEdgeSchema
)

router = APIRouter()

@router.get("/api/graph", response_model=SensorGraphResponseSchema)
def get_sensor_graph():
    nodes = [
        GraphNodeSchema(
            id="OHRC",
            label="OHRC (0.28m)",
            gsd=0.28,
            modality="Panchromatic",
            color="#0ea5e9"  # sky-500
        ),
        GraphNodeSchema(
            id="TMC2",
            label="TMC-2 (5.0m)",
            gsd=5.0,
            modality="Stereo Triplet",
            color="#6366f1"  # indigo-500
        ),
        GraphNodeSchema(
            id="IIRS",
            label="IIRS (86.5m)",
            gsd=86.5,
            modality="Hyperspectral 256b",
            color="#f59e0b"  # amber-500
        )
    ]

    edges = [
        GraphEdgeSchema(
            source="OHRC",
            target="OHRC",
            status="validated",
            label="Multi-Sun Angle (18° vs 52°)",
            inlier_ratio=0.952,
            rmse=0.34
        ),
        GraphEdgeSchema(
            source="OHRC",
            target="TMC2",
            status="demo_precomputed",
            label="18x GSD Scale Pyramid",
            inlier_ratio=0.915,
            rmse=0.48
        ),
        GraphEdgeSchema(
            source="OHRC",
            target="IIRS",
            status="validated",
            label="Hyperspectral Proxy Synthesis",
            inlier_ratio=0.9942,
            rmse=0.3801
        ),
        GraphEdgeSchema(
            source="TMC2",
            target="TMC2",
            status="demo_precomputed",
            label="Stereo Triplet Forward-Aft",
            inlier_ratio=0.938,
            rmse=0.41
        ),
        GraphEdgeSchema(
            source="TMC2",
            target="IIRS",
            status="integration_pending",
            label="Multi-Instrument 3D Context (Pending)",
            inlier_ratio=None,
            rmse=None
        )
    ]

    summary = {
        "validated": 2,
        "demo_precomputed": 2,
        "integration_pending": 1
    }

    return SensorGraphResponseSchema(
        nodes=nodes,
        edges=edges,
        timestamp=datetime.now(timezone.utc).isoformat(),
        status_summary=summary
    )
