const { query, transaction } = require('../config/database');
const User = require('./User');

class Order {
    constructor(data) {
        this.id = data.id;
        this.usuario_id = data.usuario_id;
        this.order_id = data.order_id;
        this.service_id = data.service_id;
        this.link = data.link;
        this.quantity = data.quantity;
        this.charge = parseFloat(data.charge);
        this.start_count = data.start_count;
        this.status = data.status;
        this.remains = data.remains;
        this.currency = data.currency;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
        this.notas = data.notas;
    }

    // Crear nueva orden
    static async create(userId, orderData) {
        const { service_id, link, quantity } = orderData;

        console.log(`📝 Creando orden para usuario ${userId}, servicio ${service_id}`);

        // 1. Obtener información del servicio desde la BD (ya sincronizados)
        const services = await query(
            'SELECT * FROM servicios_cache WHERE service_id = ? AND activo = 1',
            [service_id]
        );

        if (services.length === 0) {
            throw new Error('Servicio no encontrado o inactivo. Por favor recarga la página para sincronizar servicios.');
        }

        const service = services[0];

        // 2. Validar cantidad mínima y máxima
        if (quantity < service.min) {
            throw new Error(`Cantidad mínima: ${service.min}`);
        }

        if (quantity > service.max) {
            throw new Error(`Cantidad máxima: ${service.max}`);
        }

        // 3. Calcular costo total con markup del 25%
        let costoPorMil;
        if (service.precio_final !== null && service.precio_final !== undefined) {
            costoPorMil = parseFloat(service.precio_final);
        } else {
            const rate = parseFloat(service.rate);
            const markup = 25; // MARKUP FIJO DEL 25% PARA GANANCIA
            costoPorMil = rate * (1 + markup / 100);
        }
        const costoTotal = (quantity / 1000) * costoPorMil;

        console.log(`💰 Costo calculado: $${costoTotal.toFixed(4)}`);

        // 4. Verificar balance del usuario
        const users = await query(
            'SELECT balance FROM usuarios WHERE id = ? AND estado = "activo"',
            [userId]
        );

        if (users.length === 0) {
            throw new Error('Usuario no encontrado o inactivo');
        }

        const balanceActual = parseFloat(users[0].balance);

        if (balanceActual < costoTotal) {
            throw new Error(`Balance insuficiente. Necesitas $${costoTotal.toFixed(4)} pero tienes $${balanceActual.toFixed(4)}`);
        }

        // 5. Usar transacción SIMPLE y RÁPIDA
        const connection = await require('../config/database').getConnection().getConnection();
        
        try {
            await connection.beginTransaction();
            console.log('🔄 Transacción iniciada');

            // 5a. Actualizar balance
            const nuevoBalance = balanceActual - costoTotal;
            await connection.execute(
                'UPDATE usuarios SET balance = ? WHERE id = ?',
                [nuevoBalance, userId]
            );
            console.log(`✅ Balance actualizado: $${balanceActual} -> $${nuevoBalance}`);

            // 5b. Crear orden
            const orderIdUnique = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const [orderResult] = await connection.execute(
                'INSERT INTO ordenes (usuario_id, service_id, link, quantity, charge, status, order_id, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, service_id, link, quantity, costoTotal, 'Pending', orderIdUnique, 'USD']
            );
            const orderId = orderResult.insertId;
            console.log(`✅ Orden creada con ID: ${orderId}`);

            // 5c. Registrar transacción
            await connection.execute(
                'INSERT INTO transacciones (usuario_id, tipo, monto, balance_anterior, balance_nuevo, descripcion, orden_id, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, 'gasto', costoTotal, balanceActual, nuevoBalance, `Orden #${orderId}`, orderId, 'completada']
            );
            console.log(`✅ Transacción registrada`);

            // Commit rápido
            await connection.commit();
            console.log('✅ Transacción completada');

            connection.release();

            // 6. Enviar a API externa en segundo plano (no bloquear)
            this.sendToSMMCoderAsync(orderId, service_id, link, quantity).catch(err => {
                console.error(`⚠️ Error enviando orden ${orderId} a API:`, err.message);
            });

            return orderId;

        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('❌ Error en transacción:', error.message);
            throw error;
        }
    }

