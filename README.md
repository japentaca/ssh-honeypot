# 🍯 SSH Honeypot

Un honeypot SSH de alta interacción desarrollado en Node.js para detectar y registrar intentos de acceso no autorizado a sistemas SSH.

## 📋 Descripción

Este proyecto implementa un honeypot SSH que simula un servidor SSH real para atraer y registrar actividad maliciosa. El honeypot captura información valiosa sobre atacantes, incluyendo direcciones IP, credenciales utilizadas y comandos ejecutados, sin comprometer la seguridad del sistema real.

## ✨ Características

- **🔐 Autenticación Simulada**: Acepta aleatoriamente conexiones (10% de probabilidad) para estudiar el comportamiento post-autenticación
- **🐚 Shell Interactivo Falso**: Simula un entorno Linux con comandos básicos
- **⚠️ Mensaje de Advertencia Configurable**: Opción de mostrar advertencia en inglés sobre investigación y denuncia de IPs
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

### Configuración mediante Variables de Entorno

El honeypot ahora utiliza **dotenv** para cargar la configuración desde variables de entorno, proporcionando valores por defecto automáticos si no están definidas. Esto permite una configuración flexible sin modificar el código.

#### Configuración Rápida

1. **Copia el archivo de ejemplo**:
```bash
cp .env.example .env
```

2. **Edita el archivo `.env`** con tus valores personalizados (opcional)

3. **Inicia el honeypot** - usará las variables de entorno o los valores por defecto

#### Variables de Entorno Disponibles

| Variable | Descripción | Valor por Defecto | Tipo |
|----------|-------------|-------------------|------|
| **Configuración del Servidor** |
| `SSH_HONEYPOT_PORT` | Puerto de escucha SSH | `2222` | Número (1-65535) |
| `SSH_HONEYPOT_HOST` | Interfaz de red a usar | `0.0.0.0` | String |
| `SSH_HONEYPOT_BANNER` | Banner SSH del servidor | `SSH-2.0-OpenSSH_7.4` | String |
| `SSH_HONEYPOT_HOST_KEY_PATH` | Ruta al archivo de clave del host | `host.key` | String |
| **Configuración de Logs** |
| `SSH_HONEYPOT_LOG_FILE` | Archivo de registro | `ssh_honeypot.log` | String |
| `SSH_HONEYPOT_LOG_ROTATION_SIZE` | Tamaño máximo antes de rotar (bytes) | `10485760` (10MB) | Número |
| `SSH_HONEYPOT_LOG_ROTATION_MAX_FILES` | Máximo de archivos rotados a conservar (0 = ilimitado) | `10` | Número |
| **Gestión de Conexiones** |
| `SSH_HONEYPOT_MAX_CONNECTIONS` | Máximo de conexiones simultáneas | `100` | Número |
| `SSH_HONEYPOT_DELAY_MIN` | Delay mínimo antes de cerrar (ms) | `2000` | Número |
| `SSH_HONEYPOT_DELAY_MAX` | Delay máximo antes de cerrar (ms) | `10000` | Número |
| **Autenticación** |
| `SSH_HONEYPOT_AUTH_DELAY_MIN` | Delay mínimo de autenticación (ms) | `500` | Número |
| `SSH_HONEYPOT_AUTH_DELAY_MAX` | Delay máximo de autenticación (ms) | `3500` | Número |
| **Shell Falso** |
| `SSH_HONEYPOT_FAKE_SHELL_ENABLED` | Habilitar shell interactivo | `true` | Boolean |
| `SSH_HONEYPOT_FAKE_SHELL_SUCCESS_RATE` | Tasa de éxito de login (0-1) | `0.1` (10%) | Float |
| `SSH_HONEYPOT_FAKE_SHELL_HOSTNAME` | Hostname del sistema simulado | `honeypot` | String |
| `SSH_HONEYPOT_FAKE_SHELL_PROMPT` | Prompt del shell falso mostrado al cliente | `~$ ` | String |
| `SSH_HONEYPOT_FAKE_SHELL_OS` | Sistema operativo simulado | `Ubuntu 20.04.1 LTS` | String |
| `SSH_HONEYPOT_FAKE_SHELL_KERNEL` | Información del kernel | `Linux honeypot 5.4.0...` | String |
| `SSH_HONEYPOT_ALLOWED_CREDENTIALS` | Credenciales que siempre permiten acceso | `admin:admin,root:password,test:test` | String |
| **Mensaje de Advertencia** |
| `SSH_HONEYPOT_ENABLE_WARNING_MESSAGE` | Habilitar mensaje de advertencia | `false` | Boolean |
| `SSH_HONEYPOT_WARNING_MESSAGE_TEXT` | Texto del mensaje de advertencia | `WARNING: Unauthorized access...` | String |
| `SSH_HONEYPOT_WARNING_MESSAGE_DELAY` | Delay antes de mostrar mensaje (ms) | `1500` | Número |
| **Rate Limiting** |
| `SSH_HONEYPOT_RATE_LIMIT_WINDOW` | Ventana de tiempo (ms) | `60000` (1 min) | Número |
| `SSH_HONEYPOT_RATE_LIMIT_MAX_ATTEMPTS` | Máximo de intentos por ventana | `10` | Número |
| **Estadísticas** |
| `SSH_HONEYPOT_STATS_DISPLAY_INTERVAL` | Intervalo de estadísticas (ms) | `300000` (5 min) | Número |
| `SSH_HONEYPOT_STATS_TOP_COUNT` | Cantidad de top items a mostrar | `5` | Número |

