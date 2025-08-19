CREATE DATABASE IF NOT EXISTS chat_app;
USE chat_app;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Messages with status
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender VARCHAR(100) NOT NULL,
  receiver VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('sent','delivered','seen') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE messages ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'sent';

select * from users;
