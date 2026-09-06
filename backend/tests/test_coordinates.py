import pytest
from app.services import coordinate_service


def test_normalize_longitude():
    assert coordinate_service.normalize_longitude(0.0) == 0.0
    assert coordinate_service.normalize_longitude(355.444914) == pytest.approx(355.444914)
    # -5 degrees should map to 355 degrees
    assert coordinate_service.normalize_longitude(-5.0) == pytest.approx(355.0)
    # -180 degrees should map to 180 degrees
    assert coordinate_service.normalize_longitude(-180.0) == pytest.approx(180.0)
    # 360 degrees should map to 0 degrees
    assert coordinate_service.normalize_longitude(360.0) == 0.0
    # 370 degrees should map to 10 degrees
    assert coordinate_service.normalize_longitude(370.0) == pytest.approx(10.0)


def test_validate_coordinates():
    lat, lon = coordinate_service.validate_coordinates(60.792810, -4.555086)
    assert lat == pytest.approx(60.792810)
    assert lon == pytest.approx(355.444914)

    # Invalid latitudes
    with pytest.raises(ValueError):
        coordinate_service.validate_coordinates(95.0, 0.0)

    with pytest.raises(ValueError):
        coordinate_service.validate_coordinates(-90.1, 0.0)


def test_calculate_angular_distance():
    d = coordinate_service.calculate_angular_distance(0.0, -5.0, 0.0, 355.0)
    # Both are 355 degrees, so distance should be 0.0
    assert d == pytest.approx(0.0)
