# ===== COMPREHENSIVE VALIDATOR.JS TEST SUITE =====
# Tests all validation chains and error handling

Write-Host ""
Write-Host "===== COMPREHENSIVE VALIDATOR.JS TEST SUITE =====" -ForegroundColor Cyan
Write-Host "Testing: 12 validation chains + error handling" -ForegroundColor Yellow
Write-Host ""

# Test results tracking
$totalTests = 0
$passedTests = 0
$failedTests = 0
$testResults = @()

function LogTest($testName, $status, $details) {
    $totalTests++
    if ($status -eq "PASS") { $passedTests++ }
    else { $failedTests++ }
    
    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$status] $testName" -ForegroundColor $color
    if ($details) { Write-Host "      $details" -ForegroundColor Gray }
    
    $testResults += @{name=$testName; status=$status; details=$details}
}

# ===== SETUP: LOGIN & GET TOKEN =====
Write-Host ""
Write-Host "[SETUP] Authenticating..." -ForegroundColor Yellow
$loginBody = @{email='ojasshrivastava1008@gmail.com';password='Krishna@1008'} | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
    $token = $loginResponse.token
    $userId = $loginResponse.user.id
    Write-Host "SUCCESS - Token obtained" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Authentication error" -ForegroundColor Red
    exit
}

$headers = @{Authorization="Bearer $token"}

# ===== TEST SUITE 1: REGISTRATION VALIDATION =====
Write-Host ""
Write-Host "===== TEST 1: validateRegister =====" -ForegroundColor Cyan

# Test 1.1: Valid registration
Write-Host ""
Write-Host "Test 1.1: Valid Registration Data" -ForegroundColor Yellow
$uniqueEmail = "testuser_$(Get-Random)@test.com"
$validRegister = @{
    name='John Doe'
    email=$uniqueEmail
    password='Test1234!'
    confirmPassword='Test1234!'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $validRegister -ContentType 'application/json'
    if ($response.success) {
        LogTest "Valid registration data accepted" "PASS" "User created: $uniqueEmail"
    }
} catch {
    LogTest "Valid registration data accepted" "FAIL" "$($_.Exception.Response.StatusCode)"
}

# Test 1.2: Missing name
Write-Host ""
Write-Host "Test 1.2: Missing Name" -ForegroundColor Yellow
$invalidRegister = @{
    email='test@test.com'
    password='Test1234!'
    confirmPassword='Test1234!'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $invalidRegister -ContentType 'application/json'
    LogTest "Missing name rejected" "FAIL" "Should have been rejected"
} catch {
    $error = $_.Exception.Response.StatusCode
    if ($error -eq 400) {
        LogTest "Missing name rejected" "PASS" "Returns 400 Bad Request"
    } else {
        LogTest "Missing name rejected" "FAIL" "Wrong status code: $error"
    }
}

# Test 1.3: Invalid email format
Write-Host ""
Write-Host "Test 1.3: Invalid Email Format" -ForegroundColor Yellow
$invalidEmail = @{
    name='John Doe'
    email='notanemail'
    password='Test1234!'
    confirmPassword='Test1234!'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $invalidEmail -ContentType 'application/json'
    LogTest "Invalid email format rejected" "FAIL" "Should have been rejected"
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    if ($statusCode -eq 400) {
        LogTest "Invalid email format rejected" "PASS" "Returns 400 Bad Request"
    }
}

# Test 1.4: Weak password (no uppercase)
Write-Host ""
Write-Host "Test 1.4: Weak Password (No Uppercase)" -ForegroundColor Yellow
$weakPassword = @{
    name='John Doe'
    email="unique_$(Get-Random)@test.com"
    password='test1234!'
    confirmPassword='test1234!'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $weakPassword -ContentType 'application/json'
    LogTest "Weak password (no uppercase) rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Weak password (no uppercase) rejected" "PASS" "Returns 400"
    }
}

# Test 1.5: Password mismatch
Write-Host ""
Write-Host "Test 1.5: Password Mismatch" -ForegroundColor Yellow
$mismatchPassword = @{
    name='John Doe'
    email="unique_$(Get-Random)@test.com"
    password='Test1234!'
    confirmPassword='Test5678!'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $mismatchPassword -ContentType 'application/json'
    LogTest "Password mismatch rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Password mismatch rejected" "PASS" "Returns 400"
    }
}

