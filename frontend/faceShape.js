// Phase 4: heuristic face-shape classification.
//
// There is no single agreed-upon algorithm for this in the aesthetics
// literature — different stylists and apps use different rules of thumb.
// This is a transparent, documented heuristic based on four ratios, not a
// scientific or medical classification. The underlying ratios are returned
// alongside the result so the reasoning is visible rather than a black box.
import { dist, angleAtVertex, round, extractPoints } from "./geometry.js";

const SHAPES = {
  oval: {
    label: "Oval",
    description:
      "Face length is somewhat greater than width, with the jaw gently tapering relative to the forehead and cheekbones.",
  },
  round: {
    label: "Round",
    description: "Face length and width are close to equal, with a softly curved jawline and no sharp angles.",
  },
  square: {
    label: "Square",
    description: "Face length and width are close to equal, with the forehead, cheekbones, and jaw similar in width and a more angular jawline.",
  },
  heart: {
    label: "Heart",
    description: "The forehead is noticeably wider than the jaw, which narrows toward the chin.",
  },
  diamond: {
    label: "Diamond",
    description: "The cheekbones are clearly the widest point, with both the forehead and jaw narrower by comparison.",
  },
  oblong: {
    label: "Oblong",
    description: "Face length is notably greater than width, with the forehead, cheekbones, and jaw fairly similar in width.",
  },
  triangle: {
    label: "Triangle",
    description: "The jaw is noticeably wider than the forehead.",
  },
};

function decideShape({ lengthToWidth, jawToCheek, foreheadToCheek, gonialAngle }) {
  if (lengthToWidth >= 1.45) {
    if (jawToCheek >= 0.85 && foreheadToCheek >= 0.85) return "oblong";
    return "oval";
  }

  if (foreheadToCheek >= 0.9 && jawToCheek <= 0.78) return "heart";
  if (jawToCheek >= 0.9 && foreheadToCheek <= 0.78) return "triangle";
  if (foreheadToCheek <= 0.8 && jawToCheek <= 0.8) return "diamond";

  if (foreheadToCheek >= 0.85 && jawToCheek >= 0.85) {
    return gonialAngle <= 120 ? "square" : "round";
  }

  return "oval";
}

export function classifyFaceShape(landmarks, width, height) {
  const { foreheadTop, glabella, subnasale, chinBottom, cheekA, cheekB, jawA, jawB, templeA, templeB } = extractPoints(
    landmarks,
    width,
    height
  );

  const faceHeight = dist(foreheadTop, glabella) + dist(glabella, subnasale) + dist(subnasale, chinBottom);
  const cheekWidth = dist(cheekA, cheekB);
  const jawWidth = dist(jawA, jawB);
  const foreheadWidth = dist(templeA, templeB);
  const gonialAngle = (angleAtVertex(jawA, templeA, chinBottom) + angleAtVertex(jawB, templeB, chinBottom)) / 2;

  const ratios = {
    lengthToWidth: faceHeight / cheekWidth,
    jawToCheek: jawWidth / cheekWidth,
    foreheadToCheek: foreheadWidth / cheekWidth,
    gonialAngle,
  };

  const shapeId = decideShape(ratios);
  const shape = SHAPES[shapeId];

  return {
    id: shapeId,
    label: shape.label,
    description: shape.description,
    proportions: {
      lengthToWidth: round(ratios.lengthToWidth, 2),
      jawToCheekWidth: round(ratios.jawToCheek, 2),
      foreheadToCheekWidth: round(ratios.foreheadToCheek, 2),
      jawAngle: round(ratios.gonialAngle, 1),
    },
  };
}
