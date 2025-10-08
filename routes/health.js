const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        // Test database connection
        const result = await query('SELECT 1 as test');
        
        // Get table counts
        const tables = await query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        const tableCounts = {};
        for (const table of tableNames) {
            try {
                const count = await query(`SELECT COUNT(*) as count FROM ${table}`);
                tableCounts[table] = count[0].count;
            } catch (error) {
                tableCounts[table] = `Error: ${error.message}`;
            }
        }
        
        res.json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date().toISOString(),
            tables: tableCounts,
            session: {
                hasSession: !!req.session,
                userId: req.session?.userId || null,
                userRole: req.session?.userRole || null
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error.message,
            stack: error.stack
        });
    }
});

// Test admin routes
router.get('/test-admin', async (req, res) => {
    try {
        console.log('🧪 Testing admin routes...');
        console.log('Session:', req.session);
        
        // Test users query
        const users = await query('SELECT COUNT(*) as count FROM usuarios');
        console.log('✅ Users query OK:', users);
        
        // Test transactions query
        const transactions = await query('SELECT COUNT(*) as count FROM transacciones');
        console.log('✅ Transactions query OK:', transactions);
        
        // Test orders query
        const orders = await query('SELECT COUNT(*) as count FROM ordenes');
        console.log('✅ Orders query OK:', orders);
        
        res.json({
            status: 'OK',
            tests: {
                users: users[0].count,
                transactions: transactions[0].count,
                orders: orders[0].count
            },
            session: {
                userId: req.session?.userId,
                userRole: req.session?.userRole
            }
        });
    } catch (error) {
        console.error('❌ Test failed:', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }
});

// Fix order_id column type
router.post('/fix-order-id', async (req, res) => {
    try {
        console.log('🔧 Iniciando corrección de columna order_id...');
        
        // Verificar el tipo actual de la columna
        const [columns] = await query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'ordenes' 
            AND COLUMN_NAME = 'order_id'
        `);

        const currentType = columns.length > 0 ? columns[0].COLUMN_TYPE : 'No encontrado';
        console.log('📋 Tipo actual:', currentType);

        // Si ya es VARCHAR, no hacer nada
        if (currentType.includes('varchar')) {
            return res.json({
                status: 'OK',
                message: 'La columna order_id ya es VARCHAR',
                current_type: currentType,
                action: 'No se requiere cambio'
            });
        }

        // Modificar la columna order_id
        console.log('🔄 Modificando columna order_id de INT a VARCHAR(100)...');
        
        await query(`
            ALTER TABLE ordenes 
            MODIFY COLUMN order_id VARCHAR(100) DEFAULT NULL
        `);

        console.log('✅ Columna order_id modificada exitosamente');

        // Verificar el cambio
        const [newColumns] = await query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'ordenes' 
            AND COLUMN_NAME = 'order_id'
        `);

        const newType = newColumns[0].COLUMN_TYPE;
        console.log('📋 Nuevo tipo:', newType);

        res.json({
            status: 'SUCCESS',
            message: 'Columna order_id corregida exitosamente',
            old_type: currentType,
            new_type: newType,
            action: 'Modificación completada'
        });

    } catch (error) {
        console.error('❌ Error corrigiendo order_id:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Error al corregir la columna',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
