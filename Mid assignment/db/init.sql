-- Create database if not exists
CREATE DATABASE IF NOT EXISTS employee_management;

USE employee_management;

-- Create employees table FIRST (referenced by users table)
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    position VARCHAR(255) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Create sessions table (for token management)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    check_in DATETIME NOT NULL,
    check_out DATETIME NULL,
    work_duration INT NULL COMMENT 'Duration in minutes',
    date DATE NOT NULL,
    status ENUM('present', 'checked_in', 'checked_out') DEFAULT 'checked_in',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_date (employee_id, date),
    INDEX idx_date (date)
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_date DATE NOT NULL,
    leave_type ENUM('sick', 'casual', 'annual', 'other') NOT NULL DEFAULT 'casual',
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at DATETIME NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee_status (employee_id, status),
    INDEX idx_leave_date (leave_date)
);

-- Insert sample employees
INSERT INTO employees (name, email, position, salary) VALUES
('John Doe', 'john.doe@example.com', 'Software Engineer', 75000.00),
('Jane Smith', 'jane.smith@example.com', 'Product Manager', 85000.00),
('Mike Johnson', 'mike.johnson@example.com', 'UI/UX Designer', 65000.00),
('Sarah Williams', 'sarah.williams@example.com', 'DevOps Engineer', 80000.00),
('David Brown', 'david.brown@example.com', 'QA Engineer', 60000.00);

-- Create default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (username, password, role, is_active) VALUES
('admin', '$2y$10$BxR91kIJ1xsx1ip2UaQZQeIt0YCsR2Pq0CRvn5GPDilSjUeeB6fem', 'admin', TRUE);

-- Create employee users (password: admin123 for all)
INSERT INTO users (employee_id, username, password, role, is_active) 
SELECT 
    e.id,
    LOWER(REPLACE(e.name, ' ', '.')),
    '$2y$10$BxR91kIJ1xsx1ip2UaQZQeIt0YCsR2Pq0CRvn5GPDilSjUeeB6fem',
    'employee',
    TRUE
FROM employees e;
