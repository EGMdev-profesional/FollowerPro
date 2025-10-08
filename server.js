const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// Importar configuración de base de datos
const { initDatabase } = require('./config/database');
const User = require('./models/User');

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
const setupRoutes = require('./routes/setup');

// Usar rutas
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes); // Alias para rutas de usuario
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/setup', setupRoutes); // Ruta temporal para inicialización

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

// Inicializar aplicación
async function startServer() {
    try {
        // Inicializar base de datos
        await initDatabase();
        
        // Crear usuario administrador si no existe
        await User.createAdmin();
        
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
