# ErrorHandler.js Comprehensive Testing Suite
Write-Host "`n=== ERRORHANDLER.JS TESTING SUITE ===" -ForegroundColor Cyan
Write-Host "Testing all error scenarios`n" -ForegroundColor Gray

$testResults = @()

# Test 1: Invalid JSON
Write-Host "[TEST 1] Invalid JSON (SyntaxError)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body '{invalid json}' -ContentType 'application/json' -SkipHttpErrorCheck
    if ($response.StatusCode -eq 400) {
        Write-Host "PASS - Status: 400" -ForegroundColor Green
        $testResults += "Test 1: PASS"
    } else {
        Write-Host "FAIL - Got $($response.StatusCode)" -ForegroundColor Red
        $testResults += "Test 1: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 1: FAIL"
}

# Test 2: Duplicate Email
Write-Host "`n[TEST 2] Duplicate Email (E11000)" -ForegroundColor Yellow
try {
    $email = "test_$(Get-Random)@example.com"
    $reg1 = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body (ConvertTo-Json @{name='User1';email=$email;password='Test1234!';confirmPassword='Test1234!'}) -ContentType 'application/json'
    
    $reg2 = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body (ConvertTo-Json @{name='User2';email=$email;password='Test1234!';confirmPassword='Test1234!'}) -ContentType 'application/json' -SkipHttpErrorCheck
    
    if ($reg2.StatusCode -eq 400) {
        Write-Host "PASS - Status: 400" -ForegroundColor Green
        $testResults += "Test 2: PASS"
    } else {
        Write-Host "FAIL - Got $($reg2.StatusCode)" -ForegroundColor Red
        $testResults += "Test 2: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 2: FAIL"
}

# Test 3: Validation Error
Write-Host "`n[TEST 3] Validation Error" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body (ConvertTo-Json @{email='test@example.com';password='Test1234!'}) -ContentType 'application/json' -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 400) {
        Write-Host "PASS - Status: 400" -ForegroundColor Green
        $testResults += "Test 3: PASS"
    } else {
        Write-Host "FAIL - Got $($response.StatusCode)" -ForegroundColor Red
        $testResults += "Test 3: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 3: FAIL"
}

# Test 4: 404 Not Found
Write-Host "`n[TEST 4] 404 Not Found" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/nonexistent-route' -Method GET -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 404) {
        Write-Host "PASS - Status: 404" -ForegroundColor Green
        $testResults += "Test 4: PASS"
    } else {
        Write-Host "FAIL - Got $($response.StatusCode)" -ForegroundColor Red
        $testResults += "Test 4: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 4: FAIL"
}

# Test 5: Invalid JWT Token
Write-Host "`n[TEST 5] Invalid JWT Token" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/me' -Method GET -Headers @{'Authorization'='Bearer invalidjwt123'} -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 401) {
        Write-Host "PASS - Status: 401" -ForegroundColor Green
        $testResults += "Test 5: PASS"
    } else {
        Write-Host "FAIL - Got $($response.StatusCode)" -ForegroundColor Red
        $testResults += "Test 5: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 5: FAIL"
}

# Test 6: Missing Auth Header
Write-Host "`n[TEST 6] Missing Authorization Header" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/me' -Method GET -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 401) {
        Write-Host "PASS - Status: 401" -ForegroundColor Green
        $testResults += "Test 6: PASS"
    } else {
        Write-Host "FAIL - Got $($response.StatusCode)" -ForegroundColor Red
        $testResults += "Test 6: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 6: FAIL"
}

# Test 7: Response Format Validation
Write-Host "`n[TEST 7] Response Format Consistency" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/invalid' -Method GET -SkipHttpErrorCheck
    $body = $response.Content | ConvertFrom-Json
    
    if ($body.PSObject.Properties.Name -contains "success" -and $body.PSObject.Properties.Name -contains "message" -and $body.success -eq $false) {
        Write-Host "PASS - Format valid" -ForegroundColor Green
        $testResults += "Test 7: PASS"
    } else {
        Write-Host "FAIL - Format invalid" -ForegroundColor Red
        $testResults += "Test 7: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 7: FAIL"
}

# Test 8: Valid Request Control
Write-Host "`n[TEST 8] Valid Request (Control)" -ForegroundColor Yellow
try {
    $email = "valid_$(Get-Random)@test.com"
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body (ConvertTo-Json @{name='TestUser';email=$email;password='Test1234!';confirmPassword='Test1234!'}) -ContentType 'application/json'
    
    $body = $response.Content | ConvertFrom-Json
    if ($response.StatusCode -eq 201 -and $body.success) {
        Write-Host "PASS - Status: 201, Success: true" -ForegroundColor Green
        $testResults += "Test 8: PASS"
    } else {
        Write-Host "FAIL - Expected success response" -ForegroundColor Red
        $testResults += "Test 8: FAIL"
    }
} catch {
    Write-Host "FAIL - Exception" -ForegroundColor Red
    $testResults += "Test 8: FAIL"
}

# Summary
Write-Host "`n`n=== TEST SUMMARY ===" -ForegroundColor Cyan
$passCount = ($testResults | Where-Object {$_ -like "*PASS"}).Count
$totalCount = $testResults.Count
Write-Host "Passed: $passCount/$totalCount`n" -ForegroundColor Green

foreach ($result in $testResults) {
    if ($result -like "*PASS") {
        Write-Host "[PASS] $result" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $result" -ForegroundColor Red
    }
}

if ($passCount -eq $totalCount) {
    Write-Host "`n=== ALL TESTS PASSED ===" -ForegroundColor Green
} else {
    Write-Host "`n=== SOME TESTS FAILED ===" -ForegroundColor Red
}
