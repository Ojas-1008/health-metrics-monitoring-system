# ===== VALIDATOR.JS FOCUSED TEST SUITE =====
# Tests core validation functionality without rate limit issues

Write-Host ""
Write-Host "===== VALIDATOR.JS FOCUSED TEST SUITE =====" -ForegroundColor Cyan
Write-Host "Testing: Core validation chains" -ForegroundColor Yellow
Write-Host ""

$totalTests = 0
$passedTests = 0

function LogTest($testName, $status, $details) {
    $totalTests++
    if ($status -eq "PASS") { $passedTests++ }
    
    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$status] $testName" -ForegroundColor $color
    if ($details) { Write-Host "      $details" -ForegroundColor Gray }
}

# Setup
Write-Host ""
Write-Host "[SETUP] Authenticating..." -ForegroundColor Yellow
$loginBody = @{email='ojasshrivastava1008@gmail.com';password='Krishna@1008'} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$token = $loginResponse.token
$headers = @{Authorization="Bearer $token"}
Write-Host "SUCCESS - Token obtained" -ForegroundColor Green

# ===== PROFILE UPDATE VALIDATION =====
Write-Host ""
Write-Host "===== VALIDATION TEST 1: Profile Name =====" -ForegroundColor Cyan

# Valid name
Write-Host ""
Write-Host "Test 1.1: Valid Name" -ForegroundColor Yellow
$validProfile = @{name='John Smith'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $validProfile -ContentType 'application/json' -Headers $headers
    if ($response.success) { LogTest "Valid name accepted" "PASS" }
} catch { LogTest "Valid name" "FAIL" }

# Too short name
Write-Host ""
Write-Host "Test 1.2: Name Too Short" -ForegroundColor Yellow
$shortName = @{name='J'} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $shortName -ContentType 'application/json' -Headers $headers
    LogTest "Short name rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Short name rejected" "PASS" "Validation working"
    }
}

# Name with numbers
Write-Host ""
Write-Host "Test 1.3: Name with Numbers" -ForegroundColor Yellow
$numName = @{name='John123'} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $numName -ContentType 'application/json' -Headers $headers
    LogTest "Name with numbers rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Name with numbers rejected" "PASS" "Validation working"
    }
}

# ===== GOALS VALIDATION =====
Write-Host ""
Write-Host "===== VALIDATION TEST 2: Goals =====" -ForegroundColor Cyan

# Valid goals
Write-Host ""
Write-Host "Test 2.1: Valid Goals" -ForegroundColor Yellow
$validGoals = @{
    goals=@{
        stepGoal=10000
        sleepGoal=8
        calorieGoal=2000
    }
} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $validGoals -ContentType 'application/json' -Headers $headers
    if ($response.success) { LogTest "Valid goals accepted" "PASS" }
} catch { LogTest "Valid goals" "FAIL" }

# Goal too high (steps)
Write-Host ""
Write-Host "Test 2.2: Step Goal Too High" -ForegroundColor Yellow
$highSteps = @{goals=@{stepGoal=60000}} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $highSteps -ContentType 'application/json' -Headers $headers
    LogTest "High step goal rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "High step goal rejected" "PASS" "Validation working"
    }
}

# Goal too low (sleep)
Write-Host ""
Write-Host "Test 2.3: Sleep Goal Too Low" -ForegroundColor Yellow
$lowSleep = @{goals=@{sleepGoal=2}} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $lowSleep -ContentType 'application/json' -Headers $headers
    LogTest "Low sleep goal rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Low sleep goal rejected" "PASS" "Validation working"
    }
}

# ===== METRICS VALIDATION =====
Write-Host ""
Write-Host "===== VALIDATION TEST 3: Metrics =====" -ForegroundColor Cyan

# Valid metrics
Write-Host ""
Write-Host "Test 3.1: Valid Metrics" -ForegroundColor Yellow
$today = (Get-Date).ToString('yyyy-MM-dd')
$validMetrics = @{
    date=$today
    metrics=@{
        steps=8500
        calories=2000
        distance=6.5
        activeMinutes=45
        weight=75
        sleepHours=7.5
    }
} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $validMetrics -ContentType 'application/json' -Headers $headers
    if ($response.success) { LogTest "Valid metrics accepted" "PASS" }
} catch { LogTest "Valid metrics" "FAIL" }

# Invalid date format
Write-Host ""
Write-Host "Test 3.2: Invalid Date Format" -ForegroundColor Yellow
$badDate = @{date='13-11-2025';metrics=@{steps=8000}} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $badDate -ContentType 'application/json' -Headers $headers
    LogTest "Invalid date rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Invalid date rejected" "PASS" "Validation working"
    }
}

# Future date
Write-Host ""
Write-Host "Test 3.3: Future Date Rejected" -ForegroundColor Yellow
$futureDate = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
$futureMetrics = @{date=$futureDate;metrics=@{steps=8000}} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $futureMetrics -ContentType 'application/json' -Headers $headers
    LogTest "Future date rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Future date rejected" "PASS" "Validation working"
    }
}

# Empty metrics
Write-Host ""
Write-Host "Test 3.4: Empty Metrics Object" -ForegroundColor Yellow
$emptyMetrics = @{date=$today;metrics=@{}} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $emptyMetrics -ContentType 'application/json' -Headers $headers
    LogTest "Empty metrics rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Empty metrics rejected" "PASS" "Validation working"
    }
}

# ===== ERROR HANDLING TEST =====
Write-Host ""
Write-Host "===== VALIDATION TEST 4: Error Handling =====" -ForegroundColor Cyan

# Test error format
Write-Host ""
Write-Host "Test 4.1: Error Response Format" -ForegroundColor Yellow
$invalidInput = @{date=$today;metrics=@{}} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $invalidInput -ContentType 'application/json' -Headers $headers
} catch {
    try {
        $body = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($body)
        $content = $reader.ReadToEnd()
        $error = $content | ConvertFrom-Json
        
        if ($error.success -eq $false -and $error.message -and $error.errors) {
            LogTest "Error response format correct" "PASS" "success, message, errors fields present"
        } else {
            LogTest "Error response format" "FAIL" "Missing expected fields"
        }
    } catch {
        LogTest "Error response format" "FAIL" "Could not parse error"
    }
}

# ===== SUMMARY =====
Write-Host ""
Write-Host "===== TEST SUMMARY =====" -ForegroundColor Cyan
Write-Host "Total Tests Run: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Success Rate: $(if($totalTests -gt 0) {[math]::Round(($passedTests/$totalTests)*100,2)} else {0})%" -ForegroundColor Green

Write-Host ""
Write-Host "===== COMPLETE =====" -ForegroundColor Cyan
