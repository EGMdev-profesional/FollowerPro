const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
    try {
        console.log('🔍 Verificando tablas en la base de datos...');

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Verificar qué tablas existen
        const [tables] = await connection.query('SHOW TABLES');
        console.log('📋 Tablas encontradas:', tables.length);

        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });

        // Crear tablas faltantes individualmente
        const requiredTables = [
            'usuarios',
            'servicios_cache',
            'ordenes',
            'transacciones',
            'logs_sistema',
            'configuracion',
            'sesiones'
        ];

        console.log('\n🔄 Verificando tablas faltantes...');

        for (const tableName of requiredTables) {
            const [exists] = await connection.query(
                'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
                [process.env.DB_NAME, tableName]
            );

            if (exists[0].count === 0) {
                console.log(`❌ Tabla ${tableName} NO existe - creando...`);

                // Aquí puedes agregar la lógica para crear tablas individuales
                // Por ahora solo informamos cuáles faltan
            } else {
                console.log(`✅ Tabla ${tableName} existe`);
            }
        }

        await connection.end();
        console.log('\n✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkTables();