# Test 1.6: Duplicate email
Write-Host ""
Write-Host "Test 1.6: Duplicate Email" -ForegroundColor Yellow
$duplicateEmail = @{
    name='Jane Doe'
    email='ojasshrivastava1008@gmail.com'
    password='Test1234!'
    confirmPassword='Test1234!'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $duplicateEmail -ContentType 'application/json'
    LogTest "Duplicate email rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Duplicate email rejected" "PASS" "Returns 400"
    }
}

# ===== TEST SUITE 2: LOGIN VALIDATION =====
Write-Host ""
Write-Host "===== TEST 2: validateLogin =====" -ForegroundColor Cyan

# Test 2.1: Valid login
Write-Host ""
Write-Host "Test 2.1: Valid Login Credentials" -ForegroundColor Yellow
$validLogin = @{email='ojasshrivastava1008@gmail.com';password='Krishna@1008'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $validLogin -ContentType 'application/json'
    if ($response.token) {
        LogTest "Valid login accepted" "PASS" "Token generated"
    }
} catch {
    LogTest "Valid login accepted" "FAIL" "$($_.Exception.Response.StatusCode)"
}

# Test 2.2: Missing email
Write-Host ""
Write-Host "Test 2.2: Missing Email" -ForegroundColor Yellow
$noEmail = @{password='Krishna@1008'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $noEmail -ContentType 'application/json'
    LogTest "Missing email rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Missing email rejected" "PASS" "Returns 400"
    }
}

# Test 2.3: Invalid email format
Write-Host ""
Write-Host "Test 2.3: Invalid Email Format" -ForegroundColor Yellow
$invalidEmailLogin = @{email='notanemail';password='Krishna@1008'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $invalidEmailLogin -ContentType 'application/json'
    LogTest "Invalid email format rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Invalid email format rejected" "PASS" "Returns 400"
    }
}

# Test 2.4: Wrong password
Write-Host ""
Write-Host "Test 2.4: Wrong Password" -ForegroundColor Yellow
$wrongPassword = @{email='ojasshrivastava1008@gmail.com';password='WrongPassword123!'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $wrongPassword -ContentType 'application/json'
    LogTest "Wrong password rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        LogTest "Wrong password rejected" "PASS" "Returns 401 Unauthorized"
    }
}

# ===== TEST SUITE 3: PROFILE UPDATE VALIDATION =====
Write-Host ""
Write-Host "===== TEST 3: validateProfileUpdate =====" -ForegroundColor Cyan

# Test 3.1: Valid profile update
Write-Host ""
Write-Host "Test 3.1: Valid Profile Update" -ForegroundColor Yellow
$validProfile = @{name='Updated Name'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $validProfile -ContentType 'application/json' -Headers $headers
    if ($response.success) {
        LogTest "Valid profile update accepted" "PASS" "Profile updated"
    }
} catch {
    LogTest "Valid profile update accepted" "FAIL" "$($_.Exception.Response.StatusCode)"
}

# Test 3.2: Invalid name (too short)
Write-Host ""
Write-Host "Test 3.2: Invalid Name (Too Short)" -ForegroundColor Yellow
$shortName = @{name='J'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $shortName -ContentType 'application/json' -Headers $headers
    LogTest "Invalid name rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Invalid name rejected" "PASS" "Returns 400"
    }
}

# Test 3.3: Invalid name (contains numbers)
Write-Host ""
Write-Host "Test 3.3: Invalid Name (Contains Numbers)" -ForegroundColor Yellow
$numericName = @{name='John123'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $numericName -ContentType 'application/json' -Headers $headers
    LogTest "Name with numbers rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Name with numbers rejected" "PASS" "Returns 400"
    }
}

# Test 3.4: Invalid profile picture URL
Write-Host ""
Write-Host "Test 3.4: Invalid Profile Picture URL" -ForegroundColor Yellow
$invalidUrl = @{profilePicture='notaurl'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $invalidUrl -ContentType 'application/json' -Headers $headers
    LogTest "Invalid URL rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Invalid URL rejected" "PASS" "Returns 400"
    }
}

