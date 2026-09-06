# FRONTEND TESTING PLAN

## 1. Initial Load

Verify:

- application starts
- no console errors
- backend connection is handled

## 2. Coordinate Mode

Input:

60.792810

355.444914

Verify:

- API request
- three images
- map
- decision

## 3. Same Test

Use JUDGE0001 three-sensor case.

Expected:

SAME LUNAR ZONE

## 4. Different Test

Use:

JUDGE0001 OHRC
JUDGE0250 TMC-2
JUDGE0500 IIRS

Expected:

DIFFERENT LUNAR ZONES

## 5. Invalid Inputs

Test:

- empty coordinate
- invalid latitude
- invalid longitude
- missing image
- unsupported image

## 6. Loading

Verify duplicate requests cannot be accidentally triggered.

## 7. Backend Failure

Disconnect backend.

Verify a clean error message appears.

## 8. Responsive

Test desktop and laptop resolutions.

## 9. Browser

Test Chrome and Edge.

## 10. Visual Hierarchy

Decision must be most prominent.

Images second.

Map third.

Technical evidence fourth.
