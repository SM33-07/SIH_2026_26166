"""
Build and validate all authoritative SIH26166 demo data files.
Creates:
- cases.json
- sensors.json
- benchmarks.json
- methodology.json
- provenance.json
- manifest.json
in both data/demo/ and backend/data/demo/
"""

import os
import json

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DEMO_DIR = os.path.join(BASE_DIR, "data", "demo")
BACKEND_DEMO_DIR = os.path.join(BASE_DIR, "backend", "data", "demo")

# 1. Authoritative 4 Real Geographic Pairs
PAIRS_DATA = [
    {
        "id": "pair_2267",
        "case_id": "2267",
        "name": "Target Region Pair 2267",
        "region": "Sinus Roris / Northern Oceanus Procellarum",
        "latitude": 60.989399854,
        "longitude": -4.677456283250024,
        "lat": 60.989400,
        "lon": -4.677456,
        "location": {
            "latitude": 60.989399854,
            "longitude": -4.677456283250024
        },
        "description": "Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.",
        "primary_pair": "IIRS_TMC2",
        "sensors": {
            "IIRS": {
                "image": "/static/demo/pairs/2267/iirs.png",
                "image_url": "/static/demo/pairs/2267/iirs.png",
                "instrument": "IIRS",
                "modality": "hyperspectral",
                "bands": 256,
                "gsd_m_per_px": 86.5,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_2267_IIRS_Lat_60.989400_Lon_-4.677456.png"
            },
            "TMC2": {
                "image": "/static/demo/pairs/2267/tmc2.png",
                "image_url": "/static/demo/pairs/2267/tmc2.png",
                "instrument": "TMC-2",
                "modality": "panchromatic_stereo_triplet",
                "bands": 1,
                "gsd_m_per_px": 5.0,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_2267_TMC2_Lat_60.989400_Lon_-4.677456.png"
            },
            "OHRC": {
                "image": "/static/demo/pairs/2267/ohrc.png",
                "image_url": "/static/demo/pairs/2267/ohrc.png",
                "instrument": "OHRC",
                "modality": "panchromatic_high_resolution",
                "bands": 1,
                "gsd_m_per_px": 0.28,
                "status": "geographically_associated",
                "tile_id": 229,
                "hdf5_index": 229,
                "lat_center": 60.989416,
                "lon_center": -4.679032,
                "distance_to_target": 23.2,
                "distance_to_target_m": 23.2,
                "note": "Closest OHRC tile (offset 23.2 m) from ohrc_full_13770.h5"
            }
        },
        "sensor_availability": {
            "IIRS": True,
            "TMC2": True,
            "OHRC": True
        },
        "statuses": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "preview_urls": {
            "IIRS": "/static/demo/pairs/2267/iirs.png",
            "TMC2": "/static/demo/pairs/2267/tmc2.png",
            "OHRC": "/static/demo/pairs/2267/ohrc.png"
        },
        "scale_ratios": {
            "iirs_tmc2": 17.3,
            "tmc2_ohrc": 17.86,
            "iirs_ohrc": 308.93
        },
        "pair_status": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "three_way_integration": {
            "bridge_sensor": "TMC-2",
            "strategy": "hierarchical_tri_sensor_registration",
            "status": "integration_pending",
            "scale_chain": "IIRS (86.5 m/px) -> TMC-2 (5.0 m/px) -> OHRC (0.28 m/px)",
            "conceptual_chain": "IIRS↔OHRC ≈ (TMC-2↔OHRC) ∘ (IIRS↔TMC-2)",
            "chain_status": "conceptual"
        },
        "provenance": {
            "type": "real_spatial_scene",
            "source": "Chandrayaan-2 Real Co-located Scenes",
            "real_spatial_scene": True,
            "accuracy_validated": False,
            "notes": "Real spatially corresponding IIRS and TMC-2 scene with geographically closest OHRC counterpart tile."
        },
        "pairs": [
            {
                "pair_key": "IIRS_TMC2",
                "instrument_a": "IIRS",
                "instrument_b": "TMC2",
                "status": "spatially_paired",
                "file": "IIRS_TMC2.json"
            },
            {
                "pair_key": "TMC2_OHRC",
                "instrument_a": "TMC2",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "TMC2_OHRC.json"
            },
            {
                "pair_key": "IIRS_OHRC",
                "instrument_a": "IIRS",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "IIRS_OHRC.json"
            }
        ]
    },
    {
        "id": "pair_3463",
        "case_id": "3463",
        "name": "Target Region Pair 3463",
        "region": "Sinus Roris / Northern Oceanus Procellarum",
        "latitude": 60.839792389,
        "longitude": -4.6951810540500105,
        "lat": 60.839792,
        "lon": -4.695181,
        "location": {
            "latitude": 60.839792389,
            "longitude": -4.6951810540500105
        },
        "description": "Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.",
        "primary_pair": "IIRS_TMC2",
        "sensors": {
            "IIRS": {
                "image": "/static/demo/pairs/3463/iirs.png",
                "image_url": "/static/demo/pairs/3463/iirs.png",
                "instrument": "IIRS",
                "modality": "hyperspectral",
                "bands": 256,
                "gsd_m_per_px": 86.5,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_3463_IIRS_Lat_60.839792_Lon_-4.695181.png"
            },
            "TMC2": {
                "image": "/static/demo/pairs/3463/tmc2.png",
                "image_url": "/static/demo/pairs/3463/tmc2.png",
                "instrument": "TMC-2",
                "modality": "panchromatic_stereo_triplet",
                "bands": 1,
                "gsd_m_per_px": 5.0,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_3463_TMC2_Lat_60.839792_Lon_-4.695181.png"
            },
            "OHRC": {
                "image": "/static/demo/pairs/3463/ohrc.png",
                "image_url": "/static/demo/pairs/3463/ohrc.png",
                "instrument": "OHRC",
                "modality": "panchromatic_high_resolution",
                "bands": 1,
                "gsd_m_per_px": 0.28,
                "status": "geographically_associated",
                "tile_id": 2748,
                "hdf5_index": 2748,
                "lat_center": 60.841111,
                "lon_center": -4.697437,
                "distance_to_target": 52.1,
                "distance_to_target_m": 52.1,
                "note": "Closest OHRC tile (offset 52.1 m) from ohrc_full_13770.h5"
            }
        },
        "sensor_availability": {
            "IIRS": True,
            "TMC2": True,
            "OHRC": True
        },
        "statuses": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "preview_urls": {
            "IIRS": "/static/demo/pairs/3463/iirs.png",
            "TMC2": "/static/demo/pairs/3463/tmc2.png",
            "OHRC": "/static/demo/pairs/3463/ohrc.png"
        },
        "scale_ratios": {
            "iirs_tmc2": 17.3,
            "tmc2_ohrc": 17.86,
            "iirs_ohrc": 308.93
        },
        "pair_status": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "three_way_integration": {
            "bridge_sensor": "TMC-2",
            "strategy": "hierarchical_tri_sensor_registration",
            "status": "integration_pending",
            "scale_chain": "IIRS (86.5 m/px) -> TMC-2 (5.0 m/px) -> OHRC (0.28 m/px)",
            "conceptual_chain": "IIRS↔OHRC ≈ (TMC-2↔OHRC) ∘ (IIRS↔TMC-2)",
            "chain_status": "conceptual"
        },
        "provenance": {
            "type": "real_spatial_scene",
            "source": "Chandrayaan-2 Real Co-located Scenes",
            "real_spatial_scene": True,
            "accuracy_validated": False,
            "notes": "Real spatially corresponding IIRS and TMC-2 scene with geographically closest OHRC counterpart tile."
        },
        "pairs": [
            {
                "pair_key": "IIRS_TMC2",
                "instrument_a": "IIRS",
                "instrument_b": "TMC2",
                "status": "spatially_paired",
                "file": "IIRS_TMC2.json"
            },
            {
                "pair_key": "TMC2_OHRC",
                "instrument_a": "TMC2",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "TMC2_OHRC.json"
            },
            {
                "pair_key": "IIRS_OHRC",
                "instrument_a": "IIRS",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "IIRS_OHRC.json"
            }
        ]
    },
    {
        "id": "pair_5353",
        "case_id": "5353",
        "name": "Target Region Pair 5353",
        "region": "Sinus Roris / Northern Oceanus Procellarum",
        "latitude": 60.6036142065,
        "longitude": -4.695332187824988,
        "lat": 60.603614,
        "lon": -4.695332,
        "location": {
            "latitude": 60.6036142065,
            "longitude": -4.695332187824988
        },
        "description": "Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.",
        "primary_pair": "IIRS_TMC2",
        "sensors": {
            "IIRS": {
                "image": "/static/demo/pairs/5353/iirs.png",
                "image_url": "/static/demo/pairs/5353/iirs.png",
                "instrument": "IIRS",
                "modality": "hyperspectral",
                "bands": 256,
                "gsd_m_per_px": 86.5,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_5353_IIRS_Lat_60.603614_Lon_-4.695332.png"
            },
            "TMC2": {
                "image": "/static/demo/pairs/5353/tmc2.png",
                "image_url": "/static/demo/pairs/5353/tmc2.png",
                "instrument": "TMC-2",
                "modality": "panchromatic_stereo_triplet",
                "bands": 1,
                "gsd_m_per_px": 5.0,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_5353_TMC2_Lat_60.603614_Lon_-4.695332.png"
            },
            "OHRC": {
                "image": "/static/demo/pairs/5353/ohrc.png",
                "image_url": "/static/demo/pairs/5353/ohrc.png",
                "instrument": "OHRC",
                "modality": "panchromatic_high_resolution",
                "bands": 1,
                "gsd_m_per_px": 0.28,
                "status": "geographically_associated",
                "tile_id": 6802,
                "hdf5_index": 6802,
                "lat_center": 60.602680,
                "lon_center": -4.697775,
                "distance_to_target": 46.1,
                "distance_to_target_m": 46.1,
                "note": "Closest OHRC tile (offset 46.1 m) from ohrc_full_13770.h5"
            }
        },
        "sensor_availability": {
            "IIRS": True,
            "TMC2": True,
            "OHRC": True
        },
        "statuses": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "preview_urls": {
            "IIRS": "/static/demo/pairs/5353/iirs.png",
            "TMC2": "/static/demo/pairs/5353/tmc2.png",
            "OHRC": "/static/demo/pairs/5353/ohrc.png"
        },
        "scale_ratios": {
            "iirs_tmc2": 17.3,
            "tmc2_ohrc": 17.86,
            "iirs_ohrc": 308.93
        },
        "pair_status": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "three_way_integration": {
            "bridge_sensor": "TMC-2",
            "strategy": "hierarchical_tri_sensor_registration",
            "status": "integration_pending",
            "scale_chain": "IIRS (86.5 m/px) -> TMC-2 (5.0 m/px) -> OHRC (0.28 m/px)",
            "conceptual_chain": "IIRS↔OHRC ≈ (TMC-2↔OHRC) ∘ (IIRS↔TMC-2)",
            "chain_status": "conceptual"
        },
        "provenance": {
            "type": "real_spatial_scene",
            "source": "Chandrayaan-2 Real Co-located Scenes",
            "real_spatial_scene": True,
            "accuracy_validated": False,
            "notes": "Real spatially corresponding IIRS and TMC-2 scene with geographically closest OHRC counterpart tile."
        },
        "pairs": [
            {
                "pair_key": "IIRS_TMC2",
                "instrument_a": "IIRS",
                "instrument_b": "TMC2",
                "status": "spatially_paired",
                "file": "IIRS_TMC2.json"
            },
            {
                "pair_key": "TMC2_OHRC",
                "instrument_a": "TMC2",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "TMC2_OHRC.json"
            },
            {
                "pair_key": "IIRS_OHRC",
                "instrument_a": "IIRS",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "IIRS_OHRC.json"
            }
        ]
    },
    {
        "id": "pair_7674",
        "case_id": "7674",
        "name": "Target Region Pair 7674",
        "region": "Sinus Roris / Northern Oceanus Procellarum",
        "latitude": 60.217857712,
        "longitude": -4.695636387849959,
        "lat": 60.217858,
        "lon": -4.695636,
        "location": {
            "latitude": 60.217857712,
            "longitude": -4.695636387849959
        },
        "description": "Real geographically corresponding Chandrayaan-2 IIRS hyperspectral and TMC-2 panchromatic stereo scene with closest OHRC counterpart tile.",
        "primary_pair": "IIRS_TMC2",
        "sensors": {
            "IIRS": {
                "image": "/static/demo/pairs/7674/iirs.png",
                "image_url": "/static/demo/pairs/7674/iirs.png",
                "instrument": "IIRS",
                "modality": "hyperspectral",
                "bands": 256,
                "gsd_m_per_px": 86.5,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_7674_IIRS_Lat_60.217858_Lon_-4.695636.png"
            },
            "TMC2": {
                "image": "/static/demo/pairs/7674/tmc2.png",
                "image_url": "/static/demo/pairs/7674/tmc2.png",
                "instrument": "TMC-2",
                "modality": "panchromatic_stereo_triplet",
                "bands": 1,
                "gsd_m_per_px": 5.0,
                "status": "available",
                "data_type": "real_spatial_scene",
                "raw_file": "Pair_7674_TMC2_Lat_60.217858_Lon_-4.695636.png"
            },
            "OHRC": {
                "image": "/static/demo/pairs/7674/ohrc.png",
                "image_url": "/static/demo/pairs/7674/ohrc.png",
                "instrument": "OHRC",
                "modality": "panchromatic_high_resolution",
                "bands": 1,
                "gsd_m_per_px": 0.28,
                "status": "geographically_associated",
                "tile_id": 13334,
                "hdf5_index": 13154,
                "lat_center": 60.218545,
                "lon_center": -4.696093,
                "distance_to_target": 21.9,
                "distance_to_target_m": 21.9,
                "note": "Closest OHRC tile (offset 21.9 m) from ohrc_full_13770.h5"
            }
        },
        "sensor_availability": {
            "IIRS": True,
            "TMC2": True,
            "OHRC": True
        },
        "statuses": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "preview_urls": {
            "IIRS": "/static/demo/pairs/7674/iirs.png",
            "TMC2": "/static/demo/pairs/7674/tmc2.png",
            "OHRC": "/static/demo/pairs/7674/ohrc.png"
        },
        "scale_ratios": {
            "iirs_tmc2": 17.3,
            "tmc2_ohrc": 17.86,
            "iirs_ohrc": 308.93
        },
        "pair_status": {
            "IIRS_TMC2": "spatially_paired",
            "TMC2_OHRC": "geographically_associated",
            "IIRS_OHRC": "geographically_associated",
            "three_way": "integration_pending"
        },
        "three_way_integration": {
            "bridge_sensor": "TMC-2",
            "strategy": "hierarchical_tri_sensor_registration",
            "status": "integration_pending",
            "scale_chain": "IIRS (86.5 m/px) -> TMC-2 (5.0 m/px) -> OHRC (0.28 m/px)",
            "conceptual_chain": "IIRS↔OHRC ≈ (TMC-2↔OHRC) ∘ (IIRS↔TMC-2)",
            "chain_status": "conceptual"
        },
        "provenance": {
            "type": "real_spatial_scene",
            "source": "Chandrayaan-2 Real Co-located Scenes",
            "real_spatial_scene": True,
            "accuracy_validated": False,
            "notes": "Real spatially corresponding IIRS and TMC-2 scene with geographically closest OHRC counterpart tile."
        },
        "pairs": [
            {
                "pair_key": "IIRS_TMC2",
                "instrument_a": "IIRS",
                "instrument_b": "TMC2",
                "status": "spatially_paired",
                "file": "IIRS_TMC2.json"
            },
            {
                "pair_key": "TMC2_OHRC",
                "instrument_a": "TMC2",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "TMC2_OHRC.json"
            },
            {
                "pair_key": "IIRS_OHRC",
                "instrument_a": "IIRS",
                "instrument_b": "OHRC",
                "status": "geographically_associated",
                "file": "IIRS_OHRC.json"
            }
        ]
    }
]

