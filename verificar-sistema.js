const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║   🔍 VERIFICACIÓN DEL SISTEMA - PANEL SMM                     ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let allGood = true;

// 1. Verificar archivo .env
console.log('1️⃣  Verificando archivo .env...');
if (fs.existsSync('.env')) {
    console.log('   ✅ Archivo .env existe');
    
    // Leer y verificar variables importantes
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = [
        'DB_HOST',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
        'SMMCODER_API_KEY',
        'SESSION_SECRET'
    ];
    
    const missingVars = [];
    requiredVars.forEach(varName => {
        if (!envContent.includes(varName + '=') || envContent.includes(varName + '=tu_')) {
            missingVars.push(varName);
        }
    });
    
    if (missingVars.length > 0) {
        console.log('   ⚠️  Variables sin configurar:', missingVars.join(', '));
        console.log('   ℹ️  Edita el archivo .env con tus datos reales');
        allGood = false;
    } else {
        console.log('   ✅ Variables de entorno configuradas');
    }
} else {
    console.log('   ❌ Archivo .env NO existe');
    console.log('   ℹ️  Ejecuta: copy .env.example .env');
    allGood = false;
}

// 2. Verificar node_modules
console.log('\n2️⃣  Verificando dependencias...');
if (fs.existsSync('node_modules')) {
    console.log('   ✅ Dependencias instaladas');
} else {
    console.log('   ❌ Dependencias NO instaladas');
    console.log('   ℹ️  Ejecuta: npm install');
    allGood = false;
}

// 3. Verificar archivos críticos
console.log('\n3️⃣  Verificando archivos del sistema...');
const criticalFiles = [
    'server.js',
    'config/database.js',
    'routes/api.js',
    'routes/orders.js',
    'models/Order.js',
    'models/User.js',
    'public/dashboard.html',
    'public/js/app.js'
];

let missingFiles = [];
criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log('   ❌ Archivos faltantes:', missingFiles.join(', '));
    allGood = false;
} else {
    console.log('   ✅ Todos los archivos críticos presentes');
}

// 4. Verificar nuevos archivos de corrección
console.log('\n4️⃣  Verificando archivos de corrección...');
const fixFiles = [
    'fix-database-schema.js',
    'test-order-creation.js',
    'INSTRUCCIONES_RAPIDAS.md',
    'SOLUCION_COMPLETA.md'
];

let missingFixFiles = [];
fixFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        missingFixFiles.push(file);
    }
});

if (missingFixFiles.length > 0) {
    console.log('   ⚠️  Archivos de corrección faltantes:', missingFixFiles.join(', '));
} else {
    console.log('   ✅ Todos los archivos de corrección presentes');
}

// 5. Verificar package.json scripts
console.log('\n5️⃣  Verificando scripts en package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['start', 'fix-schema', 'test-orders'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
        console.log('   ⚠️  Scripts faltantes:', missingScripts.join(', '));
    } else {
        console.log('   ✅ Todos los scripts necesarios presentes');
    }
} catch (error) {
    console.log('   ❌ Error leyendo package.json');
    allGood = false;
}

// 6. Verificar conexión a base de datos (si .env está configurado)
console.log('\n6️⃣  Verificando conexión a base de datos...');
if (fs.existsSync('.env')) {
    require('dotenv').config();
    
    if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
        if (!process.env.DB_HOST.includes('tu_') && !process.env.DB_USER.includes('tu_')) {
            console.log('   ℹ️  Credenciales de BD configuradas');
            console.log('   ℹ️  Para probar conexión, ejecuta: npm run fix-schema');
        } else {
            console.log('   ⚠️  Credenciales de BD no configuradas correctamente');
            allGood = false;
        }
    } else {
        console.log('   ⚠️  Variables de BD faltantes en .env');
        allGood = false;
    }
} else {
    console.log('   ⚠️  No se puede verificar (falta archivo .env)');
}

// Resumen final
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                     RESUMEN DE VERIFICACIÓN                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

if (allGood) {
    console.log('✅ ¡TODO ESTÁ LISTO!\n');
    console.log('Próximos pasos:');
    console.log('1. Ejecuta: npm run fix-schema');
    console.log('2. Ejecuta: npm start');
    console.log('3. Abre: http://localhost:3000');
    console.log('4. Login: admin@panelsmm.com / Admin123!\n');
} else {
    console.log('⚠️  HAY PROBLEMAS QUE RESOLVER\n');
    console.log('Revisa los mensajes anteriores y corrige los problemas.');
    console.log('Luego ejecuta este script nuevamente para verificar.\n');
}

console.log('═══════════════════════════════════════════════════════════════\n');