    // Enviar a SMMCoder de forma asíncrona (no bloquear la creación)
    static async sendToSMMCoderAsync(orderId, serviceId, link, quantity) {
        try {
            const externalOrderId = await this.sendToSMMCoder(orderId, serviceId, link, quantity);
            if (externalOrderId) {
                await query(
                    'UPDATE ordenes SET order_id = ?, status = ? WHERE id = ?',
                    [externalOrderId, 'In progress', orderId]
                );
                console.log(`✅ Orden ${orderId} actualizada con ID externo: ${externalOrderId}`);
            }
        } catch (error) {
            // Verificar si es error de fondos insuficientes en la API
            if (error.message.includes('not_enough_funds')) {
                console.warn(`⚠️ Orden ${orderId} creada localmente pero no enviada a API: Fondos insuficientes en cuenta SMMCoder`);
                // Actualizar nota en la orden
                await query(
                    'UPDATE ordenes SET notas = ? WHERE id = ?',
                    ['Pendiente de envío a API (fondos insuficientes en proveedor)', orderId]
                );
            } else {
                console.error(`⚠️ No se pudo enviar orden ${orderId} a API externa:`, error.message);
            }
        }
    }

    // Enviar orden a SMMCoder API
    static async sendToSMMCoder(orderId, serviceId, link, quantity) {
        const axios = require('axios');

        try {
            console.log(`📡 Enviando orden #${orderId} a SMMCoder API...`);
            console.log(`Servicio: ${serviceId}, Cantidad: ${quantity}, Link: ${link}`);

            const response = await axios.post(process.env.SMMCODER_API_URL, {
                key: process.env.SMMCODER_API_KEY,
                action: 'add',
                service: serviceId,
                link: link,
                quantity: quantity
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 15000 // 15 segundos timeout
            });

            console.log('📥 Respuesta de SMMCoder:', response.data);

            if (response.data && response.data.order) {
                console.log(`✅ Orden enviada exitosamente con ID externo: ${response.data.order}`);
                return response.data.order;
            } else {
                throw new Error(`Respuesta inválida de SMMCoder: ${JSON.stringify(response.data)}`);
            }

        } catch (error) {
            console.error(`❌ Error enviando orden #${orderId} a SMMCoder:`, error.message);

            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }

            if (error.code === 'ECONNREFUSED') {
                console.error('🔌 No se pudo conectar con SMMCoder API');
            }

            throw error;
        }
    }

    // Obtener órdenes por usuario
    static async getByUserId(userId, limit = 50, offset = 0, status = null) {
        // Asegurar que limit y offset sean números enteros
        const safeLimit = parseInt(limit) || 50;
        const safeOffset = parseInt(offset) || 0;
        
        let sql = `
            SELECT o.*, s.name as service_name, s.category, s.type,
                   COALESCE(o.order_id, CONCAT('LOCAL-', o.id)) as display_order_id
            FROM ordenes o
            LEFT JOIN servicios_cache s ON o.service_id = s.service_id
            WHERE o.usuario_id = ?
        `;

        const params = [userId];

        if (status) {
            sql += ' AND o.status = ?';
            params.push(status);
        }

        // Agregar LIMIT y OFFSET directamente en el SQL (no como parámetros preparados)
        sql += ` ORDER BY o.fecha_creacion DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

        const orders = await query(sql, params);
        return orders.map(order => ({
            ...order,
            order_id: order.display_order_id // Usar el ID compuesto para mostrar
        }));
    }

    // Obtener orden por ID
    static async getById(orderId, userId = null) {
        let sql = `
            SELECT o.*, s.name as service_name, s.category, s.type,
                   COALESCE(o.order_id, CONCAT('LOCAL-', o.id)) as display_order_id
            FROM ordenes o
            LEFT JOIN servicios_cache s ON o.service_id = s.service_id
            WHERE o.id = ?
        `;

        const params = [orderId];

        if (userId) {
            sql += ' AND o.usuario_id = ?';
            params.push(userId);
        }

        const orders = await query(sql, params);
        if (orders.length > 0) {
            const order = orders[0];
            order.order_id = order.display_order_id; // Usar el ID compuesto
            return new Order(order);
        }
        return null;
    }

    // Actualizar estado de orden
    static async updateStatus(orderId, status, startCount = null, remains = null) {
        let sql = 'UPDATE ordenes SET status = ?, fecha_actualizacion = NOW()';
        const params = [status];

        if (startCount !== null) {
            sql += ', start_count = ?';
            params.push(startCount);
        }

        if (remains !== null) {
            sql += ', remains = ?';
            params.push(remains);
        }

        sql += ' WHERE id = ?';
        params.push(orderId);

        await query(sql, params);

        // Log del cambio de estado
        const order = await this.getById(orderId);
        if (order) {
            await User.logAction(order.usuario_id, 'order_status_update', 
                `Orden #${orderId} cambió a: ${status}`, 'info', {
                    old_status: order.status,
                    new_status: status,
                    start_count: startCount,
                    remains: remains
                });
        }
    }

    // Cancelar orden y reembolsar (DESHABILITADO - Solo admin puede cancelar desde BD)
    static async cancel(orderId, userId, reason = 'Cancelada por usuario') {
        throw new Error('La cancelación de órdenes está deshabilitada. Contacta al administrador.');
    }

    // Obtener estadísticas de órdenes
    static async getStats(userId = null) {
        let sql = 'SELECT * FROM v_stats_ordenes';
        const params = [];

        if (userId) {
            sql = `
                SELECT 
                    COUNT(*) as total_ordenes,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completadas,
                    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendientes,
                    COUNT(CASE WHEN status = 'In progress' THEN 1 END) as en_proceso,
                    COUNT(CASE WHEN status = 'Canceled' THEN 1 END) as canceladas,
                    SUM(charge) as gasto_total,
                    AVG(charge) as orden_promedio
                FROM ordenes 
                WHERE usuario_id = ?
            `;
            params.push(userId);
        }

        const stats = await query(sql, params);
        return stats[0] || {};
    }

    // Sincronizar con SMMCoder API
    static async syncWithSMMCoder() {
        try {
            // Obtener órdenes pendientes o en proceso
            const pendingOrders = await query(`
                SELECT * FROM ordenes 
                WHERE status IN ('Pending', 'In progress') 
                AND order_id IS NOT NULL
                ORDER BY fecha_creacion DESC
                LIMIT 100
            `);

            const axios = require('axios');
            
            for (const order of pendingOrders) {
                try {
                    const response = await axios.post(process.env.SMMCODER_API_URL, {
                        key: process.env.SMMCODER_API_KEY,
                        action: 'status',
                        order: order.order_id
                    });

                    if (response.data && response.data.status) {
                        const newStatus = response.data.status;
                        const startCount = response.data.start_count || order.start_count;
                        const remains = response.data.remains || order.remains;

                        if (newStatus !== order.status) {
                            await this.updateStatus(order.id, newStatus, startCount, remains);
                            console.log(`Orden #${order.id} actualizada: ${order.status} -> ${newStatus}`);
                        }
                    }

                } catch (orderError) {
                    console.error(`Error sincronizando orden #${order.id}:`, orderError.message);
                }

                // Pequeña pausa para no sobrecargar la API
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`Sincronización completada: ${pendingOrders.length} órdenes verificadas`);

        } catch (error) {
            console.error('Error en sincronización general:', error.message);
        }
    }

    // Obtener todas las órdenes (para admin)
    static async getAll(limit = 50, offset = 0, status = null, userId = null) {
        let sql = `
            SELECT o.*, u.nombre, u.email, s.name as service_name, s.category
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            LEFT JOIN servicios_cache s ON o.service_id = s.service_id
            WHERE 1=1
        `;
        
        const params = [];

        if (status) {
            sql += ' AND o.status = ?';
            params.push(status);
        }

        if (userId) {
            sql += ' AND o.usuario_id = ?';
            params.push(userId);
        }

        sql += ' ORDER BY o.fecha_creacion DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await query(sql, params);
    }
}

module.exports = Order;
