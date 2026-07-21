// Phase 4: renders face-shape summary and style recommendations. Kept in
// its own module/DOM subtree from results.js (the metrics display) so the
// two stay visibly and structurally separate, per the "suggestions, not
// corrections" requirement.
export function renderFaceShapeSummary(faceShape, container) {
  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "shape-summary-card";

  const heading = document.createElement("h3");
  heading.textContent = `Face shape: ${faceShape.label}`;
  card.appendChild(heading);

  const desc = document.createElement("p");
  desc.textContent = faceShape.description;
  card.appendChild(desc);

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "How this was determined";
  details.appendChild(summary);

  const { lengthToWidth, jawToCheekWidth, foreheadToCheekWidth, jawAngle } = faceShape.proportions;
  const list = document.createElement("ul");
  for (const item of [
    `Face length ÷ cheekbone width: ${lengthToWidth}`,
    `Jaw width ÷ cheekbone width: ${jawToCheekWidth}`,
    `Forehead width ÷ cheekbone width: ${foreheadToCheekWidth}`,
    `Jaw angle: ${jawAngle}°`,
  ]) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }
  details.appendChild(list);

  const caveat = document.createElement("p");
  caveat.className = "shape-caveat";
  caveat.textContent =
    "This is a simplified heuristic based on these four proportions, not a scientific or medical classification — a stylist looking at the same photo might categorize it differently.";
  details.appendChild(caveat);

  card.appendChild(details);
  container.appendChild(card);
}

function renderCategory(title, items) {
  const section = document.createElement("div");
  section.className = "style-category";

  const h4 = document.createElement("h4");
  h4.textContent = title;
  section.appendChild(h4);

  const ul = document.createElement("ul");
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  }
  section.appendChild(ul);
  return section;
}

export function renderStyleRecommendations(recommendations, container) {
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "style-grid";
  grid.appendChild(renderCategory("Haircuts", recommendations.haircuts));
  grid.appendChild(renderCategory("Facial hair", recommendations.facialHair));
  grid.appendChild(renderCategory("Glasses frames", recommendations.glasses));
  grid.appendChild(renderCategory("Eyebrow grooming", [recommendations.eyebrows]));
  container.appendChild(grid);
}
