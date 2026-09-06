# BACKEND TESTING PLAN

## 1. Health Test

GET /api/v1/health

Verify:

- service starts
- models are loaded
- device is reported

## 2. Coordinate Test

Use:

Latitude 60.792810
Longitude 355.444914

Verify:

- request succeeds
- common point is returned
- three sensor observations exist
- image references are valid
- map coordinates are returned

## 3. Same Test

Use the controlled JUDGE0001 three-sensor case.

Expected:

SAME LUNAR ZONE

## 4. Different Test

Use:

OHRC JUDGE0001
TMC-2 JUDGE0250
IIRS JUDGE0500

Expected:

DIFFERENT LUNAR ZONES

## 5. TMC-2 HDF5 Test

Test:

- early shard
- middle shard
- final shard

Verify that actual shard length is used.

## 6. Model Test

Verify:

- TMC-2 checkpoint loads
- OHRC checkpoint loads
- IIRS assets load

## 7. Regression

Run the 500-case judge library.

Record:

- latency
- successful retrieval
- decision
- errors

## 8. API Contract

Verify every response contains the fields required by the frontend.

## 9. Security

Test:

- oversized upload
- invalid MIME type
- malformed JSON
- missing fields
- path traversal
- repeated requests

## 10. Performance

Measure:

- startup time
- model loading time
- coordinate lookup
- candidate retrieval
- LoFTR verification
- complete request latency
