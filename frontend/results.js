// Renders computed metrics as plain, neutrally-worded cards. Each of the 15
// cards stands alone; the one combined value (the 0-10 composite score) is
// rendered separately by renderCompositeScore, always below and visually
// distinct from the individual measurements — see compositeScore.js for how
// it's computed.

function formatValue(m) {
  if (m.unit.startsWith("%")) return `${m.value}%`;
  if (m.unit === "degrees") {
    const sign = m.id === "canthal-tilt" && m.value > 0 ? "+" : "";
    return `${sign}${m.value}°`;
  }
  return `${m.value}`;
}

function formatRange(m) {
  const [min, max] = m.referenceRange;
  if (m.unit.startsWith("%")) return `${min}%–${max}%`;
  if (m.unit === "degrees") return `${min}°–${max}°`;
  return `${min}–${max}`;
}

// Purely positional language (below / within, toward one end or the other)
// — never evaluative ("good", "bad", "attractive").
export function describePosition(value, [min, max]) {
  if (value < min) return `Below the ${min}–${max} range commonly cited as typical.`;
  if (value > max) return `Above the ${min}–${max} range commonly cited as typical.`;
  const pos = (value - min) / (max - min);
  if (pos < 0.33) return `Within the commonly-cited typical range, toward the lower end.`;
  if (pos > 0.67) return `Within the commonly-cited typical range, toward the upper end.`;
  return `Within the commonly-cited typical range, near the middle.`;
}

function renderCard(m) {
  const card = document.createElement("article");
  card.className = "metric-card";

  const title = document.createElement("h4");
  title.textContent = m.label;
  card.appendChild(title);

  const value = document.createElement("div");
  value.className = "metric-value";
  value.textContent = formatValue(m);
  card.appendChild(value);

  const range = document.createElement("div");
  range.className = "metric-range";
  range.textContent = `Commonly-cited typical range: ${formatRange(m)}`;
  card.appendChild(range);

  const position = document.createElement("div");
  position.className = "metric-position";
  position.textContent = describePosition(m.value, m.referenceRange);
  card.appendChild(position);

  const desc = document.createElement("p");
  desc.className = "metric-desc";
  desc.textContent = m.description;
  card.appendChild(desc);

  if (m.note) {
    const note = document.createElement("p");
    note.className = "metric-note";
    note.textContent = m.note;
    card.appendChild(note);
  }

  if (m.confidence === "low") {
    const badge = document.createElement("span");
    badge.className = "metric-badge";
    badge.textContent = "Low-confidence estimate";
    card.appendChild(badge);
  }

  return card;
}

export function renderResults(metrics, container) {
  container.innerHTML = "";
  const groups = new Map();
  for (const m of metrics) {
    if (!groups.has(m.group)) groups.set(m.group, []);
    groups.get(m.group).push(m);
  }

  for (const [groupName, groupMetrics] of groups) {
    const section = document.createElement("div");
    section.className = "metric-group";

    const heading = document.createElement("h3");
    heading.textContent = groupName;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "metric-grid";
    for (const m of groupMetrics) grid.appendChild(renderCard(m));
    section.appendChild(grid);

    container.appendChild(section);
  }
}

export function renderCompositeScore(score, container) {
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "composite-score-card";

  const heading = document.createElement("h3");
  heading.textContent = "Compiled score";
  card.appendChild(heading);

  const value = document.createElement("div");
  value.className = "composite-score-value";
  value.textContent = `${score.toFixed(1)} / 10`;
  card.appendChild(value);

  const desc = document.createElement("p");
  desc.className = "composite-score-desc";
  desc.textContent =
    "Average proximity of the 15 measurements above to their own commonly-cited reference ranges, rescaled to 0–10. It reflects proximity to those reference bands only — not attractiveness, health, or worth.";
  card.appendChild(desc);

  container.appendChild(card);
}
