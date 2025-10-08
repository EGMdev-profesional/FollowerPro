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

module.exports = router;
