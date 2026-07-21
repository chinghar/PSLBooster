// Everything below runs entirely in the browser via local WASM + a local
// model file — no network requests are made once the page has loaded.
// @mediapipe/tasks-vision is bundled by Vite from node_modules; the WASM
// runtime and model file are static passthrough assets served from
// frontend/public/ (see vite.config.js).
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { computeMetrics } from "./metrics.js";
import { renderResults } from "./results.js";
import { classifyFaceShape } from "./faceShape.js";
import { getRecommendations } from "./recommendations.js";
import { renderFaceShapeSummary, renderStyleRecommendations } from "./styleResults.js";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startWebcam");
const captureBtn = document.getElementById("capture");
const fileInput = document.getElementById("fileInput");
const statusEl = document.getElementById("status");
const metricsOutput = document.getElementById("metricsOutput");
const resultsGroups = document.getElementById("resultsGroups");
const faceShapeSummary = document.getElementById("faceShapeSummary");
const styleGroups = document.getElementById("styleGroups");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const refreshingIndicator = document.getElementById("refreshingIndicator");

const reviewSection = document.getElementById("reviewSection");
const reviewImg = document.getElementById("reviewImg");
const submitBtn = document.getElementById("submitBtn");
const retakeBtn = document.getElementById("retakeBtn");

const saveNote = document.getElementById("saveNote");
const saveResultBtn = document.getElementById("saveResultBtn");
const saveStatus = document.getElementById("saveStatus");

const historyList = document.getElementById("historyList");
const refreshHistoryBtn = document.getElementById("refreshHistory");
const deleteAllDataBtn = document.getElementById("deleteAllData");
const historyDetail = document.getElementById("historyDetail");
const historyDetailPhoto = document.getElementById("historyDetailPhoto");
const historyDetailMeta = document.getElementById("historyDetailMeta");
const historyDetailMeasurements = document.getElementById("historyDetailMeasurements");
const historyDetailShapeSummary = document.getElementById("historyDetailShapeSummary");
const historyDetailStyleGroups = document.getElementById("historyDetailStyleGroups");
const closeHistoryDetailBtn = document.getElementById("closeHistoryDetail");

let faceLandmarker = null;
let currentMode = "VIDEO";
let rafId = null;
let webcamStream = null;
let lastLandmarks = null;
let lastDimensions = null;
let lastPhotoBlob = null;
let lastMetrics = null;
let lastFaceShape = null;

// A captured/uploaded photo staged for review, not yet submitted for
// analysis. Nothing in the Measurements/Style tabs changes until the user
// explicitly clicks "Submit for analysis" on this exact photo.
let pendingLandmarks = null;
let pendingDimensions = null;
let pendingPhotoBlob = null;
let pendingObjectUrl = null;

function showReview(photoBlob, landmarks, dimensions) {
  if (pendingObjectUrl) URL.revokeObjectURL(pendingObjectUrl);
  pendingPhotoBlob = photoBlob;
  pendingLandmarks = landmarks;
  pendingDimensions = dimensions;
  pendingObjectUrl = URL.createObjectURL(photoBlob);
  reviewImg.src = pendingObjectUrl;
  reviewSection.hidden = false;
  submitBtn.disabled = false;
}

function clearReview() {
  if (pendingObjectUrl) URL.revokeObjectURL(pendingObjectUrl);
  pendingObjectUrl = null;
  pendingPhotoBlob = null;
  pendingLandmarks = null;
  pendingDimensions = null;
  reviewSection.hidden = true;
  reviewImg.src = "";
}

function processDetection(landmarks, width, height) {
  const metrics = computeMetrics(landmarks, width, height);
  console.log("Facial metrics (raw):", metrics);
  metricsOutput.textContent = JSON.stringify(metrics, null, 2);
  renderResults(metrics, resultsGroups);
  lastMetrics = metrics;

  const faceShape = classifyFaceShape(landmarks, width, height);
  console.log("Face shape:", faceShape);
  renderFaceShapeSummary(faceShape, faceShapeSummary);
  const recommendations = getRecommendations(faceShape.id);
  renderStyleRecommendations(recommendations, styleGroups);
  lastFaceShape = faceShape;

  saveResultBtn.disabled = false;
  saveStatus.textContent = "";
}

