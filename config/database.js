const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectTimeout: 60000,
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Pool de conexiones
let pool;

const initDatabase = async () => {
    try {
        pool = mysql.createPool(dbConfig);
        
        // Probar la conexión
        const connection = await pool.getConnection();
        console.log('✅ Conectado a la base de datos MariaDB');
        
        // Configurar timeouts para evitar bloqueos
        try {
            await connection.execute('SET SESSION innodb_lock_wait_timeout = 120');
            await connection.execute('SET SESSION lock_wait_timeout = 120');
            await connection.execute('SET SESSION wait_timeout = 28800');
            console.log('✅ Timeouts configurados');
        } catch (error) {
            console.warn('⚠️ No se pudieron configurar timeouts:', error.message);
        }
        
        // Crear tabla servicios_cache si no existe
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS servicios_cache (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    service_id INT(11) NOT NULL,
                    name TEXT NOT NULL,
                    type VARCHAR(100) NOT NULL,
                    category TEXT NOT NULL,
                    rate DECIMAL(10,4) NOT NULL,
                    min INT(11) NOT NULL,
                    max INT(11) NOT NULL,
                    refill TINYINT(1) DEFAULT 0,
                    \`cancel\` TINYINT(1) DEFAULT 0,
                    descripcion TEXT DEFAULT NULL,
                    activo TINYINT(1) DEFAULT 1,
                    markup DECIMAL(5,2) DEFAULT 20.00,
                    precio_final DECIMAL(10,4) GENERATED ALWAYS AS (rate * (1 + markup / 100)) STORED,
                    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY service_id (service_id),
                    KEY idx_activo (activo)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Tabla servicios_cache verificada/creada');
        } catch (error) {
            console.error('⚠️ Error creando tabla servicios_cache:', error.message);
        }
        
        connection.release();
        
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        throw error;
    }
    
    return pool;
};

// Obtener conexión del pool
const getConnection = () => {
    if (!pool) {
        throw new Error('Database pool not initialized');
    }
    return pool;
};

// Función para ejecutar queries
const query = async (sql, params = []) => {
    try {
        const connection = getConnection();
        const [rows] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Error en query:', error.message);
        throw error;
    }
};

// Función para transacciones
const transaction = async (callback) => {
    const connection = await getConnection().getConnection();
    
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Cerrar conexiones
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        console.log('🔌 Conexiones de base de datos cerradas');
    }
};

module.exports = {
    initDatabase,
    getConnection,
    query,
    transaction,
    closeDatabase
};
