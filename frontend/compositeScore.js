// Compiles the 15 individual measurements into a single 0-10 number.
//
// Per metric, proximity to that metric's own commonly-cited reference range
// is scored 0-1: 1 if the value falls inside the range, decreasing linearly
// (down to 0) as the value moves one full range-width past either edge.
// The composite is the average of those 15 proximity scores, rescaled to
// 0-10. It is a direct rescaling of the reference ranges already shown per
// metric elsewhere in the UI — not a separately trained or population-based
// "attractiveness" score.
function proximityScore(value, [min, max]) {
  if (value >= min && value <= max) return 1;
  const width = max - min;
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 1 - distance / width);
}

export function computeCompositeScore(metrics) {
  const scores = metrics.map((m) => proximityScore(m.value, m.referenceRange));
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(average * 100) / 10; // 0-10, one decimal
}
