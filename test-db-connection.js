const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('\n🔍 VERIFICANDO CONFIGURACIÓN DE BASE DE DATOS\n');
    console.log('═══════════════════════════════════════════════');
    
    // Mostrar las variables de entorno (sin mostrar la contraseña completa)
    console.log('\n📋 Configuración detectada:');
    console.log('───────────────────────────────────────────────');
    console.log(`Host:     ${process.env.DB_HOST || 'NO CONFIGURADO'}`);
    console.log(`Port:     ${process.env.DB_PORT || '3306 (por defecto)'}`);
    console.log(`Usuario:  ${process.env.DB_USER || 'NO CONFIGURADO'}`);
    console.log(`Password: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'NO CONFIGURADO'}`);
    console.log(`Database: ${process.env.DB_NAME || 'NO CONFIGURADO'}`);
    
    // Verificar que todas las variables estén configuradas
    console.log('\n✅ Variables requeridas:');
    console.log('───────────────────────────────────────────────');
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    let allConfigured = true;
    
    requiredVars.forEach(varName => {
        const isConfigured = !!process.env[varName];
        console.log(`${isConfigured ? '✓' : '✗'} ${varName}: ${isConfigured ? 'CONFIGURADO' : '⚠️  FALTA'}`);
        if (!isConfigured) allConfigured = false;
    });
    
    if (!allConfigured) {
        console.log('\n❌ ERROR: Faltan variables de entorno requeridas en el archivo .env');
        console.log('\nAgrega las siguientes líneas a tu archivo .env:');
        console.log('───────────────────────────────────────────────');
        console.log('DB_HOST=localhost');
        console.log('DB_PORT=3306');
        console.log('DB_USER=u969924544_papito');
        console.log('DB_PASSWORD=tu_contraseña_aquí');
        console.log('DB_NAME=u969924544_papito');
        return;
    }
    
    // Intentar conexión
    console.log('\n🔌 Intentando conectar a la base de datos...');
    console.log('───────────────────────────────────────────────');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ ¡CONEXIÓN EXITOSA!');
        
        // Probar una query simple
        const [rows] = await connection.execute('SELECT DATABASE() as db, USER() as user, VERSION() as version');
        console.log('\n📊 Información de la conexión:');
        console.log('───────────────────────────────────────────────');
        console.log(`Base de datos activa: ${rows[0].db}`);
        console.log(`Usuario conectado:    ${rows[0].user}`);
        console.log(`Versión MySQL/Maria:  ${rows[0].version}`);
        
        // Verificar tablas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`\n📁 Tablas encontradas: ${tables.length}`);
        if (tables.length > 0) {
            console.log('───────────────────────────────────────────────');
            tables.forEach((table, index) => {
                console.log(`${index + 1}. ${Object.values(table)[0]}`);
            });
        }
        
        await connection.end();
        console.log('\n═══════════════════════════════════════════════');
        console.log('✅ TODO ESTÁ CONFIGURADO CORRECTAMENTE');
        console.log('═══════════════════════════════════════════════\n');
        
    } catch (error) {
        console.log('❌ ERROR DE CONEXIÓN');
        console.log('───────────────────────────────────────────────');
        console.log(`Código de error: ${error.code}`);
        console.log(`Mensaje:        ${error.message}`);
        
        console.log('\n💡 POSIBLES SOLUCIONES:');
        console.log('───────────────────────────────────────────────');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('❌ USUARIO O CONTRASEÑA INCORRECTOS');
            console.log('\n¿Qué revisar?');
            console.log('1. Verifica que el usuario sea: u969924544_papito');
            console.log('2. Verifica que la contraseña en el .env sea EXACTAMENTE la misma');
            console.log('3. NO debe tener espacios al inicio o final');
            console.log('4. Si la contraseña tiene caracteres especiales, usa comillas:');
            console.log('   DB_PASSWORD="tu_contraseña_con_caracteres_especiales"');
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.log('❌ NO SE PUEDE CONECTAR AL SERVIDOR');
            console.log('\n¿Qué revisar?');
            console.log('1. Verifica que el host sea correcto (localhost o auth-db1548.hstgr.io)');
            console.log('2. Verifica que el puerto sea 3306');
            console.log('3. Verifica que el servidor MySQL/MariaDB esté ejecutándose');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('❌ LA BASE DE DATOS NO EXISTE');
            console.log('\n¿Qué revisar?');
            console.log('1. Verifica que el nombre de la base de datos sea: u969924544_papito');
            console.log('2. Verifica que la base de datos esté creada en el servidor');
        }
        
        console.log('\n═══════════════════════════════════════════════\n');
    }
}

testConnection();