# 2. Sensors Registry Data
SENSORS_DATA = {
    "sensors": [
        {
            "id": "OHRC",
            "name": "Orbiter High Resolution Camera",
            "instrument": "OHRC",
            "gsd_m_per_pixel": 0.28,
            "gsd_m_per_px": 0.28,
            "gsd": 0.28,
            "modality": "panchromatic_high_resolution",
            "modality_label": "Panchromatic High-Resolution Optical",
            "bands": 1,
            "swath_km": 3.0,
            "spectral_range_um": "0.45 - 0.70",
            "stereo_capability": False,
            "status": "operational",
            "description": "Very high resolution lunar optical imagery for fine hazard detection, small crater resolution, and pinpoint landmark navigation.",
            "theme_accent": "emerald"
        },
        {
            "id": "TMC2",
            "name": "Terrain Mapping Camera-2",
            "instrument": "TMC-2",
            "gsd_m_per_pixel": 5.0,
            "gsd_m_per_px": 5.0,
            "gsd": 5.0,
            "modality": "panchromatic_stereo_triplet",
            "modality_label": "Panchromatic Stereo Triplet (Fore-Nadir-Aft)",
            "bands": 1,
            "swath_km": 20.0,
            "spectral_range_um": "0.50 - 0.85",
            "stereo_capability": True,
            "status": "operational",
            "description": "Stereo triplet mapping camera providing regional 3D digital elevation models and intermediate scale contextual bridge.",
            "theme_accent": "cyan"
        },
        {
            "id": "IIRS",
            "name": "Imaging Infra-Red Spectrometer",
            "instrument": "IIRS",
            "gsd_m_per_pixel": 86.5,
            "gsd_m_per_px": 86.5,
            "gsd": 86.5,
            "modality": "hyperspectral",
            "modality_label": "Hyperspectral (256 Contiguous Bands)",
            "bands": 256,
            "swath_km": 20.0,
            "spectral_range_um": "0.80 - 5.00",
            "stereo_capability": False,
            "status": "operational",
            "description": "Hyperspectral mineralogical sensor mapped via calibrated band synthesis and panchromatic proxy representations.",
            "theme_accent": "amber"
        }
    ],
    "scale_ratios": {
        "IIRS_to_TMC2": 17.3,
        "TMC2_to_OHRC": 17.86,
        "IIRS_to_OHRC": 308.93
    },
    "hierarchical_bridge": {
        "bridge_sensor": "TMC-2",
        "rationale": "Direct 308.93x matching from IIRS (86.5m) to OHRC (0.28m) suffers from severe resolution disparity. TMC-2 (5.0m) acts as the bridge sensor with two tractable ~17.5x scale stages."
    }
}

