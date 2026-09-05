# API Documentation — SIH26166 Backend

## Health & Metadata Endpoints
- `GET /health`: Returns service health status and active compute device (`cuda` or `cpu`).
- `GET /api/instruments`: Returns specification schemas for OHRC, TMC-2, and IIRS.

## Matching & Demo Data Endpoints
- `GET /api/demo/pairs`: Lists offline hackathon demo dataset pairs.
- `POST /api/match`: Submits two lunar images with pipeline options and returns correspondences, inlier masks, homography matrix, metrics, and base64 rendered visualizations.
- `GET /api/match/{job_id}`: Retrieves cached match job results.

## Evaluation & Export Endpoints
- `POST /api/evaluation/run`: Triggers full ablation benchmark suite across classical and proposed engines.
- `GET /api/evaluation/latest`: Returns latest ablation evaluation report.
- `GET /api/export/{job_id}/json`: Downloads job results and transformation matrix in JSON format.
- `GET /api/export/{job_id}/csv`: Downloads correspondence point pairs and inlier flags in CSV format.
