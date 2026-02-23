const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { requestPasswordReset, resetPassword } = require('../services/passwordResetService');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, pais } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                message: 'Este email ya está registrado'
            });
        }

        // Crear usuario
        const newUser = await User.create({
            nombre,
            apellido,
            email,
            password,
            telefono,
            pais
        });

        // Log de registro exitoso
        await User.logAction(newUser.id, 'registro', 'Usuario registrado desde web', 'info', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: {
                id: newUser.id,
                nombre: newUser.nombre,
                email: newUser.email,
                balance: newUser.balance
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email y contraseña son requeridos'
            });
        }

        // Intentar login
        const user = await User.login(email, password);

        // Generar JWT token
        const tokenExpiry = remember ? '30d' : '24h';
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                rol: user.rol 
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        // Configurar sesión
        req.session.userId = user.id;
        req.session.userRole = user.rol;

        // Log de login exitoso
        await User.logAction(user.id, 'login', 'Login exitoso desde web', 'info', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                balance: user.balance,
                estado: user.estado
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        
        // Log de intento fallido
        if (req.body.email) {
            const userData = await User.findByEmail(req.body.email);
            if (userData) {
                await User.logAction(userData.id, 'login_failed', 'Intento de login fallido', 'warning', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    reason: error.message
                });
            }
        }

        res.status(401).json({
            message: error.message || 'Credenciales inválidas'
        });
    }
});

// Obtener perfil de usuario
router.get('/profile', async (req, res) => {
    try {
        // Verificar sesión
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Devolver información del usuario (sin contraseña)
        res.json({
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                balance: user.balance,
                rol: user.rol,
                estado: user.estado,
                fecha_registro: user.fecha_registro,
                telefono: user.telefono,
                pais: user.pais
            }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.estado !== 'activo') {
            return res.status(403).json({ message: 'Cuenta inactiva' });
        }

        res.json({
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
                balance: user.balance,
                estado: user.estado
            }
        });

    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    try {
        // Destruir sesión
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destruyendo sesión:', err);
            }
        });

        res.json({ message: 'Logout exitoso' });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener perfil del usuario (con sesión)
router.get('/profile', async (req, res) => {
    try {
        // Verificar si hay sesión activa
        if (!req.session.userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                telefono: user.telefono,
                pais: user.pais,
                balance: user.balance,
                rol: user.rol,
                estado: user.estado,
                fecha_registro: user.fecha_registro,
                ultima_conexion: user.ultima_conexion
            }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener perfil del usuario (con JWT - para API)
router.get('/profile-jwt', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                telefono: user.telefono,
                pais: user.pais,
                balance: user.balance,
                rol: user.rol,
                estado: user.estado,
                fecha_registro: user.fecha_registro,
                ultima_conexion: user.ultima_conexion
            }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Actualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { nombre, apellido, telefono, pais } = req.body;
        const userId = req.user.userId;

        // Actualizar datos del usuario
        const sql = `
            UPDATE usuarios 
            SET nombre = ?, apellido = ?, telefono = ?, pais = ?
            WHERE id = ?
        `;
        
        await require('../config/database').query(sql, [nombre, apellido, telefono, pais, userId]);

        // Log de actualización
        await User.logAction(userId, 'profile_update', 'Perfil actualizado', 'info');

        res.json({ message: 'Perfil actualizado exitosamente' });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Cambiar contraseña (con sesión)
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Verificar sesión
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }
        
        const userId = req.session.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Contraseña actual y nueva son requeridas'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener usuario actual
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar contraseña actual
        const isValidPassword = await User.verifyPassword(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        const sql = 'UPDATE usuarios SET password = ? WHERE id = ?';
        await require('../config/database').query(sql, [hashedPassword, userId]);

        // Log de cambio de contraseña
        await User.logAction(userId, 'password_change', 'Contraseña cambiada', 'info');

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email requerido' });
        }

        await requestPasswordReset(String(email).trim(), req);

        return res.json({
            success: true,
            message: 'Si el correo existe, te enviamos un link para restablecer tu contraseña.'
        });
    } catch (error) {
        console.error('Error forgot-password:', error);
        return res.status(500).json({ success: false, message: 'Error procesando solicitud' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await resetPassword(token, newPassword);
        return res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Error' });
    }
});

module.exports = { router, authenticateToken };
