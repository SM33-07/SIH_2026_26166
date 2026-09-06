# BACKEND API CONTRACT

## 1. Base URL

Development:

http://localhost:8000

API prefix:

/api/v1

## 2. Health

### Request

GET /api/v1/health

### Response

```json
{
  "status": "ok",
  "service": "lunar-multisensor-backend",
  "models_loaded": true,
  "device": "cuda"
}
```

## 3. Coordinate Search

### Request

POST /api/v1/coordinate/search

JSON:

```json
{
  "latitude": 60.792810,
  "longitude": 355.444914
}
```

### Expected Response

```json
{
  "decision": "SAME LUNAR ZONE",
  "consistency_score": 0.9806,
  "common_point_id": "CP_000001",
  "matched_location": {
    "latitude": 60.792810,
    "longitude": 355.444914
  },
  "sensors": {
    "ohrc": {
      "observation_id": "OHRC_3586"
    },
    "tmc2": {
      "observation_id": "TMC2_8211"
    },
    "iirs": {
      "pixel_row": 201,
      "pixel_col": 244
    }
  }
}
```

## 4. Three Image Matching

Endpoint:

POST /api/v1/match/three-images

Content type:

multipart/form-data

Required fields:

- ohrc_image
- tmc2_image
- iirs_image

Optional:

- latitude
- longitude

## 5. Example Matching Response

```json
{
  "decision": "SAME LUNAR ZONE",
  "consistency_score": 0.9885,
  "common_location": {
    "latitude": 60.595531,
    "longitude": 355.376453
  },
  "pairwise": {
    "ohrc_tmc2": {
      "distance_deg": 0.00286,
      "status": "PASS"
    },
    "ohrc_iirs": {
      "distance_deg": 0.00256,
      "status": "PASS"
    },
    "tmc2_iirs": {
      "distance_deg": 0.00072,
      "status": "PASS"
    }
  }
}
```

## 6. Common Point

GET /api/v1/common-points/{id}

Return:

- common point ID
- latitude
- longitude
- OHRC observation
- TMC-2 observation
- IIRS observation
- consistency

## 7. Demo

GET /api/v1/demo/{judge_point_id}

This endpoint is optional and is intended for controlled demonstrations.

## 8. Error Format

```json
{
  "error": {
    "code": "INVALID_COORDINATE",
    "message": "Latitude or longitude is invalid."
  }
}
```

## 9. HTTP Status Codes

200 = success

400 = invalid request

404 = observation not found

413 = uploaded file too large

422 = validation failure

500 = backend processing failure

503 = model/data service unavailable

## 10. CORS

Development frontend:

http://localhost:5173

Production must use explicit allowed origins.

Do not use unrestricted production CORS.

## 11. Important

The frontend must not perform:

- LoFTR
- RANSAC
- geographic distance calculation
- model inference
- scientific threshold calculations

The backend returns the completed scientific result.
