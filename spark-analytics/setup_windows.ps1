# One-time Setup Script for Spark Analytics on Windows
# This sets up everything needed to run analytics processing

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Spark Analytics Setup for Windows" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to spark-analytics directory
$projectRoot = "c:\Users\ojass\OneDrive\Documents\Web Development\health-metrics-monitoring-system"
$sparkDir = Join-Path $projectRoot "spark-analytics"

if (-not (Test-Path $sparkDir)) {
    Write-Host "ERROR: spark-analytics directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $sparkDir
Write-Host "Working directory: $sparkDir" -ForegroundColor Green
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Cyan
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3.9+ from https://www.python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "Found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Check Java installation
Write-Host "Checking Java installation..." -ForegroundColor Cyan
$javaVersion = java -version 2>&1 | Select-String "version"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Java not found!" -ForegroundColor Red
    Write-Host "Please install Java 11 from https://adoptium.net/temurin/releases/?version=11" -ForegroundColor Red
    exit 1
}
Write-Host "Found: $javaVersion" -ForegroundColor Green
Write-Host ""

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".\venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host "Virtual environment created!" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Yellow
}
Write-Host ""

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Check .env file
if (-not (Test-Path ".\.env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from example..." -ForegroundColor Cyan
    
    if (Test-Path ".\.env.example") {
        Copy-Item ".\.env.example" ".\.env"
        Write-Host ".env file created!" -ForegroundColor Green
        Write-Host "IMPORTANT: Please edit .env and add your MongoDB connection string" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: .env.example not found!" -ForegroundColor Red
        Write-Host "Please create .env file manually with MongoDB settings" -ForegroundColor Red
    }
} else {
    Write-Host ".env file exists" -ForegroundColor Green
}
Write-Host ""

# Create necessary directories
Write-Host "Creating required directories..." -ForegroundColor Cyan
$dirs = @("hadoop\bin", "spark-checkpoints", "spark-local", "dlq")
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    }
}
Write-Host ""

# Test MongoDB connection
Write-Host "Testing MongoDB connection..." -ForegroundColor Cyan
python test_mongo_connection.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: MongoDB connection test failed!" -ForegroundColor Yellow
    Write-Host "Please check your MONGO_URI in .env file" -ForegroundColor Yellow
} else {
    Write-Host "MongoDB connection successful!" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify .env file has correct MongoDB URI" -ForegroundColor White
Write-Host "2. Run: .\run_analytics.ps1" -ForegroundColor White
Write-Host "   OR" -ForegroundColor Yellow
Write-Host "3. Run: python process_batch_windows.py" -ForegroundColor White
Write-Host ""
Write-Host "For continuous processing (every 60 seconds):" -ForegroundColor Cyan
Write-Host "   python main.py" -ForegroundColor White
Write-Host ""
