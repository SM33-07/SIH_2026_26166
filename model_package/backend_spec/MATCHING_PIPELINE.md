# MATCHING PIPELINE

## 1. Overall Pipeline

```text
INPUT
  |
  v
Preprocessing
  |
  v
Candidate Retrieval
  |
  v
LoFTR / Correspondence
  |
  v
Geometric Verification
  |
  v
Geographic Localization
  |
  v
Three-Sensor Consistency
  |
  v
Decision
  |
  +----> SAME
  |
  +----> DIFFERENT
```

## 2. Preprocessing

Images should be:

- converted to supported numeric representation
- normalized
- resized only where required
- converted to model-compatible tensor dimensions

Scientific image geometry should not be unnecessarily distorted.

## 3. Candidate Retrieval

Retrieval reduces a large search space to a small Top-K candidate set.

Example:

339,735 TMC-2 patches
        |
        v
candidate retrieval
        |
        v
Top-K candidates

Only Top-K candidates should proceed to expensive verification.

## 4. LoFTR

LoFTR provides learned image correspondence.

Backend should retain:

- keypoints
- correspondences
- confidence
- match count
- geometric output

## 5. Geometric Verification

Recommended conceptual sequence:

matches
   |
   v
RANSAC / robust estimator
   |
   v
inlier mask
   |
   v
reprojection error

Return:

- number of matches
- number of inliers
- inlier ratio
- geometric error

## 6. Multi-Sensor Consensus

Evaluate:

OHRC <-> TMC-2

OHRC <-> IIRS

TMC-2 <-> IIRS

If the three relationships are geographically consistent,
the evidence supports SAME LUNAR ZONE.

## 7. MatchResult

The internal result object should conceptually contain:

- keypoints
- correspondences
- confidence
- inlier_mask
- geometry
- RMSE
- inlier_ratio
- modality_pair

## 8. Important Training Caveat

The historical training work optimized the differentiable coarse
correspondence path.

The final LoFTR matching output was not fully optimized through the
standard non-differentiable post-match path during that experiment.

Do not claim that the historical training optimized every LoFTR stage.

## 9. Retrieval Caveat

A high retrieval similarity means:

likely candidate

It does not automatically mean:

same lunar zone.
