const localHosts = ["", "localhost", "127.0.0.1"];
const isLocalEnvironment = localHosts.includes(window.location.hostname);
const API_ORIGIN = isLocalEnvironment
  ? "http://127.0.0.1:8000"
  : "";
const API_URL = `${API_ORIGIN}/api/analyze`;

const form = document.querySelector("#analysis-form");
const message = document.querySelector("#message");
const resultsContainer = document.querySelector("#results");
const visualDashboard = document.querySelector("#visual-dashboard");
const apiStatus = document.querySelector("#api-status");
const mutationForm = document.querySelector("#mutation-form");
const mutationMessage = document.querySelector("#mutation-message");
const mutationResults = document.querySelector("#mutation-results");

checkApiStatus();

async function checkApiStatus() {
  if (!isLocalEnvironment) {
    apiStatus.innerHTML = '<span class="status-dot"></span> Mutation review ready';
    apiStatus.classList.remove("offline");
    apiStatus.classList.add("neutral");
    return;
  }
  try {
    const response = await fetch(`${API_ORIGIN}/api/health`);
    if (!response.ok) throw new Error();
    apiStatus.innerHTML = '<span class="status-dot"></span> Ready to analyze';
    apiStatus.classList.remove("offline", "neutral");
  } catch {
    apiStatus.innerHTML = '<span class="status-dot"></span> Analyzer unavailable';
    apiStatus.classList.remove("neutral");
    apiStatus.classList.add("offline");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.classList.remove("error");
  message.textContent = "Analyzing both DNA strands…";
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
      : "No candidate sites with an NGG PAM were found.";
    renderResults(payload.results, targetDna.length);
  } catch (error) {
    message.classList.add("error");
    message.textContent = error.message === "Failed to fetch"
      ? "The analyzer is unavailable. Start the API, then try again."
      : error.message;
    checkApiStatus();
  }
});

mutationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  mutationMessage.classList.remove("error");
  mutationMessage.textContent = "Comparing the two sequences…";
  mutationResults.hidden = true;

  try {
    const reference = normalizeDna(document.querySelector("#reference-dna").value);
    const mutated = normalizeDna(document.querySelector("#mutated-dna").value);
    const guide = normalizeDna(document.querySelector("#mutation-guide").value);
    if (reference.length !== mutated.length) {
      throw new Error("Reference and mutated DNA must be the same length for this review.");
    }
    if (guide.length !== 20) {
      throw new Error("Guide RNA must be exactly 20 bases long.");
    }
    renderMutationReview(reference, mutated, guide);
    mutationMessage.textContent = "Review complete. Start with the risk and consequence summary below.";
  } catch (error) {
    mutationMessage.classList.add("error");
    mutationMessage.textContent = error.message;
  }
});

function normalizeDna(value) {
  const sequence = value.toUpperCase().replace(/\s+/g, "");
  if (!sequence) throw new Error("DNA sequences cannot be empty.");
  if (!/^[ACGT]+$/.test(sequence)) {
    throw new Error("DNA may contain only A, C, G, and T.");
  }
  return sequence;
}

