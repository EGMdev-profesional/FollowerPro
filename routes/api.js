const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_URL = process.env.SMMCODER_API_URL;
const API_KEY = process.env.SMMCODER_API_KEY;

// Función helper para hacer requests a SMMCoder
async function smmCoderRequest(action, params = {}) {
    try {
        const data = {
            key: API_KEY,
            action: action,
            ...params
        };

        const response = await axios.post(API_URL, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error en SMMCoder API:', error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

// Obtener balance del usuario
router.get('/balance', async (req, res) => {
    try {
        // Verificar sesión
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                error: 'No autenticado'
            });
        }

        // Obtener balance de la base de datos
        const { query } = require('../config/database');
        const users = await query(
            'SELECT balance FROM usuarios WHERE id = ? AND estado = "activo"',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const balance = parseFloat(users[0].balance) || 0;

        res.json({
            success: true,
            data: { balance: balance.toFixed(2) }
        });

    } catch (error) {
        console.error('Error obteniendo balance:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Obtener lista de servicios
router.get('/services', async (req, res) => {
    try {
        console.log('📡 Solicitando servicios de SMMCoder API...');
        
        // Obtener servicios de la API
        const result = await smmCoderRequest('services');
        
        console.log('📥 Respuesta recibida:', {
            success: result.success,
            dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
            count: Array.isArray(result.data) ? result.data.length : 0
        });
        
        // Verificar si la respuesta es exitosa
        if (result.success && result.data && Array.isArray(result.data)) {
            // Devolver servicios al cliente
            res.json(result);
            
            // Sincronizar en segundo plano
            console.log(`🔄 Iniciando sincronización de ${result.data.length} servicios...`);
            syncServicesToDatabase(result.data).catch(err => {
                console.error('❌ Error en sincronización en segundo plano:', err);
            });
        } else {
            // Si falla la API externa, intentar cargar desde BD local
            console.warn('⚠️ API externa falló, cargando servicios locales...');
            const { query } = require('../config/database');
            const localServices = await query(
                'SELECT service_id as service, name, category, rate, min, max, type, refill, `cancel` FROM servicios_cache WHERE activo = 1 ORDER BY category, name'
            );
            
            if (localServices.length > 0) {
                console.log(`✅ ${localServices.length} servicios cargados desde BD local`);
                res.json({
                    success: true,
                    data: localServices,
                    source: 'local_cache'
                });
            } else {
                throw new Error('No hay servicios disponibles. API externa no responde y BD local está vacía.');
            }
        }
    } catch (error) {
        console.error('❌ Error obteniendo servicios:', error.message);
        
        // Último intento: cargar desde BD local
        try {
            const { query } = require('../config/database');
            const localServices = await query(
                'SELECT service_id as service, name, category, rate, min, max, type, refill, `cancel` FROM servicios_cache WHERE activo = 1 ORDER BY category, name'
            );
            
            if (localServices.length > 0) {
                console.log(`✅ Fallback: ${localServices.length} servicios desde BD local`);
                res.json({
                    success: true,
                    data: localServices,
                    source: 'local_cache_fallback'
                });
            } else {
                res.status(503).json({ 
                    success: false,
                    error: 'Servicios no disponibles temporalmente. Por favor intenta más tarde.',
                    details: error.message 
                });
            }
        } catch (dbError) {
            res.status(500).json({ 
                success: false,
                error: 'Error al cargar servicios',
                details: dbError.message 
            });
        }
    }
});

// Variable global para rastrear el estado de sincronización
let syncStatus = {
    isSync: false,
    progress: 0,
    total: 0,
    synced: 0
};

// Función para sincronizar servicios en segundo plano
async function syncServicesToDatabase(services) {
    const { query } = require('../config/database');
    
    syncStatus.isSync = true;
    syncStatus.total = services.length;
    syncStatus.synced = 0;
    syncStatus.progress = 0;
    
    console.log(`📥 Sincronizando ${services.length} servicios a la BD en segundo plano...`);
    
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < services.length; i += BATCH_SIZE) {
        const batch = services.slice(i, i + BATCH_SIZE);
        
        // Procesar batch en paralelo
        await Promise.all(batch.map(async (service) => {
            try {
                await query(`
                    INSERT INTO servicios_cache 
                    (service_id, name, type, category, rate, min, max, refill, \`cancel\`, markup, activo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        type = VALUES(type),
                        category = VALUES(category),
                        rate = VALUES(rate),
                        min = VALUES(min),
                        max = VALUES(max),
                        refill = VALUES(refill),
                        \`cancel\` = VALUES(\`cancel\`),
                        markup = VALUES(markup),
                        activo = 1
                `, [
                    service.service,
                    service.name,
                    service.type || 'Default',
                    service.category,
                    parseFloat(service.rate),
                    parseInt(service.min),
                    parseInt(service.max),
                    service.refill ? 1 : 0,
                    service.cancel ? 1 : 0,
                    20
                ]);
                syncStatus.synced++;
            } catch (err) {
                console.error(`❌ Error guardando servicio ${service.service}:`, err.message);
                console.error('Datos del servicio:', {
                    service_id: service.service,
                    name: service.name?.substring(0, 50),
                    type: service.type,
                    category: service.category,
                    rate: service.rate,
                    min: service.min,
                    max: service.max
                });
            }
        }));
        
        syncStatus.progress = Math.round((syncStatus.synced / syncStatus.total) * 100);
        console.log(`📊 Progreso: ${syncStatus.progress}% (${syncStatus.synced}/${syncStatus.total})`);
    }
    
    syncStatus.isSync = false;
    console.log(`✅ ${syncStatus.synced} servicios sincronizados exitosamente`);
    
    // Verificar cuántos servicios hay en la BD
    try {
        const count = await query('SELECT COUNT(*) as total FROM servicios_cache WHERE activo = 1');
        console.log(`📊 Servicios en BD: ${count[0].total}`);
    } catch (err) {
        console.error('Error verificando servicios en BD:', err.message);
    }
}

// Endpoint para verificar el estado de sincronización
router.get('/services/sync-status', (req, res) => {
    res.json(syncStatus);
});

// Crear nueva orden
router.post('/order', async (req, res) => {
    const { service, link, quantity, runs, interval } = req.body;

    const params = {
        service: service,
        link: link,
        quantity: quantity
    };

    // Agregar parámetros opcionales si están presentes
    if (runs) params.runs = runs;
    if (interval) params.interval = interval;

    const result = await smmCoderRequest('add', params);
    res.json(result);
});

// Obtener estado de orden
router.get('/order/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const result = await smmCoderRequest('status', { order: orderId });
    res.json(result);
});

// Obtener estado de múltiples órdenes
router.post('/orders/status', async (req, res) => {
    const { orderIds } = req.body;
    const result = await smmCoderRequest('status', { orders: orderIds.join(',') });
    res.json(result);
});

// Crear refill
router.post('/refill', async (req, res) => {
    const { orderId } = req.body;
    const result = await smmCoderRequest('refill', { order: orderId });
    res.json(result);
});

// Obtener estado de refill
router.get('/refill/:refillId', async (req, res) => {
    const { refillId } = req.params;
    const result = await smmCoderRequest('refill_status', { refill: refillId });
    res.json(result);
});

// Cancelar orden
router.post('/cancel', async (req, res) => {
    const { orderIds } = req.body;
    const result = await smmCoderRequest('cancel', { orders: orderIds.join(',') });
    res.json(result);
});

// Obtener servicios desde BD local (fallback)
router.get('/services/local', async (req, res) => {
    try {
        const { query } = require('../config/database');

        const services = await query(
            'SELECT service_id as service, name, category, rate, min, max, type FROM servicios_cache WHERE activo = 1 ORDER BY category, name'
        );

        // Formatear como espera el frontend
        const formattedServices = services.map(service => ({
            service: service.service,
            name: service.name,
            category: service.category,
            rate: service.rate,
            min: service.min,
            max: service.max,
            type: service.type
        }));

        res.json({
            success: true,
            data: formattedServices
        });

    } catch (error) {
        console.error('Error obteniendo servicios locales:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;
