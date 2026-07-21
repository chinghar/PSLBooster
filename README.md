# Facial Metrics (local-only)

Runs entirely on your machine. No cloud APIs, no accounts, no telemetry.
Landmark detection happens in-browser via MediaPipe's WASM build; the model
file and JS runtime are downloaded once during setup and then used offline.

## Setup (one-time, needs network access)

```
./scripts/setup.sh
```

This creates a Python virtualenv, installs the FastAPI backend deps, installs
`@mediapipe/tasks-vision` via npm, and copies its WASM runtime + the
`face_landmarker.task` model into `frontend/vendor/` and `frontend/models/`.
After this step, no further network access is required.

## Run

```
./scripts/run.sh
```

Then open http://127.0.0.1:8000 in a browser (Chrome/Edge recommended for
webcam + WASM GPU delegate support). Grant camera permission when prompted,
or use the "Upload photo" button instead.

## Features

- **Measurements tab** — 15 geometric proportion measurements (facial thirds,
  facial fifths, canthal tilt, gonial angle, interpupillary distance ratio,
  nasofrontal angle, chin-to-philtrum ratio, and more), each shown with its
  value, a commonly-cited reference range, and a neutral description. No
  composite score, grade, or ranking anywhere.
- **Style suggestions tab** — face-shape classification plus additive
  haircut/facial-hair/glasses/eyebrow suggestions, kept structurally and
  conceptually separate from the measurements above.
- **History tab** — optional, per-photo saving. Nothing is stored unless you
  explicitly click "Save this result". It's a plain list of past snapshots,
  not a trend/score tracker.

## Your data

Saved photos and results live entirely in this project folder:

- `data/photos/` — saved photo files
- `data/app.db` — SQLite database with the saved metrics/face-shape JSON and
  timestamps

Nothing is ever uploaded anywhere. To delete everything, either:

- click **"Delete all my data"** in the History tab (removes all DB rows and
  photo files), or
- with the server stopped, just delete the folders yourself:
  `rm -rf data/photos data/app.db`

## Project layout

```
backend/     FastAPI app — serves the frontend on localhost and hosts the
             local save/list/view/delete history endpoints
frontend/    Static HTML/CSS/JS + MediaPipe (vendored, not committed)
             geometry.js       shared landmark indices & math
             metrics.js        the 15 proportion measurements
             faceShape.js      face-shape classification heuristic
             recommendations.js style/grooming suggestion text
             results.js / styleResults.js   DOM rendering
             disclaimer.js     persistent disclaimer banner
data/        Local-only storage for saved photos/results (not committed)
scripts/     setup.sh (one-time) and run.sh (start the server)
```
