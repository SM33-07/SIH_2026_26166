# GEOGRAPHIC ENGINE

## 1. Purpose

The geographic engine determines whether sensor observations are
spatially consistent.

## 2. Longitude Convention

The project uses lunar longitude in a 0-360 degree representation
for the relevant dataset.

Example:

-4.55 degrees

corresponds approximately to:

355.45 degrees

The backend must use one consistent longitude convention.

## 3. Geographic Search

Input:

- latitude
- longitude

Search:

- spatial index
- common-point catalog
- sensor metadata

Return:

- nearest valid observation
- geographic distance
- associated sensors

## 4. Same-Zone Radius

Established project setting:

SAME_RADIUS_DEG = 0.02

This should be configurable.

Do not duplicate the value throughout multiple modules.

## 5. Pairwise Distances

Calculate:

OHRC <-> TMC-2

OHRC <-> IIRS

TMC-2 <-> IIRS

Each relationship should produce:

- distance
- threshold
- PASS / FAIL

## 6. Example

OHRC:
60.5945135, 355.3794631

TMC-2:
60.5958538, 355.3743179

IIRS:
60.5962257, 355.3755789

These observations are geographically close.

Previously calculated consistency:

approximately 0.9885

## 7. Common Location

When observations are consistent, return a representative common point.

The project example produced approximately:

Latitude 60.595531
Longitude 355.376453

## 8. IIRS Limitation

IIRS geolocation is approximate.

Do not describe it as instrument-grade validated per-pixel geometry.

## 9. Map Data

Backend should return common location:

```json
{
  "latitude": 60.595531,
  "longitude": 355.376453
}
```

It may also return individual sensor locations.
