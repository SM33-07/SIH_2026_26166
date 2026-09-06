import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.services import (
    common_point_service,
    coordinate_service,
    loftr_service,
    ohrc_service,
    tmc2_service,
)


@pytest.fixture(scope="module")
def client():
    settings.resolve_paths()
    common_point_service.load(settings.MODEL_PACKAGE_ROOT)
    coordinate_service.build_spatial_index()
    tmc2_service.load_mapping(settings.MODEL_PACKAGE_ROOT)
    ohrc_service.load_metadata(settings.MODEL_PACKAGE_ROOT)
    loftr_service.init_matcher(settings.MODEL_PACKAGE_ROOT)

    with TestClient(app) as test_client:
        yield test_client


def test_answer_leak_catalog(client):
    """Verify GET /api/v1/cases exposes NO precomputed decision or leaked labels."""
    response = client.get("/api/v1/cases?limit=20")
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert len(data["cases"]) > 0

    for case in data["cases"]:
        # Cases list must provide input metadata only
        assert "id" in case
        assert "latitude" in case
        assert "longitude_360" in case
        # Ensure that no prediction decision is exposed in the case browsing catalog
        assert "decision" not in case
        assert "prediction" not in case


def test_cache_bypass_and_live_inference(client):
    """Verify live demo genuinely bypasses cache when force_live=True."""
    # First execution
    res1 = client.get("/api/v1/demo/JUDGE_0001?force_live=true")
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["inference_mode"] == "live"
    assert d1["cache_used"] is False
    assert d1["runtime_ms"] is not None
    assert d1["runtime_ms"] > 0
    assert d1["decision"] in ["SAME LUNAR ZONE", "DIFFERENT LUNAR ZONES", "INSUFFICIENT EVIDENCE"]
    assert d1["reference_label"] is not None

    # Second execution of the exact same case must still bypass cache
    res2 = client.get("/api/v1/demo/JUDGE_0001?force_live=true")
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["inference_mode"] == "live"
    assert d2["cache_used"] is False
    assert d2["runtime_ms"] is not None
    assert d2["runtime_ms"] > 0


def test_prediction_reference_separation(client):
    """Verify model decision and ground-truth reference label are separate fields."""
    res = client.get("/api/v1/demo/JUDGE_0001?force_live=true")
    assert res.status_code == 200
    data = res.json()

    # Decision is synthesized by decision_service from LoFTR + geometry + geography
    assert "decision" in data
    # Reference label is the catalog ground truth for evaluation
    assert "reference_label" in data
    assert data["decision"] in ["SAME LUNAR ZONE", "DIFFERENT LUNAR ZONES", "INSUFFICIENT EVIDENCE"]
    assert data["reference_label"] in ["SAME", "DIFFERENT", "SAME LUNAR ZONE", "DIFFERENT LUNAR ZONES"]


def test_random_controlled_case_execution(client):
    """Verify live inference runs successfully for different controlled cases."""
    cases_to_test = ["JUDGE_0001", "JUDGE_0002"]
    for cid in cases_to_test:
        res = client.get(f"/api/v1/demo/{cid}?force_live=true")
        assert res.status_code == 200
        d = res.json()
        assert d["inference_mode"] == "live"
        assert d["cache_used"] is False
        assert d["evidence"] is not None
