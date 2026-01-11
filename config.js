/**
 * SSH Honeypot Configuration Module
 * 
 * This module centralizes all configuration management for the SSH honeypot.
 * It loads environment variables using dotenv and provides fallback default values
 * for any undefined or empty environment variables.
 * 
 * All configuration values are validated and type-converted as needed.
 */

require('dotenv').config();

/**
 * Helper function to get environment variable with fallback
 * @param {string} key - Environment variable name
 * @param {any} defaultValue - Default value if env var is not set or empty
 * @returns {string} The environment variable value or default
 */
function getEnvVar(key, defaultValue) {
  const value = process.env[key];
  // Return default if undefined, null, or empty string
  if (value === undefined || value === null || value === '') {
    console.log(`⚠️  Using default value for ${key}: ${defaultValue}`);
    return defaultValue;
  }
  return value;
}

/**
 * Helper function to parse integer environment variables
 * @param {string} key - Environment variable name
 * @param {number} defaultValue - Default value if env var is not set or invalid
 * @returns {number} Parsed integer value
 */
function getEnvInt(key, defaultValue) {
  const value = getEnvVar(key, defaultValue);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`⚠️  Invalid integer value for ${key}: "${value}". Using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

/**
 * Helper function to parse boolean environment variables
 * @param {string} key - Environment variable name
 * @param {boolean} defaultValue - Default value if env var is not set
 * @returns {boolean} Parsed boolean value
 */
function getEnvBool(key, defaultValue) {
  const value = getEnvVar(key, defaultValue.toString());
  // Accept various boolean representations
  return value.toLowerCase() === 'true' ||
    value === '1' ||
    value.toLowerCase() === 'yes' ||
    value.toLowerCase() === 'on';
}

/**
 * Helper function to parse float environment variables
 * @param {string} key - Environment variable name
 * @param {number} defaultValue - Default value if env var is not set or invalid
 * @returns {number} Parsed float value
 */
function getEnvFloat(key, defaultValue) {
  const value = getEnvVar(key, defaultValue);
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    console.warn(`⚠️  Invalid float value for ${key}: "${value}". Using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

/**
 * Main configuration object
 * Each value is loaded from environment variables with appropriate fallbacks
 */
const CONFIG = {
  // Server Configuration
  PORT: getEnvInt('SSH_HONEYPOT_PORT', 2222),
  HOST: getEnvVar('SSH_HONEYPOT_HOST', '0.0.0.0'),

  // Logging Configuration
  LOG_FILE: getEnvVar('SSH_HONEYPOT_LOG_FILE', 'ssh_honeypot.log'),
  LOG_ROTATION_SIZE: getEnvInt('SSH_HONEYPOT_LOG_ROTATION_SIZE', 10 * 1024 * 1024), // 10MB default
  // Maximum number of rotated log files to keep. 0 = unlimited.
  LOG_ROTATION_MAX_FILES: getEnvInt('SSH_HONEYPOT_LOG_ROTATION_MAX_FILES', 10),

  // Connection Management
  MAX_CONNECTIONS: getEnvInt('SSH_HONEYPOT_MAX_CONNECTIONS', 100),
  DELAY_MIN: getEnvInt('SSH_HONEYPOT_DELAY_MIN', 2000), // milliseconds
  DELAY_MAX: getEnvInt('SSH_HONEYPOT_DELAY_MAX', 10000), // milliseconds

  // Feature Flags
  FAKE_SHELL_ENABLED: getEnvBool('SSH_HONEYPOT_FAKE_SHELL_ENABLED', true),
  FAKE_SHELL_SUCCESS_RATE: getEnvFloat('SSH_HONEYPOT_FAKE_SHELL_SUCCESS_RATE', 0.1), // 10% default

  // Rate Limiting
  RATE_LIMIT_WINDOW: getEnvInt('SSH_HONEYPOT_RATE_LIMIT_WINDOW', 60000), // 1 minute default
  RATE_LIMIT_MAX_ATTEMPTS: getEnvInt('SSH_HONEYPOT_RATE_LIMIT_MAX_ATTEMPTS', 10),

  // SSH Server Configuration
  SSH_BANNER: getEnvVar('SSH_HONEYPOT_BANNER', 'SSH-2.0-OpenSSH_7.4'),
  HOST_KEY_PATH: getEnvVar('SSH_HONEYPOT_HOST_KEY_PATH', 'host.key'),

  // Authentication Delays
  AUTH_DELAY_MIN: getEnvInt('SSH_HONEYPOT_AUTH_DELAY_MIN', 500), // milliseconds
  AUTH_DELAY_MAX: getEnvInt('SSH_HONEYPOT_AUTH_DELAY_MAX', 3500), // milliseconds

  // Statistics Display
  STATS_DISPLAY_INTERVAL: getEnvInt('SSH_HONEYPOT_STATS_DISPLAY_INTERVAL', 300000), // 5 minutes default
  STATS_TOP_COUNT: getEnvInt('SSH_HONEYPOT_STATS_TOP_COUNT', 5), // Top N items to display

  // Fake Shell Responses (can be customized via environment)
  FAKE_SHELL_HOSTNAME: getEnvVar('SSH_HONEYPOT_FAKE_SHELL_HOSTNAME', 'honeypot'),
  // Fake shell prompt shown to connected clients (keep it simple to avoid leaking obvious honeypot markers)
  // Example values: "~$ ", "$ ", "ubuntu@host:~$ ", "[admin@server ~]$ "
  FAKE_SHELL_PROMPT: getEnvVar('SSH_HONEYPOT_FAKE_SHELL_PROMPT', '~$ '),
  FAKE_SHELL_OS: getEnvVar('SSH_HONEYPOT_FAKE_SHELL_OS', 'Ubuntu 20.04.1 LTS'),
  FAKE_SHELL_KERNEL: getEnvVar('SSH_HONEYPOT_FAKE_SHELL_KERNEL', 'Linux honeypot 5.4.0-42-generic #46-Ubuntu SMP Fri Jul 10 00:24:02 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux'),

  // Credenciales que siempre permiten acceso (formato: "usuario:contraseña,usuario2:contraseña2")
  ALLOWED_CREDENTIALS: getEnvVar('SSH_HONEYPOT_ALLOWED_CREDENTIALS', 'admin:admin,root:password,test:test'),

  // Warning Message Configuration
  ENABLE_WARNING_MESSAGE: getEnvBool('SSH_HONEYPOT_ENABLE_WARNING_MESSAGE', false),
  WARNING_MESSAGE_TEXT: getEnvVar('SSH_HONEYPOT_WARNING_MESSAGE_TEXT',
    'WARNING: Unauthorized access attempt detected. This system is monitored and protected. Your IP address has been logged and will be investigated and reported to relevant authorities.'),
  WARNING_MESSAGE_DELAY: getEnvInt('SSH_HONEYPOT_WARNING_MESSAGE_DELAY', 1500), // milliseconds
};

/**
 * Validate configuration values
 * Ensures all critical values are within acceptable ranges
 */
function validateConfig() {
  const errors = [];

  // Port validation
  if (CONFIG.PORT < 1 || CONFIG.PORT > 65535) {
    errors.push(`Invalid port number: ${CONFIG.PORT}. Must be between 1 and 65535.`);
  }

  // Delay validation
  if (CONFIG.DELAY_MIN > CONFIG.DELAY_MAX) {
    errors.push(`DELAY_MIN (${CONFIG.DELAY_MIN}) cannot be greater than DELAY_MAX (${CONFIG.DELAY_MAX}).`);
  }

  if (CONFIG.AUTH_DELAY_MIN > CONFIG.AUTH_DELAY_MAX) {
    errors.push(`AUTH_DELAY_MIN (${CONFIG.AUTH_DELAY_MIN}) cannot be greater than AUTH_DELAY_MAX (${CONFIG.AUTH_DELAY_MAX}).`);
  }

  // Rate limit validation
  if (CONFIG.RATE_LIMIT_MAX_ATTEMPTS < 1) {
    errors.push(`RATE_LIMIT_MAX_ATTEMPTS must be at least 1. Got: ${CONFIG.RATE_LIMIT_MAX_ATTEMPTS}`);
  }

  // Success rate validation
  if (CONFIG.FAKE_SHELL_SUCCESS_RATE < 0 || CONFIG.FAKE_SHELL_SUCCESS_RATE > 1) {
    errors.push(`FAKE_SHELL_SUCCESS_RATE must be between 0 and 1. Got: ${CONFIG.FAKE_SHELL_SUCCESS_RATE}`);
  }

  // Log rotation retention validation
  if (CONFIG.LOG_ROTATION_MAX_FILES < 0) {
    errors.push(`LOG_ROTATION_MAX_FILES must be 0 (unlimited) or a positive integer. Got: ${CONFIG.LOG_ROTATION_MAX_FILES}`);
  }

  // Warning message delay validation
  if (CONFIG.WARNING_MESSAGE_DELAY < 0) {
    errors.push(`WARNING_MESSAGE_DELAY must be a positive integer. Got: ${CONFIG.WARNING_MESSAGE_DELAY}`);
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
}

/**
 * Display current configuration (for debugging/logging)
 * Masks sensitive values if needed
 */
function displayConfig() {
  console.log('📋 SSH Honeypot Configuration:');
  console.log('================================');
  console.log(`Server: ${CONFIG.HOST}:${CONFIG.PORT}`);
  console.log(`Log File: ${CONFIG.LOG_FILE}`);
  console.log(`Max Connections: ${CONFIG.MAX_CONNECTIONS}`);
  console.log(`Fake Shell: ${CONFIG.FAKE_SHELL_ENABLED ? 'Enabled' : 'Disabled'}`);
  if (CONFIG.FAKE_SHELL_ENABLED) {
    console.log(`Success Rate: ${(CONFIG.FAKE_SHELL_SUCCESS_RATE * 100).toFixed(1)}%`);
  }
  console.log(`Rate Limit: ${CONFIG.RATE_LIMIT_MAX_ATTEMPTS} attempts per ${CONFIG.RATE_LIMIT_WINDOW}ms`);
  console.log(`Warning Message: ${CONFIG.ENABLE_WARNING_MESSAGE ? 'Enabled' : 'Disabled'}`);
  if (CONFIG.ENABLE_WARNING_MESSAGE) {
    console.log(`Warning Delay: ${CONFIG.WARNING_MESSAGE_DELAY}ms`);
  }

  // Mostrar credenciales permitidas (sin las contraseñas por seguridad)
  if (CONFIG.ALLOWED_CREDENTIALS) {
    const credentialPairs = CONFIG.ALLOWED_CREDENTIALS.split(',');
    const usernames = credentialPairs.map(pair => pair.trim().split(':')[0]).filter(Boolean);
    console.log(`Allowed Users: ${usernames.join(', ')}`);
  }
  console.log('================================\n');
}

// Validate configuration on module load
validateConfig();

// Export configuration and helper functions
module.exports = {
  CONFIG,
  getEnvVar,
  getEnvInt,
  getEnvBool,
  getEnvFloat,
  displayConfig,
  validateConfig
};