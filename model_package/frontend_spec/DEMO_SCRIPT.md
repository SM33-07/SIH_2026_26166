
# 3-MINUTE SIH DEMO SCRIPT

## Part 1 — Explain problem

"We receive lunar observations from different cameras with very
different spatial resolutions and illumination conditions. The
system determines whether they correspond to the same physical
lunar surface zone."

---

## Part 2 — Coordinate demo

Enter:

Latitude:
60.792810

Longitude:
355.444914

The system returns:

OHRC Tile 3586
TMC-2 Patch 8211
IIRS Pixel (201,244)

Show all three images.

Then show the map.

Explain:

"These are different camera views, not identical images. The
association is made through geographic correspondence."

---

## Part 3 — SAME demo

Use:

JUDGE_0001
JUDGE_0001
JUDGE_0001

Show:

SAME LUNAR ZONE

---

## Part 4 — DIFFERENT demo

Use:

JUDGE_0001
JUDGE_0250
JUDGE_0500

Show:

DIFFERENT LUNAR ZONES

Then show the pairwise distances.

---

## Part 5 — Explain evidence

"The decision is not based only on visual similarity. We combine
sensor-specific retrieval, geometric correspondence and geographic
cross-sensor consistency."

---

## Part 6 — IIRS disclaimer

"The current IIRS proxy has approximate pixel-to-lunar geolocation,
which is explicitly surfaced in the interface."
