// Phase 2: geometry & metric calculations.
//
// Every measurement here is either an angle or a ratio/percentage — never a
// raw pixel length — so results are comparable across photos regardless of
// camera distance or image resolution (there is no calibration reference to
// convert pixels to real-world units).
import { dist, angleAtVertex, canthalTiltDeg, round, extractPoints } from "./geometry.js";

export function computeMetrics(landmarks, width, height) {
  const {
    foreheadTop,
    glabella,
    nasion,
    noseTip,
    subnasale,
    upperLipTop,
    lowerLipBottom,
    chinBottom,
    cheekA,
    cheekB,
    jawA,
    jawB,
    templeA,
    templeB,
    eyeAOuter,
    eyeAInner,
    eyeBInner,
    eyeBOuter,
    irisA,
    irisB,
  } = extractPoints(landmarks, width, height);

  // --- Facial thirds: hairline-proxy -> brow -> nose base -> chin ---
  const upperThird = dist(foreheadTop, glabella);
  const middleThird = dist(glabella, subnasale);
  const lowerThird = dist(subnasale, chinBottom);
  const totalHeight = upperThird + middleThird + lowerThird;

  // --- Facial fifths: face width at eye level, in one-eye-width segments ---
  const fifth1 = dist(cheekA, eyeAOuter);
  const fifth2 = dist(eyeAOuter, eyeAInner);
  const fifth3 = dist(eyeAInner, eyeBInner);
  const fifth4 = dist(eyeBInner, eyeBOuter);
  const fifth5 = dist(eyeBOuter, cheekB);
  const totalWidth = fifth1 + fifth2 + fifth3 + fifth4 + fifth5;

  // --- Canthal tilt ---
  const tiltA = canthalTiltDeg(eyeAInner, eyeAOuter);
  const tiltB = canthalTiltDeg(eyeBInner, eyeBOuter);

  // --- Gonial (jaw) angle, frontal-photo approximation ---
  const gonialA = angleAtVertex(jawA, templeA, chinBottom);
  const gonialB = angleAtVertex(jawB, templeB, chinBottom);

  // --- Interpupillary distance ---
  const ipd = dist(irisA, irisB);
  const bizygomaticWidth = dist(cheekA, cheekB);
  const intercanthalWidth = dist(eyeAInner, eyeBInner);
  const ipdRatio = (ipd / bizygomaticWidth) * 100;
  const canthalIndex = ipd / intercanthalWidth;

  // --- Nasofrontal angle (uses relative depth; least reliable metric here) ---
  const nasofrontalAngle = angleAtVertex(nasion, glabella, noseTip, true);

  // --- Chin-to-philtrum ratio ---
  const philtrumLength = dist(subnasale, upperLipTop);
  const chinHeight = dist(lowerLipBottom, chinBottom);
  const chinToPhiltrumRatio = chinHeight / philtrumLength;

  // --- Facial width-to-height ratio (fWHR) ---
  const browToLipHeight = dist(glabella, upperLipTop);
  const fwhr = bizygomaticWidth / browToLipHeight;

  // --- Jaw width vs cheekbone width ---
  const bigonialWidth = dist(jawA, jawB);
  const jawToCheekRatio = bigonialWidth / bizygomaticWidth;

  return [
    {
      id: "third-upper",
      group: "Facial thirds",
      label: "Upper third (hairline-to-brow)",
      value: round((upperThird / totalHeight) * 100),
      unit: "% of face height",
      referenceRange: [30, 36],
      description:
        "The visible forehead, from the top edge of the photo's face-mesh detection down to the brow, as a share of total face height.",
      note: "Uses the topmost detected forehead point as a stand-in for the hairline, since hair coverage isn't detected. This segment is the most sensitive to hairstyle and photo framing.",
    },
    {
      id: "third-middle",
      group: "Facial thirds",
      label: "Middle third (brow-to-nose-base)",
      value: round((middleThird / totalHeight) * 100),
      unit: "% of face height",
      referenceRange: [30, 36],
      description: "From the brow to the base of the nose, as a share of total face height.",
    },
    {
      id: "third-lower",
      group: "Facial thirds",
      label: "Lower third (nose-base-to-chin)",
      value: round((lowerThird / totalHeight) * 100),
      unit: "% of face height",
      referenceRange: [30, 36],
      description: "From the base of the nose to the bottom of the chin, as a share of total face height.",
    },
    {
      id: "fifth-1",
      group: "Facial fifths",
      label: "Fifth 1 (face edge to outer eye)",
      value: round((fifth1 / totalWidth) * 100),
      unit: "% of face width",
      referenceRange: [18, 22],
      description: "From the edge of the face at eye level to the outer corner of the nearer eye.",
    },
    {
      id: "fifth-2",
      group: "Facial fifths",
      label: "Fifth 2 (eye width, side A)",
      value: round((fifth2 / totalWidth) * 100),
      unit: "% of face width",
      referenceRange: [18, 22],
      description: "The horizontal width of one eye.",
    },
    {
      id: "fifth-3",
      group: "Facial fifths",
      label: "Fifth 3 (between the eyes)",
      value: round((fifth3 / totalWidth) * 100),
      unit: "% of face width",
      referenceRange: [18, 22],
      description: "The gap between the inner corners of the two eyes (intercanthal width).",
    },
    {
      id: "fifth-4",
      group: "Facial fifths",
      label: "Fifth 4 (eye width, side B)",
      value: round((fifth4 / totalWidth) * 100),
      unit: "% of face width",
      referenceRange: [18, 22],
      description: "The horizontal width of the other eye.",
    },
    {
      id: "fifth-5",
      group: "Facial fifths",
      label: "Fifth 5 (outer eye to face edge)",
      value: round((fifth5 / totalWidth) * 100),
      unit: "% of face width",
      referenceRange: [18, 22],
      description: "From the outer corner of the eye to the edge of the face at eye level, on the other side.",
    },
    {
      id: "canthal-tilt",
      group: "Eyes",
      label: "Canthal tilt",
      value: round((tiltA + tiltB) / 2),
      unit: "degrees",
      referenceRange: [-5, 10],
      description:
        "The angle of the line from the inner to outer eye corner, relative to horizontal. Positive values mean the outer corner sits higher (upturned); negative values mean it sits lower (downturned).",
      perSide: { a: round(tiltA), b: round(tiltB) },
    },
    {
      id: "gonial-angle",
      group: "Jaw",
      label: "Gonial (jaw) angle",
      value: round((gonialA + gonialB) / 2),
      unit: "degrees",
      referenceRange: [115, 130],
      description: "The angle of the jaw at the point where it turns from the vertical ramus (near the ear) to the horizontal body (toward the chin).",
      note: "Approximate. The gonial angle is conventionally measured from a side-profile X-ray; this is estimated from a single frontal photo and is less precise as a result.",
      perSide: { a: round(gonialA), b: round(gonialB) },
    },
    {
      id: "ipd-ratio",
      group: "Eyes",
      label: "Interpupillary distance ratio",
      value: round(ipdRatio),
      unit: "% of face width",
      referenceRange: [42, 46],
      description: "The distance between the centers of the pupils, as a share of the widest part of the face (cheekbone to cheekbone).",
      auxiliary: { canthalIndex: round(canthalIndex, 2) },
    },
    {
      id: "nasofrontal-angle",
      group: "Nose",
      label: "Nasofrontal angle",
      value: round(nasofrontalAngle),
      unit: "degrees",
      referenceRange: [115, 135],
      description: "The angle at the bridge of the nose (nasion) between the slope of the forehead and the slope of the nasal bridge.",
      confidence: "low",
      note: "Estimated using MediaPipe's relative depth data from a single frontal photo. This angle is conventionally assessed from a side-profile photo, so treat this estimate as rough.",
    },
    {
      id: "chin-philtrum-ratio",
      group: "Lower face",
      label: "Chin-to-philtrum ratio",
      value: round(chinToPhiltrumRatio, 2),
      unit: "ratio",
      referenceRange: [1.6, 2.2],
      description: "Chin height (lower lip to chin bottom) divided by philtrum length (nose base to upper lip).",
    },
    {
      id: "fwhr",
      group: "Overall proportions",
      label: "Facial width-to-height ratio",
      value: round(fwhr, 2),
      unit: "ratio",
      referenceRange: [1.7, 2.1],
      description: "Bizygomatic (cheekbone-to-cheekbone) width divided by the height from brow to upper lip.",
    },
    {
      id: "jaw-cheek-width-ratio",
      group: "Overall proportions",
      label: "Jaw-to-cheekbone width ratio",
      value: round(jawToCheekRatio, 2),
      unit: "ratio",
      referenceRange: [0.75, 0.95],
      description: "Jaw width (gonion to gonion) divided by cheekbone width (bizygomatic). Describes face-shape proportions rather than a balance target.",
    },
  ];
}
