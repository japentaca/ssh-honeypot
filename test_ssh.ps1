# Script simple para probar la conectividad al honeypot SSH
# Verifica que el puerto este abierto y responda

$host_ip = "localhost"
$port = 2222
$total_tests = 5

Write-Host "Probando conectividad al honeypot SSH en $host_ip`:$port" -ForegroundColor Green
Write-Host ""

# Probar conectividad basica al puerto
for ($i = 1; $i -le $total_tests; $i++) {
    Write-Host "Prueba $i/$total_tests - " -NoNewline
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ReceiveTimeout = 3000
        $tcpClient.SendTimeout = 3000
        
        $tcpClient.Connect($host_ip, $port)
        
        if ($tcpClient.Connected) {
            Write-Host "CONECTADO" -ForegroundColor Green
            
            # Leer el banner SSH
            $stream = $tcpClient.GetStream()
            $buffer = New-Object byte[] 1024
            $bytesRead = $stream.Read($buffer, 0, 1024)
            $banner = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
            Write-Host "  Banner: $($banner.Trim())" -ForegroundColor Cyan
        } else {
            Write-Host "FALLO DE CONEXION" -ForegroundColor Red
        }
        
        $tcpClient.Close()
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 1000
}

Write-Host ""
Write-Host "Para probar autenticacion SSH manualmente, usa:" -ForegroundColor Yellow
Write-Host "ssh admin@localhost -p 2222" -ForegroundColor White
Write-Host "Password: admin" -ForegroundColor White
Write-Host ""
Write-Host "Otras credenciales disponibles:" -ForegroundColor Yellow
Write-Host "- root:password" -ForegroundColor White
Write-Host "- test:test" -ForegroundColor White