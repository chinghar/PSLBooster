# Facial Metrics (local-only)

Runs entirely on your machine. No cloud APIs, no accounts, no telemetry.
Landmark detection happens in-browser via MediaPipe's WASM build, bundled by
Vite; the model file and JS runtime are fetched once during setup and then
used offline.

## Setup (one-time, needs network access)

```
./scripts/setup.sh
```

This creates a Python virtualenv, installs the FastAPI backend deps, runs
`npm install` (Vite + `@mediapipe/tasks-vision`), downloads the
`face_landmarker.task` model into `frontend/public/models/`, and runs
`npm run build` to produce `dist/`. After this step, no further network
access is required to run the app locally.

## Run

```
./scripts/run.sh
```

Then open http://127.0.0.1:8000 in a browser (Chrome/Edge recommended for
webcam + WASM GPU delegate support). Grant camera permission when prompted,
or use the "Upload photo" button instead.

If you edit frontend code, re-run `npm run build` (or use `npm run dev` for
a Vite dev server with hot reload at http://localhost:5173 while working on
the frontend — that mode doesn't include the backend, so History/Save won't
work there).

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

## Deploying to Vercel

`vercel.json` and `vite.config.js` are set up so Vercel's Vite preset builds
this with `npm run build` and serves `dist/`. Import the repo into Vercel as-is.

**Important limitation:** Vercel only hosts the static frontend (landmark
detection, measurements, and style suggestions all run client-side, so those
work fine). The **History tab will not work on Vercel** — `backend/main.py`
is a stateful Python server that writes to a local SQLite file and local
disk, and Vercel has no persistent filesystem or long-running Python
process in that form. Save requests will simply fail gracefully (the UI
already handles fetch errors). Making History work on Vercel would need a
real backend rework (e.g. Vercel Postgres + Blob storage) — ask if you want
that built out.

## Project layout

```
backend/          FastAPI app — serves dist/ (the built frontend) on
                   localhost and hosts the local save/list/view/delete
                   history endpoints. Not used on Vercel.
frontend/          Vite project source
  index.html, app.js, style.css, ...
  geometry.js        shared landmark indices & math
  metrics.js         the 15 proportion measurements
  faceShape.js       face-shape classification heuristic
  recommendations.js style/grooming suggestion text
  results.js / styleResults.js   DOM rendering
  disclaimer.js       persistent disclaimer banner
  public/            static passthrough assets served at the site root
    models/face_landmarker.task   committed (not on npm, no build-time
                                   network fetch needed)
    vendor/mediapipe/wasm/        generated from node_modules at build
                                   time (not committed)
dist/              Vite build output (not committed) — what both the local
                   FastAPI server and Vercel actually serve
data/              Local-only storage for saved photos/results (not
                   committed, not used on Vercel)
scripts/           setup.sh (one-time), run.sh (start the local server),
                   copy-mediapipe-wasm.mjs (build helper)
vite.config.js     root=frontend, publicDir=public, build output -> ../dist
vercel.json        framework: vite, SPA rewrite to index.html
```
