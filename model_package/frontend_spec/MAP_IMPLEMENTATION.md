# MAP IMPLEMENTATION

## 1. Purpose

The map communicates geographic consistency visually.

## 2. Recommended Library

Leaflet with React-Leaflet.

## 3. Required Backend Data

```json
{
  "common_location": {
    "latitude": 60.595531,
    "longitude": 355.376453
  }
}
```

Optional sensor locations:

```json
{
  "sensor_locations": [
    {
      "sensor": "OHRC",
      "latitude": 60.5945,
      "longitude": 355.3794
    },
    {
      "sensor": "TMC-2",
      "latitude": 60.5958,
      "longitude": 355.3743
    },
    {
      "sensor": "IIRS",
      "latitude": 60.5962,
      "longitude": 355.3756
    }
  ]
}
```

## 4. Display

Show:

- common point
- sensor markers
- optional connecting lines

## 5. Different Case

When observations are separated, display the geographic separation.

The map should help explain the DIFFERENT decision.

## 6. Coordinate Convention

Keep longitude convention consistent with the backend.

Do not silently change between -180..180 and 0..360.
