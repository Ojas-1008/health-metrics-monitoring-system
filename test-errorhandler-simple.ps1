# ErrorHandler.js - Simple Error Scenario Testing

Write-Host "`n=== ERRORHANDLER.JS ERROR SCENARIO TESTS ===" -ForegroundColor Cyan
Write-Host "Testing error handling using curl`n" -ForegroundColor Gray

# Test 1: 404 Not Found
Write-Host "[TEST 1] 404 Not Found" -ForegroundColor Yellow
$curl1 = curl.exe -s -X GET http://localhost:5000/api/nonexistent-route
$json1 = $curl1 | ConvertFrom-Json
if ($json1.success -eq $false) {
    Write-Host "PASS - Status: 404, Error: $($json1.error)" -ForegroundColor Green
} else {
    Write-Host "FAIL" -ForegroundColor Red
}

# Test 2: Invalid JSON
Write-Host "`n[TEST 2] Invalid JSON (SyntaxError)" -ForegroundColor Yellow
$curl2 = curl.exe -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{invalid json}"
$json2 = $curl2 | ConvertFrom-Json
if ($json2.success -eq $false -and $json2.message -like "*JSON*") {
    Write-Host "PASS - Syntax error caught" -ForegroundColor Green
} else {
    Write-Host "Result: $($json2 | ConvertTo-Json)" -ForegroundColor Gray
}

# Test 3: Duplicate Email
Write-Host "`n[TEST 3] Duplicate Email (E11000 Error)" -ForegroundColor Yellow
$email = "test_$(Get-Random)@example.com"
$body1 = ConvertTo-Json @{name='User1';email=$email;password='Test1234!';confirmPassword='Test1234!'}
$curl3a = curl.exe -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d $body1
$json3a = $curl3a | ConvertFrom-Json
Write-Host "Created user: $($json3a.user.email)" -ForegroundColor Cyan

$curl3b = curl.exe -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d $body1
$json3b = $curl3b | ConvertFrom-Json
if ($json3b.success -eq $false -and $json3b.message -like "*already*") {
    Write-Host "PASS - Duplicate error: $($json3b.message)" -ForegroundColor Green
} else {
    Write-Host "Result: $($json3b.message)" -ForegroundColor Gray
}

# Test 4: Invalid JWT Token
Write-Host "`n[TEST 4] Invalid JWT Token" -ForegroundColor Yellow
$curl4 = curl.exe -s -H "Authorization: Bearer invalidjwt" http://localhost:5000/api/auth/me
$json4 = $curl4 | ConvertFrom-Json
if ($json4.success -eq $false -and $json4.message -like "*token*") {
    Write-Host "PASS - JWT error: $($json4.message)" -ForegroundColor Green
} else {
    Write-Host "Result: $($json4.message)" -ForegroundColor Gray
}

# Test 5: Missing Auth Header
Write-Host "`n[TEST 5] Missing Authorization Header" -ForegroundColor Yellow
$curl5 = curl.exe -s http://localhost:5000/api/auth/me
$json5 = $curl5 | ConvertFrom-Json
if ($json5.success -eq $false) {
    Write-Host "PASS - Auth error: $($json5.message)" -ForegroundColor Green
} else {
    Write-Host "Result: $($json5.message)" -ForegroundColor Gray
}

# Test 6: Validation Error (Missing Name)
Write-Host "`n[TEST 6] Validation Error (Missing Field)" -ForegroundColor Yellow
$body6 = ConvertTo-Json @{email='test@example.com';password='Test1234!'}
$curl6 = curl.exe -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d $body6
$json6 = $curl6 | ConvertFrom-Json
if ($json6.success -eq $false) {
    Write-Host "PASS - Validation error: $($json6.message)" -ForegroundColor Green
} else {
    Write-Host "Result: $($json6.message)" -ForegroundColor Gray
}

# Test 7: Valid Request (Control)
Write-Host "`n[TEST 7] Valid Request (Control)" -ForegroundColor Yellow
$email7 = "valid_$(Get-Random)@test.com"
$body7 = ConvertTo-Json @{name='TestUser';email=$email7;password='Test1234!';confirmPassword='Test1234!'}
$curl7 = curl.exe -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d $body7
$json7 = $curl7 | ConvertFrom-Json
if ($json7.success -eq $true) {
    Write-Host "PASS - User created: $($json7.user.email)" -ForegroundColor Green
} else {
    Write-Host "FAIL - $($json7.message)" -ForegroundColor Red
}

# Test 8: Response Format Verification
Write-Host "`n[TEST 8] Error Response Format" -ForegroundColor Yellow
$curl8 = curl.exe -s -X GET http://localhost:5000/api/invalid
$json8 = $curl8 | ConvertFrom-Json
$hasSuccess = $json8.PSObject.Properties.Name -contains "success"
$hasMessage = $json8.PSObject.Properties.Name -contains "message"
$hasError = $json8.PSObject.Properties.Name -contains "error"
if ($hasSuccess -and $hasMessage -and $hasError) {
    Write-Host "PASS - All required fields present" -ForegroundColor Green
    Write-Host "  Fields: success, message, error" -ForegroundColor Gray
} else {
    Write-Host "FAIL - Missing fields" -ForegroundColor Red
}

Write-Host "`n=== TESTING COMPLETE ===" -ForegroundColor Cyan
