import pytest
from app.services import decision_service


def test_decision_same_lunar_zone():
    pairwise = {
        "ohrc_tmc2": {"distance_deg": 0.0003, "status": "PASS"},
        "ohrc_iirs": {"distance_deg": 0.0005, "status": "PASS"},
        "tmc2_iirs": {"distance_deg": 0.0004, "status": "PASS"},
    }
    feature_matches = {
        "total_inliers": 8,
        "mean_confidence": 0.88,
    }

    verdict, score, explanation = decision_service.evaluate_decision(pairwise, feature_matches)
    assert verdict == decision_service.VERDICT_SAME
    assert score >= 0.85
    assert explanation["pairwise_passes"] == 3


def test_decision_different_lunar_zones():
    pairwise = {
        "ohrc_tmc2": {"distance_deg": 0.15, "status": "FAIL"},
        "ohrc_iirs": {"distance_deg": 0.20, "status": "FAIL"},
        "tmc2_iirs": {"distance_deg": 0.18, "status": "FAIL"},
    }
    feature_matches = {
        "total_inliers": 0,
        "mean_confidence": 0.0,
    }

    verdict, score, explanation = decision_service.evaluate_decision(pairwise, feature_matches)
    assert verdict == decision_service.VERDICT_DIFFERENT
    assert score < 0.40
    assert explanation["pairwise_passes"] == 0


def test_decision_inconclusive():
    # Only 1 or 2 pairs pass, or distance borderline
    pairwise = {
        "ohrc_tmc2": {"distance_deg": 0.015, "status": "PASS"},
        "ohrc_iirs": {"distance_deg": 0.025, "status": "FAIL"},
        "tmc2_iirs": {"distance_deg": 0.018, "status": "PASS"},
    }
    feature_matches = {
        "total_inliers": 2,
        "mean_confidence": 0.55,
    }

    verdict, score, explanation = decision_service.evaluate_decision(pairwise, feature_matches)
    assert verdict == decision_service.VERDICT_INCONCLUSIVE
    assert explanation["pairwise_passes"] == 2
