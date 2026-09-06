# DATA AND MODEL INTEGRATION

## 1. Scientific Package

The scientific package contains model assets, mappings, indexes,
judge images, and training records.

Conceptual structure:

```text
models/
+-- tmc2/
+-- ohrc/
+-- iirs/

indexes/

mappings/

judge_library/

judge_visuals/

training_records/
```

## 2. TMC-2

Patch size:

48 x 48

Approximate GSD:

5.41 m/pixel

Usable patches:

339,735

Important files:

- TMC-2 LoFTR checkpoint
- tmc2_final_usable_patch_mapping.csv
- tmc2_clean_geometry.csv
- TMC-2 HDF5 shards

## 3. OHRC

Tiles:

13,770

Image size:

512 x 512

Approximate GSD:

0.28 m/pixel

Model:

ohrc_resnet18_best.pth

Embedding dimension:

256

## 4. IIRS

Real proxy image:

IIRS_E2G2_valid_proxy_norm.npy

Shape:

11868 x 250

Geographic array:

iirs_pixel_lat_lon_approx.npy

Shape:

11868 x 250 x 2

## 5. Geographic Mapping

TMC-2 authoritative mapping:

Scan + Pixel -> Latitude + Longitude

OHRC mapping uses exact four-corner registration.

IIRS mapping is approximate.

## 6. Four-Corner OHRC-TMC Registration

For OHRC geographic registration, the four corners should be mapped
into TMC-2 coordinates.

An exact four-corner homography should be used rather than an arbitrary
temporary bounding-box resize.

## 7. Common Points

The strict common-point catalog contains 1,514 strong points.

Each point can associate:

- TMC-2 observation
- OHRC observation
- IIRS observation
- geographic coordinates
- consistency information

## 8. Judge Library

The judge library contains 500 complete three-sensor cases.

Use it for regression and controlled demonstrations.

## 9. Model Status

TMC-2:

Available packaged checkpoint = recovered original checkpoint.

OHRC:

Available checkpoint = ohrc_resnet18_best.pth.

IIRS:

Available project IIRS components.

If a new model replaces one of these, update this documentation.
