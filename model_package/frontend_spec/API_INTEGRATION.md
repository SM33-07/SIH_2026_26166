# FRONTEND API INTEGRATION

## 1. Base URL

Use:

VITE_API_BASE_URL=http://localhost:8000

Do not hard-code the production URL.

## 2. Coordinate Request

POST:

/api/v1/coordinate/search

Body:

```json
{
  "latitude": 60.792810,
  "longitude": 355.444914
}
```

## 3. Image Request

Use multipart/form-data.

Fields:

- ohrc_image
- tmc2_image
- iirs_image

## 4. Loading State

Display:

Analyzing lunar observations...

Disable repeated submission while processing.

## 5. Processing Stages

Optional visual progress:

Preparing images

Finding candidates

Verifying correspondence

Checking geographic consistency

Producing result

## 6. Success

Show:

1. decision
2. score
3. images
4. map
5. evidence

## 7. Error

Show human-readable errors.

Example:

We could not locate a sufficiently reliable matching observation.

Do not show raw Python exceptions.

## 8. Image Paths

The frontend must never directly access:

- /kaggle/
- /content/
- /mnt/
- HDF5 paths
- model paths

The backend must provide frontend-safe image references.

## 9. TypeScript

Create interfaces matching the backend API.

Example:

```typescript
interface MatchResult {
  decision: string;
  consistency_score: number;
  common_location?: {
    latitude: number;
    longitude: number;
  };
}
```
