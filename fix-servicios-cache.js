const { initDatabase, query, closeDatabase } = require('./config/database');

async function fixServiciosCacheTable() {
    try {
        console.log('🔧 Verificando estructura de tabla servicios_cache...');

        // Inicializar conexión a la base de datos
        await initDatabase();
        console.log('');

        // 1. Verificar si la tabla existe
        const tables = await query(`
            SHOW TABLES LIKE 'servicios_cache'
        `);

        if (tables.length === 0) {
            console.log('❌ La tabla servicios_cache no existe. Creándola...');
            await query(`
                CREATE TABLE servicios_cache (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    service_id INT(11) NOT NULL,
                    name TEXT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    category VARCHAR(100) NOT NULL,
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
                    KEY idx_category (category),
                    KEY idx_activo (activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Tabla servicios_cache creada exitosamente');
            return;
        }

        // 2. Verificar columnas existentes
        const columns = await query(`
            SHOW COLUMNS FROM servicios_cache
        `);

        const columnNames = columns.map(col => col.Field);
        console.log('📋 Columnas existentes:', columnNames.join(', '));

        // 3. Verificar si precio_final existe
        if (!columnNames.includes('precio_final')) {
            console.log('⚠️ Columna precio_final no existe. Agregándola...');
            
            // Verificar si markup existe
            if (!columnNames.includes('markup')) {
                console.log('⚠️ Columna markup no existe. Agregándola primero...');
                await query(`
                    ALTER TABLE servicios_cache 
                    ADD COLUMN markup DECIMAL(5,2) DEFAULT 20.00 AFTER activo
                `);
                console.log('✅ Columna markup agregada');
            }

            // Agregar precio_final como columna calculada
            await query(`
                ALTER TABLE servicios_cache 
                ADD COLUMN precio_final DECIMAL(10,4) 
                GENERATED ALWAYS AS (rate * (1 + markup / 100)) STORED
                AFTER markup
            `);
            console.log('✅ Columna precio_final agregada como columna calculada');
        } else {
            console.log('✅ Columna precio_final ya existe');
        }

        // 4. Verificar algunas filas de ejemplo
        const sampleServices = await query(`
            SELECT service_id, name, rate, markup, precio_final 
            FROM servicios_cache 
            WHERE activo = 1 
            LIMIT 5
        `);

        if (sampleServices.length > 0) {
            console.log('\n📊 Servicios de ejemplo:');
            sampleServices.forEach(service => {
                console.log(`  - ID: ${service.service_id}`);
                console.log(`    Nombre: ${service.name}`);
                console.log(`    Rate: $${service.rate}`);
                console.log(`    Markup: ${service.markup}%`);
                console.log(`    Precio Final: $${service.precio_final}`);
                console.log('');
            });
        } else {
            console.log('⚠️ No hay servicios en la tabla. Ejecuta la sincronización de servicios.');
        }

        // 5. Contar servicios activos
        const count = await query(`
            SELECT COUNT(*) as total FROM servicios_cache WHERE activo = 1
        `);
        console.log(`\n✅ Total de servicios activos: ${count[0].total}`);

        console.log('\n✅ Verificación completada exitosamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

// Ejecutar
fixServiciosCacheTable();
