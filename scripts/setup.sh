#!/usr/bin/env bash
# One-time local setup: installs deps, fetches the face landmark model, and
# builds the frontend into dist/ so the app can run fully offline afterward.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Installing Python backend dependencies"
python3 -m venv .venv
. .venv/bin/activate
pip install -q -r backend/requirements.txt

echo "==> Installing frontend dependencies (Vite + MediaPipe)"
npm install --no-audit --no-fund

echo "==> Downloading face_landmarker model (one-time, ~3.6MB)"
mkdir -p frontend/public/models
if [ ! -f frontend/public/models/face_landmarker.task ]; then
  curl -L -o frontend/public/models/face_landmarker.task \
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
else
  echo "    (already present, skipping)"
fi

echo "==> Building the frontend (npm run build)"
npm run build

echo "==> Done. Run ./scripts/run.sh to start the app."
