# Test admin entries API
# First, login as admin
$adminLoginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Logging in as admin..." -ForegroundColor Cyan
$adminResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/admin/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $adminLoginBody

$adminToken = $adminResponse.data.token
Write-Host "Admin token obtained" -ForegroundColor Green

# Now fetch participants
Write-Host "`nFetching participants..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $adminToken"
}

$participants = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/admin/participants" `
    -Method GET `
    -Headers $headers

Write-Host "Total participants from API: $($participants.data.Count)" -ForegroundColor Green
Write-Host "`nLast 3 participants:" -ForegroundColor Yellow
$participants.data | Select-Object -Last 3 | ForEach-Object {
    Write-Host "  - $($_.name) ($($_.phone)) - ID: $($_.id)" -ForegroundColor White
}
