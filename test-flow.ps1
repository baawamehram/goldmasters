# Test complete flow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "TEST: New User Login" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Step 1: Login new user
$timestamp = Get-Date -Format 'HHmmss'
$testName = "Test User $timestamp"
$testPhone = "91$(Get-Random -Minimum 1000000000 -Maximum 9999999999)"

$loginBody = @{
    name = $testName
    phone = $testPhone
    isAdult = $true
} | ConvertTo-Json

Write-Host "`n[1] Logging in new user..." -ForegroundColor Yellow
Write-Host "    Name: $testName" -ForegroundColor White
Write-Host "    Phone: $testPhone" -ForegroundColor White

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/participants/login" -Method POST -ContentType "application/json" -Body $loginBody

Write-Host "    Success! User ID: $($loginResponse.data.participant.id)" -ForegroundColor Green

# Step 2: Check file
Write-Host "`n[2] Checking shared data file..." -ForegroundColor Yellow
$entries = Get-Content "C:\Users\user\Desktop\wishmasters\.data\user-entries.json" | ConvertFrom-Json
$newUser = $entries | Where-Object { $_.phone -eq $testPhone }

if ($newUser) {
    Write-Host "    Success! User found in file" -ForegroundColor Green
    Write-Host "    Name: $($newUser.name)" -ForegroundColor White
} else {
    Write-Host "    ERROR: User NOT found in file" -ForegroundColor Red
}

Write-Host "`n[3] Waiting 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`nDone! Check http://localhost:3000/admin/entries" -ForegroundColor Cyan
