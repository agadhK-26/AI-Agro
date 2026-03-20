CREATE DATABASE IF NOT EXISTS agri_ai;
USE agri_ai;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,
  phone         VARCHAR(20),
  location      VARCHAR(150),
  role          ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',
  aadhar        VARCHAR(20),
  pan           VARCHAR(20),
  income_proof  VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  seller_id     INT NOT NULL,
  title         VARCHAR(150) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  stock         INT DEFAULT 0,
  category      VARCHAR(50),
  image_url     VARCHAR(500),
  location      VARCHAR(150),
  status        ENUM('active', 'inactive') DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id      INT NOT NULL,
  product_id    INT NOT NULL,
  quantity      INT DEFAULT 1,
  added_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id        INT NOT NULL,
  total_amount    DECIMAL(10,2) NOT NULL,
  platform_fee    DECIMAL(10,2) DEFAULT 0,
  processing_fee  DECIMAL(10,2) DEFAULT 15,
  grand_total     DECIMAL(10,2) NOT NULL,
  status          ENUM('pending', 'confirmed', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  seller_id   INT NOT NULL,
  quantity    INT NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id)  REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaints (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  order_id    INT,
  subject     VARCHAR(200),
  message     TEXT,
  status      ENUM('open', 'resolved', 'closed') DEFAULT 'open',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin', 'admin@agri-ai', '$2a$10$wvgABFnfL5zD7sVIBF4nYeMr6L2Q9KivC3E9KyFX.FHW6YyMbN4oy', 'admin');

CREATE TABLE IF NOT EXISTS seller_bank (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  seller_id     INT NOT NULL UNIQUE,
  accountName   VARCHAR(150),
  accountNumber VARCHAR(50),
  ifsc          VARCHAR(20),
  bankName      VARCHAR(100),
  upiId         VARCHAR(100),
  updatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);