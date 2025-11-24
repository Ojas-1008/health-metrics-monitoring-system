# Simple PayloadMonitor Test
Write-Host "`n=== PAYLOADMONITOR.JS TEST ===" -ForegroundColor Cyan

# Login
Write-Host "Logging in..." -ForegroundColor Yellow
$loginBody = '{"email":"ojasshrivastava1008@gmail.com","password":"Krishna@1008"}'
$loginResponse = curl.exe -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d $loginBody | ConvertFrom-Json

if ($loginResponse.success) {
    $token = $loginResponse.token
    Write-Host "Login SUCCESS" -ForegroundColor Green
    
    # Trigger events
    Write-Host "`nTriggering SSE events..." -ForegroundColor Yellow
    
    # Event 1: Add metrics
    $metrics1 = '{"date":"2025-11-23","metrics":{"steps":8500,"calories":2100}}'
    curl.exe -s -X POST http://localhost:5000/api/metrics -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $metrics1 | Out-Null
    Write-Host "Event 1: Metrics added" -ForegroundColor Cyan
    Start-Sleep -Milliseconds 300
    
    # Event 2: Update metrics
    $metrics2 = '{"date":"2025-11-23","metrics":{"steps":10000}}'
    curl.exe -s -X POST http://localhost:5000/api/metrics -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $metrics2 | Out-Null
    Write-Host "Event 2: Metrics updated" -ForegroundColor Cyan
    Start-Sleep -Milliseconds 300
    
    # Event 3: Update profile
    $profile = '{"name":"Ojas Shrivastava"}'
    curl.exe -s -X PUT http://localhost:5000/api/auth/profile -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $profile | Out-Null
    Write-Host "Event 3: Profile updated" -ForegroundColor Cyan
    Start-Sleep -Milliseconds 300
    
    # Event 4-13: Rapid events
    Write-Host "Triggering 10 rapid events..." -ForegroundColor Cyan
    for ($i = 1; $i -le 10; $i++) {
        $rapid = "{`"date`":`"2025-11-23`",`"metrics`":{`"steps`":$($8000 + $i * 100)}}"
        curl.exe -s -X POST http://localhost:5000/api/metrics -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d $rapid | Out-Null
        Start-Sleep -Milliseconds 100
    }
    Write-Host "10 rapid events sent" -ForegroundColor Green
    
    Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
    Write-Host "Total events triggered: 13+" -ForegroundColor Green
    Write-Host "`nCheck server terminal for:" -ForegroundColor Yellow
    Write-Host "  - [PayloadMonitor] statistics" -ForegroundColor Gray
    Write-Host "  - Payload size measurements" -ForegroundColor Gray
    Write-Host "  - Large payload warnings" -ForegroundColor Gray
    
} else {
    Write-Host "Login FAILED: $($loginResponse.message)" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETE ===`n" -ForegroundColor Cyan
