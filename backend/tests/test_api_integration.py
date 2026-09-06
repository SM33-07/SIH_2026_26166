import io
import numpy as np
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
    # Load all models and catalogs once
    settings.resolve_paths()
    common_point_service.load(settings.MODEL_PACKAGE_ROOT)
    coordinate_service.build_spatial_index()
    tmc2_service.load_mapping(settings.MODEL_PACKAGE_ROOT)
    ohrc_service.load_metadata(settings.MODEL_PACKAGE_ROOT)
    loftr_service.init_matcher(settings.MODEL_PACKAGE_ROOT)

    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoints(client):
    # Both /api/v1/health and /api/health must work identically
    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    data_v1 = res_v1.json()
    assert data_v1["status"] == "ok"
    assert data_v1["common_points"] == 1514
    assert data_v1["judge_points"] == 500
    assert data_v1["tmc2_shards"] == 34
    assert "scientific_metadata" in data_v1

    res_legacy = client.get("/api/health")
    assert res_legacy.status_code == 200
    assert res_legacy.json() == data_v1


def test_coordinate_search_controlled_demo(client):
    # Query: 60.792810, 355.444914
    # Must naturally resolve to CP_000001, OHRC 3586, TMC2 8211, IIRS (201, 244)
    payload = {"latitude": 60.792810, "longitude": 355.444914}
    res = client.post("/api/v1/coordinate/search", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["decision"] == "SAME LUNAR ZONE"
    assert data["common_point_id"] == "CP_000001"
    assert data["sensors"]["ohrc"]["tile_id"] == 3586
    assert data["sensors"]["tmc2"]["patch_id"] == 8211
    assert data["sensors"]["iirs"]["iirs_row"] == 201
    assert data["sensors"]["iirs"]["iirs_col"] == 244
    assert data["consistency_score"] > 0.85
    assert "images" in data
    assert "ohrc" in data["images"]
    assert "tmc2" in data["images"]
    assert "iirs" in data["images"]

    # Test alias /api/coordinate/search
    res_legacy = client.post("/api/coordinate/search", json=payload)
    assert res_legacy.status_code == 200
    assert res_legacy.json()["common_point_id"] == "CP_000001"


def test_judge_demo_point(client):
    res = client.get("/api/v1/demo/JUDGE_0001")
    assert res.status_code == 200
    data = res.json()
    assert data["judge_point_id"] == "JUDGE_0001"
    assert data["decision"] == "SAME LUNAR ZONE"
    assert data["common_point_id"] == "CP_000001"


def test_common_point_detail(client):
    res = client.get("/api/v1/common-points/CP_000001")
    assert res.status_code == 200
    data = res.json()
    assert data["common_point_id"] == "CP_000001"
    assert data["ohrc_tile_id"] == 3586
    assert data["patch_id"] == 8211
    assert data["iirs_row"] == 201
    assert data["iirs_col"] == 244


def test_media_streaming(client):
    res = client.get("/api/v1/media/judge/JUDGE_0001/ohrc")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 100


def test_sensors_and_benchmarks(client):
    res_s = client.get("/api/v1/sensors/characteristics")
    assert res_s.status_code == 200
    assert res_s.json()["sensors"]["tmc2"]["gsd_m_per_px"] == 5.41
    assert res_s.json()["sensors"]["ohrc"]["gsd_m_per_px"] == 0.28
    assert res_s.json()["sensors"]["iirs"]["gsd_m_per_px"] == 86.5

    res_b = client.get("/api/v1/benchmarks/retrieval")
    assert res_b.status_code == 200
    assert res_b.json()["metrics"]["mean_reciprocal_rank"] == 0.95

    res_a = client.get("/api/v1/benchmarks/audit")
    assert res_a.status_code == 200
    assert res_a.json()["status"] == "UNVERIFIED MODEL OUTPUT"


def test_three_image_upload(client):
    # Synthetic small numpy arrays saved as PNG/NPY
    arr = np.random.randint(50, 200, size=(128, 128), dtype=np.uint8)
    buf = io.BytesIO()
    np.save(buf, arr)
    npy_bytes = buf.getvalue()

    files = {
        "ohrc_image": ("test_ohrc.npy", npy_bytes, "application/octet-stream"),
        "tmc2_image": ("test_tmc2.npy", npy_bytes, "application/octet-stream"),
        "iirs_image": ("test_iirs.npy", npy_bytes, "application/octet-stream"),
    }
    res = client.post("/api/v1/match/three-images", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "decision" in data
    assert "consistency_score" in data
    assert "provenance" in data
