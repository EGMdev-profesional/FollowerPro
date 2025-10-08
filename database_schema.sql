-- ========================================
-- SCHEMA PARA PANEL SMM - HOSTINGER MARIADB
-- ========================================
-- Importar este archivo en phpMyAdmin de Hostinger
-- Crear primero la base de datos: panel_smm

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ========================================
-- TABLA: usuarios
-- ========================================
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `balance` decimal(10,4) DEFAULT 0.0000,
  `rol` enum('admin','usuario') DEFAULT 'usuario',
  `estado` enum('activo','inactivo','suspendido') DEFAULT 'activo',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_conexion` timestamp NULL DEFAULT NULL,
  `api_key` varchar(64) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `pais` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `api_key` (`api_key`),
  KEY `idx_rol` (`rol`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: servicios_cache
-- ========================================
CREATE TABLE `servicios_cache` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `name` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `category` varchar(100) NOT NULL,
  `rate` decimal(10,4) NOT NULL,
  `min` int(11) NOT NULL,
  `max` int(11) NOT NULL,
  `refill` tinyint(1) DEFAULT 0,
  `cancel` tinyint(1) DEFAULT 0,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `markup` decimal(5,2) DEFAULT 20.00,
  `precio_final` decimal(10,4) GENERATED ALWAYS AS (`rate` * (1 + `markup` / 100)) STORED,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_id` (`service_id`),
  KEY `idx_category` (`category`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: ordenes
-- ========================================
CREATE TABLE `ordenes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `link` text NOT NULL,
  `quantity` int(11) NOT NULL,
  `charge` decimal(10,4) NOT NULL,
  `start_count` int(11) DEFAULT 0,
  `status` varchar(50) DEFAULT 'Pending',
  `remains` int(11) DEFAULT 0,
  `currency` varchar(10) DEFAULT 'USD',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ordenes_usuario` (`usuario_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  CONSTRAINT `fk_ordenes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: transacciones
-- ========================================
CREATE TABLE `transacciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('recarga','gasto','refund','bonus') NOT NULL,
  `monto` decimal(10,4) NOT NULL,
  `balance_anterior` decimal(10,4) NOT NULL,
  `balance_nuevo` decimal(10,4) NOT NULL,
  `descripcion` text NOT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `referencia_externa` varchar(100) DEFAULT NULL,
  `orden_id` int(11) DEFAULT NULL,
  `estado` enum('pendiente','completada','fallida','cancelada') DEFAULT 'completada',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `procesada_por` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_transacciones_usuario` (`usuario_id`),
  KEY `fk_transacciones_orden` (`orden_id`),
  KEY `fk_transacciones_admin` (`procesada_por`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  CONSTRAINT `fk_transacciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transacciones_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transacciones_admin` FOREIGN KEY (`procesada_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: sesiones
-- ========================================
CREATE TABLE `sesiones` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: configuracion
-- ========================================
CREATE TABLE `configuracion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) NOT NULL,
  `valor` text NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('string','number','boolean','json') DEFAULT 'string',
  `categoria` varchar(50) DEFAULT 'general',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: logs_sistema
-- ========================================
CREATE TABLE `logs_sistema` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `datos_adicionales` json DEFAULT NULL,
  `nivel` enum('info','warning','error','critical') DEFAULT 'info',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_logs_usuario` (`usuario_id`),
  KEY `idx_accion` (`accion`),
  KEY `idx_nivel` (`nivel`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- DATOS INICIALES
-- ========================================

-- Insertar usuario administrador
INSERT INTO `usuarios` (`email`, `password`, `nombre`, `apellido`, `balance`, `rol`, `estado`) VALUES
('admin@panelsmm.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'Sistema', 1000.0000, 'admin', 'activo');

-- Configuraciones iniciales
INSERT INTO `configuracion` (`clave`, `valor`, `descripcion`, `tipo`, `categoria`) VALUES
('sitio_nombre', 'Panel SMM', 'Nombre del sitio web', 'string', 'general'),
('sitio_descripcion', 'Panel de gestión de servicios SMM', 'Descripción del sitio', 'string', 'general'),
('markup_default', '20', 'Markup por defecto para servicios (%)', 'number', 'precios'),
('min_recarga', '5', 'Monto mínimo de recarga (USD)', 'number', 'pagos'),
('max_recarga', '1000', 'Monto máximo de recarga (USD)', 'number', 'pagos'),
('whatsapp_numero', '1234567890', 'Número de WhatsApp para soporte', 'string', 'contacto'),
('registro_abierto', 'true', 'Permitir registro de nuevos usuarios', 'boolean', 'usuarios'),
('mantenimiento', 'false', 'Modo mantenimiento activado', 'boolean', 'sistema');

-- ========================================
-- TRIGGERS PARA AUDITORIA
-- ========================================

-- Trigger para actualizar balance en transacciones
DELIMITER $$
CREATE TRIGGER `tr_actualizar_balance` 
AFTER INSERT ON `transacciones` 
FOR EACH ROW 
BEGIN
    IF NEW.estado = 'completada' THEN
        UPDATE usuarios 
        SET balance = NEW.balance_nuevo 
        WHERE id = NEW.usuario_id;
    END IF;
END$$
DELIMITER ;

-- Trigger para log de cambios en usuarios
DELIMITER $$
CREATE TRIGGER `tr_log_usuarios` 
AFTER UPDATE ON `usuarios` 
FOR EACH ROW 
BEGIN
    IF OLD.balance != NEW.balance THEN
        INSERT INTO logs_sistema (usuario_id, accion, descripcion, nivel) 
        VALUES (NEW.id, 'balance_update', 
                CONCAT('Balance actualizado de ', OLD.balance, ' a ', NEW.balance), 
                'info');
    END IF;
END$$
DELIMITER ;

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista de estadísticas de usuarios
CREATE VIEW `v_stats_usuarios` AS
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN rol = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN rol = 'usuario' THEN 1 END) as usuarios_normales,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as usuarios_activos,
    SUM(balance) as balance_total,
    AVG(balance) as balance_promedio
FROM usuarios;

-- Vista de estadísticas de órdenes
CREATE VIEW `v_stats_ordenes` AS
SELECT 
    COUNT(*) as total_ordenes,
    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completadas,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'In progress' THEN 1 END) as en_proceso,
    SUM(charge) as ingresos_totales,
    AVG(charge) as orden_promedio
FROM ordenes;

COMMIT;

-- ========================================
-- INSTRUCCIONES DE INSTALACIÓN
-- ========================================
/*
1. En phpMyAdmin de Hostinger:
   - Crear nueva base de datos: panel_smm
   - Importar este archivo SQL completo
   
2. Configurar .env con los datos de Hostinger:
   DB_HOST=localhost (o la IP que te den)
   DB_NAME=panel_smm
   DB_USER=tu_usuario_hostinger
   DB_PASSWORD=tu_password_hostinger
   
3. Credenciales de administrador por defecto:
   Email: admin@panelsmm.com
   Password: Admin123!
   
4. El sistema creará automáticamente:
   - Tablas con relaciones
   - Triggers para auditoría
   - Vistas para estadísticas
   - Usuario admin inicial
   - Configuraciones básicas
*/
