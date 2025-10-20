# Health Metrics API - Auth Testing
Write-Host "Testing Authentication Endpoints" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/auth"

# Test 1: Register
Write-Host "Test 1: Register User" -ForegroundColor Yellow
$registerBody = @{
    name = "John Doe"
    email = "john@example.com"
    password = "Test1234!"
    confirmPassword = "Test1234!"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $registerBody
    Write-Host "SUCCESS: Registration passed" -ForegroundColor Green
    $registerResponse | ConvertTo-Json -Depth 10
    $token = $registerResponse.token
    
    # Test 2: Login
    Write-Host ""
    Write-Host "Test 2: Login User" -ForegroundColor Yellow
    $loginBody = @{
        email = "john@example.com"
        password = "Test1234!"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    Write-Host "SUCCESS: Login passed" -ForegroundColor Green
    $loginResponse | ConvertTo-Json -Depth 10
    
    # Test 3: Get Current User
    Write-Host ""
    Write-Host "Test 3: Get Current User" -ForegroundColor Yellow
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/me" -Method GET -Headers @{"Authorization"="Bearer $token"}
    Write-Host "SUCCESS: Get current user passed" -ForegroundColor Green
    $meResponse | ConvertTo-Json -Depth 10
    
    # Test 4: Update Profile
    Write-Host ""
    Write-Host "Test 4: Update Profile" -ForegroundColor Yellow
    $updateBody = @{
        name = "John Updated"
        goals = @{
            stepGoal = 12000
        }
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/profile" -Method PUT -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $updateBody
    Write-Host "SUCCESS: Profile update passed" -ForegroundColor Green
    $updateResponse | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message
    }
}
