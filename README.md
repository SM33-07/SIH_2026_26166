# SIH26166 — Multi-Modal, Sun-Angle and Scale-Invariant Lunar Image Correspondence Engine

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-sky.svg)](https://react.dev/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-orange.svg)](https://pytorch.org/)
[![SIH 2026](https://img.shields.io/badge/SIH-2026--SIH26166-purple.svg)](https://sih.gov.in)

> **Smart India Hackathon 2026 — Problem SIH26166 (ISRO / Space Technology Domain)**  
> Autonomous image registration platform finding correspondences across Chandrayaan-2 **OHRC**, **TMC-2**, and **IIRS** optical/hyperspectral instruments despite extreme solar incidence differences, 20x resolution gaps, and cross-modality.

---

## Technical Highlights

1. **Three-Instrument Coverage**:
   - **OHRC**: 0.25 m/pixel panchromatic high-resolution hazard imagery.
   - **TMC-2**: 5.00 m/pixel panchromatic stereo mapping triplets.
   - **IIRS**: 80.0 m/pixel 256-band hyperspectral sensor (0.8–5.0 µm).
2. **Illumination Invariance**: Photometric Lunar-Lambertian normalization layer + Contrast Limited Adaptive Histogram Equalization (CLAHE).
3. **Shadow Feature Masking**: Adaptive thresholding and morphological filtering to suppress false matches in low-signal shadowed regions.
4. **20x Scale Gap Pyramid**: Multi-level Gaussian pyramid handling spatial scale gaps between OHRC (0.25m) and TMC-2 (5m).
5. **IIRS Band-Compositing Proxy**: Synthesizes a panchromatic-like composite image from selected IIRS spectral bands.
6. **Dual Matching Architecture**:
   - **Proposed Learned Matcher**: Dense feature attention matcher implemented in PyTorch (LoFTR style) with automatic CPU fallback.
   - **Classical Baseline**: SIFT, AKAZE, and ORB with Lowe's ratio test and cross-check.
7. **Explainable Spatial Confidence**: 2D spatial heatmap evaluating match density, MAGSAC++ inlier status, shadow masks, and reprojection residuals.
8. **Interactive React Space-Tech Dashboard**: Side-by-side keypoint lines, warped alignment overlay, cyan-red registration flicker test, ablation benchmark comparison, manual control point tool, and JSON/CSV export.

---

## Quick Start & Installation

### Option A: Local Development

#### 1. Backend Setup
```powershell
# Navigate to project root
cd "C:\Users\Yash\OneDrive\Desktop\SIH 2026"

# Create a virtual environment (one time only)
python -m venv .venv

# Activate the environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip (recommended)
python -m pip install --upgrade pip

# Install backend dependencies
pip install -r backend\requirements.txt

# Set project root on PYTHONPATH
$env:PYTHONPATH="."

# Prepare offline demo dataset (optional but recommended)
python scripts/prepare_demo.py

# Run unit tests (optional)
pytest ml/tests/test_pipeline.py

# Start FastAPI backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

If PowerShell blocks activation due to execution policy, run this once in the same terminal before activating:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Backend server runs at: `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

#### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Frontend dashboard runs at: `http://localhost:3000`.

---

### Option B: Docker Compose (Preferred for Hackathon Demo)
```bash
docker compose up --build
```
- Dashboard: `http://localhost:3000`
- API Backend: `http://localhost:8000`

---

## Repository Structure

```
sih26166-lunar-correspondence/
├── README.md
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── routes_health.py
│   │   │   ├── routes_upload.py
│   │   │   ├── routes_match.py
│   │   │   ├── routes_evaluation.py
│   │   │   └── routes_export.py
│   │   ├── schemas/
│   │   └── services/
│   │       ├── match_service.py
│   │       └── visualization_service.py
│   ├── requirements.txt
│   └── Dockerfile
├── ml/
│   ├── preprocessing/
│   │   ├── illumination.py
│   │   ├── shadows.py
│   │   ├── scale_pyramid.py
│   │   └── iirs_proxy.py
│   ├── matching/
│   │   ├── base.py
│   │   ├── classical.py
│   │   └── learned_loftr.py
│   ├── geometry/
│   │   ├── robust_transform.py
│   │   └── confidence.py
│   ├── synthetic/
│   │   └── relit_generator.py
│   └── evaluation/
│       ├── harness.py
│       ├── cycle_consistency.py
│       └── manual_control_points.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── OverviewScreen.jsx
│   │   │   ├── MatchingScreen.jsx
│   │   │   ├── ResultsDashboard.jsx
│   │   │   └── EvaluationComparison.jsx
│   │   ├── store/
│   │   │   └── matchStore.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── scripts/
│   ├── prepare_demo.py
│   └── run_evaluation.py
├── reports/
│   └── results/
└── docs/
    ├── architecture.md
    ├── methodology.md
    └── api.md
```

---

## Evaluation Benchmark

To run the offline evaluation benchmark across demo pairs and generate `reports/results/evaluation_summary.json`:
```powershell
$env:PYTHONPATH="."
python scripts/run_evaluation.py
```

---

## Scientific Caveats & Limitations
- **IIRS Proxy Trade-off**: The band-compositing proxy collapses 256 hyperspectral channels into a single synthetic panchromatic representation. It does not replace full spectral matching.
- **Extreme Shadowing**: Regions with near-zero signal inside deep crater shadows produce suppressed confidence values to prevent false match hallucination.
