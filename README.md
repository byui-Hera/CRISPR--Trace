# CRISPR-Trace

CRISPR-Trace is an educational bioinformatics tool for scanning DNA for potential SpCas9 off-target sites. It searches both DNA strands for 20-base spacers followed by an `NGG` PAM, compares each spacer with a guide RNA, and produces an explainable heuristic score.

## Features

- Forward- and reverse-strand scanning
- SpCas9 `NGG` PAM detection
- Mismatch position reporting
- PAM-proximal seed-region weighting
- Typed data models and modular package structure
- Streamlit dashboard with CSV export
- Unit tests for validation, scoring, and scanning

## Project structure

```text
CRISPR--Trace/
├── app.py                 # Streamlit dashboard
├── pyproject.toml         # Package metadata and dependencies
├── requirements.txt       # Runtime dependency list
├── src/crispr_trace/
│   ├── cli.py             # Command-line interface
│   ├── models.py          # CandidateSite dataclass
│   ├── scanner.py         # PAM scanning and analysis pipeline
│   ├── scoring.py         # Mismatch and heuristic scoring
│   └── sequence.py        # DNA validation and strand utilities
└── tests/
    └── test_scanner.py    # Automated tests
```

## Setup

Create and activate a virtual environment, then install the project in editable mode:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e .
```

Run the tests:

```powershell
python -m unittest discover -s tests
```

Launch the dashboard:

```powershell
python -m streamlit run app.py
```

Run the command-line interface:

```powershell
crispr-trace
```

## Scoring model

The current score is intentionally transparent rather than clinically validated. Mismatches in positions 12–19 of the guide are treated as PAM-proximal seed mismatches and receive a larger penalty than mismatches elsewhere.

This tool is for software and bioinformatics education. It is not a clinical decision-support system or a replacement for experimental validation.

## Example input

```text
Target DNA: TTTACGTACGTACGTACGTACGTAGGCCC
Guide RNA:  ACGTACGTACGTACGTACGT
```

## Resume description

> Built CRISPR-Trace, a modular Python/Streamlit bioinformatics application that scans both DNA strands for SpCas9 off-target candidates, reports PAM and mismatch features, applies an explainable seed-region scoring heuristic, and exports analysis results for review.
