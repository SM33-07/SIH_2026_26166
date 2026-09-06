import pytest
from app.services import tmc2_service


def test_tmc2_quality_filter():
    # Passing patch
    passed, reason = tmc2_service.check_patch_quality(mean=100.0, std=15.0, percent_dark=2.0, percent_bright=3.0)
    assert passed is True
    assert reason is None

    # Mean < 40 rejected
    passed, reason = tmc2_service.check_patch_quality(mean=35.0, std=10.0, percent_dark=1.0, percent_bright=1.0)
    assert passed is False
    assert "Mean" in reason

    # Std < 2 rejected
    passed, reason = tmc2_service.check_patch_quality(mean=80.0, std=1.5, percent_dark=0.0, percent_bright=0.0)
    assert passed is False
    assert "Standard deviation" in reason

    # Dark pixels >= 10% rejected
    passed, reason = tmc2_service.check_patch_quality(mean=60.0, std=5.0, percent_dark=12.0, percent_bright=0.0)
    assert passed is False
    assert "Dark" in reason

    # Bright saturated pixels >= 10% rejected
    passed, reason = tmc2_service.check_patch_quality(mean=80.0, std=8.0, percent_dark=0.0, percent_bright=15.0)
    assert passed is False
    assert "saturated" in reason.lower()


def test_shard_cumulative_offsets_math():
    """Verify cumulative shard resolution logic across unequal shard sizes."""
    # Mock shard offsets table: 3 shards with unequal sizes
    # Shard 0: 1,000 items (0..999)
    # Shard 1: 2,500 items (1,000..3,499)
    # Shard 2: 1,500 items (3,500..4,999)
    synthetic_offsets = [
        ("shard_00.h5", 0, 1000),
        ("shard_01.h5", 1000, 2500),
        ("shard_02.h5", 3500, 1500),
    ]
    tmc2_service._SHARD_OFFSETS = synthetic_offsets
    tmc2_service._TOTAL_RECORDS = 5000

    # Index 0 -> shard 0, local 0
    s_path, l_idx = tmc2_service.resolve_shard_location(0)
    assert s_path == "shard_00.h5" and l_idx == 0

    # Index 999 -> shard 0, local 999
    s_path, l_idx = tmc2_service.resolve_shard_location(999)
    assert s_path == "shard_00.h5" and l_idx == 999

    # Index 1000 -> shard 1, local 0
    s_path, l_idx = tmc2_service.resolve_shard_location(1000)
    assert s_path == "shard_01.h5" and l_idx == 0

    # Index 3499 -> shard 1, local 2499
    s_path, l_idx = tmc2_service.resolve_shard_location(3499)
    assert s_path == "shard_01.h5" and l_idx == 2499

    # Index 3500 -> shard 2, local 0
    s_path, l_idx = tmc2_service.resolve_shard_location(3500)
    assert s_path == "shard_02.h5" and l_idx == 0

    # Index 5000 -> Out of bounds raises IndexError
    with pytest.raises(IndexError):
        tmc2_service.resolve_shard_location(5000)
