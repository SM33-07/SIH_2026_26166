"""
CLI Evaluation Benchmark Runner for Lunar Image Correspondence (SIH26166).

Runs evaluation across demo datasets and generates reports/evaluation_results.json.

Run:
python scripts/run_evaluation.py
"""

import os
import sys
import json
import cv2
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.evaluation.harness import run_ablation_experiment

def main():
    demo_dir = os.path.join("data", "demo")
    manifest_path = os.path.join(demo_dir, "manifest.json")

    if not os.path.exists(manifest_path):
        print("Demo dataset not found. Running prepare_demo.py first...")
        from scripts.prepare_demo import prepare_demo_dataset
        prepare_demo_dataset()

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    reports_dir = os.path.join("reports", "results")
    os.makedirs(reports_dir, exist_ok=True)

    summary_results = []

    for pair in manifest.get("pairs", []):
        print(f"\n--- Evaluating Pair: {pair['name']} ---")
        img_a_path = os.path.join(demo_dir, pair["image_a"])
        img_b_path = os.path.join(demo_dir, pair["image_b"])

        img_a = cv2.imread(img_a_path, cv2.IMREAD_GRAYSCALE)
        img_b = cv2.imread(img_b_path, cv2.IMREAD_GRAYSCALE)

        if img_a is None or img_b is None:
            print(f"Skipping {pair['id']}: missing images.")
            continue

        modality_pair = f"{pair['instrument_a']}-{pair['instrument_b']}"
        ablation = run_ablation_experiment(
            img_a, img_b,
            modality_pair=modality_pair,
            sun_elevation_a=pair.get("sun_elevation_a"),
            sun_elevation_b=pair.get("sun_elevation_b"),
            gsd_a=pair.get("gsd_a"),
            gsd_b=pair.get("gsd_b")
        )

        pair_summary = {
            "pair_id": pair["id"],
            "name": pair["name"],
            "modality_pair": modality_pair,
            "ablation_results": ablation
        }
        summary_results.append(pair_summary)

    output_path = os.path.join(reports_dir, "evaluation_summary.json")
    with open(output_path, "w") as f:
        json.dump(summary_results, f, indent=2)

    print(f"\nEvaluation benchmark complete! Saved results to {output_path}")

if __name__ == "__main__":
    main()