function renderMutationReview(reference, mutated, guide) {
  const changes = [];
  for (let index = 0; index < reference.length; index += 1) {
    if (reference[index] !== mutated[index]) {
      changes.push({ position: index + 1, from: reference[index], to: mutated[index] });
    }
  }

  if (!changes.length) {
    mutationResults.innerHTML = mutationSummary(
      "No sequence change detected",
      "low",
      "Risk is low for this comparison because the reference and mutated sequences are identical.",
      "There is no observed base substitution to interpret.",
      "Confirm that you entered the intended reference and mutated sequences."
    );
    mutationResults.hidden = false;
    return;
  }

  const guideStart = reference.indexOf(guide);
  const guideEnd = guideStart + guide.length;
  const inGuide = guideStart >= 0
    ? changes.filter((change) => change.position - 1 >= guideStart && change.position - 1 < guideEnd)
    : [];
  const pamStart = guideEnd;
  const referencePam = guideStart >= 0 ? reference.slice(pamStart, pamStart + 3) : "";
  const mutatedPam = guideStart >= 0 ? mutated.slice(pamStart, pamStart + 3) : "";
  const pamChanged = referencePam !== mutatedPam;
  const pamDisrupted = referencePam.length === 3 && referencePam[1] === "G" && referencePam[2] === "G" && mutatedPam !== referencePam;
  const pamCreated = referencePam !== mutatedPam && mutatedPam.length === 3 && mutatedPam[1] === "G" && mutatedPam[2] === "G";

  let risk = "low";
  let riskText = "The observed change is outside the guide match, so this review does not flag a direct guide-level effect.";
  if (pamDisrupted || pamCreated) {
    risk = "high";
    riskText = pamDisrupted
      ? "The mutation changes an NGG PAM next to the guide match, which may disrupt recognition."
      : "The mutation creates an NGG PAM next to the guide match, which may create a new candidate site.";
  } else if (inGuide.length) {
    risk = "medium";
    riskText = `${inGuide.length} mutation${inGuide.length === 1 ? "" : "s"} fall${inGuide.length === 1 ? "s" : ""} inside the guide match and may change binding. `;
  }

  const changeList = changes.map((change) => `<li>Position ${change.position}: <code>${change.from} → ${change.to}</code></li>`).join("");
  const pamNote = guideStart >= 0
    ? `<p class="mutation-note">Reference PAM: <code>${referencePam || "not found"}</code> · Mutated PAM: <code>${mutatedPam || "not found"}</code></p>`
    : `<p class="mutation-note">The guide sequence was not found exactly in the reference, so PAM impact could not be localized.</p>`;
  const solution = risk === "high"
    ? "Review the altered guide/PAM relationship with a broader off-target scan and experimental validation before drawing conclusions."
    : risk === "medium"
      ? "Re-run the sequence analyzer with the mutated DNA and compare candidate scores; consider an alternative guide if the change is important."
      : "Review nearby sequence context and scan both versions if you need to rule out newly created candidate sites.";

  mutationResults.innerHTML = `
    <div class="mutation-summary ${risk}">
      <span class="mutation-risk-label">${risk.toUpperCase()} REVIEW PRIORITY</span>
      <h3>${risk === "high" ? "PAM or guide match changed" : risk === "medium" ? "Guide match changed" : "No direct guide-level change detected"}</h3>
      <p>${riskText}</p>
    </div>
    <div class="mutation-grid">
      <article class="mutation-card"><span>WHAT CHANGED</span><h3>${changes.length} substitution${changes.length === 1 ? "" : "s"}</h3><ul>${changeList}</ul>${pamNote}</article>
      <article class="mutation-card"><span>POSSIBLE CONSEQUENCE</span><h3>${pamChanged ? "PAM context changed" : inGuide.length ? "Guide similarity changed" : "No localized effect"}</h3><p>${riskText}</p></article>
      <article class="mutation-card solution-card"><span>NEXT STEP</span><h3>Validate and compare</h3><p>${solution}</p></article>
    </div>
    <p class="mutation-disclaimer">This is a sequence-level educational heuristic, not a clinical risk assessment or proof of biological effect.</p>
  `;
  mutationResults.hidden = false;
}

function mutationSummary(title, risk, riskText, consequence, solution) {
  return `
    <div class="mutation-summary ${risk}">
      <span class="mutation-risk-label">${risk.toUpperCase()} REVIEW PRIORITY</span>
      <h3>${title}</h3><p>${riskText}</p>
    </div>
    <div class="mutation-grid">
      <article class="mutation-card"><span>POSSIBLE CONSEQUENCE</span><h3>No difference to interpret</h3><p>${consequence}</p></article>
      <article class="mutation-card solution-card"><span>NEXT STEP</span><h3>Confirm the inputs</h3><p>${solution}</p></article>
    </div>
    <p class="mutation-disclaimer">This is a sequence-level educational heuristic, not a clinical risk assessment or proof of biological effect.</p>
  `;
}

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
  const labels = {
    "Dangerous off-target": "Higher-similarity candidate",
    "Possible off-target": "Moderate-similarity candidate",
    "Lower-risk off-target": "Lower-similarity candidate",
  };
  if (result.classification) return labels[result.classification] || result.classification;
  if (result.mismatches === 0) return "Intended target";
  if (result.score >= 0.75) return "Higher-similarity candidate";
  if (result.score >= 0.4) return "Moderate-similarity candidate";
  return "Lower-similarity candidate";
}

function classificationClass(classification) {
  if (classification === "Intended target") return "target";
  if (classification === "Higher-similarity candidate") return "danger";
  if (classification === "Moderate-similarity candidate") return "possible";
  return "low";
}

function renderVisualDashboard(results, sequenceLength) {
  const targetCount = results.filter((result) => getClassification(result) === "Intended target").length;
  const highSimilarityCount = results.filter((result) => getClassification(result) === "Higher-similarity candidate").length;
  const bannerClass = highSimilarityCount ? "warning" : "good";
  const bannerTitle = highSimilarityCount
    ? `${highSimilarityCount} higher-similarity candidate${highSimilarityCount === 1 ? "" : "s"} to review`
    : "No higher-similarity candidates found";
  const bannerText = highSimilarityCount
    ? "Red areas show close matches for review. Green shows an exact guide match."
    : "The exact guide match is shown in green. Other matches are lower-scoring in this analysis.";

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
      <span class="legend-item"><i class="legend-swatch legend-danger"></i> Higher-similarity candidate</span>
      <span class="legend-item"><i class="legend-swatch legend-possible"></i> Moderate-similarity candidate</span>
      <span class="legend-item"><i class="legend-swatch legend-low"></i> Lower-similarity candidate</span>
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
