# DECISION ENGINE

## 1. Purpose

Convert technical evidence into a clear judge-facing result.

Allowed primary states:

SAME LUNAR ZONE

DIFFERENT LUNAR ZONES

## 2. Evidence

Potential evidence includes:

1. geographic distance
2. pairwise consistency
3. correspondence count
4. geometric inliers
5. reprojection error
6. candidate confidence

## 3. Geographic Decision

Evaluate:

distance(OHRC, TMC-2)

distance(OHRC, IIRS)

distance(TMC-2, IIRS)

Compare each against the configured same-zone threshold.

## 4. Conceptual Logic

```text
IF geographic agreement is strong
AND correspondence evidence is acceptable
THEN
    SAME LUNAR ZONE
ELSE
    DIFFERENT LUNAR ZONES
```

The final implementation should centralize thresholds.

## 5. Score

Return:

consistency_score

Do not call it a probability.

## 6. SAME Explanation

Suggested explanation:

The three observations are geographically consistent with the same
lunar region and satisfy the configured correspondence checks.

## 7. DIFFERENT Explanation

Suggested explanation:

The observations are geographically separated beyond the configured
same-zone tolerance.

## 8. UI Priority

1. Decision
2. Score
3. Three images
4. Map
5. Pairwise evidence
6. Technical details