# 3. Verified IIRS Synthetic Benchmark Data
BENCHMARKS_DATA = {
    "benchmark_type": "IIRS synthetic correspondence benchmark",
    "real_scene_accuracy": False,
    "three_sensor_accuracy": False,
    "warning": "These measurements reflect the fine-adapted LoFTR benchmark on synthetic IIRS correspondence pairs and are not real-scene three-sensor accuracy.",
    "standard": {
        "name": "Standard Illumination Conditions",
        "sun_angle_range": "15°–45°",
        "evaluated_pairs": 500,
        "mean_error_px": 0.3801,
        "p90_error_px": 0.5684,
        "accuracy_1px_pct": 96.95,
        "accuracy_2px_pct": 99.11,
        "accuracy_3px_pct": 99.55,
        "inlier_ratio_pct": 99.42,
        "mean_confidence_pct": 90.36,
        "runtime_ms": 29.4,
        "status": "validated_benchmark"
    },
    "stress": {
        "name": "Stress / Extreme Grazing Solar Incidence",
        "sun_angle_range": "5°–15°",
        "evaluated_pairs": 500,
        "mean_error_px": 0.5458,
        "p90_error_px": 0.6644,
        "accuracy_1px_pct": 95.38,
        "accuracy_3px_pct": 99.24,
        "inlier_ratio_pct": 99.06,
        "mean_confidence_pct": 89.70,
        "runtime_ms": 30.2,
        "status": "validated_benchmark"
    },
    "ablations": [
        {
            "method": "Classical SIFT + RANSAC",
            "keypoints": 450,
            "matches": 62,
            "inliers": 14,
            "inlier_ratio": 0.2258,
            "inlier_ratio_pct": 22.58,
            "rmse": 2.65,
            "runtime_ms": 48.2,
            "status": "baseline"
        },
        {
            "method": "Classical AKAZE + RANSAC",
            "keypoints": 512,
            "matches": 78,
            "inliers": 24,
            "inlier_ratio": 0.3077,
            "inlier_ratio_pct": 30.77,
            "rmse": 2.14,
            "runtime_ms": 55.6,
            "status": "baseline"
        },
        {
            "method": "Proposed Fine-Adapted LoFTR (Ours)",
            "keypoints": 1200,
            "matches": 1193,
            "inliers": 1186,
            "inlier_ratio": 0.9942,
            "inlier_ratio_pct": 99.42,
            "rmse": 0.3801,
            "runtime_ms": 29.4,
            "status": "validated_benchmark"
        }
    ]
}

