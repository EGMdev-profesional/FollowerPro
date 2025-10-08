const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const fs = require('fs');

// Endpoint temporal para inicializar la base de datos
router.get('/init-database', async (req, res) => {
    let connection;
    const logs = [];
    
    try {
        logs.push('🔄 Iniciando proceso de inicialización de base de datos...');
        logs.push(`Host: ${process.env.DB_HOST}`);
        logs.push(`Database: ${process.env.DB_NAME}`);
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: false
        });

        logs.push('✅ Conectado a MySQL\n');

        // Leer el schema completo
        const schemaContent = fs.readFileSync('./database_schema.sql', 'utf8');
        
        // Dividir el SQL en statements individuales
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

        logs.push(`📋 Encontrados ${sqlBlocks.length} statements SQL para ejecutar\n`);

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
                    logs.push(`🔄 [${i + 1}/${sqlBlocks.length}] Ejecutando: ${statementType}`);
                    await connection.query(cleanStatement);
                    logs.push(`✅ [${i + 1}/${sqlBlocks.length}] ${statementType} - OK`);
                    successCount++;
                }
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                    error.message.includes('already exists') ||
                    error.code === 'ER_DUP_ENTRY') {
                    logs.push(`⚠️  [${i + 1}/${sqlBlocks.length}] ${statementType} - Ya existe (omitido)`);
                    skipCount++;
                } else {
                    logs.push(`❌ [${i + 1}/${sqlBlocks.length}] ${statementType} - ERROR: ${error.message}`);
                    errorCount++;
                }
            }
        }

        logs.push('\n' + '='.repeat(60));
        logs.push('📊 RESUMEN DE EJECUCIÓN:');
        logs.push('='.repeat(60));
        logs.push(`✅ Exitosos: ${successCount}`);
        logs.push(`⚠️  Omitidos: ${skipCount}`);
        logs.push(`❌ Errores: ${errorCount}`);
        logs.push('='.repeat(60));

        // Verificar tablas creadas
        logs.push('\n🔍 Verificando tablas en la base de datos...');
        const [tables] = await connection.query('SHOW TABLES');
        logs.push(`\n📋 Total de tablas creadas: ${tables.length}`);
        
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            logs.push(`   ${index + 1}. ✓ ${tableName}`);
        });

        // Verificar vistas
        const [views] = await connection.query(
            "SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ?",
            [process.env.DB_NAME]
        );
        
        if (views.length > 0) {
            logs.push(`\n👁️  Vistas creadas: ${views.length}`);
            views.forEach((view, index) => {
                logs.push(`   ${index + 1}. ✓ ${view.TABLE_NAME}`);
            });
        }

        // Verificar triggers
        const [triggers] = await connection.query(
            "SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?",
            [process.env.DB_NAME]
        );
        
        if (triggers.length > 0) {
            logs.push(`\n⚡ Triggers creados: ${triggers.length}`);
            triggers.forEach((trigger, index) => {
                logs.push(`   ${index + 1}. ✓ ${trigger.TRIGGER_NAME}`);
            });
        }

        logs.push('\n🎉 ¡Base de datos inicializada correctamente!');

        // Enviar respuesta HTML con los logs
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Inicialización de Base de Datos</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        background: #1e1e1e;
                        color: #d4d4d4;
                        padding: 20px;
                        margin: 0;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: #252526;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    }
                    h1 {
                        color: #4ec9b0;
                        border-bottom: 2px solid #4ec9b0;
                        padding-bottom: 10px;
                    }
                    .log-line {
                        margin: 5px 0;
                        line-height: 1.6;
                    }
                    .success { color: #4ec9b0; }
                    .warning { color: #ce9178; }
                    .error { color: #f48771; }
                    .info { color: #569cd6; }
                    pre {
                        background: #1e1e1e;
                        padding: 15px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Inicialización Completada</h1>
                    <pre>${logs.map(log => {
                        let className = '';
                        if (log.includes('✅')) className = 'success';
                        else if (log.includes('⚠️')) className = 'warning';
                        else if (log.includes('❌')) className = 'error';
                        else if (log.includes('🔄') || log.includes('🔍')) className = 'info';
                        return `<div class="log-line ${className}">${log}</div>`;
                    }).join('')}</pre>
                    <p style="margin-top: 20px; color: #ce9178;">
                        ⚠️ <strong>IMPORTANTE:</strong> Por seguridad, elimina este endpoint después de usarlo.
                    </p>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        logs.push(`\n❌ ERROR FATAL: ${error.message}`);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error en Inicialización</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        background: #1e1e1e;
                        color: #f48771;
                        padding: 20px;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: #252526;
                        padding: 30px;
                        border-radius: 8px;
                    }
                    pre {
                        background: #1e1e1e;
                        padding: 15px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Error en Inicialización</h1>
                    <pre>${logs.join('\n')}\n\nStack: ${error.stack}</pre>
                </div>
            </body>
            </html>
        `);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

module.exports = router;
