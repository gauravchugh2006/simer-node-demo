CREATE DATABASE IF NOT EXISTS ccd_cafe;
USE ccd_cafe;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  items JSON NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('placed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'placed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

INSERT INTO users (name, email, password_hash, role)
VALUES
  ('Cafe Admin', 'admin@cafecoffeeday.com', 'ed003880292aa9ab35977e8320d23d58:c0332404d51566db92a025d6ca1852a0e00347166700cf5407b8244c8377df6b', 'admin')
ON DUPLICATE KEY UPDATE email = email;
