-- Create database if not exists
CREATE DATABASE IF NOT EXISTS employee_management;

USE employee_management;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    position VARCHAR(255) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO employees (name, email, position, salary) VALUES
('John Doe', 'john.doe@example.com', 'Software Engineer', 75000.00),
('Jane Smith', 'jane.smith@example.com', 'Product Manager', 85000.00),
('Mike Johnson', 'mike.johnson@example.com', 'UI/UX Designer', 65000.00),
('Sarah Williams', 'sarah.williams@example.com', 'DevOps Engineer', 80000.00),
('David Brown', 'david.brown@example.com', 'QA Engineer', 60000.00);
