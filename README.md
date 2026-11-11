# CRISPR-Trace

CRISPR-Trace is a small website that helps people explore how CRISPR guide sequences match DNA.

## What does it do?

CRISPR uses a short guide sequence to find a specific place in DNA. Sometimes the guide may also match another place. These extra matches are called **off-target sites**.

CRISPR-Trace:

1. Takes a DNA sequence and a 20-letter guide sequence.
2. Looks for possible CRISPR target sites.
3. Checks both directions of the DNA.
4. Counts differences between the guide and each possible site.
5. Shows the results in a simple table.

The tool gives each result an easy-to-understand score. A higher score means the guide and the possible site are more similar.

> This is an educational project. Its score is a simple computer estimate, not medical advice or a replacement for laboratory testing.

## Website preview

The website has three simple parts:

- **Analyzer:** enter DNA and view possible matches.
- **How it works:** learn how the tool checks the sequence.
- **About:** read about the project and its limitations.

## Project structure

```text
CRISPR--Trace/
├── web/
│   ├── index.html       # Website content
│   ├── styles.css       # Website colors and layout
│   ├── app.js           # Website interactions
│   └── favicon.svg       # Browser tab logo
├── src/crispr_trace/
│   ├── api.py           # Connects the website to Python
│   ├── scanner.py       # Finds possible DNA sites
│   ├── scoring.py       # Counts differences and creates scores
│   ├── sequence.py      # Checks DNA input
│   └── models.py        # Stores result information
├── tests/
│   └── test_scanner.py  # Checks that the code works
├── app.py               # Optional Streamlit version
└── pyproject.toml       # Project setup
```

## How to run it

### 1. Install the project

Open PowerShell in the project folder and run:

```powershell
python -m pip install -e .
```

### 2. Start the Python backend

Open one PowerShell window and run:

```powershell
crispr-api
```

The backend does the DNA analysis.

### 3. Start the website

Open a second PowerShell window and run:

```powershell
python -m http.server 5501 --bind 127.0.0.1 --directory web
```

Then open this address in your browser:

```text
http://127.0.0.1:5501
```

### Start everything with one script

You can also start the API, website, and browser together:

```powershell
.\start_website.ps1
```

## How to try it

Use these example values:

```text
DNA sequence:
TTTACGTACGTACGTACGTACGTAGGCCC

Guide sequence:
ACGTACGTACGTACGTACGT
```

Click **Analyze sequence** to see the results.

## Run the tests

```powershell
python -m unittest discover -s tests
```

## Resume description

> Built CRISPR-Trace, a full-stack Python and JavaScript bioinformatics website that checks both DNA strands for possible CRISPR off-target matches, explains mismatch-based scores, and presents results in a clear interactive interface.
