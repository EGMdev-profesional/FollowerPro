const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { query } = require('../config/database');
const router = express.Router();

// Middleware para verificar que sea admin
const requireAdmin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'No autenticado' });
    }
    
    // Verificar que sea admin (esto se puede mejorar consultando la BD)
    if (req.session.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    }
    
    next();
};

// Obtener estadísticas generales
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE estado != 'eliminado') as total_usuarios,
                (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo') as usuarios_activos,
                (SELECT COUNT(*) FROM ordenes) as total_ordenes,
                (SELECT SUM(balance) FROM usuarios) as balance_total
        `);
        
        res.json({
            stats: stats[0]
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});

// Obtener todos los usuarios
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let sql = `
            SELECT id, email, nombre, apellido, balance, rol, estado, 
                   fecha_registro, ultima_conexion
            FROM usuarios 
            WHERE estado != 'eliminado'
        `;
        
        const params = [];
        
        if (search) {
            sql += ` AND (nombre LIKE ? OR email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        sql += ` ORDER BY fecha_registro DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
        
        const users = await query(sql, params);
        
        // Obtener total de usuarios
        const totalResult = await query(
            'SELECT COUNT(*) as total FROM usuarios WHERE estado != "eliminado"'
        );
        
        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// Actualizar balance de usuario
router.put('/users/:userId/balance', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description = 'Ajuste manual por administrador' } = req.body;
        
        if (!amount || isNaN(amount)) {
            return res.status(400).json({ message: 'Monto inválido' });
        }
        
        const user = await User.findById(parseInt(userId));
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        const newBalance = parseFloat(user.balance) + parseFloat(amount);
        
        await query(
            'UPDATE usuarios SET balance = ? WHERE id = ?',
            [newBalance, userId]
        );
        
        // Registrar transacción
        await query(`
            INSERT INTO transacciones 
            (usuario_id, tipo, monto, balance_anterior, balance_nuevo, descripcion, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'completada')
        `, [
            userId,
            amount > 0 ? 'recarga' : 'ajuste',
            amount,
            user.balance,
            newBalance,
            description
        ]);
        
        res.json({
            message: 'Balance actualizado exitosamente',
            new_balance: newBalance
        });
        
    } catch (error) {
        console.error('Error actualizando balance:', error);
        res.status(500).json({ message: 'Error al actualizar balance' });
    }
});

// Cambiar estado de usuario
router.put('/users/:userId/status', requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['activo', 'suspendido', 'inactivo'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        
        await query(
            'UPDATE usuarios SET estado = ? WHERE id = ?',
            [status, userId]
        );
        
        res.json({ message: 'Estado actualizado exitosamente' });
        
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ message: 'Error al actualizar estado' });
    }
});

// Obtener todas las transacciones
router.get('/transactions', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const transactions = await query(`
            SELECT t.*, u.nombre, u.email
            FROM transacciones t
            LEFT JOIN usuarios u ON t.usuario_id = u.id
            ORDER BY t.fecha_creacion DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), offset]);
        
        const totalResult = await query('SELECT COUNT(*) as total FROM transacciones');
        
        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo transacciones:', error);
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
});

// Obtener todas las órdenes
router.get('/orders', requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let sql = `
            SELECT o.*, u.nombre, u.email, s.name as service_name
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            LEFT JOIN servicios_cache s ON o.service_id = s.service_id
        `;
        
        const params = [];
        
        if (status) {
            sql += ` WHERE o.status = ?`;
            params.push(status);
        }
        
        sql += ` ORDER BY o.fecha_creacion DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
        
        const orders = await query(sql, params);
        
        const totalResult = await query('SELECT COUNT(*) as total FROM ordenes');
        
        res.json({
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo órdenes:', error);
        res.status(500).json({ message: 'Error al obtener órdenes' });
    }
});

// Procesar órdenes pendientes (reenviar a API externa)
router.post('/orders/process-pending', requireAdmin, async (req, res) => {
    try {
        console.log('🔄 Procesando órdenes pendientes...');
        
        // Obtener órdenes pendientes que no se enviaron a la API
        const pendingOrders = await query(`
            SELECT o.*, s.name as service_name
            FROM ordenes o
            LEFT JOIN servicios_cache s ON o.service_id = s.service_id
            WHERE o.status = 'Pending' 
            AND (o.order_id LIKE 'ORD-%' OR o.order_id IS NULL)
            ORDER BY o.fecha_creacion ASC
            LIMIT 50
        `);
        
        if (pendingOrders.length === 0) {
            return res.json({
                message: 'No hay órdenes pendientes para procesar',
                processed: 0,
                failed: 0,
                total: 0
            });
        }
        
        console.log(`📊 Encontradas ${pendingOrders.length} órdenes pendientes`);
        
        const Order = require('../models/Order');
        let processed = 0;
        let failed = 0;
        const results = [];
        
        // Procesar cada orden
        for (const order of pendingOrders) {
            try {
                console.log(`📤 Procesando orden #${order.id}...`);
                
                // Intentar enviar a SMMCoder
                const externalOrderId = await Order.sendToSMMCoder(
                    order.id,
                    order.service_id,
                    order.link,
                    order.quantity
                );
                
                if (externalOrderId) {
                    // Actualizar orden con ID externo
                    await query(
                        'UPDATE ordenes SET order_id = ?, status = ?, notas = NULL WHERE id = ?',
                        [externalOrderId, 'In progress', order.id]
                    );
                    
                    processed++;
                    results.push({
                        id: order.id,
                        status: 'success',
                        external_id: externalOrderId
                    });
                    
                    console.log(`✅ Orden #${order.id} procesada con ID externo: ${externalOrderId}`);
                } else {
                    failed++;
                    results.push({
                        id: order.id,
                        status: 'failed',
                        error: 'No se obtuvo ID externo'
                    });
                }
                
                // Pequeña pausa para no sobrecargar la API
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                failed++;
                results.push({
                    id: order.id,
                    status: 'failed',
                    error: error.message
                });
                
                console.error(`❌ Error procesando orden #${order.id}:`, error.message);
                
                // Actualizar nota en la orden
                await query(
                    'UPDATE ordenes SET notas = ? WHERE id = ?',
                    [`Error al reenviar: ${error.message}`, order.id]
                );
            }
        }
        
        console.log(`✅ Proceso completado: ${processed} exitosas, ${failed} fallidas`);
        
        res.json({
            message: `Proceso completado: ${processed} órdenes procesadas, ${failed} fallidas`,
            processed,
            failed,
            total: pendingOrders.length,
            results
        });
        
    } catch (error) {
        console.error('Error procesando órdenes pendientes:', error);
        res.status(500).json({ 
            message: 'Error al procesar órdenes pendientes',
            error: error.message 
        });
    }
});

// Obtener configuración del sistema
router.get('/config', requireAdmin, async (req, res) => {
    try {
        const config = await query('SELECT * FROM configuracion');
        res.json({ config });
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ message: 'Error al obtener configuración' });
    }
});

// Actualizar configuración
router.put('/config', requireAdmin, async (req, res) => {
    try {
        const { key, value } = req.body;
        
        if (!key) {
            return res.status(400).json({ message: 'Key es requerida' });
        }
        
        await query(`
            INSERT INTO configuracion (clave, valor, fecha_actualizacion)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE valor = ?, fecha_actualizacion = NOW()
        `, [key, value, value]);
        
        res.json({ message: 'Configuración actualizada exitosamente' });
        
    } catch (error) {
        console.error('Error actualizando configuración:', error);
        res.status(500).json({ message: 'Error al actualizar configuración' });
    }
});

module.exports = router;
