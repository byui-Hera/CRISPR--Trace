@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_website.ps1"
if errorlevel 1 (
    echo.
    echo CRISPR-Trace could not start. Read the message above for the fix.
    pause
)
