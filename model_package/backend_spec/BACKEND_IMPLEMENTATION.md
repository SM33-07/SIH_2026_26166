# BACKEND IMPLEMENTATION GUIDE

## 1. Environment

Recommended:

Python 3.10+

Core dependencies:

- fastapi
- uvicorn
- torch
- torchvision
- kornia
- numpy
- pandas
- scipy
- h5py
- pillow
- python-multipart

## 2. Configuration

Use environment variables.

```text
MODEL_ROOT=/path/to/models
INDEX_ROOT=/path/to/indexes
MAPPING_ROOT=/path/to/mappings
JUDGE_LIBRARY_ROOT=/path/to/judge_library

OHRC_H5=/path/to/ohrc_full_13770.h5
TMC2_DATASET_DIR=/path/to/tmc2
IIRS_IMAGE=/path/to/iirs_image.npy
IIRS_GEO=/path/to/iirs_pixel_lat_lon_approx.npy

SAME_RADIUS_DEG=0.02
DEVICE=cuda
```

## 3. Startup Sequence

1. Load configuration.
2. Validate required files.
3. Load models.
4. Load metadata.
5. Load geographic indexes.
6. Build spatial indexes.
7. Mark the server ready.

## 4. OHRC Service

The OHRC service should return:

- observation ID
- image
- latitude
- longitude
- corners
- metadata

## 5. TMC-2 Service

The TMC-2 service is responsible for robust HDF5 access.

Implementation sequence:

1. Determine target patch.
2. Determine HDF5 shard.
3. Open shard.
4. Inspect actual dataset length.
5. Validate local index.
6. Read patch.
7. Return metadata.

Important:

Never assume all shards have identical record counts.

The final dataset contains shards whose actual lengths must be respected.

## 6. IIRS Service

Load:

- normalized IIRS image
- approximate pixel-to-lunar array

Extract local image regions around the requested pixel.

Always mark IIRS geolocation as approximate.

## 7. Coordinate Search

```text
latitude + longitude
        |
        v
spatial index
        |
        v
nearest valid common point
        |
        +----> OHRC
        |
        +----> TMC-2
        |
        +----> IIRS
        |
        v
complete response
```

## 8. Image Matching

```text
uploaded images
       |
       v
validation
       |
       v
normalization
       |
       v
candidate retrieval
       |
       v
correspondence verification
       |
       v
geographic localization
       |
       v
three-sensor consistency
       |
       v
decision
```

## 9. Caching

Cache:

- models
- metadata
- spatial indexes
- frequently accessed observations

Do not repeatedly rebuild large indexes for every request.

## 10. Logging

Log:

- request ID
- endpoint
- processing time
- candidate count
- selected candidate
- verification result
- decision

Do not log raw uploaded images.

Do not expose internal filesystem paths.

## 11. Request ID

Each request should receive a unique request ID.

Example:

req_20260906_000123
