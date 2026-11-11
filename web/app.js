const API_URL = "http://127.0.0.1:8000/api/analyze";

const form = document.querySelector("#analysis-form");
const message = document.querySelector("#message");
const resultsContainer = document.querySelector("#results");
const visualDashboard = document.querySelector("#visual-dashboard");
const apiStatus = document.querySelector("#api-status");

checkApiStatus();

async function checkApiStatus() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/health");
    if (!response.ok) throw new Error();
    apiStatus.innerHTML = '<span class="status-dot"></span> Ready to check';
    apiStatus.classList.remove("offline");
  } catch {
    apiStatus.innerHTML = '<span class="status-dot"></span> Start the analyzer';
    apiStatus.classList.add("offline");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.classList.remove("error");
  message.textContent = "Checking both DNA strands…";
  resultsContainer.hidden = true;
  visualDashboard.hidden = true;

  const targetDna = document.querySelector("#target-dna").value;
  const guideRna = document.querySelector("#guide-rna").value;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_dna: targetDna, guide_rna: guideRna }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Analysis failed.");

    message.textContent = payload.candidate_count
      ? "Analysis complete."
      : "No valid NGG PAM sites were found.";
    renderResults(payload.results, targetDna.length);
  } catch (error) {
    message.classList.add("error");
    message.textContent = "The analysis service is not running. Start it with: crispr-api";
    checkApiStatus();
  }
});

function renderResults(results, sequenceLength) {
  if (!results.length) return;

  const counts = results.reduce((summary, result) => {
    summary[result.risk_level] = (summary[result.risk_level] || 0) + 1;
    return summary;
  }, {});

  const rows = results.map((result) => {
    const classification = getClassification(result);
    return `
    <tr>
      <td>${result.position}</td>
      <td>${result.strand}</td>
      <td><code>${result.spacer}</code></td>
      <td><code>${result.pam}</code></td>
      <td>${result.mismatches}</td>
      <td>${result.mismatch_positions.join(", ") || "—"}</td>
      <td>${result.score.toFixed(2)}</td>
      <td><span class="risk-badge risk-${classificationClass(classification)}">${classification}</span></td>
    </tr>
  `;
  }).join("");

  resultsContainer.innerHTML = `
    <div class="summary-grid">
      <div class="summary-card"><strong>${results.length}</strong><span>Candidate sites</span></div>
      <div class="summary-card high"><strong>${counts.High || 0}</strong><span>High score</span></div>
      <div class="summary-card medium"><strong>${counts.Medium || 0}</strong><span>Medium score</span></div>
      <div class="summary-card low"><strong>${counts.Low || 0}</strong><span>Low score</span></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Position</th><th>Strand</th><th>Spacer</th><th>PAM</th><th>Mismatches</th><th>Mismatch positions</th><th>Score</th><th>Meaning</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <button class="button download" id="download-results">Download CSV ↓</button>
  `;
  resultsContainer.hidden = false;
  renderVisualDashboard(results, sequenceLength);
  document.querySelector("#download-results").addEventListener("click", () => downloadCsv(results));
}

function getClassification(result) {
  if (result.classification) return result.classification;
  if (result.mismatches === 0) return "Intended target";
  if (result.score >= 0.75) return "Dangerous off-target";
  if (result.score >= 0.4) return "Possible off-target";
  return "Lower-risk off-target";
}

function classificationClass(classification) {
  if (classification === "Intended target") return "target";
  if (classification === "Dangerous off-target") return "danger";
  if (classification === "Possible off-target") return "possible";
  return "low";
}

function renderVisualDashboard(results, sequenceLength) {
  const targetCount = results.filter((result) => getClassification(result) === "Intended target").length;
  const dangerousCount = results.filter((result) => getClassification(result) === "Dangerous off-target").length;
  const bannerClass = dangerousCount ? "warning" : "good";
  const bannerTitle = dangerousCount
    ? `${dangerousCount} dangerous off-target${dangerousCount === 1 ? "" : "s"} to review`
    : "No dangerous off-targets found";
  const bannerText = dangerousCount
    ? "Red areas show close matches that deserve attention. Green shows the intended target."
    : "The intended target is shown in green. Other matches are lower-scoring in this analysis.";

  visualDashboard.innerHTML = `
    <div class="result-banner ${bannerClass}">
      <div><strong>${bannerTitle}</strong><p>${bannerText} Intended target sites found: ${targetCount}.</p></div>
    </div>
    <div class="visual-heading">
      <div><h3>DNA match map</h3><p>A simple 3D-style view of where each result sits in the sequence.</p></div>
    </div>
    <div class="helix-card">${buildHelixSvg(results, sequenceLength)}</div>
    <div class="legend">
      <span class="legend-item"><i class="legend-swatch legend-target"></i> Intended target</span>
      <span class="legend-item"><i class="legend-swatch legend-danger"></i> Dangerous off-target</span>
      <span class="legend-item"><i class="legend-swatch legend-possible"></i> Possible off-target</span>
      <span class="legend-item"><i class="legend-swatch legend-low"></i> Lower-risk or unmarked DNA</span>
    </div>
  `;
  visualDashboard.hidden = false;
}

function buildHelixSvg(results, sequenceLength) {
  const width = 1000;
  const height = 250;
  const points = Math.min(Math.max(sequenceLength, 24), 60);
  const step = (width - 70) / (points - 1);
  const colors = {
    target: "#397565",
    danger: "#c06b61",
    possible: "#b58a4c",
    low: "#b8c4be",
    none: "#dfe7e2",
  };
  let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="DNA helix with colored target and off-target regions">`;
  svg += `<rect width="${width}" height="${height}" rx="12" fill="#f7f8f5"/>`;

  for (let i = 0; i < points; i += 1) {
    const x = 35 + i * step;
    const angle = (i / (points - 1)) * Math.PI * 4;
    const yOne = 112 + 54 * Math.sin(angle);
    const yTwo = 112 - 54 * Math.sin(angle);
    const sequenceIndex = Math.round((i / (points - 1)) * Math.max(sequenceLength - 1, 0));
    const state = stateAtPosition(sequenceIndex, results);
    const color = colors[state];
    svg += `<line x1="${x}" y1="${yOne}" x2="${x}" y2="${yTwo}" stroke="${color}" stroke-width="3" opacity=".7"/>`;
    svg += `<circle cx="${x}" cy="${yOne}" r="8" fill="${color}"/>`;
    svg += `<circle cx="${x}" cy="${yTwo}" r="8" fill="${color}" opacity=".78"/>`;
    if (state !== "none") svg += `<rect x="${x - 5}" y="210" width="10" height="10" rx="3" fill="${color}"/>`;
  }

  svg += `<text x="35" y="235" fill="#708078" font-size="12">start of sequence</text>`;
  svg += `<text x="${width - 145}" y="235" fill="#708078" font-size="12">end of sequence</text>`;
  svg += "</svg>";
  return svg;
}

function stateAtPosition(position, results) {
  const states = results
    .filter((result) => position >= result.position && position < result.position + 23)
    .map((result) => classificationClass(getClassification(result)));
  if (states.includes("target")) return "target";
  if (states.includes("danger")) return "danger";
  if (states.includes("possible")) return "possible";
  if (states.includes("low")) return "low";
  return "none";
}

function downloadCsv(results) {
  const headers = ["position", "strand", "spacer", "pam", "mismatches", "mismatch_positions", "score", "risk_level"];
  const lines = [headers.join(",")];
  results.forEach((result) => {
    lines.push(headers.map((header) => JSON.stringify(result[header])).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "crispr_trace_results.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
