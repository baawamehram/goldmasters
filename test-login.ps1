# Test login API
$body = @{
    name = "Test User $(Get-Date -Format 'HHmmss')"
    phone = "91$(Get-Random -Minimum 1000000000 -Maximum 9999999999)"
    isAdult = $true
} | ConvertTo-Json

Write-Host "Testing login with:" -ForegroundColor Cyan
Write-Host $body

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/participants/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "`nLogin Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5

Write-Host "`nWaiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "`nChecking user entries file..." -ForegroundColor Cyan
$entries = Get-Content "C:\Users\user\Desktop\wishmasters\.data\user-entries.json" | ConvertFrom-Json
Write-Host "Total entries: $($entries.Count)" -ForegroundColor Green
$lastEntry = $entries[-1]
Write-Host "Last entry: $($lastEntry.name) - $($lastEntry.phone)" -ForegroundColor Green