# Test 3.5: Valid goals update
Write-Host ""
Write-Host "Test 3.5: Valid Goals Update" -ForegroundColor Yellow
$validGoals = @{
    goals=@{
        stepGoal=10000
        sleepGoal=8
        calorieGoal=2000
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $validGoals -ContentType 'application/json' -Headers $headers
    if ($response.success) {
        LogTest "Valid goals update accepted" "PASS" "Goals updated"
    }
} catch {
    LogTest "Valid goals update accepted" "FAIL" "$($_.Exception.Response.StatusCode)"
}

# Test 3.6: Invalid step goal (too high)
Write-Host ""
Write-Host "Test 3.6: Invalid Step Goal (Too High)" -ForegroundColor Yellow
$invalidSteps = @{
    goals=@{stepGoal=60000}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/profile' -Method PUT -Body $invalidSteps -ContentType 'application/json' -Headers $headers
    LogTest "Invalid step goal rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Invalid step goal rejected" "PASS" "Returns 400"
    }
}

# ===== TEST SUITE 4: METRICS VALIDATION =====
Write-Host ""
Write-Host "===== TEST 4: validateAddOrUpdateMetrics =====" -ForegroundColor Cyan

# Test 4.1: Valid metrics
Write-Host ""
Write-Host "Test 4.1: Valid Metrics Addition" -ForegroundColor Yellow
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
    if ($response.success) {
        LogTest "Valid metrics accepted" "PASS" "Metrics added for $today"
    }
} catch {
    LogTest "Valid metrics accepted" "FAIL" "$($_.Exception.Response.StatusCode)"
}

# Test 4.2: Invalid date format
Write-Host ""
Write-Host "Test 4.2: Invalid Date Format" -ForegroundColor Yellow
$invalidDate = @{
    date='13-11-2025'
    metrics=@{steps=8000}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $invalidDate -ContentType 'application/json' -Headers $headers
    LogTest "Invalid date format rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Invalid date format rejected" "PASS" "Returns 400"
    }
}

# Test 4.3: Future date
Write-Host ""
Write-Host "Test 4.3: Future Date Rejected" -ForegroundColor Yellow
$futureDate = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
$futureMetrics = @{
    date=$futureDate
    metrics=@{steps=8000}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $futureMetrics -ContentType 'application/json' -Headers $headers
    LogTest "Future date rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Future date rejected" "PASS" "Returns 400"
    }
}

# Test 4.4: Empty metrics object
Write-Host ""
Write-Host "Test 4.4: Empty Metrics Object" -ForegroundColor Yellow
$emptyMetrics = @{
    date=$today
    metrics=@{}
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/metrics' -Method POST -Body $emptyMetrics -ContentType 'application/json' -Headers $headers
    LogTest "Empty metrics rejected" "FAIL" "Should have been rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        LogTest "Empty metrics rejected" "PASS" "Returns 400"
    }
}

# ===== TEST SUITE 5: ERROR MESSAGE QUALITY =====
Write-Host ""
Write-Host "===== TEST 5: Error Message Quality =====" -ForegroundColor Cyan

# Test 5.1: Specific error message for duplicate email
Write-Host ""
Write-Host "Test 5.1: Specific Error for Duplicate Email" -ForegroundColor Yellow
$dupEmail = @{
    name='Test User'
    email='ojasshrivastava1008@gmail.com'
    password='Test1234!'
    confirmPassword='Test1234!'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $dupEmail -ContentType 'application/json'
} catch {
    $errorResponse = $_.Exception.Response | ConvertFrom-Json
    if ($errorResponse.message -match "already registered" -or $errorResponse.errors.email) {
        LogTest "Specific duplicate email message" "PASS" "Message mentions email is registered"
    } else {
        LogTest "Specific duplicate email message" "FAIL" "Generic message instead of specific"
    }
}

# Test 5.2: Multiple validation errors
Write-Host ""
Write-Host "Test 5.2: Multiple Validation Errors" -ForegroundColor Yellow
$multipleErrors = @{
    name='X'
    email='invalid'
    password='weak'
    confirmPassword='nomatch'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $multipleErrors -ContentType 'application/json'
} catch {
    $errorResponse = $_.Exception.Response | ConvertFrom-Json
    if ($errorResponse.errors -and ($errorResponse.errors | Get-Member -MemberType Properties).Count -gt 1) {
        LogTest "Multiple errors formatted correctly" "PASS" "All fields with errors listed"
    } else {
        LogTest "Multiple errors formatted correctly" "FAIL" "Only partial errors shown"
    }
}

# ===== TEST SUMMARY =====
Write-Host ""
Write-Host "===== TEST SUMMARY =====" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests"  -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if($failedTests -gt 0) {"Red"} else {"Green"})
Write-Host ""

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if($successRate -eq 100) {"Green"} else {"Yellow"})

Write-Host ""
Write-Host "===== COMPLETE =====" -ForegroundColor Cyan
