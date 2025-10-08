-- Crear tabla servicios_cache si no existe
CREATE TABLE IF NOT EXISTS servicios_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    type VARCHAR(100) DEFAULT 'Default',
    category VARCHAR(200) NOT NULL,
    rate DECIMAL(10,4) NOT NULL,
    min INT NOT NULL,
    max INT NOT NULL,
    refill TINYINT(1) DEFAULT 0,
    cancel TINYINT(1) DEFAULT 0,
    precio_final DECIMAL(10,4) NOT NULL,
    markup DECIMAL(5,2) DEFAULT 20.00,
    activo TINYINT(1) DEFAULT 1,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_service_id (service_id),
    INDEX idx_category (category),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
