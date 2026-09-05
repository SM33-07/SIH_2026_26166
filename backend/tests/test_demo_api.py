"""
Comprehensive Test Suite for SIH26166 Backend API Endpoints.
Tests:
- GET /api/health and /health
- GET /api/sensors (OHRC 0.28m, TMC-2 5.0m, IIRS 86.5m, scale ratios)
- GET /api/cases (4 primary real geographic pairs)
- GET /api/cases/pair_2267
- GET /api/cases/pair_3463
- GET /api/cases/pair_5353
- GET /api/cases/pair_7674
- GET /api/matches/pair_2267/IIRS/TMC2 (zero fabrication pending contract)
- GET /api/matches/pair_3463/IIRS/TMC2
- GET /api/matches/pair_5353/IIRS/TMC2
- GET /api/matches/pair_7674/IIRS/TMC2
- GET /api/benchmarks/iirs (standard & stress verified metrics & caveats)
- GET /api/provenance (scientific state definitions & limitations)
- GET /api/methodology (7-stage processing pipeline)
- GET /api/graph (sensor topology)
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoints():
    for url in ["/health", "/api/health"]:
        response = client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["demo_mode"] is True

def test_sensors_endpoint():
    response = client.get("/api/sensors")
    assert response.status_code == 200
    data = response.json()
    sensors = data["sensors"]
    assert len(sensors) == 3
    ids = {s["id"] for s in sensors}
    assert ids == {"OHRC", "TMC2", "IIRS"}

    ohrc = next(s for s in sensors if s["id"] == "OHRC")
    assert ohrc["gsd_m_per_pixel"] == 0.28

    tmc2 = next(s for s in sensors if s["id"] == "TMC2")
    assert tmc2["gsd_m_per_pixel"] == 5.0

    iirs = next(s for s in sensors if s["id"] == "IIRS")
    assert iirs["gsd_m_per_pixel"] == 86.5

    # Scale ratios
    ratios = data.get("scale_ratios", {})
    assert ratios.get("IIRS_to_TMC2") == 17.3
    assert ratios.get("TMC2_to_OHRC") == 17.86
    assert ratios.get("IIRS_to_OHRC") == 308.93

def test_cases_endpoint():
    response = client.get("/api/cases")
    assert response.status_code == 200
    data = response.json()
    cases = data["cases"]
    assert len(cases) == 4
    case_ids = {c["id"] for c in cases}
    assert case_ids == {"pair_2267", "pair_3463", "pair_5353", "pair_7674"}

@pytest.mark.parametrize("case_id, expected_lat, expected_lon", [
    ("pair_2267", 60.989399854, -4.677456283250024),
    ("pair_3463", 60.839792389, -4.6951810540500105),
    ("pair_5353", 60.6036142065, -4.695332187824988),
    ("pair_7674", 60.217857712, -4.695636387849959)
])
def test_individual_cases(case_id, expected_lat, expected_lon):
    response = client.get(f"/api/cases/{case_id}")
    assert response.status_code == 200
    c = response.json()
    assert c["id"] == case_id
    assert abs(c["latitude"] - expected_lat) < 1e-4
    assert abs(c["longitude"] - expected_lon) < 1e-4
    assert "sensors" in c
    assert "IIRS" in c["sensors"]
    assert "TMC2" in c["sensors"]
    assert "OHRC" in c["sensors"]
    assert c["sensors"]["OHRC"]["status"] == "geographically_associated"
    assert c["sensors"]["OHRC"]["distance_to_target"] < 60.0  # < 60 meters offset
    assert c["scale_ratios"]["iirs_tmc2"] == 17.3
    assert c["scale_ratios"]["tmc2_ohrc"] == 17.86
    assert c["pair_status"]["IIRS_TMC2"] == "spatially_paired"
    assert c["pair_status"]["three_way"] == "integration_pending"

@pytest.mark.parametrize("case_id", ["pair_2267", "pair_3463", "pair_5353", "pair_7674"])
def test_matches_endpoints_zero_fabrication(case_id):
    """
    Verifies Section 19 & 20 zero-fabrication contract:
    - status is integration_pending
    - metrics is null
    - keypoints and matches are empty lists
    - transform is null
    - clear scientific provenance explanation is returned
    """
    response = client.get(f"/api/matches/{case_id}/IIRS/TMC2")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "integration_pending"
    assert data["metrics"] is None
    assert data["keypoints0"] == []
    assert data["keypoints1"] == []
    assert data["keypoints_a"] == []
    assert data["keypoints_b"] == []
    assert data["matches"] == []
    assert data["correspondences"] == []
    assert data["transform"] is None
    assert data["homography"] is None
    assert "provenance" in data
    assert "reason" in data["provenance"]

def test_benchmarks_iirs_endpoint():
    response = client.get("/api/benchmarks/iirs")
    assert response.status_code == 200
    data = response.json()
    assert data["benchmark_type"] == "IIRS synthetic correspondence benchmark"
    assert data["real_scene_accuracy"] is False
    assert data["three_sensor_accuracy"] is False
    assert "warning" in data

    std = data["standard"]
    assert std["mean_error_px"] == 0.3801
    assert std["p90_error_px"] == 0.5684
    assert std["accuracy_1px_pct"] == 96.95
    assert std["accuracy_2px_pct"] == 99.11
    assert std["accuracy_3px_pct"] == 99.55
    assert std["inlier_ratio_pct"] == 99.42
    assert std["mean_confidence_pct"] == 90.36
    assert std["runtime_ms"] == 29.4

    stress = data["stress"]
    assert stress["mean_error_px"] == 0.5458
    assert stress["p90_error_px"] == 0.6644
    assert stress["accuracy_1px_pct"] == 95.38
    assert stress["accuracy_3px_pct"] == 99.24
    assert stress["inlier_ratio_pct"] == 99.06
    assert stress["mean_confidence_pct"] == 89.70
    assert stress["runtime_ms"] == 30.2

    assert len(data.get("ablations", [])) >= 3

def test_provenance_endpoint():
    response = client.get("/api/provenance")
    assert response.status_code == 200
    data = response.json()
    states = data["scientific_states"]
    assert "SPATIALLY PAIRED" in states
    assert "GEOGRAPHICALLY ASSOCIATED" in states
    assert "INTEGRATION PENDING" in states
    assert "VALIDATED BENCHMARK" in states
    assert len(data["limitations"]) >= 6

def test_methodology_endpoint():
    response = client.get("/api/methodology")
    assert response.status_code == 200
    data = response.json()
    stages = data["pipeline_stages"]
    assert len(stages) == 7
    stage_names = [s["name"] for s in stages]
    assert "Data Ingestion & Calibration" in stage_names[0]
    assert "Hierarchical Tri-Sensor Co-Registration" in stage_names[6]

def test_graph_endpoint():
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) == 3
    assert len(data["edges"]) >= 3

def test_match_post_endpoint():
    payload = {
        "image_a_id": "ohrc_sun18deg.png",
        "image_b_id": "ohrc_sun52deg.png",
        "modality_a": "OHRC",
        "modality_b": "OHRC"
    }
    response = client.post("/api/match", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
