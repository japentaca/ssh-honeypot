Write-Host "=== SSH Honeypot Test Script ===" -ForegroundColor Cyan
Write-Host ""

$hostname = "localhost"
$port = 2222

Write-Host "Testing SSH connection to ${hostname}:${port}" -ForegroundColor Yellow
Write-Host ""

Write-Host "--- Test 1: Port connectivity check ---" -ForegroundColor Magenta
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($hostname, $port)
    Write-Host "Port $port is OPEN and accepting connections" -ForegroundColor Green
    $tcpClient.Close()
} catch {
    Write-Host "Port $port is CLOSED or not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "--- Test 2: SSH banner check ---" -ForegroundColor Magenta

try {
    $socket = New-Object System.Net.Sockets.TcpClient($hostname, $port)
    $stream = $socket.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    $banner = $reader.ReadLine()
    Write-Host "SSH Banner received: $banner" -ForegroundColor Green
    
    $socket.Close()
} catch {
    Write-Host "Error reading banner: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "SSH server is running on port $port" -ForegroundColor Green
Write-Host "Server banner: $banner" -ForegroundColor Green
Write-Host "Ready to accept connections" -ForegroundColor Green
Write-Host ""

Write-Host "=== Manual Connection Test ===" -ForegroundColor Cyan
Write-Host "Run this command to connect:" -ForegroundColor Yellow
Write-Host "  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $port admin@$hostname" -ForegroundColor White
Write-Host ""
Write-Host "Test credentials:" -ForegroundColor Yellow
Write-Host "  - admin:admin" -ForegroundColor White
Write-Host "  - root:password" -ForegroundColor White
Write-Host "  - test:test" -ForegroundColor White
Write-Host ""
