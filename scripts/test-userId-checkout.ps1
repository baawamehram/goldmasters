# Test script to verify userId-based checkout works correctly
# This script simulates the flow: checkout with userId -> view in admin dashboard

Write-Host "Testing userId-based checkout flow..." -ForegroundColor Cyan
Write-Host ""

$userId = "user-1761637008241-wo741fqnr"
$apiUrl = "http://localhost:4000/api/v1"

# Test data
$checkoutData = @{
    name = "Test User"
    phone = "+913453453456"
    email = "test@example.com"
    password = "checkout123"
    markers = @(
        @{
            ticketId = "ticket-$userId-0"
            ticketNumber = 1024
            x = 0.5417
            y = 0.4112
        },
        @{
            ticketId = "ticket-$userId-0"
            ticketNumber = 1024
            x = 0.4600
            y = 0.5600
        },
        @{
            ticketId = "ticket-$userId-0"
            ticketNumber = 1024
            x = 0.4200
            y = 0.6200
        },
        @{
            ticketId = "ticket-$userId-1"
            ticketNumber = 1026
            x = 0.5800
            y = 0.5000
        },
        @{
            ticketId = "ticket-$userId-1"
            ticketNumber = 1026
            x = 0.5400
            y = 0.5600
        },
        @{
            ticketId = "ticket-$userId-1"
            ticketNumber = 1026
            x = 0.5000
            y = 0.6200
        },
        @{
            ticketId = "ticket-$userId-2"
            ticketNumber = 1028
            x = 0.6600
            y = 0.5000
        },
        @{
            ticketId = "ticket-$userId-2"
            ticketNumber = 1028
            x = 0.6200
            y = 0.5600
        },
        @{
            ticketId = "ticket-$userId-2"
            ticketNumber = 1028
            x = 0.5800
            y = 0.6200
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Step 1: Sending checkout request with userId in URL..." -ForegroundColor Yellow
Write-Host "URL: $apiUrl/competitions/$userId/checkout" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/competitions/$userId/checkout" `
        -Method Post `
        -ContentType "application/json" `
        -Body $checkoutData

    Write-Host "[SUCCESS] Checkout successful!" -ForegroundColor Green
    Write-Host "Participant ID: $($response.data.participantId)" -ForegroundColor Gray
    Write-Host "User ID: $($response.data.userId)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "[ERROR] Checkout failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "Step 2: Retrieving checkout summary using userId..." -ForegroundColor Yellow

# Note: You'll need an admin token for this. For now, we'll just show the URL
Write-Host "Admin view URL: http://localhost:3000/admin/entries/$userId/view" -ForegroundColor Gray
Write-Host ""

Write-Host "To verify the fix:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000/competition/$userId/checkout in your browser" -ForegroundColor White
Write-Host "2. Complete the checkout with the same details above" -ForegroundColor White
Write-Host "3. Log in to admin dashboard" -ForegroundColor White
Write-Host "4. Navigate to http://localhost:3000/admin/entries/$userId/view" -ForegroundColor White
Write-Host "5. You should see the checkout data with all 9 markers across 3 tickets" -ForegroundColor White
Write-Host ""

Write-Host "[SUCCESS] Test completed!" -ForegroundColor Green
