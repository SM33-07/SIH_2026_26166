# BACKEND ERROR HANDLING

## 1. General Rule

Never expose raw Python stack traces to the frontend.

Return structured errors.

## 2. Invalid Coordinates

Examples:

- missing latitude
- missing longitude
- invalid latitude
- invalid longitude

Return HTTP 400.

## 3. Observation Not Found

Return HTTP 404.

Example:

```json
{
  "error": {
    "code": "OBSERVATION_NOT_FOUND",
    "message": "No observation was found near the requested location."
  }
}
```

## 4. Invalid Image

Possible causes:

- corrupt file
- unsupported format
- empty file
- invalid dimensions

Return HTTP 400 or 422.

## 5. Model Failure

If a required model cannot load:

- mark service unhealthy
- do not silently continue
- return HTTP 503 for inference requests

## 6. HDF5 Failure

Handle:

- missing shard
- invalid local index
- corrupt shard
- out-of-range record

## 7. Timeout

Expensive image matching should have a timeout.

## 8. Security

Do not expose:

- absolute filesystem paths
- internal stack traces
- environment secrets
- model paths
- HDF5 paths
