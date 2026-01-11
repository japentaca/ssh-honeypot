# SSH Honeypot - Resultados de Pruebas

## Fecha: 2026-01-11

## Estado del Servidor

✅ **FUNCIONANDO** - El servidor SSH honeypot está operativo en el puerto 2222

## Pruebas Realizadas

### 1. Verificación de Puerto
```powershell
netstat -an | Select-String "2222"
```
**Resultado**: ✅ Puerto 2222 LISTENING en 0.0.0.0

### 2. Verificación de Banner SSH
**Comando**: Conexión TCP al puerto 2222
**Resultado**: ✅ Banner recibido: `SSH-2.0-ssh2js1.17.0`

### 3. Pruebas de Conexión SSH
**Comando**:
```bash
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 admin@localhost
```

**Credenciales Configuradas**:
- admin:admin
- root:password
- test:test

**Resultado**: El servidor acepta conexiones y solicita contraseña

## Configuración Actual

### Archivo .env
```
SSH_HONEYPOT_PORT=2222
SSH_HONEYPOT_HOST=0.0.0.0
SSH_HONEYPOT_ALLOWED_CREDENTIALS=admin:admin,root:password,test:test
```

### Configuración de Shell Falso
- **Habilitado**: Sí
- **Tasa de Éxito**: 10% (para credenciales no permitidas)
- **Credenciales Permitidas**: 100% de éxito (admin:admin, root:password, test:test)

## Correcciones Aplicadas

### Bug Corregido en config.js
**Línea 96**: Cambiado `FAKE_SHELL_SUCCESS_RATE` de 0.9 a 0.1
```javascript
// Antes:
FAKE_SHELL_SUCCESS_RATE: getEnvFloat('SSH_HONEYPOT_FAKE_SHELL_SUCCESS_RATE', 0.9),

// Después:
FAKE_SHELL_SUCCESS_RATE: getEnvFloat('SSH_HONEYPOT_FAKE_SHELL_SUCCESS_RATE', 0.1),
```

## Instrucciones de Prueba Manual

### Prueba Básica de Conectividad
```powershell
# Ejecutar el script de prueba
powershell -ExecutionPolicy Bypass -File test_ssh_simple.ps1
```

### Prueba de Conexión Interactiva
```bash
# 1. Conectarse al honeypot
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p 2222 admin@localhost

# 2. Ingresar contraseña cuando se solicite
Password: admin

# 3. Una vez conectado, probar comandos:
whoami
pwd
ls
uname -a
cat /etc/passwd
ps aux
exit
```

### Verificar Logs
```powershell
# Ver los últimos 10 intentos de conexión
Get-Content ssh_honeypot.log | Select-Object -Last 10 | ForEach-Object { ConvertFrom-Json $_ | Format-List }
```

## Características del Honeypot

### Comandos Simulados
El shell falso simula los siguientes comandos:
- `ls` - Lista archivos
- `pwd` - Directorio actual
- `whoami` - Usuario actual (root)
- `id` - Información del usuario
- `uname -a` - Información del sistema
- `cat /etc/passwd` - Archivo de usuarios
- `ps aux` - Procesos activos
- `hostname` - Nombre del host
- `exit` / `logout` - Cerrar sesión

### Información Registrada
Para cada intento de conexión, el honeypot registra:
- Timestamp
- IP del cliente
- Usuario intentado
- Contraseña intentada
- Método de autenticación
- User-Agent del cliente SSH

## Estadísticas

El honeypot muestra estadísticas cada 5 minutos con:
- Tiempo de actividad
- Total de conexiones
- Conexiones activas
- Intentos de login
- IPs únicas
- Top 5 usuarios más utilizados
- Top 5 contraseñas más utilizadas

## Próximos Pasos Recomendados

1. ✅ Verificar que nodemon haya reiniciado el servidor con la configuración corregida
2. 🔄 Realizar pruebas de conexión con las credenciales permitidas
3. 📊 Monitorear los logs para verificar el comportamiento
4. 🔍 Analizar la tasa de éxito de autenticación

## Notas de Seguridad

⚠️ **IMPORTANTE**: Este honeypot es solo para fines educativos y de investigación
- Ejecutar solo en entornos aislados
- No usar en sistemas de producción
- Monitorear regularmente los logs
- Mantener las dependencias actualizadas
