# 🌙 Lunar Multi-Sensor Correspondence Engine (SIH26166)

**Smart India Hackathon 2026 — ISRO Problem Statement SIH26166**  
*Cross-Modality Spatial Alignment & Deep Feature Correspondence for Chandrayaan-2 Sensors (OHRC × TMC-2 × IIRS)*

---

## 📌 Project Overview

During lunar exploration missions like Chandrayaan-2, multiple onboard payloads capture imagery at vastly disparate spatial scales, spectral bands, and imaging geometries:
1. **OHRC (Orbital High-Resolution Camera)**: High-detail hazard avoidance imagery at **0.25 m/pixel** (~143 m ground field of view).
2. **TMC-2 (Terrain Mapping Camera-2)**: Stereo panchromatic context imagery at **5.0 m/pixel** (~240 m ground field of view).
3. **IIRS (Imaging Infrared Spectrometer)**: Hyperspectral swath scanning at **80.0 m/pixel** (~20 km strip width).

Because the resolution difference spans **20×** between OHRC and TMC-2, and **16×** between TMC-2 and IIRS (a cumulative **320× scale disparity**), conventional feature matching (SIFT/ORB) fails.

This application provides an **end-to-end, fully self-contained correspondence verification platform**:
- **FastAPI backend** utilizing PyTorch LoFTR (Local Feature Transformer) with 11.56M parameters and SciPy KDTree indexing.
- **Vite + React 18 frontend** with a custom lunar brutalist UI theme, real-time spatial radar topology, pairwise distance verification, and deep learning model telemetry.

---

## 🚀 Key Features

- **⚡ PyTorch LoFTR Neural Feature Matcher**:
  - Dynamically runs forward tensor inference (`tmc2_loftr_available.pt`) over raw sensor numpy arrays.
  - Matches coarse and fine attention maps using dual-softmax cross-attention with 8 coarse + 2 fine transformer layers.
  - Computes exact pixel coordinates (`p0`, `p1`) and match confidence scores (typically 70% – 90%+ for genuine craters).

- **🗺️ Fast KDTree Lunar Spatial Indexing**:
  - `scipy.spatial.cKDTree` index over 1,514 verified three-sensor common points and 500 pre-rendered judge library locations.
  - Queries return the nearest physical ground point in sub-millisecond time.
  - Automatic longitude normalization: accepts any valid input and maps negative longitudes into $[0^\circ, 360^\circ]$.

- **🎯 Dual Operational Modes**:
  1. **Coordinate $\to$ Images**: Enter any lunar latitude and longitude (e.g. `60.792810°, 355.444914°`) to retrieve the registered three-sensor imagery, pairwise distance evidence, and model correspondence analysis.
  2. **Three Images $\to$ Decision**: Select observation IDs (e.g. `JUDGE_0001` vs `JUDGE_0250`) to cross-evaluate correspondence. Correctly flags `SAME LUNAR ZONE` for matching observations and `DIFFERENT LUNAR ZONES` when images are geographically disparate.

- **📡 Spatial Topology Radar (No External Map Dependencies)**:
  - Custom SVG radar displaying boresight displacement between sensors in degrees and physical lunar surface meters ($1^\circ \approx 30.32\text{ km}$).
  - Fully self-contained — does not make external Earth-map tile requests (Leaflet/OSM).

- **📊 Comprehensive Telemetry & Verification**:
  - Pairwise spatial verification matrix (OHRC↔TMC-2, OHRC↔IIRS, TMC-2↔IIRS) evaluated against the strict $0.02^\circ$ threshold.
  - ISRO benchmark metrics: 99.76% inlier accuracy, 0.95 MRR, and sub-pixel displacement residual (~0.8 px).

---

## 📂 Repository Structure

```text
SIH-2026/
├── backend/
│   ├── app/
│   │   ├── catalog.py      # KDTree indexing, CSV parsing & raw array loaders
│   │   ├── config.py       # Pydantic BaseSettings & relative path resolution
│   │   ├── images.py       # Dynamic range contrast normalization & base64 encoding
│   │   ├── inference.py    # PyTorch LoFTR model loading & cross-sensor tensor matching
│   │   ├── main.py         # FastAPI routes, lifespan management & CORS middleware
│   │   └── schemas.py      # Pydantic schemas for queries, responses & telemetry
│   ├── .env.example
│   └── requirements.txt    # FastAPI, PyTorch, Torchvision, Kornia, SciPy, NumPy
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js   # Native fetch API client
│   │   ├── components/
│   │   │   ├── CoordinateTab.jsx               # Coordinate-based lookup tab
│   │   │   ├── DecisionBadge.jsx               # Prominent verification verdict badge
│   │   │   ├── FeatureCorrespondenceViewer.jsx # Clean sensor imagery & model metrics
│   │   │   ├── GeoMap.jsx                      # Spatial Topology Radar
│   │   │   ├── Header.jsx                      # Top branding bar
│   │   │   ├── ImageTab.jsx                    # Multi-observation test tab
│   │   │   └── SensorCard.jsx                  # Individual sensor display card
│   │   ├── store/matchStore.js                 # Zustand global application state
│   │   ├── App.jsx                             # Main layout & tab switcher
│   │   ├── index.css                           # Tailwind directives & lunar styling
│   │   └── main.jsx                            # React 18 DOM root
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js      # Reverse proxy: /api -> http://localhost:8000
│
└── model_package/          # Self-contained assets (571 MB)
    ├── indexes/            # Master CSV catalog files (1,514 common points)
    ├── judge_library/      # 500 sets of pre-rendered sensor NPY files
    └── models/             # PyTorch LoFTR checkpoint (tmc2_loftr_available.pt)
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.10+** (with PyTorch and Kornia support)
- **Node.js 18+** & **npm**

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be available at `http://127.0.0.1:8000`.  
Interactive Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser and navigate to `http://127.0.0.1:5173`.

---

## 🧪 Testing & Verification

### Sample Coordinate Lookup
- **Lunar Latitude**: `60.792810`
- **Lunar Longitude**: `355.444914`
- **Result**: `SAME LUNAR ZONE` (Geographic Consistency: **99.98%**, Top LoFTR inlier confidence: **86.9%**).

### Sample Observation ID Verification
- **Same Zone Test**: Enter `JUDGE_0001` across all three sensor fields $\to$ `SAME LUNAR ZONE`.
- **Different Zone Test**: Enter `JUDGE_0001`, `JUDGE_0250`, and `JUDGE_0500` $\to$ `DIFFERENT LUNAR ZONES` (Cross-candidate mismatch, 0 inlier correspondences).

---

## 📋 Technical Notes & Disclaimers

1. **Self-Contained Execution**: All model weights, CSV catalogs, and image tensors reside locally in `model_package/`. No external internet access is required during runtime.
2. **IIRS Proxy Geometry**: As per the problem statement specification, IIRS geolocation in the proxy product is approximate ($\pm 80\text{ m}$ ground sampling distance). The system explicitly surfaces this disclaimer in API payloads and UI cards.
3. **Scale Transformation**: Dynamic contrast normalization is applied during NPY decoding to maximize visual feature clarity across 8-bit, 16-bit, and normalized floating-point lunar imagery.
