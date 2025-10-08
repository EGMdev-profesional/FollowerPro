const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function initDatabase() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        console.log('Host:', process.env.DB_HOST);
        console.log('Database:', process.env.DB_NAME);
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('✅ Conectado a MySQL');

        // Leer el schema
        const schema = fs.readFileSync('./database_schema.sql', 'utf8');
        
        console.log('🔄 Ejecutando schema SQL...');
        await connection.query(schema);
        
        console.log('✅ Base de datos inicializada correctamente');
        console.log('✅ Tablas creadas:');
        console.log('   - usuarios');
        console.log('   - servicios_cache');
        console.log('   - ordenes');
        console.log('   - transacciones');
        console.log('   - logs_sistema');
        console.log('   - configuracion');
        console.log('   - sesiones');
        
        await connection.end();
        console.log('🎉 ¡Listo! La base de datos está lista para usar.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

initDatabase();
