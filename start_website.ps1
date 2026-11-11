$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = (Get-Command python -ErrorAction SilentlyContinue).Source

if (-not $python) {
    throw "Python was not found. Install Python or activate your virtual environment first."
}

if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "CRISPR-Trace API is already running on http://127.0.0.1:8000"
} else {
    Write-Host "Starting CRISPR-Trace API on http://127.0.0.1:8000"
    Start-Process -FilePath $python `
        -ArgumentList "-m uvicorn crispr_trace.api:app --app-dir src --host 127.0.0.1 --port 8000" `
        -WorkingDirectory $project
}

if (Get-NetTCPConnection -LocalPort 5501 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "CRISPR-Trace website is already running on http://127.0.0.1:5501"
} else {
    Write-Host "Starting CRISPR-Trace website on http://127.0.0.1:5501"
    Start-Process -FilePath $python `
        -ArgumentList "-m http.server 5501 --bind 127.0.0.1 --directory web" `
        -WorkingDirectory $project
}

Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:5501"
