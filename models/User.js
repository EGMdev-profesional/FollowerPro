const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');

class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.nombre = data.nombre;
        this.apellido = data.apellido;
        this.balance = parseFloat(data.balance) || 0;
        this.rol = data.rol;
        this.estado = data.estado;
        this.fecha_registro = data.fecha_registro;
        this.ultima_conexion = data.ultima_conexion;
        this.telefono = data.telefono;
        this.pais = data.pais;
    }

    // Crear nuevo usuario
    static async create(userData) {
        const { email, password, nombre, apellido, telefono, pais } = userData;
        
        // Verificar si el email ya existe
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        // Hashear password
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO usuarios (email, password, nombre, apellido, telefono, pais, balance, rol, estado)
            VALUES (?, ?, ?, ?, ?, ?, 0.0000, 'usuario', 'activo')
        `;

        try {
            const result = await query(sql, [email, hashedPassword, nombre, apellido, telefono, pais]);
            
            // Obtener el usuario creado
            const newUser = await this.findById(result.insertId);
            
            // Log de registro
            await this.logAction(result.insertId, 'registro', 'Usuario registrado exitosamente');
            
            return new User(newUser);
        } catch (error) {
            throw new Error('Error al crear usuario: ' + error.message);
        }
    }

    // Buscar usuario por ID
    static async findById(id) {
        const sql = 'SELECT * FROM usuarios WHERE id = ? AND estado != "eliminado"';
        const users = await query(sql, [id]);
        return users.length > 0 ? users[0] : null;
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        const sql = 'SELECT * FROM usuarios WHERE email = ? AND estado != "eliminado"';
        const users = await query(sql, [email]);
        return users.length > 0 ? users[0] : null;
    }

    // Verificar password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Login
    static async login(email, password) {
        const userData = await this.findByEmail(email);
        if (!userData) {
            throw new Error('Credenciales inválidas');
        }

        if (userData.estado !== 'activo') {
            throw new Error('Cuenta inactiva o suspendida');
        }

        const isValidPassword = await this.verifyPassword(password, userData.password);
        if (!isValidPassword) {
            throw new Error('Credenciales inválidas');
        }

        // Actualizar última conexión
        this.updateLastLogin(userData.id).catch(() => {});
        
        // Log de login
        this.logAction(userData.id, 'login', 'Usuario inició sesión').catch(() => {});

        return new User(userData);
    }

    // Actualizar última conexión
    static async updateLastLogin(userId) {
        const sql = 'UPDATE usuarios SET ultima_conexion = NOW() WHERE id = ?';
        await query(sql, [userId]);
    }

    // Obtener balance
    async getBalance() {
        const sql = 'SELECT balance FROM usuarios WHERE id = ?';
        const result = await query(sql, [this.id]);
        return result.length > 0 ? parseFloat(result[0].balance) : 0;
    }

    // Actualizar balance
    async updateBalance(newBalance, descripcion, tipo = 'recarga', metodo_pago = null) {
        return await transaction(async (connection) => {
            // Obtener balance actual
            const [currentUser] = await connection.execute(
                'SELECT balance FROM usuarios WHERE id = ?', 
                [this.id]
            );
            
            const balanceAnterior = parseFloat(currentUser[0].balance);
            const balanceNuevo = parseFloat(newBalance);

            // Actualizar balance del usuario
            await connection.execute(
                'UPDATE usuarios SET balance = ? WHERE id = ?',
                [balanceNuevo, this.id]
            );

            // Registrar transacción
            await connection.execute(`
                INSERT INTO transacciones 
                (usuario_id, tipo, monto, balance_anterior, balance_nuevo, descripcion, metodo_pago, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'completada')
            `, [
                this.id, 
                tipo, 
                balanceNuevo - balanceAnterior, 
                balanceAnterior, 
                balanceNuevo, 
                descripcion, 
                metodo_pago
            ]);

            this.balance = balanceNuevo;
            return balanceNuevo;
        });
    }

    // Obtener todas las transacciones del usuario
    async getTransactions(limit = 50, offset = 0) {
        const sql = `
            SELECT * FROM transacciones 
            WHERE usuario_id = ? 
            ORDER BY fecha_creacion DESC 
            LIMIT ? OFFSET ?
        `;
        return await query(sql, [this.id, limit, offset]);
    }

    // Obtener órdenes del usuario
    async getOrders(limit = 50, offset = 0) {
        const sql = `
            SELECT o.*, s.name as service_name, s.category 
            FROM ordenes o
            LEFT JOIN servicios_cache s ON o.service_id = s.service_id
            WHERE o.usuario_id = ? 
            ORDER BY o.fecha_creacion DESC 
            LIMIT ? OFFSET ?
        `;
        return await query(sql, [this.id, limit, offset]);
    }

    // Crear orden
    async createOrder(serviceId, link, quantity, charge) {
        const sql = `
            INSERT INTO ordenes (usuario_id, service_id, link, quantity, charge, status)
            VALUES (?, ?, ?, ?, ?, 'Pending')
        `;
        
        const result = await query(sql, [this.id, serviceId, link, quantity, charge]);
        
        // Descontar del balance
        const newBalance = this.balance - charge;
        await this.updateBalance(newBalance, `Orden #${result.insertId} - ${link}`, 'gasto');
        
        return result.insertId;
    }

    // Métodos estáticos para administración
    static async getAllUsers(limit = 50, offset = 0) {
        const sql = `
            SELECT id, email, nombre, apellido, balance, rol, estado, fecha_registro, ultima_conexion
            FROM usuarios 
            WHERE estado != 'eliminado'
            ORDER BY fecha_registro DESC 
            LIMIT ? OFFSET ?
        `;
        return await query(sql, [limit, offset]);
    }

    static async getUserStats() {
        const sql = 'SELECT * FROM v_stats_usuarios';
        const stats = await query(sql);
        return stats[0] || {};
    }

    static async updateUserStatus(userId, status) {
        const sql = 'UPDATE usuarios SET estado = ? WHERE id = ?';
        await query(sql, [status, userId]);
        
        await this.logAction(userId, 'status_change', `Estado cambiado a: ${status}`);
    }

    // Log de acciones
    static async logAction(userId, accion, descripcion, nivel = 'info', datosAdicionales = null) {
        const sql = `
            INSERT INTO logs_sistema (usuario_id, accion, descripcion, nivel, datos_adicionales)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await query(sql, [
            userId, 
            accion, 
            descripcion, 
            nivel, 
            datosAdicionales ? JSON.stringify(datosAdicionales) : null
        ]);
    }

    // Crear usuario administrador inicial
    static async createAdmin() {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@panelsmm.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

        try {
            // Verificar si ya existe
            const existingAdmin = await this.findByEmail(adminEmail);
            if (existingAdmin) {
                console.log('👤 Usuario administrador ya existe');
                return;
            }

            // Crear admin
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const sql = `
                INSERT INTO usuarios (email, password, nombre, apellido, balance, rol, estado)
                VALUES (?, ?, 'Administrador', 'Sistema', 1000.0000, 'admin', 'activo')
            `;

            await query(sql, [adminEmail, hashedPassword]);
            console.log('👑 Usuario administrador creado exitosamente');
            console.log(`📧 Email: ${adminEmail}`);
            console.log(`🔑 Password: ${adminPassword}`);
            
        } catch (error) {
            console.error('Error creando administrador:', error.message);
        }
    }
}

module.exports = User;
