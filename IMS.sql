CREATE DATABASE IF NOT EXISTS ims;

CREATE USER IF NOT EXISTS 'ims_app'@'localhost' IDENTIFIED BY 'ims123';
CREATE USER IF NOT EXISTS 'ims_app'@'127.0.0.1' IDENTIFIED BY 'ims123';
GRANT ALL PRIVILEGES ON ims.* TO 'ims_app'@'localhost';
GRANT ALL PRIVILEGES ON ims.* TO 'ims_app'@'127.0.0.1';
FLUSH PRIVILEGES;

USE ims;

CREATE TABLE IF NOT EXISTS admin_accounts (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(30) DEFAULT 'ADMIN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS customer_accounts (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    category_id INT,
    FOREIGN KEY (category_id) REFERENCES categories (category_id)
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(50) NOT NULL,
    processed_by VARCHAR(50),
    datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    FOREIGN KEY (customer_name) REFERENCES customer_accounts (username),
    FOREIGN KEY (processed_by) REFERENCES admin_accounts (username)
);

CREATE TABLE IF NOT EXISTS order_items (
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders (order_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

CREATE TABLE IF NOT EXISTS admin_products (
    admin_username VARCHAR(50) NOT NULL,
    product_id INT NOT NULL,
    action VARCHAR(20) NOT NULL,
    action_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (
        admin_username,
        product_id,
        action_datetime
    ),
    FOREIGN KEY (admin_username) REFERENCES admin_accounts (username),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

ALTER TABLE admin_accounts AUTO_INCREMENT = 1;

ALTER TABLE customer_accounts AUTO_INCREMENT = 1;

ALTER TABLE categories AUTO_INCREMENT = 1;

ALTER TABLE products AUTO_INCREMENT = 101;

ALTER TABLE orders AUTO_INCREMENT = 1;

-- Triggers removed as username generation is handled by the application layer.

-- Seed data
INSERT IGNORE INTO
    categories (name, description)
VALUES (
        'Electronics',
        'Electronic devices and accessories'
    ),
    (
        'Peripherals',
        'Computer peripherals and input devices'
    ),
    (
        'Storage',
        'Storage devices and drives'
    ),
    (
        'Networking',
        'Network devices and accessories'
    ),
    (
        'Office',
        'Office supplies and equipment'
    );

INSERT INTO
    admin_accounts (
        password,
        first_name,
        last_name,
        email,
        role
    )
VALUES (
        'admin123',
        'Super',
        'Admin',
        'superadmin@ims.com',
        'SUPER_ADMIN'
    );

INSERT INTO
    products
VALUES (101, 'Keyboard', 1500, 20, 2),
    (102, 'Mouse', 800, 35, 2),
    (103, 'Monitor', 22000, 12, 1),
    (104, 'USBDrive', 1200, 50, 3),
    (105, 'Router', 5500, 8, 4),
    (106, 'Webcam', 3200, 15, 1),
    (107, 'Headset', 2800, 18, 1),
    (108, 'Desk Lamp', 950, 30, 5);
