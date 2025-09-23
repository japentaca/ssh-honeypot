const ssh2 = require('ssh2');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Import centralized configuration
const { CONFIG, displayConfig } = require('./config');

const Server = ssh2.Server;

// Statistics and monitoring
class HoneypotStats extends EventEmitter {
  constructor() {
    super();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      totalAttempts: 0,
      uniqueIPs: new Set(),
      topUsernames: new Map(),
      topPasswords: new Map(),
      connectionsByCountry: new Map(),
      startTime: new Date()
    };
    this.connectionQueue = [];
    this.rateLimitMap = new Map();
  }

  addConnection(ip) {
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    this.stats.uniqueIPs.add(ip);
    this.emit('connection', { ip, total: this.stats.totalConnections });
  }

  removeConnection() {
    this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
  }

  addAttempt(ip, username, password) {
    this.stats.totalAttempts++;

    // Track popular credentials
    this.stats.topUsernames.set(username, (this.stats.topUsernames.get(username) || 0) + 1);
    this.stats.topPasswords.set(password, (this.stats.topPasswords.get(password) || 0) + 1);

    this.emit('attempt', { ip, username, password, total: this.stats.totalAttempts });
  }

  checkRateLimit(ip) {
    const now = Date.now();
    const clientData = this.rateLimitMap.get(ip) || { attempts: 0, windowStart: now };

    // Reset window if expired
    if (now - clientData.windowStart > CONFIG.RATE_LIMIT_WINDOW) {
      clientData.attempts = 0;
      clientData.windowStart = now;
    }

    clientData.attempts++;
    this.rateLimitMap.set(ip, clientData);

    return clientData.attempts <= CONFIG.RATE_LIMIT_MAX_ATTEMPTS;
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    return {
      ...this.stats,
      uniqueIPs: this.stats.uniqueIPs.size,
      uptime: Math.floor(uptime / 1000),
      topUsernames: Array.from(this.stats.topUsernames.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topPasswords: Array.from(this.stats.topPasswords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
  }
}

// Thread-safe logging with rotation
class HoneypotLogger {
  constructor(logFile) {
    this.logFile = logFile;
    this.writeQueue = [];
    this.isWriting = false;
    this.ensureLogFile();
  }

  async ensureLogFile() {
    try {
      await fs.access(this.logFile);
    } catch {
      await fs.writeFile(this.logFile, '');
    }
  }

  async rotateLogIfNeeded() {
    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size > CONFIG.LOG_ROTATION_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = `${this.logFile}.${timestamp}`;
        await fs.rename(this.logFile, rotatedFile);
        await fs.writeFile(this.logFile, '');
        console.log(`Log rotated to: ${rotatedFile}`);
      }
    } catch (err) {
      console.error('Error rotating log:', err.message);
    }
  }

  async logAttempt(ip, username, password, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ip,
      username,
      password,
      ...additionalInfo
    };

    const logLine = `${JSON.stringify(logEntry)}\n`;

    return new Promise((resolve) => {
      this.writeQueue.push({ logLine, resolve });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isWriting || this.writeQueue.length === 0) return;

    this.isWriting = true;

    try {
      await this.rotateLogIfNeeded();

      const batch = this.writeQueue.splice(0);
      const logData = batch.map(item => item.logLine).join('');

      await fs.appendFile(this.logFile, logData);

      // Resolve all promises
      batch.forEach(item => item.resolve());

    } catch (err) {
      console.error('Error writing to log:', err.message);
    } finally {
      this.isWriting = false;
      // Process remaining queue
      if (this.writeQueue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }
}

// Fake shell interaction
class FakeShell {
  constructor(client, ip) {
    this.client = client;
    this.ip = ip;
    this.commands = {
      'ls': 'total 8\ndrwxr-xr-x 2 root root 4096 Jan 1 12:00 .\ndrwxr-xr-x 3 root root 4096 Jan 1 12:00 ..\n-rw-r--r-- 1 root root  220 Jan 1 12:00 .bash_logout\n',
      'pwd': '/root\n',
      'whoami': 'root\n',
      'id': 'uid=0(root) gid=0(root) groups=0(root)\n',
      'uname -a': CONFIG.FAKE_SHELL_KERNEL + '\n',
      'cat /etc/passwd': 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n',
      'ps aux': 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1   8892   764 ?        Ss   12:00   0:01 /sbin/init\n',
      'hostname': CONFIG.FAKE_SHELL_HOSTNAME + '\n'
    };
  }

  start() {
    this.client.write('Last login: ' + new Date().toUTCString() + ' from ' + this.ip + '\r\n');
    this.client.write(`Welcome to ${CONFIG.FAKE_SHELL_OS} (GNU/Linux ${CONFIG.FAKE_SHELL_KERNEL.split(' ')[2]} x86_64)\r\n\r\n`);
    this.prompt();
  }

  prompt() {
    this.client.write(`root@${CONFIG.FAKE_SHELL_HOSTNAME}:~# `);
  }

  handleCommand(command) {
    const cmd = command.trim();
    if (this.commands[cmd]) {
      this.client.write(this.commands[cmd]);
    } else if (cmd === 'exit' || cmd === 'logout') {
      this.client.write('logout\r\n');
      return false; // Signal to close connection
    } else if (cmd) {
      this.client.write(`bash: ${cmd}: command not found\r\n`);
    }
    this.prompt();
    return true;
  }
}

// Main honeypot class
class SSHHoneypot {
  constructor() {
    this.stats = new HoneypotStats();
    this.logger = new HoneypotLogger(CONFIG.LOG_FILE);
    this.server = null;
    this.isShuttingDown = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.stats.on('connection', (data) => {
      console.log(`[${new Date().toISOString()}] New connection from ${data.ip} (Total: ${data.total})`);
    });

    this.stats.on('attempt', (data) => {
      console.log(`[${new Date().toISOString()}] Login attempt from ${data.ip} - User: "${data.username}" Pass: "${data.password}"`);
    });

    // Statistics display at configured interval
    if (CONFIG.STATS_DISPLAY_INTERVAL > 0) {
      setInterval(() => this.displayStats(), CONFIG.STATS_DISPLAY_INTERVAL);
    }
  }

  async generateHostKey() {
    const hostKeyPath = path.join(__dirname, CONFIG.HOST_KEY_PATH);

    if (!fsSync.existsSync(hostKeyPath)) {
      console.log('Generating RSA host key...');
      const { generateKeyPairSync } = require('crypto');

      const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: {
          type: 'pkcs1',
          format: 'pem'
        }
      });

      await fs.writeFile(hostKeyPath, privateKey);
      console.log('Host key generated successfully.');
    }

    return await fs.readFile(hostKeyPath);
  }

  randomDelay() {
    return Math.floor(Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN + 1)) + CONFIG.DELAY_MIN;
  }

  async handleClient(client, info) {
    const clientId = `${info.ip}:${info.port}`;

    // Rate limiting
    if (!this.stats.checkRateLimit(info.ip)) {
      console.log(`Rate limit exceeded for ${info.ip}`);
      client.end();
      return;
    }

    // Connection limit
    if (this.stats.stats.activeConnections >= CONFIG.MAX_CONNECTIONS) {
      console.log(`Connection limit reached, rejecting ${info.ip}`);
      client.end();
      return;
    }

    this.stats.addConnection(info.ip);
    let shell = null;
    let isAuthenticated = false;

    client.on('authentication', async (ctx) => {
      const { method, username, password } = ctx;

      if (method === 'password') {
        const additionalInfo = {
          method,
          clientId,
          userAgent: info.header?.identRaw || 'unknown'
        };

        await this.logger.logAttempt(info.ip, username, password, additionalInfo);
        this.stats.addAttempt(info.ip, username, password);

        // Simulate processing delay
        const authDelay = Math.random() * (CONFIG.AUTH_DELAY_MAX - CONFIG.AUTH_DELAY_MIN) + CONFIG.AUTH_DELAY_MIN;
        setTimeout(() => {
          if (CONFIG.FAKE_SHELL_ENABLED && Math.random() < CONFIG.FAKE_SHELL_SUCCESS_RATE) {
            isAuthenticated = true;
            ctx.accept();
          } else {
            ctx.reject();
          }
        }, authDelay);
      } else {
        ctx.reject();
      }
    });

    client.on('ready', () => {
      console.log(`Client authenticated: ${clientId}`);

      client.on('session', (accept, reject) => {
        const session = accept();

        session.once('shell', (accept, reject) => {
          const stream = accept();
          shell = new FakeShell(stream, info.ip);
          shell.start();

          stream.on('data', (data) => {
            const command = data.toString();
            if (!shell.handleCommand(command)) {
              client.end();
            }
          });
        });

        session.once('exec', (accept, reject, info) => {
          const stream = accept();
          stream.write(`bash: ${info.command}: command not found\r\n`);
          stream.exit(127);
          stream.end();
        });
      });
    });

    client.on('end', () => {
      console.log(`Connection ended: ${clientId}`);
      this.stats.removeConnection();
    });

    client.on('error', (err) => {
      if (err.code !== 'ECONNRESET') {
        console.log(`Connection error from ${clientId}:`, err.message);
      }
      this.stats.removeConnection();
    });

    // Random delay before potential connection close (for unauthenticated connections)
    if (!isAuthenticated) {
      setTimeout(() => {
        if (!client.destroyed) {
          client.end();
        }
      }, this.randomDelay());
    }
  }

  displayStats() {
    const stats = this.stats.getStats();
    console.log('\n=== HONEYPOT STATISTICS ===');
    console.log(`Uptime: ${stats.uptime}s`);
    console.log(`Total Connections: ${stats.totalConnections}`);
    console.log(`Active Connections: ${stats.activeConnections}`);
    console.log(`Total Login Attempts: ${stats.totalAttempts}`);
    console.log(`Unique IPs: ${stats.uniqueIPs}`);
    console.log('\nTop Usernames:');
    stats.topUsernames.slice(0, CONFIG.STATS_TOP_COUNT).forEach(([user, count]) => {
      console.log(`  ${user}: ${count}`);
    });
    console.log('\nTop Passwords:');
    stats.topPasswords.slice(0, CONFIG.STATS_TOP_COUNT).forEach(([pass, count]) => {
      console.log(`  ${pass}: ${count}`);
    });
    console.log('============================\n');
  }

  async start() {
    try {
      const hostKey = await this.generateHostKey();

      this.server = new Server({
        hostKeys: [hostKey],
        banner: CONFIG.SSH_BANNER
      }, (client, info) => this.handleClient(client, info));

      this.server.listen(CONFIG.PORT, CONFIG.HOST, () => {
        console.log('\n🍯 SSH Honeypot Started Successfully!\n');
        displayConfig();
        console.log('Press Ctrl+C to stop\n');
      });

      this.server.on('error', (err) => {
        console.error('Server error:', err.message);
      });

    } catch (err) {
      console.error('Failed to start honeypot:', err.message);
      process.exit(1);
    }
  }

  async shutdown() {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log('\n🛑 Shutting down SSH honeypot...');

    const finalStats = this.stats.getStats();
    console.log(`📊 Final Stats - Connections: ${finalStats.totalConnections}, Attempts: ${finalStats.totalAttempts}`);

    if (this.server) {
      this.server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Initialize and start honeypot
const honeypot = new SSHHoneypot();

// Graceful shutdown handlers
process.on('SIGINT', () => honeypot.shutdown());
process.on('SIGTERM', () => honeypot.shutdown());
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  honeypot.shutdown();
});

// Start the honeypot
honeypot.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});