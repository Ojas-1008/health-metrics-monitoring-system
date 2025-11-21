# Health Metrics Analytics Runner for Windows
# Runs analytics processing without WSL/streaming requirements

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Health Metrics Analytics - Windows Batch Mode" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
$currentDir = Get-Location
if ($currentDir.Path -notlike "*spark-analytics*") {
    Write-Host "Changing to spark-analytics directory..." -ForegroundColor Yellow
    Set-Location "c:\Users\ojass\OneDrive\Documents\Web Development\health-metrics-monitoring-system\spark-analytics"
}

# Check if Python virtual environment exists
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Green
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Virtual environment not found. Using global Python..." -ForegroundColor Yellow
}

# Check if .env file exists
if (-not (Test-Path ".\.env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with MongoDB connection settings" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting analytics processing..." -ForegroundColor Green
Write-Host ""

# Run the batch processing script
python process_batch_windows.py

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "Analytics processing completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Analytics processing failed with exit code: $exitCode" -ForegroundColor Red
}
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verify results
Write-Host "Verifying analytics in MongoDB..." -ForegroundColor Cyan
python verify_analytics_mongodb.py

exit $exitCode
