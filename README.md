# CRISPR-Trace

CRISPR-Trace is a small website that helps people explore how CRISPR guide sequences match DNA.

## What does it do?

CRISPR uses a short guide sequence to find a specific place in DNA. Sometimes the guide may also match another place. These extra matches are called **off-target sites**.

CRISPR-Trace:

1. Takes a DNA sequence and a 20-letter guide sequence.
2. Looks for possible CRISPR target sites.
3. Checks both directions of the DNA.
4. Counts differences between the guide and each possible site.
5. Shows the results in a simple table and visual DNA map.

The website uses simple colors to explain the results:

- **Green — Intended target:** the guide matches the site exactly.
- **Red — Dangerous off-target:** the guide is very similar to another site.
- **Amber — Possible off-target:** the guide has more differences.
- **Gray — Lower-risk off-target:** the guide has many differences.

> This is an educational project. Its score is a simple computer estimate, not medical advice or a replacement for laboratory testing.

## Website preview

The website has three simple parts:

- **Analyzer:** enter DNA and view possible matches.
- **How it works:** learn how the tool checks the sequence.
- **About:** read about the project and its limitations.

## Open the website

When the local servers are running, open the website here:

[Open CRISPR-Trace locally](http://127.0.0.1:5501)

This link works only on the computer running the project. For a link that works for recruiters viewing GitHub, the website must be deployed online.

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
├── scripts/
│   └── benchmark.py      # Measures runtime at different DNA sizes
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

Then open this local address in your browser:

```text
http://127.0.0.1:5501
```

> `127.0.0.1` means “this computer.” It is only for local testing and will not work as a public GitHub link. Port `8000` is the private API, not the website homepage.

For a public portfolio link, the website and API must be deployed to an online hosting service first.

### Start everything with one script

You can also start the API, website, and browser together:

```powershell
.\start_website.ps1
```

On Windows, you can double-click `open_website.cmd` to start everything with one action.

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

## Run the benchmark

The benchmark creates repeatable test sequences and measures how long the scanner takes to analyze them:

```powershell
python scripts/benchmark.py
```

Example output will include sequence length, number of candidate sites, median runtime, and fastest/slowest runtime. To test custom sizes:

```powershell
python scripts/benchmark.py --lengths 1000 10000 1000000 --repeats 3
```

For machine-readable output:

```powershell
python scripts/benchmark.py --json
```

## Resume description

> Built CRISPR-Trace, a full-stack Python and JavaScript bioinformatics website that checks both DNA strands for possible CRISPR off-target matches, explains mismatch-based scores, and presents results in a clear interactive interface.
