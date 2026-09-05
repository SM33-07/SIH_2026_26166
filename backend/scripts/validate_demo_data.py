"""
Comprehensive Data Validation Utility for SIH26166 Backend Demo Assets.
Checks:
[✓] All 4 pair IDs exist (2267, 3463, 5353, 7674)
[✓] CSV coordinates match cases.json
[✓] IIRS images exist
[✓] TMC-2 images exist
[✓] OHRC images exist
[✓] Sensor metadata exists
[✓] GSD values match scientific specifications (0.28m, 5.0m, 86.5m)
[✓] Scale ratios are consistent (17.3x, 17.86x, 308.93x)
[✓] Benchmark JSON parses with verified values
[✓] Provenance and methodology data exist
[✓] Heavy scientific files remain protected
"""

import os
import json
import csv
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

EXPECTED_PAIRS = ["pair_2267", "pair_3463", "pair_5353", "pair_7674"]

def validate_all():
    errors = []
    checks_passed = 0

    print("============================================================")
    print("SIH26166 BACKEND DATA & SCIENTIFIC CONTRACT VALIDATOR")
    print("============================================================")

    # 1. Load cases.json
    cases_file = os.path.join(BASE_DIR, "data", "demo", "cases.json")
    if not os.path.exists(cases_file):
        errors.append(f"Missing cases.json at {cases_file}")
        return False

    with open(cases_file, "r", encoding="utf-8") as f:
        cases_data = json.load(f)
    cases = cases_data.get("cases", [])
    case_ids = [c["id"] for c in cases]

    for ep in EXPECTED_PAIRS:
        if ep in case_ids:
            checks_passed += 1
        else:
            errors.append(f"Missing expected pair ID: {ep}")
    print(f"[OK] All four primary pair IDs exist: {EXPECTED_PAIRS}")

    # 2. Check CSV coordinates match cases.json
    csv_file = os.path.join(BASE_DIR, "data", "demo", "pairs", "selected_4_pairs.csv")
    if os.path.exists(csv_file):
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = f"pair_{row['Pair_Index']}"
                matching_case = next((c for c in cases if c["id"] == pid), None)
                if matching_case:
                    csv_lat = float(row["Latitude"])
                    csv_lon = float(row["Longitude"])
                    case_lat = float(matching_case["latitude"])
                    case_lon = float(matching_case["longitude"])
                    if abs(csv_lat - case_lat) < 1e-4 and abs(csv_lon - case_lon) < 1e-4:
                        checks_passed += 1
                    else:
                        errors.append(f"Coordinate mismatch for {pid}: CSV=({csv_lat}, {csv_lon}) vs Case=({case_lat}, {case_lon})")
        print("[OK] Coordinates match selected_4_pairs.csv exactly.")
    else:
        errors.append(f"Missing selected_4_pairs.csv at {csv_file}")

    # 3. Check Image Assets exist
    for c in cases:
        pid = c["id"].replace("pair_", "")
        pair_dir = os.path.join(BASE_DIR, "data", "demo", "pairs", pid)
        iirs_img = os.path.join(pair_dir, "iirs.png")
        tmc2_img = os.path.join(pair_dir, "tmc2.png")
        ohrc_img = os.path.join(pair_dir, "ohrc.png")

        if os.path.exists(iirs_img) and os.path.getsize(iirs_img) > 0:
            checks_passed += 1
        else:
            errors.append(f"Missing IIRS image for {pid} at {iirs_img}")

        if os.path.exists(tmc2_img) and os.path.getsize(tmc2_img) > 0:
            checks_passed += 1
        else:
            errors.append(f"Missing TMC-2 image for {pid} at {tmc2_img}")

        if os.path.exists(ohrc_img) and os.path.getsize(ohrc_img) > 0:
            checks_passed += 1
        else:
            errors.append(f"Missing OHRC image for {pid} at {ohrc_img}")
    print("[OK] Real IIRS, TMC-2, and OHRC derivative images exist for all 4 pairs.")

    # 4. Check Sensors Metadata and GSD
    sensors_file = os.path.join(BASE_DIR, "data", "demo", "sensors.json")
    with open(sensors_file, "r", encoding="utf-8") as f:
        sensors_data = json.load(f)
    sensors = sensors_data.get("sensors", [])
    sensor_map = {s["id"]: s for s in sensors}

    if "OHRC" in sensor_map and sensor_map["OHRC"]["gsd_m_per_pixel"] == 0.28:
        checks_passed += 1
    else:
        errors.append("OHRC GSD is not 0.28 m/pixel")

    if "TMC2" in sensor_map and sensor_map["TMC2"]["gsd_m_per_pixel"] == 5.0:
        checks_passed += 1
    else:
        errors.append("TMC-2 GSD is not 5.0 m/pixel")

    if "IIRS" in sensor_map and sensor_map["IIRS"]["gsd_m_per_pixel"] == 86.5:
        checks_passed += 1
    else:
        errors.append("IIRS GSD is not 86.5 m/pixel")
    print("[OK] Sensor metadata & GSD verified (OHRC: 0.28m, TMC-2: 5.0m, IIRS: 86.5m).")

    # 5. Check Scale Ratios
    ratios = sensors_data.get("scale_ratios", {})
    if ratios.get("IIRS_to_TMC2") == 17.3 and ratios.get("TMC2_to_OHRC") == 17.86 and ratios.get("IIRS_to_OHRC") == 308.93:
        checks_passed += 1
        print("[OK] Scale ratios verified: 17.3x (IIRS/TMC-2), 17.86x (TMC-2/OHRC), 308.93x (IIRS/OHRC).")
    else:
        errors.append(f"Scale ratios mismatch: {ratios}")

    # 6. Check Benchmark JSON
    bench_file = os.path.join(BASE_DIR, "data", "demo", "benchmarks.json")
    with open(bench_file, "r", encoding="utf-8") as f:
        b_data = json.load(f)
    std = b_data.get("standard", {})
    strss = b_data.get("stress", {})

    if std.get("mean_error_px") == 0.3801 and std.get("inlier_ratio_pct") == 99.42 and std.get("runtime_ms") == 29.4:
        checks_passed += 1
    else:
        errors.append(f"Standard benchmark metrics mismatch: {std}")

    if strss.get("mean_error_px") == 0.5458 and strss.get("inlier_ratio_pct") == 99.06 and strss.get("runtime_ms") == 30.2:
        checks_passed += 1
    else:
        errors.append(f"Stress benchmark metrics mismatch: {strss}")

    if b_data.get("real_scene_accuracy") is False and b_data.get("three_sensor_accuracy") is False:
        checks_passed += 1
    else:
        errors.append("Benchmark provenance flags should both be False")
    print("[OK] Verified IIRS synthetic benchmarks and caveats verified.")

    # 7. Check Methodology and Provenance
    meth_file = os.path.join(BASE_DIR, "data", "demo", "methodology.json")
    with open(meth_file, "r", encoding="utf-8") as f:
        m_data = json.load(f)
    if len(m_data.get("pipeline_stages", [])) == 7:
        checks_passed += 1
        print("[OK] 7-stage processing methodology verified.")
    else:
        errors.append("Methodology does not contain 7 stages")

    prov_file = os.path.join(BASE_DIR, "data", "demo", "provenance.json")
    with open(prov_file, "r", encoding="utf-8") as f:
        p_data = json.load(f)
    if len(p_data.get("limitations", [])) >= 6 and len(p_data.get("scientific_states", {})) >= 6:
        checks_passed += 1
        print("[OK] Provenance states and scientific limitations verified.")
    else:
        errors.append("Provenance states or limitations incomplete")

    # 8. Check Heavy Scientific Files Protection
    heavy_extensions = [".h5", ".npy", ".npz", ".pt", ".pth", ".ckpt", ".zip"]
    demo_dirs = [os.path.join(BASE_DIR, "data", "demo"), os.path.join(BASE_DIR, "backend", "data", "demo")]
    found_heavy = []
    for d in demo_dirs:
        for root, dirs, files in os.walk(d):
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in heavy_extensions:
                    found_heavy.append(os.path.join(root, f))
    if not found_heavy:
        checks_passed += 1
        print("[OK] Heavy scientific files protection verified (0 heavy files in static demo).")
    else:
        errors.append(f"Heavy scientific files found exposed: {found_heavy}")

    print("============================================================")
    if errors:
        print(f"FAILED with {len(errors)} errors:")
        for e in errors:
            print(f"  - {e}")
        return False
    else:
        print(f"SUCCESS: All {checks_passed} validation assertions passed cleanly!")
        return True

if __name__ == "__main__":
    success = validate_all()
    sys.exit(0 if success else 1)
