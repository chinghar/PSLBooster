// Shared landmark indices and geometry helpers, used by both metrics.js
// (Phase 2) and faceShape.js (Phase 4) so the two never disagree about
// which point is which.
//
// Landmark indices are taken from MediaPipe's own canonical constants
// (face_mesh_connections.py: FACEMESH_FACE_OVAL, FACEMESH_NOSE,
// FACEMESH_LIPS, FACEMESH_LEFT/RIGHT_EYE, FACEMESH_LEFT/RIGHT_IRIS), not a
// secondary source. MediaPipe's own "left"/"right" naming is relative to the
// subject, not the viewer, and is easy to get backwards, so this module
// avoids asserting anatomical laterality — paired landmarks are labeled A/B.
export const LM = {
  FOREHEAD_TOP: 10, // top of forehead / face-oval apex — a proxy for the hairline (trichion), NOT a true hairline landmark
  GLABELLA: 9, // smooth point between the eyebrows, above the nasion
  NASION: 168, // top of the nasal bridge, between the eyes
  NOSE_TIP: 4,
  SUBNASALE: 2, // base of the nose / columella base, where the nose meets the upper lip
  UPPER_LIP_TOP: 0, // outer edge, top-center of the upper lip (bottom of the philtrum)
  LOWER_LIP_BOTTOM: 17, // outer edge, bottom-center of the lower lip
  CHIN_BOTTOM: 152, // menton, lowest point of the chin
  CHEEK_A: 234, // widest point of the face at the cheekbone, one side
  CHEEK_B: 454, // widest point of the face at the cheekbone, other side
  JAW_A: 172, // approx. gonion (jaw-angle corner), same side as CHEEK_A
  JAW_B: 397, // approx. gonion (jaw-angle corner), same side as CHEEK_B
  TEMPLE_A: 127, // temple / upper face-width reference near the hairline side, same side as CHEEK_A
  TEMPLE_B: 356, // temple / upper face-width reference near the hairline side, same side as CHEEK_B
  EYE_A_OUTER: 33,
  EYE_A_INNER: 133,
  EYE_B_INNER: 362,
  EYE_B_OUTER: 263,
  IRIS_A_CENTER: 468,
  IRIS_B_CENTER: 473,
};

export function toPoint(landmarks, index, width, height) {
  const p = landmarks[index];
  // MediaPipe's z is a relative depth (roughly same scale as x), not a
  // calibrated real-world distance.
  return { x: p.x * width, y: p.y * height, z: p.z * width };
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function angleAtVertex(vertex, a, b, use3D = false) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y, z: use3D ? a.z - vertex.z : 0 };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y, z: use3D ? b.z - vertex.z : 0 };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.hypot(v1.x, v1.y, v1.z);
  const mag2 = Math.hypot(v2.x, v2.y, v2.z);
  const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// Positive = outer eye corner sits higher on the face than the inner corner
// (upturned); negative = outer corner sits lower (downturned). Uses
// abs(dx) so the sign convention is the same regardless of which side of
// the face the eye is on.
export function canthalTiltDeg(inner, outer) {
  const dx = Math.abs(outer.x - inner.x);
  const dy = inner.y - outer.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function extractPoints(landmarks, width, height) {
  const P = (i) => toPoint(landmarks, i, width, height);
  return {
    foreheadTop: P(LM.FOREHEAD_TOP),
    glabella: P(LM.GLABELLA),
    nasion: P(LM.NASION),
    noseTip: P(LM.NOSE_TIP),
    subnasale: P(LM.SUBNASALE),
    upperLipTop: P(LM.UPPER_LIP_TOP),
    lowerLipBottom: P(LM.LOWER_LIP_BOTTOM),
    chinBottom: P(LM.CHIN_BOTTOM),
    cheekA: P(LM.CHEEK_A),
    cheekB: P(LM.CHEEK_B),
    jawA: P(LM.JAW_A),
    jawB: P(LM.JAW_B),
    templeA: P(LM.TEMPLE_A),
    templeB: P(LM.TEMPLE_B),
    eyeAOuter: P(LM.EYE_A_OUTER),
    eyeAInner: P(LM.EYE_A_INNER),
    eyeBInner: P(LM.EYE_B_INNER),
    eyeBOuter: P(LM.EYE_B_OUTER),
    irisA: P(LM.IRIS_A_CENTER),
    irisB: P(LM.IRIS_B_CENTER),
  };
}
