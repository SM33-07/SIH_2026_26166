
# DEPLOYMENT

## Development

Python 3.11+ recommended.

Create virtual environment:

python -m venv .venv

Windows:

.venv\Scripts\activate

Install:

pip install -r requirements.txt

Run:

uvicorn backend.main:app --reload

---

# Environment variables

Configure:

OHRC_H5
TMC2_DATASET_DIR
IIRS_IMAGE
IIRS_GEO
MODEL_ROOT
INDEX_ROOT

See `.env.example`.

---

# Production

Run backend behind:

nginx
or
cloud load balancer

Frontend should communicate only through the API.

Do not put model files into public frontend assets.

Use server-side inference.

---

# Performance

Load:

- models once
- common-point KD-tree once
- metadata once

Do not reopen all HDF5 files on every request.

Use lazy loading and a small HDF5 handle cache.

---

# Security

Validate:

- upload size
- file type
- tensor dimensions

Never trust filenames.

---

# Logging

Log:

request id
operation
lat/lon
selected sensors
candidate IDs
decision
latency

Do not log sensitive user-uploaded image content unnecessarily.
