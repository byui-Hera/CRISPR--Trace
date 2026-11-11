import csv
import io
from collections import Counter

import streamlit as st

from crispr_trace import analyze_sequence


st.set_page_config(
    page_title="CRISPR-Trace | Off-target analysis",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .block-container { max-width: 1200px; padding-top: 2rem; }
    .hero { padding: 2rem 0 1rem 0; }
    .eyebrow { color: #22c55e; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; font-size: .78rem; }
    .hero h1 { font-size: 3rem; margin: .25rem 0; }
    .hero p { color: #94a3b8; font-size: 1.1rem; max-width: 760px; }
    .risk-card { border-radius: 12px; padding: 12px 16px; margin: 6px 0; border: 1px solid #334155; }
    .risk-high { border-left: 5px solid #ef4444; }
    .risk-medium { border-left: 5px solid #f59e0b; }
    .risk-low { border-left: 5px solid #22c55e; }
    </style>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.markdown("## 🧬 CRISPR-Trace")
    st.caption("Explainable SpCas9 off-target analysis")
    st.divider()
    st.markdown("### Current model")
    st.markdown(
        "- 20-base spacer\n"
        "- SpCas9 `NGG` PAM\n"
        "- Both DNA strands\n"
        "- PAM-proximal seed weighting"
    )
    st.divider()
    st.caption("Educational software — not a clinical predictor.")

st.markdown(
    """
    <div class="hero">
      <div class="eyebrow">Bioinformatics analysis tool</div>
      <h1>Find CRISPR off-target candidates.</h1>
      <p>Scan a DNA sequence, compare candidate spacers against a guide RNA, and inspect an explainable mismatch score across both strands.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

analyzer_tab, methodology_tab, project_tab = st.tabs(
    ["Analyzer", "How it works", "Project context"]
)

with analyzer_tab:
    st.subheader("Run an analysis")
    input_col, guide_col = st.columns([2, 1])

    with input_col:
        target = st.text_area(
            "Target DNA sequence",
            value="TTTACGTACGTACGTACGTACGTAGGCCC",
            height=120,
            help="Use DNA bases A, C, G, and T. Longer sequences can contain multiple candidates.",
        )

    with guide_col:
        guide = st.text_input(
            "Guide RNA sequence",
            value="ACGTACGTACGTACGTACGT",
            help="The current model expects exactly 20 bases.",
        )
        analyze = st.button("Analyze sequence", type="primary", use_container_width=True)

    if analyze:
        try:
            results = analyze_sequence(target, guide)
        except ValueError as error:
            st.error(str(error))
        else:
            if not results:
                st.warning("No valid NGG PAM sites were found in either strand.")
            else:
                counts = Counter(result["risk_level"] for result in results)
                st.subheader("Analysis summary")
                metric_1, metric_2, metric_3, metric_4 = st.columns(4)
                metric_1.metric("Candidate sites", len(results))
                metric_2.metric("High score", counts.get("High", 0))
                metric_3.metric("Medium score", counts.get("Medium", 0))
                metric_4.metric("Low score", counts.get("Low", 0))

                chart_data = {
                    "High": counts.get("High", 0),
                    "Medium": counts.get("Medium", 0),
                    "Low": counts.get("Low", 0),
                }
                st.bar_chart(chart_data, height=220)

                display_results = [
                    {
                        "Position": result["position"],
                        "Strand": result["strand"],
                        "Spacer": result["spacer"],
                        "PAM": result["pam"],
                        "Mismatches": result["mismatches"],
                        "Mismatch positions": str(result["mismatch_positions"]),
                        "Score": result["score"],
                        "Risk": result["risk_level"],
                    }
                    for result in results
                ]

                st.subheader("Candidate sites")
                st.dataframe(
                    display_results,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "Score": st.column_config.NumberColumn("Score", format="%.2f"),
                        "Position": st.column_config.NumberColumn("Position", format="%d"),
                    },
                )

                st.subheader("Highest-scoring candidates")
                for result in sorted(results, key=lambda item: item["score"], reverse=True)[:5]:
                    risk_class = result["risk_level"].lower()
                    st.markdown(
                        f"""
                        <div class="risk-card risk-{risk_class}">
                          <strong>{result['risk_level']} · score {result['score']:.2f}</strong><br>
                          Position {result['position']} · strand {result['strand']} · PAM <code>{result['pam']}</code><br>
                          Spacer <code>{result['spacer']}</code> · mismatches at {result['mismatch_positions']}
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                csv_buffer = io.StringIO()
                writer = csv.DictWriter(csv_buffer, fieldnames=display_results[0].keys())
                writer.writeheader()
                writer.writerows(display_results)
                st.download_button(
                    "Download results as CSV",
                    data=csv_buffer.getvalue(),
                    file_name="crispr_trace_results.csv",
                    mime="text/csv",
                )

with methodology_tab:
    st.subheader("Methodology")
    st.markdown(
        """
        1. **Validate and normalize** the DNA and guide RNA.
        2. **Scan both strands** for a 20-base spacer followed by an `NGG` PAM.
        3. **Compare spacers** with the guide and record zero-based mismatch positions.
        4. **Score candidates** with a transparent heuristic: mismatches in positions 12–19, the PAM-proximal seed region, receive a larger penalty.
        5. **Present evidence** in a sortable table and downloadable CSV report.
        """
    )
    st.info(
        "The scoring model is intentionally explainable and educational. "
        "It is not experimentally validated and should not be used for clinical decisions."
    )

with project_tab:
    st.subheader("Why this project exists")
    st.markdown(
        "CRISPR-Trace demonstrates how sequence algorithms, software engineering, "
        "data visualization, and scientific communication can work together in one portfolio project."
    )
    st.markdown("**Engineering highlights**")
    st.markdown(
        "- Modular `src/` package architecture\n"
        "- Typed immutable candidate-site model\n"
        "- Automated unit tests\n"
        "- Command-line and web interfaces\n"
        "- CSV export for reproducible review"
    )

st.divider()
st.caption("CRISPR-Trace · Python · Streamlit · Bioinformatics · Explainable heuristics")
