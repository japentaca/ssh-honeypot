# 🍯 SSH Honeypot

Un honeypot SSH de alta interacción desarrollado en Node.js para detectar y registrar intentos de acceso no autorizado a sistemas SSH.

## 📋 Descripción

Este proyecto implementa un honeypot SSH que simula un servidor SSH real para atraer y registrar actividad maliciosa. El honeypot captura información valiosa sobre atacantes, incluyendo direcciones IP, credenciales utilizadas y comandos ejecutados, sin comprometer la seguridad del sistema real.

## ✨ Características

- **🔐 Autenticación Simulada**: Acepta aleatoriamente conexiones (10% de probabilidad) para estudiar el comportamiento post-autenticación
- **🐚 Shell Interactivo Falso**: Simula un entorno Linux con comandos básicos
- **📊 Estadísticas en Tiempo Real**: Monitoreo de conexiones, intentos de login y credenciales más utilizadas
- **📝 Registro Detallado**: Logs en formato JSON con rotación automática
- **🚦 Rate Limiting**: Protección contra ataques de fuerza bruta excesivos
- **⚡ Alto Rendimiento**: Manejo concurrente de múltiples conexiones
- **🔄 Rotación de Logs**: Rotación automática cuando los logs superan 10MB

## 🚀 Instalación

### Prerrequisitos

- Node.js (v14 o superior)
- npm o yarn

### Pasos de Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/ssh-honeypot.git
cd ssh-honeypot
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el honeypot:
```bash
node index.js
```

El honeypot se iniciará por defecto en el puerto 2222.

## ⚙️ Configuración

Puedes modificar la configuración editando el objeto `CONFIG` en [`index.js`](index.js:10):

```javascript
const CONFIG = {
  PORT: 2222,                    // Puerto del honeypot
  HOST: '0.0.0.0',               // Interfaz de red
  LOG_FILE: 'ssh_honeypot.log',  // Archivo de logs
  MAX_CONNECTIONS: 100,          // Máximo de conexiones simultáneas
  DELAY_MIN: 2000,               // Delay mínimo antes de cerrar (ms)
  DELAY_MAX: 10000,              // Delay máximo antes de cerrar (ms)
  LOG_ROTATION_SIZE: 10485760,   // Tamaño máximo del log (10MB)
  FAKE_SHELL_ENABLED: true,      // Habilitar shell falso
  RATE_LIMIT_WINDOW: 60000,      // Ventana de rate limit (1 min)
  RATE_LIMIT_MAX_ATTEMPTS: 10    // Máximo de intentos por ventana
};
```

## 📊 Estadísticas

El honeypot muestra estadísticas cada 5 minutos con información sobre:

- Tiempo de actividad
- Total de conexiones
- Conexiones activas
- Intentos de login totales
- IPs únicas detectadas
- Usuarios y contraseñas más utilizados

## 📝 Formato de Logs

Los logs se guardan en formato JSON para facilitar su análisis:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "ip": "192.168.1.100",
  "username": "root",
  "password": "admin123",
  "method": "password",
  "clientId": "192.168.1.100:54321",
  "userAgent": "SSH-2.0-OpenSSH_8.0"
}
```

## 🐚 Comandos del Shell Falso

El shell interactivo simula los siguientes comandos:

- `ls` - Lista archivos del directorio
- `pwd` - Muestra el directorio actual
- `whoami` - Muestra el usuario actual
- `id` - Muestra información del usuario
- `uname -a` - Información del sistema
- `cat /etc/passwd` - Muestra archivo de usuarios
- `ps aux` - Lista procesos activos
- `exit` / `logout` - Cierra la conexión

## 🛡️ Seguridad

### Advertencias Importantes

⚠️ **NUNCA ejecutes este honeypot en sistemas de producción**

- Ejecuta el honeypot en un entorno aislado (VM, contenedor, o sistema dedicado)
- Usa un puerto diferente al SSH estándar (22) para evitar conflictos
- Monitorea regularmente los logs para detectar patrones de ataque
- Considera usar un firewall para limitar el acceso si es necesario
- No almacenes información sensible en el mismo sistema

### Mejores Prácticas

1. **Aislamiento de Red**: Ejecuta el honeypot en una DMZ o red segmentada
2. **Monitoreo**: Implementa alertas para actividad sospechosa
3. **Actualizaciones**: Mantén las dependencias actualizadas
4. **Backups**: Realiza copias de seguridad regulares de los logs
5. **Análisis**: Revisa periódicamente los datos recolectados

## 📈 Casos de Uso

- **Investigación de Seguridad**: Estudiar técnicas y patrones de ataque
- **Detección de Amenazas**: Identificar nuevas amenazas y vulnerabilidades
- **Educación**: Aprender sobre seguridad en SSH y técnicas de honeypot
- **Inteligencia de Amenazas**: Recolectar IOCs (Indicadores de Compromiso)
- **Testing de Seguridad**: Evaluar la seguridad de la red

## 🔧 Desarrollo

### Estructura del Proyecto

```
ssh-honeypot/
├── index.js           # Archivo principal del honeypot
├── package.json       # Dependencias y metadatos
├── package-lock.json  # Lock file de dependencias
├── host.key          # Clave privada del host (generada automáticamente)
├── ssh_honeypot.log  # Archivo de logs (generado al ejecutar)
├── .gitignore        # Archivos ignorados por git
└── README.md         # Este archivo
```

### Arquitectura

El honeypot está construido con las siguientes clases principales:

- **`SSHHoneypot`**: Clase principal que gestiona el servidor
- **`HoneypotStats`**: Maneja estadísticas y monitoreo
- **`HoneypotLogger`**: Sistema de logging thread-safe con rotación
- **`FakeShell`**: Simula una shell interactiva de Linux

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia ISC. Ver el archivo [`package.json`](package.json:10) para más detalles.

## ⚠️ Disclaimer

Este software es solo para fines educativos y de investigación. El uso indebido de este software puede violar leyes locales, estatales o federales. Los autores no se hacen responsables del mal uso o daños causados por este programa.

## 📞 Contacto

Para preguntas, sugerencias o reportes de seguridad, por favor abre un issue en el repositorio.

## 🙏 Agradecimientos

- [ssh2](https://github.com/mscdex/ssh2) - Librería SSH2 para Node.js
- Comunidad de seguridad informática por compartir conocimiento

---

**Recuerda**: La seguridad es responsabilidad de todos. Usa este honeypot de manera ética y responsable. 🔒