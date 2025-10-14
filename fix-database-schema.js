const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabaseSchema() {
    let connection;
    
    try {
        console.log('🔧 Conectando a la base de datos...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            charset: 'utf8mb4'
        });
        
        console.log('✅ Conectado a la base de datos');
        
        // 1. Verificar si la tabla existe
        console.log('\n📋 Verificando tabla servicios_cache...');
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'servicios_cache'"
        );
        
        if (tables.length === 0) {
            console.log('⚠️ La tabla servicios_cache no existe. Creándola...');
            await connection.execute(`
                CREATE TABLE servicios_cache (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    service_id INT(11) NOT NULL,
                    name TEXT NOT NULL,
                    type VARCHAR(100) NOT NULL,
                    category TEXT NOT NULL,
                    rate DECIMAL(10,4) NOT NULL,
                    min INT(11) NOT NULL,
                    max INT(11) NOT NULL,
                    refill TINYINT(1) DEFAULT 0,
                    \`cancel\` TINYINT(1) DEFAULT 0,
                    descripcion TEXT DEFAULT NULL,
                    activo TINYINT(1) DEFAULT 1,
                    markup DECIMAL(5,2) DEFAULT 20.00,
                    precio_final DECIMAL(10,4) GENERATED ALWAYS AS (rate * (1 + markup / 100)) STORED,
                    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY service_id (service_id),
                    KEY idx_activo (activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Tabla servicios_cache creada correctamente');
        } else {
            console.log('✅ Tabla servicios_cache existe');
            
            // 2. Verificar el tipo de la columna category
            console.log('\n🔍 Verificando estructura de la columna category...');
            const [columns] = await connection.execute(
                "SHOW COLUMNS FROM servicios_cache LIKE 'category'"
            );
            
            if (columns.length > 0) {
                const categoryColumn = columns[0];
                console.log('📊 Tipo actual de category:', categoryColumn.Type);
                
                if (categoryColumn.Type.includes('varchar')) {
                    console.log('🔧 Modificando columna category de VARCHAR a TEXT...');
                    
                    // Primero eliminar el índice si existe
                    try {
                        await connection.execute(
                            'ALTER TABLE servicios_cache DROP INDEX idx_category'
                        );
                        console.log('✅ Índice idx_category eliminado');
                    } catch (error) {
                        console.log('ℹ️ Índice idx_category no existe o ya fue eliminado');
                    }
                    
                    // Modificar la columna
                    await connection.execute(
                        'ALTER TABLE servicios_cache MODIFY COLUMN category TEXT NOT NULL'
                    );
                    console.log('✅ Columna category modificada a TEXT');
                } else {
                    console.log('✅ La columna category ya es de tipo TEXT');
                }
            }
            
            // 3. Verificar el tipo de la columna type
            console.log('\n🔍 Verificando estructura de la columna type...');
            const [typeColumns] = await connection.execute(
                "SHOW COLUMNS FROM servicios_cache LIKE 'type'"
            );
            
            if (typeColumns.length > 0) {
                const typeColumn = typeColumns[0];
                console.log('📊 Tipo actual de type:', typeColumn.Type);
                
                if (typeColumn.Type === 'varchar(50)') {
                    console.log('🔧 Modificando columna type de VARCHAR(50) a VARCHAR(100)...');
                    await connection.execute(
                        'ALTER TABLE servicios_cache MODIFY COLUMN type VARCHAR(100) NOT NULL'
                    );
                    console.log('✅ Columna type modificada a VARCHAR(100)');
                } else {
                    console.log('✅ La columna type ya tiene el tamaño correcto');
                }
            }
        }
        
        // 4. Limpiar servicios con datos inválidos
        console.log('\n🧹 Limpiando servicios con datos inválidos...');
        const [result] = await connection.execute(
            'DELETE FROM servicios_cache WHERE category IS NULL OR category = "" OR name IS NULL OR name = ""'
        );
        console.log(`✅ ${result.affectedRows} servicios inválidos eliminados`);
        
        // 5. Verificar cantidad de servicios
        const [count] = await connection.execute(
            'SELECT COUNT(*) as total FROM servicios_cache WHERE activo = 1'
        );
        console.log(`\n📊 Total de servicios activos: ${count[0].total}`);
        
        console.log('\n✅ ¡Base de datos actualizada correctamente!');
        console.log('\n💡 Ahora puedes reiniciar el servidor para que los cambios surtan efecto.');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
fixDatabaseSchema();
