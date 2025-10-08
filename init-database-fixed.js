const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function initDatabase() {
    let connection;
    try {
        console.log('🔄 Conectando a la base de datos...');
        console.log('Host:', process.env.DB_HOST);
        console.log('Database:', process.env.DB_NAME);
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: false // Cambiado a false para ejecutar una por una
        });

        console.log('✅ Conectado a MySQL\n');

        // Leer el schema completo
        const schemaContent = fs.readFileSync('./database_schema.sql', 'utf8');
        
        // Dividir el SQL en statements individuales
        // Remover comentarios y líneas vacías
        const statements = schemaContent
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed && 
                       !trimmed.startsWith('--') && 
                       !trimmed.startsWith('/*') &&
                       !trimmed.startsWith('*/') &&
                       trimmed !== 'COMMIT;' &&
                       trimmed !== 'START TRANSACTION;';
            })
            .join('\n');

        // Separar por punto y coma pero mantener los bloques DELIMITER
        const sqlBlocks = [];
        let currentBlock = '';
        let inDelimiterBlock = false;
        
        statements.split('\n').forEach(line => {
            if (line.includes('DELIMITER $$')) {
                inDelimiterBlock = true;
                return;
            }
            if (line.includes('DELIMITER ;')) {
                inDelimiterBlock = false;
                if (currentBlock.trim()) {
                    sqlBlocks.push(currentBlock.trim());
                    currentBlock = '';
                }
                return;
            }
            
            currentBlock += line + '\n';
            
            if (!inDelimiterBlock && line.trim().endsWith(';')) {
                if (currentBlock.trim()) {
                    sqlBlocks.push(currentBlock.trim());
                    currentBlock = '';
                }
            }
        });

        if (currentBlock.trim()) {
            sqlBlocks.push(currentBlock.trim());
        }

        console.log(`📋 Encontrados ${sqlBlocks.length} statements SQL para ejecutar\n`);

        // Ejecutar cada statement
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let i = 0; i < sqlBlocks.length; i++) {
            const statement = sqlBlocks[i];
            
            // Identificar el tipo de statement
            let statementType = 'UNKNOWN';
            if (statement.toUpperCase().includes('CREATE TABLE')) {
                const match = statement.match(/CREATE TABLE [`']?(\w+)[`']?/i);
                statementType = match ? `CREATE TABLE ${match[1]}` : 'CREATE TABLE';
            } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
                const match = statement.match(/CREATE TRIGGER [`']?(\w+)[`']?/i);
                statementType = match ? `CREATE TRIGGER ${match[1]}` : 'CREATE TRIGGER';
            } else if (statement.toUpperCase().includes('CREATE VIEW')) {
                const match = statement.match(/CREATE VIEW [`']?(\w+)[`']?/i);
                statementType = match ? `CREATE VIEW ${match[1]}` : 'CREATE VIEW';
            } else if (statement.toUpperCase().includes('INSERT INTO')) {
                const match = statement.match(/INSERT INTO [`']?(\w+)[`']?/i);
                statementType = match ? `INSERT INTO ${match[1]}` : 'INSERT INTO';
            } else if (statement.toUpperCase().includes('SET ')) {
                statementType = 'SET';
            }

            try {
                // Limpiar el statement de DELIMITER
                let cleanStatement = statement
                    .replace(/DELIMITER \$\$/g, '')
                    .replace(/DELIMITER ;/g, '')
                    .replace(/\$\$/g, ';')
                    .trim();

                if (cleanStatement && cleanStatement !== ';') {
                    console.log(`🔄 [${i + 1}/${sqlBlocks.length}] Ejecutando: ${statementType}`);
                    await connection.query(cleanStatement);
                    console.log(`✅ [${i + 1}/${sqlBlocks.length}] ${statementType} - OK`);
                    successCount++;
                }
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                    error.message.includes('already exists') ||
                    error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️  [${i + 1}/${sqlBlocks.length}] ${statementType} - Ya existe (omitido)`);
                    skipCount++;
                } else {
                    console.error(`❌ [${i + 1}/${sqlBlocks.length}] ${statementType} - ERROR:`);
                    console.error(`   Código: ${error.code}`);
                    console.error(`   Mensaje: ${error.message}`);
                    errorCount++;
                    
                    // No detener la ejecución, continuar con el siguiente
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE EJECUCIÓN:');
        console.log('='.repeat(60));
        console.log(`✅ Exitosos: ${successCount}`);
        console.log(`⚠️  Omitidos: ${skipCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        console.log('='.repeat(60));

        // Verificar tablas creadas
        console.log('\n🔍 Verificando tablas en la base de datos...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`\n📋 Total de tablas creadas: ${tables.length}`);
        
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ✓ ${tableName}`);
        });

        // Verificar vistas
        const [views] = await connection.query(
            "SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ?",
            [process.env.DB_NAME]
        );
        
        if (views.length > 0) {
            console.log(`\n👁️  Vistas creadas: ${views.length}`);
            views.forEach((view, index) => {
                console.log(`   ${index + 1}. ✓ ${view.TABLE_NAME}`);
            });
        }

        // Verificar triggers
        const [triggers] = await connection.query(
            "SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?",
            [process.env.DB_NAME]
        );
        
        if (triggers.length > 0) {
            console.log(`\n⚡ Triggers creados: ${triggers.length}`);
            triggers.forEach((trigger, index) => {
                console.log(`   ${index + 1}. ✓ ${trigger.TRIGGER_NAME}`);
            });
        }

        console.log('\n🎉 ¡Base de datos inicializada correctamente!');
        
    } catch (error) {
        console.error('\n❌ ERROR FATAL:', error.message);
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

initDatabase();
