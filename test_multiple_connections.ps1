Write-Host "=== SSH Honeypot Multiple Connection Test ===" -ForegroundColor Cyan
Write-Host ""

$hostname = "localhost"
$port = 2222
$username = "admin"
$password = "admin"
$maxAttempts = 20

Write-Host "This script will attempt to connect $maxAttempts times" -ForegroundColor Yellow
Write-Host "Expected success rate: ~10% (based on FAKE_SHELL_SUCCESS_RATE)" -ForegroundColor Yellow
Write-Host "Allowed credentials should have 100% success rate" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failureCount = 0

for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host "Attempt $i of $maxAttempts..." -NoNewline
    
    # Create a temporary expect-like script using PowerShell
    $result = & {
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = "ssh"
        $pinfo.Arguments = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -p $port ${username}@${hostname} whoami"
        $pinfo.UseShellExecute = $false
        $pinfo.RedirectStandardInput = $true
        $pinfo.RedirectStandardOutput = $true
        $pinfo.RedirectStandardError = $true
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $pinfo
        $process.Start() | Out-Null
        
        # Send password
        Start-Sleep -Milliseconds 500
        $process.StandardInput.WriteLine($password)
        $process.StandardInput.Close()
        
        # Wait for completion with timeout
        $timeout = 10000 # 10 seconds
        if ($process.WaitForExit($timeout)) {
            $output = $process.StandardOutput.ReadToEnd()
            $error = $process.StandardError.ReadToEnd()
            $exitCode = $process.ExitCode
            
            return @{
                ExitCode = $exitCode
                Output = $output
                Error = $error
            }
        } else {
            $process.Kill()
            return @{
                ExitCode = -1
                Output = ""
                Error = "Timeout"
            }
        }
    }
    
    if ($result.ExitCode -eq 0 -and $result.Output -match "root") {
        Write-Host " SUCCESS!" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        $failureCount++
    }
    
    # Small delay between attempts
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Total attempts: $maxAttempts" -ForegroundColor White
Write-Host "Successful: $successCount ($([math]::Round($successCount/$maxAttempts*100, 2))%)" -ForegroundColor Green
Write-Host "Failed: $failureCount ($([math]::Round($failureCount/$maxAttempts*100, 2))%)" -ForegroundColor Red
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "The honeypot is working correctly!" -ForegroundColor Green
    Write-Host "Allowed credentials (admin:admin) should always succeed." -ForegroundColor Yellow
} else {
    Write-Host "No successful connections. This might indicate an issue." -ForegroundColor Yellow
    Write-Host "Check that the .env file has SSH_HONEYPOT_ALLOWED_CREDENTIALS configured." -ForegroundColor Yellow
}
