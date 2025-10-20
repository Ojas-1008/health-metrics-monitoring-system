# Health Metrics API - Authentication Testing Script
# Run this script to test all auth endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING AUTHENTICATION ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/auth"

# Test 1: User Registration
Write-Host "Test 1: User Registration" -ForegroundColor Yellow
Write-Host "POST $baseUrl/register" -ForegroundColor Gray
Write-Host ""

try {
    $registerBody = @{
        name = "John Doe"
        email = "john@example.com"
        password = "Test1234!"
        confirmPassword = "Test1234!"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/register" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $registerBody `
        -ErrorAction Stop

    Write-Host "✅ Registration Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $registerResponse | ConvertTo-Json -Depth 10
    Write-Host "`n"

    # Save token for subsequent requests
    $token = $registerResponse.token
    $userId = $registerResponse.user.id

    # Test 2: User Login
    Write-Host "`nTest 2: User Login" -ForegroundColor Yellow
    Write-Host "POST $baseUrl/login`n" -ForegroundColor Gray

    $loginBody = @{
        email = "john@example.com"
        password = "Test1234!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody `
        -ErrorAction Stop

    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $loginResponse | ConvertTo-Json -Depth 10
    Write-Host "`n"

    # Test 3: Get Current User (Protected Route)
    Write-Host "`nTest 3: Get Current User (Protected)" -ForegroundColor Yellow
    Write-Host "GET $baseUrl/me`n" -ForegroundColor Gray

    $meResponse = Invoke-RestMethod -Uri "$baseUrl/me" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
        } `
        -ErrorAction Stop

    Write-Host "✅ Get Current User Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $meResponse | ConvertTo-Json -Depth 10
    Write-Host "`n"

    # Test 4: Update Profile (Protected Route)
    Write-Host "`nTest 4: Update Profile (Protected)" -ForegroundColor Yellow
    Write-Host "PUT $baseUrl/profile`n" -ForegroundColor Gray

    $updateBody = @{
        name = "John Updated Doe"
        goals = @{
            stepGoal = 12000
            sleepGoal = 8.5
            calorieGoal = 2200
        }
    } | ConvertTo-Json

    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/profile" `
        -Method PUT `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $updateBody `
        -ErrorAction Stop

    Write-Host "✅ Profile Update Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $updateResponse | ConvertTo-Json -Depth 10
    Write-Host "`n"

    # Test 5: Logout (Protected Route)
    Write-Host "`nTest 5: Logout (Protected)" -ForegroundColor Yellow
    Write-Host "POST $baseUrl/logout`n" -ForegroundColor Gray

    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/logout" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
        } `
        -ErrorAction Stop

    Write-Host "✅ Logout Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $logoutResponse | ConvertTo-Json -Depth 10
    Write-Host "`n"

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nServer Response:" -ForegroundColor Red
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}

Write-Host ""
Write-Host "📝 Note: If registration fails with 'Email already exists', the user is already in the database." -ForegroundColor Cyan
Write-Host "To clean up, delete the user from MongoDB Compass or mongosh" -ForegroundColor Cyan
Write-Host ""