submitBtn.addEventListener("click", async () => {
  if (!pendingLandmarks || !pendingDimensions || !pendingPhotoBlob) return;
  submitBtn.disabled = true;
  retakeBtn.disabled = true;
  refreshingIndicator.hidden = false;
  // Yield to the browser so the "refreshing" indicator actually paints
  // before the (synchronous, near-instant) recomputation runs.
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const start = performance.now();
  processDetection(pendingLandmarks, pendingDimensions.width, pendingDimensions.height);
  lastPhotoBlob = pendingPhotoBlob;
  setStatus("Measurements updated for the submitted photo.");

  const MIN_VISIBLE_MS = 350;
  const elapsed = performance.now() - start;
  if (elapsed < MIN_VISIBLE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_VISIBLE_MS - elapsed));
  }

  refreshingIndicator.hidden = true;
  retakeBtn.disabled = false;
  clearReview();
});

retakeBtn.addEventListener("click", () => {
  clearReview();
  fileInput.value = "";
  setStatus('Discarded. Click "Start webcam" or "Upload photo" to try another.');
});

for (const btn of tabButtons) {
  btn.addEventListener("click", () => {
    for (const b of tabButtons) {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    }
    for (const panel of tabPanels) {
      panel.hidden = panel.id !== `panel-${btn.dataset.tab}`;
    }
    if (btn.dataset.tab === "history") loadHistory();
  });
}

// --- Save / History (Phase 5) ---

saveResultBtn.addEventListener("click", async () => {
  if (!lastPhotoBlob || !lastMetrics || !lastFaceShape) return;
  saveResultBtn.disabled = true;
  saveStatus.textContent = "Saving...";
  try {
    const formData = new FormData();
    formData.append("photo", lastPhotoBlob, "photo.jpg");
    formData.append("metrics", JSON.stringify(lastMetrics));
    formData.append("face_shape", JSON.stringify(lastFaceShape));
    formData.append("note", saveNote.value.trim());
    const res = await fetch("/api/history", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`server returned ${res.status}`);
    saveStatus.textContent = "Saved to local history.";
    saveNote.value = "";
    await loadHistory();
  } catch (err) {
    saveStatus.textContent = `Save failed: ${err.message}`;
  } finally {
    saveResultBtn.disabled = false;
  }
});

async function loadHistory() {
  const res = await fetch("/api/history");
  const entries = await res.json();
  historyList.innerHTML = "";

  if (entries.length === 0) {
    historyList.innerHTML = '<p class="empty-state">No saved results yet.</p>';
    return;
  }

  for (const entry of entries) {
    const item = document.createElement("div");
    item.className = "history-item";

    const img = document.createElement("img");
    img.src = `/api/history/${entry.id}/photo`;
    img.alt = "Saved photo";
    item.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "history-item-meta";
    const dateEl = document.createElement("strong");
    dateEl.textContent = new Date(entry.created_at).toLocaleString();
    meta.appendChild(dateEl);
    if (entry.note) {
      const note = document.createElement("div");
      note.className = "history-item-note";
      note.textContent = entry.note;
      meta.appendChild(note);
    }
    item.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "history-item-actions";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.textContent = "View";
    viewBtn.addEventListener("click", () => viewHistoryEntry(entry.id));
    actions.appendChild(viewBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger-btn-small";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteHistoryEntry(entry.id));
    actions.appendChild(deleteBtn);

    item.appendChild(actions);
    historyList.appendChild(item);
  }
}

async function viewHistoryEntry(id) {
  const res = await fetch(`/api/history/${id}`);
  if (!res.ok) return;
  const entry = await res.json();

  historyDetail.hidden = false;
  historyDetail.dataset.entryId = String(id);
  historyDetailPhoto.src = `/api/history/${id}/photo`;
  const when = new Date(entry.created_at).toLocaleString();
  historyDetailMeta.textContent = entry.note ? `${when} — ${entry.note}` : when;

  renderResults(entry.metrics, historyDetailMeasurements);
  renderFaceShapeSummary(entry.face_shape, historyDetailShapeSummary);
  renderStyleRecommendations(getRecommendations(entry.face_shape.id), historyDetailStyleGroups);

  historyDetail.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteHistoryEntry(id) {
  if (!confirm("Delete this saved result? This cannot be undone.")) return;
  await fetch(`/api/history/${id}`, { method: "DELETE" });
  if (historyDetail.dataset.entryId === String(id)) historyDetail.hidden = true;
  await loadHistory();
}

refreshHistoryBtn.addEventListener("click", loadHistory);

closeHistoryDetailBtn.addEventListener("click", () => {
  historyDetail.hidden = true;
});

deleteAllDataBtn.addEventListener("click", async () => {
  const confirmed = confirm(
    "Delete ALL saved photos and results? This permanently removes every saved entry from your local disk and cannot be undone."
  );
  if (!confirmed) return;
  await fetch("/api/history", { method: "DELETE" });
  historyDetail.hidden = true;
  await loadHistory();
});

function setStatus(text) {
  statusEl.textContent = text;
}

async function initLandmarker() {
  setStatus("Loading MediaPipe (local, offline)...");
  const filesetResolver = await FilesetResolver.forVisionTasks("/vendor/mediapipe/wasm");
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: "/models/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: currentMode,
    numFaces: 1,
  });
  setStatus("Ready.");
}

