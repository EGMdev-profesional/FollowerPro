-- Schema para Panel SMM Completo

-- Tabla de usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(10,4) DEFAULT 0.0000,
    role ENUM('admin', 'user', 'reseller') DEFAULT 'user',
    status ENUM('active', 'suspended', 'pending') DEFAULT 'pending',
    api_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de servicios (cache de SMMCoder)
CREATE TABLE services (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    rate DECIMAL(10,4) NOT NULL,
    min_quantity INT NOT NULL,
    max_quantity INT NOT NULL,
    refill BOOLEAN DEFAULT FALSE,
    cancel BOOLEAN DEFAULT FALSE,
    markup_percentage DECIMAL(5,2) DEFAULT 20.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de órdenes
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    smmcoder_order_id INT,
    link VARCHAR(500) NOT NULL,
    quantity INT NOT NULL,
    charge DECIMAL(10,4) NOT NULL,
    start_count INT DEFAULT 0,
    remains INT DEFAULT 0,
    status ENUM('pending', 'processing', 'in_progress', 'completed', 'partial', 'canceled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Tabla de recargas
CREATE TABLE refills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    smmcoder_refill_id INT,
    status ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de transacciones (balance)
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal', 'order', 'refund', 'bonus') NOT NULL,
    amount DECIMAL(10,4) NOT NULL,
    balance_before DECIMAL(10,4) NOT NULL,
    balance_after DECIMAL(10,4) NOT NULL,
    description TEXT,
    reference_id INT, -- ID de orden, depósito, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de depósitos
CREATE TABLE deposits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10,4) NOT NULL,
    payment_method ENUM('paypal', 'stripe', 'crypto', 'bank_transfer') NOT NULL,
    payment_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'canceled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para optimización
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_smmcoder_id ON orders(smmcoder_order_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_refills_order_id ON refills(order_id);
