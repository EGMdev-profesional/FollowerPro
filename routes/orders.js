const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const router = express.Router();

// Crear nueva orden
router.post('/create', async (req, res) => {
    try {
        // Debug: Log de sesión
        console.log('📋 Sesión recibida:', {
            sessionID: req.sessionID,
            userId: req.session?.userId,
            cookies: req.cookies,
            headers: {
                cookie: req.headers.cookie ? 'presente' : 'ausente',
                'content-type': req.headers['content-type']
            }
        });
        
        // Verificar sesión
        if (!req.session || !req.session.userId) {
            console.error('❌ No hay sesión activa');
            return res.status(401).json({
                success: false,
                message: 'No autenticado. Por favor inicia sesión nuevamente.'
            });
        }
        
        console.log('✅ Usuario autenticado:', req.session.userId);

        const { service_id, link, quantity } = req.body;
        const userId = req.session.userId;

        console.log('📦 Datos recibidos:', { service_id, link, quantity, userId });

        // Validaciones básicas
        if (!service_id || !link || !quantity) {
            console.error('❌ Datos incompletos:', { service_id, link, quantity });
            return res.status(400).json({
                success: false,
                message: 'service_id, link y quantity son requeridos'
            });
        }

        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser un número mayor a 0'
            });
        }

        // Validar formato de link
        const trimmedLink = String(link).trim();
        if (!trimmedLink || !isValidUrl(trimmedLink)) {
            return res.status(400).json({
                success: false,
                message: 'El link debe ser una URL válida (debe comenzar con http:// o https://)'
            });
        }

        console.log('✅ Validaciones pasadas, creando orden...');

        // Crear la orden
        const orderId = await Order.create(userId, {
            service_id: parseInt(service_id),
            link: trimmedLink,
            quantity: parsedQuantity
        });

        console.log('✅ Orden creada con ID:', orderId);

        // Obtener la orden creada con detalles
        const order = await Order.getById(orderId, userId);

        if (!order) {
            throw new Error('No se pudo recuperar la orden creada');
        }

        res.status(201).json({
            success: true,
            message: 'Orden creada exitosamente',
            order: {
                id: order.id,
                order_id: order.order_id,
                service_id: order.service_id,
                service_name: order.service_name,
                link: order.link,
                quantity: order.quantity,
                charge: order.charge,
                status: order.status,
                fecha_creacion: order.fecha_creacion
            }
        });

    } catch (error) {
        console.error('❌ Error creando orden:', error);
        console.error('Stack:', error.stack);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al crear la orden'
        });
    }
});

// Obtener órdenes del usuario
router.get('/my-orders', async (req, res) => {
    try {
        console.log('📋 Obteniendo órdenes del usuario...');
        
        // Verificar sesión
        if (!req.session.userId) {
            console.log('❌ No hay sesión activa');
            return res.status(401).json({ message: 'No autenticado' });
        }

        const userId = req.session.userId;
        console.log('✅ Usuario ID:', userId);
        
        const { page = 1, limit = 20, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        console.log('🔍 Consultando órdenes...');
        const orders = await Order.getByUserId(
            userId,
            parseInt(limit),
            offset,
            status
        );
        console.log(`✅ Órdenes encontradas: ${orders.length}`);

        // Obtener estadísticas del usuario
        console.log('📊 Obteniendo estadísticas...');
        const stats = await Order.getStats(userId);
        console.log('✅ Estadísticas obtenidas:', stats);

        res.json({
            orders: orders.map(order => ({
                id: order.id,
                order_id: order.order_id,
                service_name: order.service_name,
                category: order.category,
                link: order.link,
                quantity: order.quantity,
                charge: order.charge,
                status: order.status,
                start_count: order.start_count,
                remains: order.remains,
                fecha_creacion: order.fecha_creacion,
                fecha_actualizacion: order.fecha_actualizacion
            })),
            stats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: stats.total_ordenes || 0
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo órdenes:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            message: 'Error al obtener las órdenes',
            error: error.message
        });
    }
});

// Obtener orden específica
router.get('/:orderId', async (req, res) => {
    try {
        // Verificar sesión
        if (!req.session.userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const { orderId } = req.params;
        const userId = req.session.userId;

        const order = await Order.getById(parseInt(orderId), userId);

        if (!order) {
            return res.status(404).json({
                message: 'Orden no encontrada'
            });
        }

        res.json({
            order: {
                id: order.id,
                order_id: order.order_id,
                service_name: order.service_name,
                category: order.category,
                type: order.type,
                link: order.link,
                quantity: order.quantity,
                charge: order.charge,
                status: order.status,
                start_count: order.start_count,
                remains: order.remains,
                currency: order.currency,
                fecha_creacion: order.fecha_creacion,
                fecha_actualizacion: order.fecha_actualizacion,
                notas: order.notas
            }
        });

    } catch (error) {
        console.error('Error obteniendo orden:', error);
        res.status(500).json({
            message: 'Error al obtener la orden'
        });
    }
});

// Cancelar orden
router.post('/:orderId/cancel', async (req, res) => {
    try {
        // Verificar sesión
        if (!req.session.userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const { orderId } = req.params;
        const userId = req.session.userId;
        const { reason = 'Cancelada por usuario' } = req.body;

        const newBalance = await Order.cancel(parseInt(orderId), userId, reason);

        res.json({
            message: 'Orden cancelada y reembolsada exitosamente',
            new_balance: newBalance
        });

    } catch (error) {
        console.error('Error cancelando orden:', error);
        res.status(400).json({
            message: error.message || 'Error al cancelar la orden'
        });
    }
});

// Calcular costo de orden (antes de crear)
router.post('/calculate-cost', async (req, res) => {
    try {
        // Verificar sesión
        if (!req.session.userId) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        const { service_id, quantity } = req.body;

        if (!service_id || !quantity) {
            return res.status(400).json({
                message: 'service_id y quantity son requeridos'
            });
        }

        // Obtener información del servicio
        const { query } = require('../config/database');
        const services = await query(
            'SELECT * FROM servicios_cache WHERE service_id = ? AND activo = 1',
            [service_id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                message: 'Servicio no encontrado'
            });
        }

        const service = services[0];
        const qty = parseInt(quantity);

        // Validar cantidad
        if (qty < service.min || qty > service.max) {
            return res.status(400).json({
                message: `Cantidad debe estar entre ${service.min} y ${service.max}`
            });
        }

        // Calcular costo
        const costoPorMil = parseFloat(service.precio_final);
        const costoTotal = (qty / 1000) * costoPorMil;

        // Verificar balance del usuario
        const userId = req.session.userId;
        const user = await User.findById(userId);
        const balanceActual = parseFloat(user.balance);

        res.json({
            service: {
                id: service.service_id,
                name: service.name,
                category: service.category,
                rate: service.rate,
                markup: service.markup,
                precio_final: service.precio_final,
                min: service.min,
                max: service.max
            },
            calculation: {
                quantity: qty,
                cost_per_1000: costoPorMil,
                total_cost: costoTotal,
                currency: 'USD'
            },
            user_balance: {
                current: balanceActual,
                after_order: balanceActual - costoTotal,
                sufficient: balanceActual >= costoTotal
            }
        });

    } catch (error) {
        console.error('Error calculando costo:', error);
        res.status(500).json({
            message: 'Error al calcular el costo'
        });
    }
});

// Función auxiliar para validar URLs
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

module.exports = router;
