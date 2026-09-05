# Methodology & Technical Rationale — SIH26166

## 1. Sun-Angle & Illumination Invariance
Lunar terrain lacks an atmosphere, resulting in severe contrast variation and shifting shadows under differing solar elevation and azimuth angles. Standard SIFT/ORB matchers often fail because intensity gradients flip across crater rims.

Our system applies a physical **Lunar-Lambertian illumination model** combined with **Contrast Limited Adaptive Histogram Equalization (CLAHE)** to normalize surface radiance prior to feature extraction.

## 2. 20x Scale Gap Handling (OHRC ↔ TMC-2)
The spatial resolution ratio between OHRC (~0.25 m/pixel) and TMC-2 (~5 m/pixel) is ~20x. Matching high-res OHRC directly to low-res TMC-2 causes extreme descriptor disparity.

Our system builds a multi-level **Gaussian scale pyramid** and rescales target imagery according to extracted GSD metadata before matching, aligning feature scale spaces.

## 3. IIRS Band-Compositing Proxy
IIRS is a 256-band hyperspectral spectrometer (0.8–5.0 µm) operating at ~80 m/pixel. Direct pixel intensity comparison against panchromatic imagery is unfeasible.

We construct a **synthetic panchromatic proxy** by selecting representative spectral bands (sampling near-IR, shortwave IR, and thermal bands) and computing a weighted composite image. This engineering proxy permits unified feature matching without claiming to solve raw hyperspectral-to-panchromatic correspondence.

## 4. Explainable Spatial Confidence
To ensure reliability in deep crater shadows or low-texture mare plains, we compute a 2D spatial confidence map combining:
- Local keypoint density
- MAGSAC++ inlier status
- Shadow mask suppression
- Reprojection residual errors
