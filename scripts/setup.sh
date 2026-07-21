#!/usr/bin/env bash
# One-time local setup. Downloads the MediaPipe JS runtime + face landmark
# model onto disk so the app can run fully offline afterward.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Installing Python backend dependencies"
python3 -m venv .venv
. .venv/bin/activate
pip install -q -r backend/requirements.txt

echo "==> Fetching @mediapipe/tasks-vision (JS + WASM runtime)"
npm install --no-audit --no-fund

echo "==> Vendoring WASM runtime into frontend/vendor/mediapipe"
rm -rf frontend/vendor/mediapipe
mkdir -p frontend/vendor/mediapipe
cp -R node_modules/@mediapipe/tasks-vision/wasm frontend/vendor/mediapipe/wasm
cp node_modules/@mediapipe/tasks-vision/vision_bundle.mjs frontend/vendor/mediapipe/
cp node_modules/@mediapipe/tasks-vision/vision_bundle.mjs.map frontend/vendor/mediapipe/ 2>/dev/null || true

echo "==> Downloading face_landmarker model (one-time, ~3.6MB)"
mkdir -p frontend/models
if [ ! -f frontend/models/face_landmarker.task ]; then
  curl -L -o frontend/models/face_landmarker.task \
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
else
  echo "    (already present, skipping)"
fi

echo "==> Done. Run ./scripts/run.sh to start the app."
