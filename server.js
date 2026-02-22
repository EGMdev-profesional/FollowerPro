const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// Importar configuración de base de datos
const { initDatabase } = require('./config/database');
const User = require('./models/User');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Permite el origen de la petición
    credentials: true // IMPORTANTE: Permite enviar cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true en producción con HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Servir archivos estáticos
app.use(express.static('public'));

// Importar rutas
const apiRoutes = require('./routes/api');
const { router: authRoutes } = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');

// Usar rutas
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes); // Alias para rutas de usuario
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', healthRoutes); // Health check routes

// Middleware para verificar autenticación en rutas protegidas
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    next();
};

// Rutas principales
app.get('/', (req, res) => {
    // Si está logueado, ir al dashboard
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    // Si no, mostrar landing page
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/login.html', (req, res) => {
    // Si ya está logueado, redirigir al dashboard
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
    // Si ya está logueado, redirigir al dashboard
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Ruta para logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destruyendo sesión:', err);
        }
        res.redirect('/login.html');
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada'
    });
});

// Función para arreglar el schema automáticamente
async function fixDatabaseSchema() {
    const { query, getConnection } = require('./config/database');
    
    try {
        console.log('🔧 Verificando y corrigiendo schema de base de datos...');
        
        // Verificar si la columna category es VARCHAR
        const connection = getConnection();
        const [columns] = await connection.execute(
            "SHOW COLUMNS FROM servicios_cache LIKE 'category'"
        );
        
        if (columns.length > 0 && columns[0].Type.includes('varchar')) {
            console.log('📝 Aplicando correcciones al schema...');
            
            // Eliminar índice si existe
            try {
                await query('ALTER TABLE servicios_cache DROP INDEX idx_category');
                console.log('✅ Índice idx_category eliminado');
            } catch (err) {
                // Índice no existe, continuar
            }
            
            // Modificar columna category
            await query('ALTER TABLE servicios_cache MODIFY COLUMN category TEXT NOT NULL');
            console.log('✅ Columna category actualizada a TEXT');
            
            // Modificar columna type
            await query('ALTER TABLE servicios_cache MODIFY COLUMN type VARCHAR(100) NOT NULL');
            console.log('✅ Columna type actualizada a VARCHAR(100)');
            
            // Limpiar datos inválidos
            await query('DELETE FROM servicios_cache WHERE category IS NULL OR category = "" OR name IS NULL OR name = ""');
            console.log('✅ Datos inválidos limpiados');
            
            console.log('✅ Schema corregido exitosamente');
        } else {
            console.log('✅ Schema ya está actualizado');
        }
    } catch (error) {
        console.warn('⚠️ No se pudo verificar/corregir schema:', error.message);
        console.log('ℹ️ El sistema continuará normalmente');
    }
}

// Inicializar aplicación
async function startServer() {
    try {
        // Inicializar base de datos
        await initDatabase();
        
        // Arreglar schema automáticamente (solo se ejecuta si es necesario)
        await fixDatabaseSchema();
        
        // Crear usuario administrador si no existe
        await User.createAdmin();

        // Sincronización periódica de estados con SMMCoder (background)
        const enableOrderSync = String(process.env.ENABLE_ORDER_SYNC || 'true').toLowerCase() === 'true';
        const syncIntervalMs = Number(process.env.ORDER_SYNC_INTERVAL_MS || 120000);
        if (enableOrderSync) {
            let isSyncRunning = false;
            setInterval(async () => {
                if (isSyncRunning) return;
                isSyncRunning = true;
                try {
                    await Order.syncWithSMMCoder();
                } catch (err) {
                    console.error('⚠️ Error en syncWithSMMCoder:', err.message);
                } finally {
                    isSyncRunning = false;
                }
            }, syncIntervalMs);
            console.log(`🔄 Sync de órdenes habilitado cada ${Math.round(syncIntervalMs / 1000)}s`);
        } else {
            console.log('⏸️ Sync de órdenes deshabilitado (ENABLE_ORDER_SYNC=false)');
        }

        // Reintentar órdenes Pending locales (sin ID externo) y auto-cancelar si expiran
        const enableLocalPendingRetry = String(process.env.ENABLE_LOCAL_PENDING_RETRY || 'true').toLowerCase() === 'true';
        const localPendingIntervalMs = Number(process.env.LOCAL_PENDING_RETRY_INTERVAL_MS || 10 * 60 * 1000);
        if (enableLocalPendingRetry) {
            let isLocalRetryRunning = false;
            setInterval(async () => {
                if (isLocalRetryRunning) return;
                isLocalRetryRunning = true;
                try {
                    await Order.processLocalPendingOrders();
                } catch (err) {
                    console.error('⚠️ Error en processLocalPendingOrders:', err.message);
                } finally {
                    isLocalRetryRunning = false;
                }
            }, localPendingIntervalMs);
            console.log(`🔁 Retry de órdenes Pending locales habilitado cada ${Math.round(localPendingIntervalMs / 1000)}s`);
        } else {
            console.log('⏸️ Retry de órdenes Pending locales deshabilitado (ENABLE_LOCAL_PENDING_RETRY=false)');
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 FollowerPro ejecutándose en http://localhost:${PORT}`);
            console.log(`👑 Panel de administración disponible`);
            console.log(`📧 Admin: ${process.env.ADMIN_EMAIL || 'admin@panelsmm.com'}`);
            console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando servidor...');
    const { closeDatabase } = require('./config/database');
    await closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Cerrando servidor...');
    const { closeDatabase } = require('./config/database');
    await closeDatabase();
    process.exit(0);
});

// Iniciar servidor
startServer();
