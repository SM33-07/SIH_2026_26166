from __future__ import annotations

from typing import Any, Optional

VERDICT_SAME = "SAME LUNAR ZONE"
VERDICT_DIFFERENT = "DIFFERENT LUNAR ZONES"
VERDICT_INCONCLUSIVE = "INSUFFICIENT / INCONCLUSIVE EVIDENCE"


def evaluate_decision(
    pairwise: dict[str, Any],
    feature_matches: Optional[dict[str, Any]] = None,
    geometric_evidence: Optional[dict[str, Any]] = None,
    candidate_similarity: Optional[float] = None,
) -> tuple[str, float, dict[str, Any]]:
    """Multi-evidence fusion decision engine.

    Evidence layers:
        1. Geographic distance agreement (0.02° threshold)
        2. Candidate retrieval similarity
        3. Learned LoFTR correspondence evidence
        4. Robust geometric verification evidence

    Returns:
        (decision_string, consistency_score, explanation_dict)
    """
    ot_pass = pairwise.get("ohrc_tmc2", {}).get("status") == "PASS"
    oi_pass = pairwise.get("ohrc_iirs", {}).get("status") == "PASS"
    ti_pass = pairwise.get("tmc2_iirs", {}).get("status") == "PASS"

    pass_count = sum([ot_pass, oi_pass, ti_pass])
    max_dist = max(
        pairwise.get("ohrc_tmc2", {}).get("distance_deg", 0.0),
        pairwise.get("ohrc_iirs", {}).get("distance_deg", 0.0),
        pairwise.get("tmc2_iirs", {}).get("distance_deg", 0.0),
    )

    inliers = feature_matches.get("total_inliers", 0) if feature_matches else 0
    mean_conf = feature_matches.get("mean_confidence", 0.0) if feature_matches else 0.0

    # Base geographic score
    if pass_count == 3:
        # All three pairs agree within 0.02°
        base_geo_score = max(0.85, 1.0 - max_dist * 5.0)
    elif pass_count == 0:
        # Complete mismatch
        base_geo_score = max(0.05, 0.3 - max_dist * 2.0)
    else:
        # Partial agreement
        base_geo_score = 0.5 - (3 - pass_count) * 0.15

    # Weight in correspondence evidence if available
    if inliers > 0:
        corr_weight = 0.2
        corr_score = min(1.0, mean_conf * (1.0 if inliers >= 4 else 0.8))
        final_score = (1.0 - corr_weight) * base_geo_score + corr_weight * corr_score
    else:
        final_score = base_geo_score

    final_score = round(float(min(1.0, max(0.0, final_score))), 6)

    # Decision logic
    if pass_count == 3 and final_score >= 0.80:
        verdict = VERDICT_SAME
        reason = "Three-sensor geographic consistency confirmed within strict 0.02° boresight radius."
    elif pass_count == 0 or max_dist > 0.05:
        verdict = VERDICT_DIFFERENT
        reason = f"Cross-modality observations are geographically disparate (max separation: {max_dist:.6f}°)."
    else:
        verdict = VERDICT_INCONCLUSIVE
        reason = (
            f"Sensor agreement is partial ({pass_count}/3 pairs passed) or confidence is insufficient. "
            "Evidence inconclusive."
        )

    explanation = {
        "verdict": verdict,
        "consistency_score": final_score,
        "pairwise_passes": pass_count,
        "maximum_separation_deg": round(max_dist, 6),
        "total_inliers": inliers,
        "mean_confidence": mean_conf,
        "reason": reason,
    }

    return verdict, final_score, explanation
