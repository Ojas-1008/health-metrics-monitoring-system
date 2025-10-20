# Authentication Routes Test Script
# This script tests all authentication endpoints

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AUTHENTICATION ROUTES TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/auth"
$testEmail = "testuser_$(Get-Random)@example.com"
$token = ""

# Test 1: Register User (with validation)
Write-Host "TEST 1: User Registration" -ForegroundColor Yellow
Write-Host "POST $baseUrl/register" -ForegroundColor Gray

$registerBody = @{
    name = "Test User"
    email = $testEmail
    password = "SecurePass123!@#"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $registerBody -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Registration successful" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    $token = $result.data.token
    Write-Host "Token received: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL: Registration failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`n----------------------------------------`n"

# Test 2: Registration Validation (missing field)
Write-Host "TEST 2: Registration Validation (Missing Password)" -ForegroundColor Yellow
Write-Host "POST $baseUrl/register" -ForegroundColor Gray

$invalidRegister = @{
    name = "Test User"
    email = "invalid@test.com"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $invalidRegister -ContentType "application/json" -UseBasicParsing
    Write-Host "❌ FAIL: Should have failed validation" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ PASS: Validation error caught correctly (400)" -ForegroundColor Green
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL: Unexpected error" -ForegroundColor Red
    }
}

Write-Host "`n----------------------------------------`n"

# Test 3: Login
Write-Host "TEST 3: User Login" -ForegroundColor Yellow
Write-Host "POST $baseUrl/login" -ForegroundColor Gray

$loginBody = @{
    email = $testEmail
    password = "SecurePass123!@#"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ PASS: Login successful" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    $token = $result.data.token
} catch {
    Write-Host "❌ FAIL: Login failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n"

# Test 4: Login Validation (invalid credentials)
Write-Host "TEST 4: Login Validation (Wrong Password)" -ForegroundColor Yellow
Write-Host "POST $baseUrl/login" -ForegroundColor Gray

$wrongLogin = @{
    email = $testEmail
    password = "WrongPassword123!"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -Body $wrongLogin -ContentType "application/json" -UseBasicParsing
    Write-Host "❌ FAIL: Should have failed authentication" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASS: Invalid credentials rejected (401)" -ForegroundColor Green
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL: Unexpected error" -ForegroundColor Red
    }
}

Write-Host "`n----------------------------------------`n"

# Test 5: Get Current User (Protected Route)
if ($token) {
    Write-Host "TEST 5: Get Current User (Protected)" -ForegroundColor Yellow
    Write-Host "GET $baseUrl/me" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/me" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "✅ PASS: Protected route accessed successfully" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ FAIL: Could not access protected route" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n----------------------------------------`n"
}

# Test 6: Get Current User without Token
Write-Host "TEST 6: Get Current User (No Token)" -ForegroundColor Yellow
Write-Host "GET $baseUrl/me" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/me" -Method GET -UseBasicParsing
    Write-Host "❌ FAIL: Should have failed without token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASS: Unauthorized access blocked (401)" -ForegroundColor Green
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL: Unexpected error" -ForegroundColor Red
    }
}

Write-Host "`n----------------------------------------`n"

# Test 7: Update Profile (Protected Route)
if ($token) {
    Write-Host "TEST 7: Update Profile (Protected)" -ForegroundColor Yellow
    Write-Host "PUT $baseUrl/profile" -ForegroundColor Gray
    
    $updateBody = @{
        name = "Updated Test User"
        goals = @{
            stepGoal = 10000
            sleepGoal = 8
        }
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/profile" -Method PUT -Body $updateBody -Headers $headers -ContentType "application/json" -UseBasicParsing
        Write-Host "✅ PASS: Profile updated successfully" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ FAIL: Could not update profile" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n----------------------------------------`n"
}

# Test 8: Change Password (Protected Route)
if ($token) {
    Write-Host "TEST 8: Change Password (Protected)" -ForegroundColor Yellow
    Write-Host "PUT $baseUrl/change-password" -ForegroundColor Gray
    
    $passwordBody = @{
        currentPassword = "SecurePass123!@#"
        newPassword = "NewSecurePass456!@#"
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/change-password" -Method PUT -Body $passwordBody -Headers $headers -ContentType "application/json" -UseBasicParsing
        Write-Host "✅ PASS: Password changed successfully" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ FAIL: Could not change password" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUITE COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
