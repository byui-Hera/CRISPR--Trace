$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = $null
$knownPythonPaths = @(
    "$env:LocalAppData\Programs\Python\Python312\python.exe",
    "$env:LocalAppData\Programs\Python\Python311\python.exe",
    "$env:LocalAppData\Programs\Python\Python310\python.exe"
)

foreach ($candidate in $knownPythonPaths) {
    if (Test-Path -LiteralPath $candidate) {
        $python = $candidate
        break
    }
}

if (-not $python) {
    $pythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($pythonCommand) {
        $python = $pythonCommand.Source
    }
}

if (-not $python) {
    throw "Python was not found. Install Python or activate your virtual environment first."
}

function Test-LocalPort([int]$port) {
    return Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
}

function Test-ApiReady {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 2
        return $health.status -eq "ok"
    } catch {
        return $false
    }
}

function Test-WebsiteReady {
    try {
        $page = Invoke-WebRequest -Uri "http://127.0.0.1:5501/" -TimeoutSec 2
        return $page.StatusCode -eq 200 -and $page.Content -match "CRISPR-Trace"
    } catch {
        return $false
    }
}

function Wait-ForApi {
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
        if (Test-ApiReady) {
            return $true
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Wait-ForWebsite {
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
        if (Test-WebsiteReady) {
            return $true
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

if (Test-ApiReady) {
    Write-Host "CRISPR-Trace API is already running on http://127.0.0.1:8000"
} elseif (Test-LocalPort 8000) {
    throw "Port 8000 is already used by another application. Close that application and run this script again."
} else {
    Write-Host "Starting CRISPR-Trace API on http://127.0.0.1:8000"
    Start-Process -FilePath $python `
        -ArgumentList "-m uvicorn crispr_trace.api:app --app-dir src --host 127.0.0.1 --port 8000" `
        -WorkingDirectory $project -WindowStyle Hidden
}

if (Test-WebsiteReady) {
    Write-Host "CRISPR-Trace website is already running on http://127.0.0.1:5501"
} elseif (Test-LocalPort 5501) {
    throw "Port 5501 is already used by another application. Close that application and run this script again."
} else {
    Write-Host "Starting CRISPR-Trace website on http://127.0.0.1:5501"
    Start-Process -FilePath $python `
        -ArgumentList "-m http.server 5501 --bind 127.0.0.1 --directory web" `
        -WorkingDirectory $project -WindowStyle Hidden
}

if (-not (Wait-ForApi)) {
    throw "The API did not become ready. Confirm dependencies with: $python -m pip install -e ."
}

if (-not (Wait-ForWebsite)) {
    throw "The website did not become ready. Check that web\index.html exists."
}

Start-Process "http://127.0.0.1:5501"