#### Ejemplo de Archivo `.env`

```bash
# Configuración básica del servidor
SSH_HONEYPOT_PORT=2222
SSH_HONEYPOT_HOST=0.0.0.0

# Configuración de logs
SSH_HONEYPOT_LOG_FILE=honeypot.log
SSH_HONEYPOT_LOG_ROTATION_SIZE=5242880  # 5MB
SSH_HONEYPOT_LOG_ROTATION_MAX_FILES=10  # conservar los 10 logs rotados más recientes

# Shell falso
SSH_HONEYPOT_FAKE_SHELL_ENABLED=true
SSH_HONEYPOT_FAKE_SHELL_SUCCESS_RATE=0.05  # 5% de éxito

# Rate limiting más estricto
SSH_HONEYPOT_RATE_LIMIT_MAX_ATTEMPTS=5
```

#### Características del Sistema de Configuración

- **🔄 Valores por Defecto Automáticos**: Si una variable no está definida o está vacía, se usa el valor por defecto
- **✅ Validación de Configuración**: El sistema valida automáticamente los valores al iniciar
- **📝 Logging de Configuración**: Se muestra qué valores se están usando al iniciar
- **🔒 Compatibilidad Hacia Atrás**: El sistema funciona sin archivo `.env`
- **⚡ Carga Dinámica**: Las variables se cargan al inicio sin necesidad de recompilar

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
├── config.js          # Módulo de configuración centralizada
├── .env               # Variables de entorno (no incluir en git)
├── .env.example       # Ejemplo de configuración con documentación
├── package.json       # Dependencias y metadatos
├── package-lock.json  # Lock file de dependencias
├── host.key          # Clave privada del host (generada automáticamente)
├── ssh_honeypot.log  # Archivo de logs (generado al ejecutar)
├── .gitignore        # Archivos ignorados por git
└── README.md         # Este archivo
```

### Arquitectura

El honeypot está construido con los siguientes componentes:

#### Clases Principales
- **`SSHHoneypot`**: Clase principal que gestiona el servidor
- **`HoneypotStats`**: Maneja estadísticas y monitoreo
- **`HoneypotLogger`**: Sistema de logging thread-safe con rotación
- **`FakeShell`**: Simula una shell interactiva de Linux

#### Módulos de Configuración
- **[`config.js`](config.js)**: Módulo centralizado de configuración con:
  - Carga de variables de entorno mediante dotenv
  - Valores por defecto automáticos
  - Validación de configuración
  - Funciones helper para diferentes tipos de datos

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
- [dotenv](https://github.com/motdotla/dotenv) - Gestión de variables de entorno
- Comunidad de seguridad informática por compartir conocimiento

---

**Recuerda**: La seguridad es responsabilidad de todos. Usa este honeypot de manera ética y responsable. 🔒