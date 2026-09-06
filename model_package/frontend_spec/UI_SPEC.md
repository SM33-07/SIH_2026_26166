# FRONTEND UI SPECIFICATION

## 1. Purpose

The frontend is the judge-facing interface.

It must make the scientific result understandable quickly.

The judge should not need to understand the underlying neural network.

## 2. Main Layout

```text
--------------------------------------------------
| Lunar Multi-Sensor Correspondence System       |
--------------------------------------------------
| Coordinate Mode | Three Image Mode             |
--------------------------------------------------

| MAIN RESULT                                     |
|                                                 |
|       SAME LUNAR ZONE                           |
|       Consistency: 0.9885                       |
|                                                 |
--------------------------------------------------

| OHRC          | TMC-2         | IIRS            |
| image         | image         | image           |
--------------------------------------------------

|                  MAP                            |
--------------------------------------------------

| Pairwise Geographic Evidence                    |
--------------------------------------------------

| Technical Details                               |
--------------------------------------------------
```

## 3. Decision

The result must be the most prominent element.

Display either:

SAME LUNAR ZONE

or:

DIFFERENT LUNAR ZONES

## 4. Sensor Cards

Create three cards:

OHRC

TMC-2

IIRS

Each card should show:

- image
- observation information
- geographic metadata when available

IIRS card must contain:

IIRS geolocation is approximate.

## 5. Map

The map should show:

- common location
- sensor locations when available
- optional connecting lines

## 6. Technical Evidence

Use an expandable section.

Show:

- pairwise distance
- PASS / FAIL
- match count
- inlier ratio
- reprojection error
- retrieval rank

Do not overwhelm the default judge screen.

## 7. Design Principle

Decision first.

Evidence second.

Technical details third.

## 8. Judge Experience

The result should be understandable within a few seconds.
