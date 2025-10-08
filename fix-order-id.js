const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixOrderIdColumn() {
    let connection;
    try {
        console.log('🔧 Conectando a la base de datos...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Conectado a MySQL\n');

        // Verificar el tipo actual de la columna
        console.log('🔍 Verificando tipo de columna order_id...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'ordenes' 
            AND COLUMN_NAME = 'order_id'
        `, [process.env.DB_NAME]);

        if (columns.length > 0) {
            console.log('📋 Tipo actual:', columns[0].COLUMN_TYPE);
        }

        // Modificar la columna order_id
        console.log('\n🔄 Modificando columna order_id de INT a VARCHAR(100)...');
        
        await connection.query(`
            ALTER TABLE ordenes 
            MODIFY COLUMN order_id VARCHAR(100) DEFAULT NULL
        `);

        console.log('✅ Columna order_id modificada exitosamente');

        // Verificar el cambio
        const [newColumns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'ordenes' 
            AND COLUMN_NAME = 'order_id'
        `, [process.env.DB_NAME]);

        console.log('📋 Nuevo tipo:', newColumns[0].COLUMN_TYPE);
        console.log('\n🎉 ¡Corrección completada exitosamente!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
        process.exit(0);
    }
}

fixOrderIdColumn();
