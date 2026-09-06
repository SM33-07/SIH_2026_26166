
# Lunar Multi-Sensor Correspondence — VS Code Handoff

## Purpose

This package contains the frozen model artifacts, geographic indexes,
judge demonstration library, and technical specifications required
to build the final backend and frontend application.

Sensors:

- OHRC
- TMC-2
- IIRS

The system supports two principal workflows:

1. Coordinate → retrieve associated OHRC/TMC-2/IIRS observations.
2. Three sensor images → determine SAME LUNAR ZONE or DIFFERENT
   LUNAR ZONES.

---

# 1. FINAL PRODUCT FLOW

## Coordinate mode

User enters:

Latitude
Longitude

Backend:

coordinate
→ common-point search
→ associated OHRC
→ associated TMC-2
→ associated IIRS
→ image retrieval
→ geographic verification

Frontend displays:

- OHRC image
- TMC-2 image
- IIRS image
- common coordinate
- sensor identifiers
- geographic map
- pairwise distances
- geographic consistency
- SAME LUNAR ZONE / DIFFERENT result

---

## Image mode

User supplies:

- one OHRC image
- one TMC-2 image
- one IIRS image

Backend:

sensor identification
→ candidate retrieval
→ correspondence verification
→ geographic consistency
→ three-way consensus

Frontend displays:

- three original images
- pairwise geographic checks
- geographic map
- common candidate location
- final SAME/DIFFERENT result

---

# 2. IMPORTANT DATA SOURCES

The package includes derived indexes and the 500-point demonstration
library.

Large raw source imagery is intentionally not duplicated into this
package.

Production deployment should configure the raw source paths using
environment variables.

Required raw-source resources:

OHRC:
- ohrc_full_13770.h5

TMC-2:
- tmc2_patches_part_*.h5

IIRS:
- IIRS_E2G2_valid_proxy_norm.npy
- iirs_pixel_lat_lon_approx.npy

---

# 3. MAIN INDEX

The most important file is:

`indexes/master_three_sensor_common_points.csv`

Each row links:

- Common point ID
- TMC-2 patch
- OHRC tile
- IIRS row
- IIRS column
- common latitude
- common longitude
- pairwise geographic distances
- consistency score

---

# 4. JUDGE LIBRARY

`judge_library/three_sensor_judge_image_library.csv`

contains the 500 prepared demonstration cases.

Each JUDGE point links:

- OHRC tile
- TMC-2 patch
- IIRS row/column
- latitude
- longitude
- consistency score

Associated NPY images are stored in the same directory.

---

# 5. BACKEND

Recommended stack:

Python
FastAPI
PyTorch
Kornia
NumPy
Pandas
SciPy
H5Py
Pillow

Recommended backend modules:

backend/
    main.py
    api/
        coordinate.py
        image_matching.py
        health.py
    services/
        coordinate_service.py
        common_point_service.py
        ohrc_service.py
        tmc2_service.py
        iirs_service.py
        retrieval_service.py
        verification_service.py
        decision_service.py
    models/
        loftr_loader.py
        ohrc_encoder.py
        iirs_model.py
    schemas/
        requests.py
        responses.py
    data/
        catalog_loader.py
        spatial_index.py
    config/
        settings.py

---

# 6. FRONTEND

Recommended stack:

React
TypeScript
Vite
Leaflet or MapLibre
Axios/fetch

Frontend should have:

- Coordinate search tab
- Three-image comparison tab
- individual image cards
- geographic map
- result status
- pairwise evidence table
- common coordinate
- sensor metadata

Do NOT fuse the three images into one image as the primary output.
Judges should see the three original sensor views separately.

---

# 7. RESULT SEMANTICS

Use:

SAME LUNAR ZONE

or:

DIFFERENT LUNAR ZONES

Do not call the consistency score a calibrated probability.

Use:

Geographic Consistency: 98.1%

rather than:

Probability: 98.1%

---

# 8. IIRS DISCLAIMER

The current IIRS pixel-to-lunar mapping is approximate.

The UI should show a small note:

"IIRS geolocation is approximate in the current proxy product."

---

# 9. TMC-2 MODEL DISCLAIMER

The bundled TMC-2 checkpoint is the available original checkpoint.

The missing Step5D checkpoint is not included because it is not present
in the current Kaggle filesystem.

Historical Step5D validation numbers are stored in:

`training_records/step5d_historical_results.json`

Do not relabel the bundled checkpoint as Step5D.

---

# 10. DEMO

Recommended judge demonstration:

### Demo 1

Coordinate:

60.792810
355.444914

Expected:

CP_000001
OHRC Tile 3586
TMC-2 Patch 8211
IIRS (201,244)

SAME LUNAR ZONE

### Demo 2

Same location:

JUDGE_0001
JUDGE_0001
JUDGE_0001

Expected:

SAME LUNAR ZONE

### Demo 3

Different locations:

JUDGE_0001
JUDGE_0250
JUDGE_0500

Expected:

DIFFERENT LUNAR ZONES
