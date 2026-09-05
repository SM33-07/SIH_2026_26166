"""
Evaluation and Ablation Benchmark API Endpoints (SIH26166).
"""

import os
import json
import cv2
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from ml.evaluation.harness import run_ablation_experiment

router = APIRouter()

@router.post("/api/evaluation/run")
def trigger_evaluation():
    demo_dir = os.path.join(settings.DATA_DIR, "demo")
    manifest_path = os.path.join(demo_dir, "manifest.json")

    if not os.path.exists(manifest_path):
        from scripts.prepare_demo import prepare_demo_dataset
        prepare_demo_dataset()

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    results = []
    for pair in manifest.get("pairs", []):
        img_a_path = os.path.join(demo_dir, pair["image_a"])
        img_b_path = os.path.join(demo_dir, pair["image_b"])

        img_a = cv2.imread(img_a_path, cv2.IMREAD_GRAYSCALE)
        img_b = cv2.imread(img_b_path, cv2.IMREAD_GRAYSCALE)

        if img_a is not None and img_b is not None:
            ablation = run_ablation_experiment(
                img_a, img_b,
                modality_pair=f"{pair['instrument_a']}-{pair['instrument_b']}",
                sun_elevation_a=pair.get("sun_elevation_a"),
                sun_elevation_b=pair.get("sun_elevation_b"),
                gsd_a=pair.get("gsd_a"),
                gsd_b=pair.get("gsd_b")
            )
            results.append({
                "pair_id": pair["id"],
                "name": pair["name"],
                "ablation": ablation
            })

    output_path = os.path.join(settings.BASE_DIR, "reports", "results", "evaluation_summary.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    return {"status": "completed", "total_pairs_evaluated": len(results), "data": results}

@router.get("/api/evaluation/latest")
def get_latest_evaluation():
    output_path = os.path.join(settings.BASE_DIR, "reports", "results", "evaluation_summary.json")
    if not os.path.exists(output_path):
        return trigger_evaluation()

    with open(output_path, "r") as f:
        return json.load(f)
