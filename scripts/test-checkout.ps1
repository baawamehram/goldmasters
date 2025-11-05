param(
  [string]$Token
)

$server = Start-Process -FilePath 'node' -ArgumentList 'apps/api/dist/index.js' -PassThru
try {
  Start-Sleep -Seconds 2

  $body = @{ 
    competition = @{ 
      id = '1'
      title = 'Sample'
      imageUrl = ''
      pricePerTicket = 500
      markersPerTicket = 3
      status = 'ACTIVE'
    }
    participant = @{ 
      id = 'participant-foo'
      name = 'Test User'
      phone = '1234567890'
      ticketsPurchased = 1
    }
    tickets = @(
      @{ 
        ticketNumber = 101
        markers = @(
          @{ id = 'm1'; x = 0.1; y = 0.2; label = 'A' }
          @{ id = 'm2'; x = 0.3; y = 0.4; label = 'B' }
          @{ id = 'm3'; x = 0.5; y = 0.6; label = 'C' }
        )
      }
    )
    totalMarkers = 3
    checkoutTime = (Get-Date).ToString('o')
  } | ConvertTo-Json -Depth 5

  $headers = @{
    'Content-Type' = 'application/json'
    Authorization  = "Bearer $Token"
  }

  $response = Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/competitions/1/checkout-summary' -Method Post -Headers $headers -Body $body -ErrorAction Stop
  Write-Output $response.StatusCode
  Write-Output $response.Content
}
finally {
  if ($server -and !$server.HasExited) {
    Stop-Process -Id $server.Id
  }
}
