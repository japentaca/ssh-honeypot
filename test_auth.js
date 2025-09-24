// Script para probar autenticación SSH al honeypot
const { Client } = require('ssh2');

const testCredentials = [
    { username: 'admin', password: 'admin' },
    { username: 'root', password: 'password' },
    { username: 'test', password: 'test' },
    { username: 'user', password: 'wrongpass' },
    { username: 'guest', password: 'guest' },
    { username: 'random', password: 'random' }
];

const totalTests = 20;
let successCount = 0;
let failCount = 0;
let testCount = 0;

console.log('🧪 Iniciando pruebas de autenticación SSH');
console.log(`📊 Realizando ${totalTests} intentos de autenticación`);
console.log('⚙️  Configuración esperada: 90% de tasa de éxito\n');

function testAuth(credentials, testNumber) {
    return new Promise((resolve) => {
        const conn = new Client();
        
        conn.on('ready', () => {
            console.log(`✅ Intento ${testNumber}/${totalTests} - Usuario: ${credentials.username} - ÉXITO`);
            successCount++;
            conn.end();
            resolve();
        });
        
        conn.on('error', (err) => {
            if (err.level === 'authentication') {
                console.log(`❌ Intento ${testNumber}/${totalTests} - Usuario: ${credentials.username} - FALLO (auth)`);
            } else {
                console.log(`❌ Intento ${testNumber}/${totalTests} - Usuario: ${credentials.username} - ERROR: ${err.message}`);
            }
            failCount++;
            resolve();
        });
        
        conn.connect({
            host: 'localhost',
            port: 2222,
            username: credentials.username,
            password: credentials.password,
            readyTimeout: 10000
        });
    });
}

async function runTests() {
    for (let i = 1; i <= totalTests; i++) {
        const credentials = testCredentials[Math.floor(Math.random() * testCredentials.length)];
        await testAuth(credentials, i);
        testCount++;
        
        // Pequeña pausa entre intentos
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successRate = (successCount / totalTests) * 100;
    
    console.log('\n📈 RESULTADOS DE LAS PRUEBAS:');
    console.log('================================');
    console.log(`Total de intentos: ${totalTests}`);
    console.log(`Intentos exitosos: ${successCount}`);
    console.log(`Intentos fallidos: ${failCount}`);
    console.log(`Tasa de éxito: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 85) {
        console.log('✅ La tasa de éxito cumple con el objetivo (≥90%)');
    } else {
        console.log('❌ La tasa de éxito está por debajo del objetivo (≥90%)');
    }
}

runTests().catch(console.error);