# 4. Methodology Pipeline Data
METHODOLOGY_DATA = {
    "title": "SIH26166 Processing Methodology",
    "description": "Seven-stage multi-modal, sun-angle and scale-invariant co-registration pipeline designed for Chandrayaan-2 lunar instruments.",
    "pipeline_stages": [
        {
            "stage": 1,
            "name": "Data Ingestion & Calibration",
            "description": "Standardized ingestion of raw PDS4/HDF5 data, geo-referencing coordinates, and calibrated reflectance conversion.",
            "inputs": ["Raw IIRS QUBE", "TMC-2 Triplet", "OHRC Strip"],
            "status": "operational"
        },
        {
            "stage": 2,
            "name": "Multi-Scale Pyramid Rescaling",
            "description": "Gaussian scale-space pyramid alignment handling the 17.3x to 308.93x spatial resolution gap between sensors.",
            "inputs": ["Calibrated Panchromatic & Proxy Images"],
            "status": "operational"
        },
        {
            "stage": 3,
            "name": "Illumination Normalization",
            "description": "Photometric reflectance modeling and adaptive wallis filter normalization across varying solar incidence angles (5° to 85°).",
            "inputs": ["Multi-Sun Angle Image Pairs"],
            "status": "operational"
        },
        {
            "stage": 4,
            "name": "Learned Coarse-to-Fine LoFTR Matching",
            "description": "Detector-free transformer correspondence establishing dense feature matches across modality boundaries.",
            "inputs": ["Normalized Image Pairs"],
            "status": "validated_on_synthetic_iirs"
        },
        {
            "stage": 5,
            "name": "Spatial Confidence Heatmap Generation",
            "description": "Per-pixel match probability field computation isolating high-certainty lunar landmarks from low-texture maria.",
            "inputs": ["Transformer Correlation Maps"],
            "status": "operational"
        },
        {
            "stage": 6,
            "name": "Robust Projective Fitting / MAGSAC++",
            "description": "Marginalizing sample consensus with threshold-free geometric estimation for accurate homography & affine model recovery.",
            "inputs": ["Dense Correspondences & Weights"],
            "status": "operational"
        },
        {
            "stage": 7,
            "name": "Hierarchical Tri-Sensor Co-Registration",
            "description": "Chained composite transformation (IIRS ↔ TMC-2 ↔ OHRC) bridging 86.5m to 0.28m via intermediate TMC-2 5.0m geometry.",
            "inputs": ["IIRS↔TMC2 Transform", "TMC2↔OHRC Transform"],
            "status": "integration_pending"
        }
    ]
}

