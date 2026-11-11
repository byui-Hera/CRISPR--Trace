const API_URL = "http://127.0.0.1:8000/api/analyze";

const form = document.querySelector("#analysis-form");
const message = document.querySelector("#message");
const resultsContainer = document.querySelector("#results");
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
    renderResults(payload.results);
  } catch (error) {
    message.classList.add("error");
    message.textContent = "The analysis service is not running. Start it with: crispr-api";
    checkApiStatus();
  }
});

function renderResults(results) {
  if (!results.length) return;

  const counts = results.reduce((summary, result) => {
    summary[result.risk_level] = (summary[result.risk_level] || 0) + 1;
    return summary;
  }, {});

  const rows = results.map((result) => `
    <tr>
      <td>${result.position}</td>
      <td>${result.strand}</td>
      <td><code>${result.spacer}</code></td>
      <td><code>${result.pam}</code></td>
      <td>${result.mismatches}</td>
      <td>${result.mismatch_positions.join(", ") || "—"}</td>
      <td>${result.score.toFixed(2)}</td>
      <td><span class="risk-badge risk-${result.risk_level.toLowerCase()}">${result.risk_level}</span></td>
    </tr>
  `).join("");

  resultsContainer.innerHTML = `
    <div class="summary-grid">
      <div class="summary-card"><strong>${results.length}</strong><span>Candidate sites</span></div>
      <div class="summary-card high"><strong>${counts.High || 0}</strong><span>High score</span></div>
      <div class="summary-card medium"><strong>${counts.Medium || 0}</strong><span>Medium score</span></div>
      <div class="summary-card low"><strong>${counts.Low || 0}</strong><span>Low score</span></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Position</th><th>Strand</th><th>Spacer</th><th>PAM</th><th>Mismatches</th><th>Mismatch positions</th><th>Score</th><th>Risk</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <button class="button download" id="download-results">Download CSV ↓</button>
  `;
  resultsContainer.hidden = false;
  document.querySelector("#download-results").addEventListener("click", () => downloadCsv(results));
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
