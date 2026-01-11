# Script de prueba para el SSH Honeypot
# Este script intenta conectarse al honeypot y ejecutar comandos

Write-Host "=== SSH Honeypot Test Script ===" -ForegroundColor Cyan
Write-Host ""

# Configuración
$hostname = "localhost"
$port = 2222
$username = "admin"
$password = "admin"

Write-Host "Testing SSH connection to ${hostname}:${port}" -ForegroundColor Yellow
Write-Host "Username: $username" -ForegroundColor Yellow
Write-Host ""

# Crear un archivo temporal con la contraseña
$passwordFile = [System.IO.Path]::GetTempFileName()
$password | Out-File -FilePath $passwordFile -Encoding ASCII -NoNewline

try {
    Write-Host "Attempting SSH connection..." -ForegroundColor Green
    
    # Intentar conexión SSH usando diferentes métodos
    Write-Host "`n--- Test 1: Basic SSH connection ---" -ForegroundColor Magenta
    
    # Usar ssh con opciones de no verificación de host
    $sshCommand = "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $port ${username}@${hostname}"
    
    Write-Host "Command: $sshCommand" -ForegroundColor Gray
    Write-Host "Note: You will need to enter password manually: $password" -ForegroundColor Yellow
    Write-Host ""
    
    # Mostrar información sobre cómo probar manualmente
    Write-Host "=== Manual Test Instructions ===" -ForegroundColor Cyan
    Write-Host "1. Run: $sshCommand" -ForegroundColor White
    Write-Host "2. Enter password when prompted: $password" -ForegroundColor White
    Write-Host "3. Once connected, try these commands:" -ForegroundColor White
    Write-Host "   - whoami" -ForegroundColor Gray
    Write-Host "   - pwd" -ForegroundColor Gray
    Write-Host "   - ls" -ForegroundColor Gray
    Write-Host "   - uname -a" -ForegroundColor Gray
    Write-Host "   - exit" -ForegroundColor Gray
    Write-Host ""
    
    # Intentar una conexión simple para verificar que el puerto está abierto
    Write-Host "--- Test 2: Port connectivity check ---" -ForegroundColor Magenta
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    try {
        $tcpClient.Connect($hostname, $port)
        Write-Host "✓ Port $port is OPEN and accepting connections" -ForegroundColor Green
        $tcpClient.Close()
    } catch {
        Write-Host "✗ Port $port is CLOSED or not responding" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "--- Test 3: SSH banner check ---" -ForegroundColor Magenta
    
    # Intentar obtener el banner SSH
    $socket = New-Object System.Net.Sockets.TcpClient($hostname, $port)
    $stream = $socket.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    $banner = $reader.ReadLine()
    Write-Host "SSH Banner received: $banner" -ForegroundColor Green
    
    $socket.Close()
    
    Write-Host ""
    Write-Host "=== Test Summary ===" -ForegroundColor Cyan
    Write-Host "✓ SSH server is running on port $port" -ForegroundColor Green
    Write-Host "✓ Server banner: $banner" -ForegroundColor Green
    Write-Host "✓ Ready to accept connections" -ForegroundColor Green
    Write-Host ""
    Write-Host "To test authentication, run the manual test command above." -ForegroundColor Yellow
} catch {
    Write-Host "Error during testing: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpiar archivo temporal
    if (Test-Path $passwordFile) {
        Remove-Item $passwordFile -Force
    }
}

Write-Host ""
Write-Host "=== Additional Test Credentials ===" -ForegroundColor Cyan
Write-Host "Try these credential combinations:" -ForegroundColor Yellow
Write-Host "  - admin:admin" -ForegroundColor White
Write-Host "  - root:password" -ForegroundColor White
Write-Host "  - test:test" -ForegroundColor White
Write-Host ""