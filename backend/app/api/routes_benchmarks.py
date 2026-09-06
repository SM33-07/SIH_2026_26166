from __future__ import annotations

import json
import os
from typing import Any
from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["Benchmarks"])


@router.get("/benchmarks/retrieval")
def get_retrieval_benchmark() -> dict[str, Any]:
    """Return TMC-2 retrieval benchmark summary."""
    return {
        "benchmark": "TMC-2 Retrieval Candidate Evaluation",
        "sample_size": 10,
        "metrics": {
            "top_1_accuracy_percent": 90.0,
            "top_5_accuracy_percent": 100.0,
            "top_10_accuracy_percent": 100.0,
            "mean_reciprocal_rank": 0.95,
        },
        "role": "Candidate generation evidence only (not sole final classifier).",
    }


@router.get("/benchmarks/historical-step5d")
def get_historical_step5d() -> dict[str, Any]:
    """Return historical Step5D validation results.

    IMPORTANT: Step5D checkpoint is NOT physically present in the package.
    These numbers must not be claimed as reproduced from the bundled checkpoint.
    """
    records_dir = settings.TRAINING_RECORDS_ROOT or os.path.join(settings.MODEL_PACKAGE_ROOT, "training_records")
    step5d_file = os.path.join(records_dir, "step5d_historical_results.json")

    if os.path.exists(step5d_file):
        try:
            with open(step5d_file, "r") as f:
                data = json.load(f)
            return data
        except Exception:
            pass

    return {
        "status": "HISTORICAL_RESULT_ONLY",
        "checkpoint_available_in_current_session": False,
        "recorded_validation_result": {
            "loss": 0.157929,
            "coarse_top1_accuracy_percent": 99.7583,
            "mean_confidence": 0.858561,
            "mean_displacement_cells": 0.0024168,
            "exact_pair_accuracy_percent": 95.8955,
        },
        "important_note": (
            "The exact Step5D checkpoint that produced the recorded validation result is not present "
            "in the current filesystem. Bundled checkpoint is tmc2_loftr_available.pt."
        ),
    }


@router.get("/benchmarks/audit")
def get_evaluation_audit() -> dict[str, Any]:
    """Scientific audit of high accuracy claims (99.97% verification audit)."""
    return {
        "status": "UNVERIFIED MODEL OUTPUT",
        "audit_policy": (
            "Any observed 99.97% result is strictly treated as an unverified experimental output "
            "until independent audit for train/test leakage, augmentation overlap, and negative pair "
            "generalization has been conducted."
        ),
        "audit_checklist": [
            {"check": "Train/test leakage", "status": "PENDING_AUDIT"},
            {"check": "Duplicate or near-duplicate lunar scenes", "status": "PENDING_AUDIT"},
            {"check": "Source image boundary overlap", "status": "PENDING_AUDIT"},
            {"check": "Ground-truth generation leakage", "status": "PENDING_AUDIT"},
            {"check": "Negative / random pairs evaluation", "status": "PENDING_AUDIT"},
            {"check": "Unseen polar region generalization", "status": "PENDING_AUDIT"},
        ],
        "official_benchmark_inclusion": False,
    }
