// Phase 4: styling & grooming suggestions.
//
// These are additive style ideas keyed off face shape — not corrections for
// anything in the Measurements tab, and phrased that way deliberately
// ("pairs well with", never "fixes" or "improves"). Kept as a separate data
// module from metrics.js/faceShape.js so there is no code path that could
// turn a measurement into a "problem" a style suggestion "solves".
const RECOMMENDATIONS = {
  oval: {
    haircuts: [
      "Most cuts work well on this shape — there's flexibility for texture and volume in a lot of directions.",
      "Longer layers, textured crops, and side-swept fringes all pair nicely.",
    ],
    facialHair: ["Most beard shapes complement this face shape, from short boxed beards to light stubble."],
    glasses: ["A wide range of frame shapes pair nicely here, including square, round, and geometric styles."],
    eyebrows: "A soft, slightly rounded arch complements this shape well.",
  },
  round: {
    haircuts: [
      "Styles that add height on top and length at the sides — a textured quiff, pompadour, or long layers — pair well, adding vertical line.",
    ],
    facialHair: ["Beard styles that add definition along the jaw, like a boxed or angular beard, pair nicely."],
    glasses: ["Angular or rectangular frames add nice contrast with this shape's curves."],
    eyebrows: "A more angled arch adds definition that complements the face's soft curves.",
  },
  square: {
    haircuts: [
      "Textured, layered cuts with movement on top pair nicely with this jawline — think textured crops or side-swept styles.",
    ],
    facialHair: ["Rounder beard shapes, like a rounded goatee or softly tapered beard, pair nicely with this jawline."],
    glasses: ["Round or oval frames pair nicely, offering a pleasant contrast with the strong jaw and cheek lines."],
    eyebrows: "A softly curved brow complements the angularity of this face shape well.",
  },
  heart: {
    haircuts: [
      "Styles with volume around the jawline and shorter or swept-back styles up top balance nicely — side parts and textured mid-length cuts work well.",
    ],
    facialHair: ["A fuller beard along the jaw and chin pairs nicely, adding width lower on the face."],
    glasses: ["Frames that are wider at the bottom, like aviators or cat-eye-adjacent shapes, complement this shape well."],
    eyebrows: "A soft, low arch pairs nicely with this face shape.",
  },
  diamond: {
    haircuts: [
      "Styles with volume at the forehead and chin — like a fringe or side-swept top — pair nicely, and chin-length cuts complement the cheekbones well.",
    ],
    facialHair: ["A beard with some width at the jawline and chin, like a full or extended goatee, pairs nicely."],
    glasses: ["Oval or rimless frames pair nicely, complementing the cheekbones."],
    eyebrows: "A soft arch pairs nicely with this shape's strong cheekbones.",
  },
  oblong: {
    haircuts: [
      "Styles with width at the sides — textured layers, waves, or a classic crew cut — pair nicely, adding horizontal balance.",
    ],
    facialHair: ["Fuller beard styles that add width along the sides of the face pair nicely."],
    glasses: ["Wide or round frames with some decorative detail on the sides pair nicely with this shape."],
    eyebrows: "A straighter, fuller brow pairs nicely with this face shape.",
  },
  triangle: {
    haircuts: [
      "Styles with volume and texture at the crown and temples pair nicely, balancing width lower on the face — textured quiffs or layers with lift on top.",
    ],
    facialHair: ["Beard styles kept closer along the jaw, with a bit more focus at the chin, pair nicely."],
    glasses: ["Frames that are more detailed or bold at the top, like browline or cat-eye-adjacent styles, pair nicely."],
    eyebrows: "A fuller, well-defined brow adds nice balance up top.",
  },
};

export function getRecommendations(shapeId) {
  return RECOMMENDATIONS[shapeId] ?? null;
}