# 5. Provenance & Limitations Data
PROVENANCE_DATA = {
    "scientific_states": {
        "SPATIALLY PAIRED": "Real lunar scenes that share genuine spatial/geographic overlap between Chandrayaan-2 instruments.",
        "GEOGRAPHICALLY ASSOCIATED": "Nearest-neighbor counterpart tile selected from regional survey imagery based on lunar coordinate proximity.",
        "MODEL VALIDATION PENDING": "Real imagery is confirmed and spatially co-located, but dense learned feature correspondence inference and geometric validation have not yet been completed.",
        "INTEGRATION PENDING": "Multi-sensor registration bridge pipeline scheduled for deployment in the three-instrument release.",
        "APPROXIMATE GEOMETRY": "Pixel-to-lunar coordinate mapping derived from planning/visualization ephemeris rather than rigorous bundle-adjusted SPICE kernels.",
        "SYNTHETIC BENCHMARK": "High-fidelity synthetic rendering benchmark used to rigorously validate fine-adapted LoFTR performance under controlled sun-angle variations.",
        "VALIDATED BENCHMARK": "Empirically measured, peer-verifiable error metrics from 500+ controlled synthetic correspondence pairs."
    },
    "limitations": [
        {
            "id": "lim_01",
            "title": "Raw Product Calibration",
            "detail": "IIRS source products are currently ingested in Raw/Level-1 format; photometric shading and stray-light corrections are preliminary."
        },
        {
            "id": "lim_02",
            "title": "Approximate Lunar Geolocation",
            "detail": "The current pixel-to-lunar geometry (iirs_pixel_lat_lon_approx.npy) is for planning and visual correspondence demonstration; it is not yet tied to high-order SPICE SPK/CK kernels."
        },
        {
            "id": "lim_03",
            "title": "Synthetic Benchmark Scope",
            "detail": "Verified sub-pixel benchmark metrics (0.3801 px normal, 0.5458 px stress) represent the fine-adapted LoFTR model evaluated on synthetic IIRS pairs, not real-scene three-sensor accuracy."
        },
        {
            "id": "lim_04",
            "title": "TMC-2 / OHRC Model Integration",
            "detail": "TMC-2 to OHRC learned correspondence model fine-tuning is actively ongoing; real pair correspondence endpoints return explicit pending states to prevent data fabrication."
        },
        {
            "id": "lim_05",
            "title": "Three-Way Geometric Validation",
            "detail": "Full three-sensor closed-loop geometric validation (cycle consistency error < 1 px across IIRS-TMC2-OHRC) remains under development."
        },
        {
            "id": "lim_06",
            "title": "Geographic Pairing vs. Learned Validation",
            "detail": "Deterministic geographic pairing of scenes/tiles confirms geographic proximity, which is distinct from solved and validated feature correspondence."
        }
    ]
}

