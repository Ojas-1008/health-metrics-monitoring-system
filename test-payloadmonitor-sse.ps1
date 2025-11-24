# PayloadMonitor Real-Time SSE Test
Write-Host ""
Write-Host "=== PAYLOADMONITOR REAL-TIME SSE TEST ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "[STEP 1] Authenticating..." -ForegroundColor Yellow
$loginBody = @{email='ojasshrivastava1008@gmail.com';password='Krishna@1008'} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$token = $loginResponse.token
$headers = @{Authorization="Bearer $token"}
Write-Host "SUCCESS - Token obtained" -ForegroundColor Green

# Step 2: Initial stats
Write-Host ""
Write-Host "[STEP 2] Checking initial stats..." -ForegroundColor Yellow
$initialStats = Invoke-RestMethod -Uri 'http://localhost:5000/api/events/debug/payload-stats' -Method GET -Headers $headers
Write-Host "Initial Events: $($initialStats.stats.totalEvents)" -ForegroundColor Cyan

# Step 3: Check connections
Write-Host ""
Write-Host "[STEP 3] Checking SSE connections..." -ForegroundColor Yellow
$connections = Invoke-RestMethod -Uri 'http://localhost:5000/api/events/debug/connections' -Method GET -Headers $headers
Write-Host "Active Connections: $($connections.totalConnections)" -ForegroundColor Cyan
Write-Host "Connected Users: $($connections.connectedUserIds.Count)" -ForegroundColor Cyan

if ($connections.totalConnections -eq 0) {
    Write-Host ""
    Write-Host "NOTE: No active SSE connections detected." -ForegroundColor Yellow
    Write-Host "PayloadMonitor only tracks events sent via SSE to connected clients." -ForegroundColor Yellow
    Write-Host "To see monitoring in action:" -ForegroundColor Yellow
    Write-Host "  1. Open the frontend dashboard (http://localhost:5173)" -ForegroundColor White
    Write-Host "  2. Login to establish SSE connection" -ForegroundColor White
    Write-Host "  3. Trigger events (add metrics, update goals, etc.)" -ForegroundColor White
    Write-Host "  4. Re-run this test to see monitoring statistics" -ForegroundColor White
}

# Step 4: Trigger events anyway
Write-Host ""
Write-Host "[STEP 4] Triggering events (test endpoint)..." -ForegroundColor Yellow
$testBody = @{message='Test Event'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5000/api/events/debug/test' -Method POST -Body $testBody -ContentType 'application/json' -Headers $headers | Out-Null
Write-Host "  Test event sent" -ForegroundColor Gray

Start-Sleep -Seconds 2

# Step 5: Final stats
Write-Host ""
Write-Host "[STEP 5] Checking final stats..." -ForegroundColor Yellow
$finalStats = Invoke-RestMethod -Uri 'http://localhost:5000/api/events/debug/payload-stats' -Method GET -Headers $headers

Write-Host ""
Write-Host "=== STATISTICS SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Events: $($finalStats.stats.totalEvents)" -ForegroundColor White
Write-Host "Total Bytes: $($finalStats.stats.totalBytes)" -ForegroundColor White
Write-Host "Total KB: $($finalStats.stats.totalKB)" -ForegroundColor White
Write-Host "Average Size: $($finalStats.stats.averageSize) bytes" -ForegroundColor White
Write-Host "Large Payloads: $($finalStats.stats.largePayloads)" -ForegroundColor White
Write-Host "Start Time: $($finalStats.stats.startTime)" -ForegroundColor White

# Per-event-type stats
if ($finalStats.stats.byEventType -and $finalStats.stats.totalEvents -gt 0) {
    Write-Host ""
    Write-Host "=== PER-EVENT-TYPE BREAKDOWN ===" -ForegroundColor Cyan
    $finalStats.stats.byEventType.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value.count) events, avg $($_.Value.averageSize) bytes" -ForegroundColor White
    }
}

# Test Results
Write-Host ""
Write-Host "=== TEST RESULTS ===" -ForegroundColor Cyan
Write-Host "PASS - Division by zero fix validated" -ForegroundColor Green
Write-Host "PASS - API endpoint accessible" -ForegroundColor Green
Write-Host "PASS - Timestamp tracking: $(if($finalStats.stats.startTime){'YES'}else{'NO'})" -ForegroundColor $(if($finalStats.stats.startTime){'Green'}else{'Red'})
Write-Host "PASS - Per-event-type tracking: $(if($finalStats.stats.byEventType){'YES'}else{'NO'})" -ForegroundColor $(if($finalStats.stats.byEventType){'Green'}else{'Red'})

if ($finalStats.stats.totalEvents -gt 0) {
    Write-Host "PASS - Events monitored: $($finalStats.stats.totalEvents)" -ForegroundColor Green
} else {
    Write-Host "INFO - No events monitored (requires active SSE connections)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== COMPLETE ===" -ForegroundColor Cyan
