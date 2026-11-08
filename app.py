import csv
import io

import streamlit as st

from crispr_trace import analyze_sequence


st.set_page_config(
    page_title="CRISPR-Trace",
    page_icon="🧬",
    layout="wide",
)

st.title("🧬 CRISPR-Trace")
st.caption("An educational SpCas9 off-target scanning and visualization tool")

st.markdown(
    "Paste a target DNA sequence and a 20-base guide RNA. "
    "CRISPR-Trace searches both strands for 20-base spacers followed by an NGG PAM."
)

target = st.text_area(
    "Target DNA sequence",
    placeholder="Example: TTTACGTACGTACGTACGTACGTAGGCCC",
    height=100,
)

guide = st.text_input(
    "Guide RNA sequence",
    placeholder="Example: ACGTACGTACGTACGTACGT",
)

if st.button("Analyze sequence", type="primary"):
    try:
        results = analyze_sequence(target, guide)

        if not results:
            st.warning("No valid NGG PAM sites were found.")
        else:
            high_risk = sum(result["risk_level"] == "High" for result in results)
            medium_risk = sum(result["risk_level"] == "Medium" for result in results)
            low_risk = sum(result["risk_level"] == "Low" for result in results)

            st.subheader("Analysis summary")
            metric_1, metric_2, metric_3, metric_4 = st.columns(4)
            metric_1.metric("Candidate sites", len(results))
            metric_2.metric("High", high_risk)
            metric_3.metric("Medium", medium_risk)
            metric_4.metric("Low", low_risk)

            display_results = [
                {
                    "Position": result["position"],
                    "Strand": result["strand"],
                    "Spacer": result["spacer"],
                    "PAM": result["pam"],
                    "Mismatches": result["mismatches"],
                    "Mismatch positions": str(result["mismatch_positions"]),
                    "Score": result["risk_score"],
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
                    "Score": st.column_config.NumberColumn(
                        "Score", format="%.2f"
                    ),
                },
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

    except ValueError as error:
        st.error(str(error))

st.divider()
st.info(
    "This tool uses an explainable educational heuristic. "
    "It is not a clinical or experimentally validated off-target predictor."
)
