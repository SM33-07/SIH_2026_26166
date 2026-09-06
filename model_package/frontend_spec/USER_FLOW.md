# FRONTEND USER FLOW

## FLOW 1 — COORDINATE TO THREE IMAGES

### Step 1

Judge selects:

Coordinate Search

### Step 2

Judge enters latitude and longitude.

Example:

60.792810

355.444914

### Step 3

Click:

Find Lunar Observations

### Step 4

Show loading.

### Step 5

Backend returns:

- OHRC
- TMC-2
- IIRS
- location
- evidence

### Step 6

Display the result.

### Step 7

Show three images, map and evidence.

## FLOW 2 — THREE IMAGES TO DECISION

### Step 1

Judge selects:

Image Matching

### Step 2

Show three upload areas:

- OHRC
- TMC-2
- IIRS

### Step 3

Judge selects images.

### Step 4

Show previews.

### Step 5

Click:

Check Correspondence

### Step 6

Backend performs:

- retrieval
- correspondence
- geometry
- geographic consistency

### Step 7

Show:

SAME LUNAR ZONE

or:

DIFFERENT LUNAR ZONES

### Step 8

Show:

- three images
- map
- pairwise evidence

## FLOW 3 — ERROR

If no reliable result exists:

No sufficiently reliable correspondence found.

If input is invalid:

Please check the supplied image or coordinates.

Never show Python stack traces to the judge.
