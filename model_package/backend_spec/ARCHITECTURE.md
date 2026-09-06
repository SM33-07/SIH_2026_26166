# BACKEND ARCHITECTURE

## 1. Backend Responsibility

The backend is the central intelligence layer.

It owns:

- model loading
- image loading
- HDF5 access
- geographic retrieval
- candidate retrieval
- correspondence inference
- geometric verification
- geographic consistency
- decision logic
- API responses

The frontend must not directly load:

- PyTorch models
- HDF5 files
- large NumPy arrays
- internal mapping files

## 2. Architecture

```text
Frontend
   |
   | HTTP / JSON / Multipart
   v
FastAPI Backend
   |
   +-----------------------------+
   |                             |
   v                             v
Coordinate Service          Image Matching Service
   |                             |
   v                             v
Geographic Retrieval       Candidate Retrieval
   |                             |
   +-------------+---------------+
                 |
                 v
          Correspondence
             Verification
                 |
                 v
          Geographic Check
                 |
                 v
           Decision Engine
                 |
                 v
          SAME / DIFFERENT
```

## 3. Recommended Backend Structure

```text
backend/
|
+-- main.py
|
+-- api/
|   +-- health.py
|   +-- coordinate.py
|   +-- image_matching.py
|   +-- demo.py
|
+-- services/
|   +-- common_point_service.py
|   +-- coordinate_service.py
|   +-- ohrc_service.py
|   +-- tmc2_service.py
|   +-- iirs_service.py
|   +-- retrieval_service.py
|   +-- loftr_service.py
|   +-- verification_service.py
|   +-- decision_service.py
|
+-- schemas/
|   +-- requests.py
|   +-- responses.py
|
+-- data/
|   +-- catalog.py
|   +-- spatial_index.py
|
+-- config/
|   +-- settings.py
|
+-- utils/
    +-- image_utils.py
    +-- geometry_utils.py
    +-- logging_utils.py
```

## 4. API Layer

Recommended framework:

FastAPI

Recommended server:

Uvicorn

API routes should:

- validate requests
- call services
- return predictable responses
- handle errors

API routes should not contain model implementation.

## 5. Service Layer

### common_point_service.py

Responsibilities:

- load common-point index
- nearest geographic lookup
- return associated sensor observations
- return common-point metadata

### coordinate_service.py

Responsibilities:

- receive latitude and longitude
- query geographic index
- identify appropriate observations
- retrieve OHRC
- retrieve TMC-2
- retrieve IIRS

### ohrc_service.py

Responsibilities:

- locate OHRC tile
- load image
- load metadata
- return geographic information

### tmc2_service.py

Responsibilities:

- locate TMC-2 patch
- identify correct HDF5 shard
- inspect actual shard length
- load patch
- return patch metadata

Important:

Do not assume every HDF5 shard contains the same number of records.

### iirs_service.py

Responsibilities:

- locate IIRS pixel
- extract local image
- return approximate geographic metadata

### retrieval_service.py

Responsibilities:

- candidate generation
- coarse similarity
- Top-K ranking

Retrieval is candidate generation only.

### loftr_service.py

Responsibilities:

- construct LoFTR
- load checkpoint
- preprocess images
- perform inference
- return matches and confidence

### verification_service.py

Responsibilities:

- RANSAC
- robust geometry
- inlier mask
- reprojection error
- geometric consistency

### decision_service.py

Responsibilities:

- combine evidence
- calculate geographic consistency
- produce SAME / DIFFERENT
- produce human-readable explanation

## 6. Model Lifecycle

Models should be loaded ONCE during application startup.

```text
Server startup
    |
    +-- Load configuration
    |
    +-- Load OHRC model
    |
    +-- Load TMC-2 model
    |
    +-- Load IIRS components
    |
    +-- Load metadata
    |
    +-- Build spatial indexes
    |
    v
Server ready
```

Never load a 100+ MB model for every API request.

## 7. Device

Configuration should support:

DEVICE=cuda

or:

DEVICE=cpu

The backend should fall back to CPU if CUDA is unavailable.

## 8. Two Main Tasks

### Task A

Coordinate to imagery.

### Task B

Three images to SAME / DIFFERENT.

These should remain separate internal workflows even if the frontend
shows them as two tabs.