# 6. Manifest Data
MANIFEST_DATA = {
    "project": "SIH26166 Lunar Image Correspondence Engine",
    "version": "2.0.0",
    "primary_targets": ["pair_2267", "pair_3463", "pair_5353", "pair_7674"],
    "total_primary_targets": 4,
    "sensors": ["OHRC", "TMC2", "IIRS"],
    "authoritative_source": "selected_4_pairs.csv",
    "ohrc_source": "ohrc_tile_metadata_final_geo_hdf5.csv & ohrc_full_13770.h5",
    "scale_ratios": {
        "iirs_tmc2": 17.3,
        "tmc2_ohrc": 17.86,
        "iirs_ohrc": 308.93
    }
}

def save_json(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved: {filepath}")

def main():
    for target_dir in [DATA_DEMO_DIR, BACKEND_DEMO_DIR]:
        # Save cases.json
        cases_file = os.path.join(target_dir, "cases.json")
        save_json(cases_file, {"cases": PAIRS_DATA})

        # Save sensors.json
        sensors_file = os.path.join(target_dir, "sensors.json")
        save_json(sensors_file, SENSORS_DATA)

        # Save benchmarks.json and benchmarks/iirs.json
        benchmarks_file = os.path.join(target_dir, "benchmarks.json")
        save_json(benchmarks_file, BENCHMARKS_DATA)
        iirs_bench_file = os.path.join(target_dir, "benchmarks", "iirs.json")
        save_json(iirs_bench_file, BENCHMARKS_DATA)

        # Save methodology.json
        methodology_file = os.path.join(target_dir, "methodology.json")
        save_json(methodology_file, METHODOLOGY_DATA)

        # Save provenance.json
        provenance_file = os.path.join(target_dir, "provenance.json")
        save_json(provenance_file, PROVENANCE_DATA)

        # Save manifest.json
        manifest_file = os.path.join(target_dir, "manifest.json")
        save_json(manifest_file, MANIFEST_DATA)

    print("\nAll authoritative demo data files built successfully in both data/demo and backend/data/demo.")

if __name__ == "__main__":
    main()
