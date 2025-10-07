# Finance Report Cron Job for Windows PowerShell
# This PowerShell script can be used with Windows Task Scheduler

param(
    [switch]$Test
)

# Set working directory to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "Starting Finance Report at $(Get-Date)" -ForegroundColor Green

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "Using Node.js version: $nodeVersion" -ForegroundColor Yellow
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Run the finance report
try {
    if ($Test) {
        Write-Host "Running connection test..." -ForegroundColor Yellow
        node scripts/finance-cron.js --test
    } else {
        Write-Host "Running finance report..." -ForegroundColor Yellow
        node scripts/finance-cron.js
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Finance report completed successfully" -ForegroundColor Green
    } else {
        Write-Host "Finance report failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running finance report: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Finished at $(Get-Date)" -ForegroundColor Green

# Keep window open if run manually (not from Task Scheduler)
if (-not $env:TASK_SCHEDULER) {
    Read-Host "Press Enter to exit"
}