async function ensureMode(mode) {
  if (currentMode !== mode) {
    await faceLandmarker.setOptions({ runningMode: mode });
    currentMode = mode;
  }
}

function resizeCanvasTo(width, height) {
  canvas.width = width;
  canvas.height = height;
}

function drawLandmarkDots(landmarks, width, height) {
  ctx.fillStyle = "#3af7a0";
  for (const point of landmarks) {
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function detectLoop() {
  if (!webcamStream) return;
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width && height) {
    if (canvas.width !== width || canvas.height !== height) resizeCanvasTo(width, height);
    const result = faceLandmarker.detectForVideo(video, performance.now());
    ctx.clearRect(0, 0, width, height);
    if (result.faceLandmarks.length > 0) {
      drawLandmarkDots(result.faceLandmarks[0], width, height);
      setStatus(`Tracking: ${result.faceLandmarks[0].length} landmarks`);
      lastLandmarks = result.faceLandmarks[0];
      lastDimensions = { width, height };
    } else {
      setStatus("No face detected");
      lastLandmarks = null;
    }
  }
  rafId = requestAnimationFrame(detectLoop);
}

function stopWebcam() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (webcamStream) {
    webcamStream.getTracks().forEach((track) => track.stop());
    webcamStream = null;
  }
  video.srcObject = null;
  startBtn.disabled = false;
  captureBtn.disabled = true;
}

startBtn.addEventListener("click", async () => {
  video.style.display = "block";
  if (!faceLandmarker) await initLandmarker();
  await ensureMode("VIDEO");
  webcamStream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
    audio: false,
  });
  video.srcObject = webcamStream;
  await video.play();
  captureBtn.disabled = false;
  startBtn.disabled = true;
  detectLoop();
});

captureBtn.addEventListener("click", async () => {
  if (lastLandmarks && lastDimensions) {
    // Grab a clean (dot-free) frame from the video element itself — the
    // overlay canvas has landmark dots drawn on it, not a plain photo.
    const snapshot = document.createElement("canvas");
    snapshot.width = video.videoWidth;
    snapshot.height = video.videoHeight;
    snapshot.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise((resolve) => snapshot.toBlob(resolve, "image/jpeg", 0.92));

    const landmarks = lastLandmarks;
    const dimensions = lastDimensions;
    stopWebcam(); // release the camera now that a still has been captured
    showReview(blob, landmarks, dimensions);
    setStatus("Photo captured. Review it below and submit for analysis, or retake.");
  } else {
    setStatus("No face was detected in the last frame — try again before capturing.");
  }
});

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  stopWebcam();
  video.style.display = "none";

  if (!faceLandmarker) await initLandmarker();
  await ensureMode("IMAGE");

  const imageBitmap = await createImageBitmap(file);
  resizeCanvasTo(imageBitmap.width, imageBitmap.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

  const result = faceLandmarker.detect(imageBitmap);
  if (result.faceLandmarks.length > 0) {
    drawLandmarkDots(result.faceLandmarks[0], canvas.width, canvas.height);
    setStatus(`Detected ${result.faceLandmarks[0].length} landmarks. Review the photo below and submit for analysis.`);
    showReview(file, result.faceLandmarks[0], { width: canvas.width, height: canvas.height });
  } else {
    setStatus("No face detected in uploaded photo — nothing to submit.");
  }
});

loadHistory();
