# Architecture & System Design — SIH26166

## Executive Overview
The **SIH26166 Lunar Image Correspondence Platform** resolves multi-sensor optical registration challenges across Chandrayaan-2 instruments:
- **OHRC** (0.25 m/pixel panchromatic)
- **TMC-2** (5.00 m/pixel panchromatic stereo)
- **IIRS** (80.0 m/pixel 256-band hyperspectral)

## Pipeline Architecture
```
INPUT IMAGES (OHRC / TMC-2 / IIRS)
  │
  ├──► Radiometric & Photometric Preprocessing (Lunar-Lambertian + CLAHE)
  ├──► Adaptive Shadow Detection & Low-Signal Masking
  ├──► Multi-Scale Image Pyramid Generation (20x Scale Ratio)
  ├──► IIRS Hyperspectral Band-Compositing Proxy Builder
  │
  ├──► Feature Correspondence Engine
  │      ├── Proposed: Dense Attention Matcher (PyTorch LoFTR)
  │      └── Classical Baseline: SIFT / AKAZE / ORB + Ratio Testing
  │
  ├──► Robust Geometry Engine (MAGSAC++ / RANSAC Homography & Affine)
  ├──► Explainable 2D Spatial Confidence Heatmap & Quality Scoring
  └──► Visual Overlay (Keypoint Lines, Warped B, Cyan-Red Registration)
```

## Modular Components
1. `ml/preprocessing/illumination.py`: Photometric Lunar-Lambertian model.
2. `ml/preprocessing/shadows.py`: Adaptive thresholding & morphological shadow masking.
3. `ml/preprocessing/scale_pyramid.py`: Gaussian pyramid handles up to 20x GSD ratio gap.
4. `ml/preprocessing/iirs_proxy.py`: Synthesizes a panchromatic-like composite image from 256 IIRS bands.
5. `ml/matching/learned_loftr.py`: PyTorch dense feature attention matcher.
6. `ml/matching/classical.py`: OpenCV SIFT/AKAZE ratio-test baseline matcher.
7. `ml/geometry/robust_transform.py`: MAGSAC++ homography and affine model estimator.
8. `ml/geometry/confidence.py`: 2D spatial confidence field based on match density, shadow maps, and residuals.
