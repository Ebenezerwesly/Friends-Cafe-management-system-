DROP DATABASE IF EXISTS friends_cafe;
CREATE DATABASE friends_cafe;
USE friends_cafe;

CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100)
);

CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(50),
    salary DECIMAL(10,2)
);

CREATE TABLE menu (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    availability BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    employee_id INT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Pending',
    FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id),
    FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
);

CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id)
        REFERENCES orders(order_id),
    FOREIGN KEY (item_id)
        REFERENCES menu(item_id)
);

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30),
    payment_status VARCHAR(30) DEFAULT 'Paid',
    FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

INSERT INTO employees
(employee_name, phone, role, salary)
VALUES
('John Smith', '9876543210', 'Manager', 30000.00),
('Sarah Williams', '9876543211', 'Cashier', 22000.00),
('David Kumar', '9876543212', 'Waiter', 18000.00),
('Alice Johnson', '9876543213', 'Chef', 25000.00),
('Bob Martin', '9876543214', 'Waiter', 18000.00);

INSERT INTO customer
(customer_name, phone, email)
VALUES
('Rahul Kumar', '9000000001', 'rahul@gmail.com'),
('Priya Sharma', '9000000002', 'priya@gmail.com'),
('Arun Kumar', '9000000003', 'arun@gmail.com'),
('Sneha Reddy', '9000000004', 'sneha@gmail.com'),
('Vikram Singh', '9000000005', 'vikram@gmail.com');

INSERT INTO menu
(item_name, category, price, availability)
VALUES
('Cappuccino', 'Beverage', 120.00, TRUE),
('Cold Coffee', 'Beverage', 100.00, TRUE),
('Masala Tea', 'Beverage', 60.00, TRUE),
('Fresh Lime Juice', 'Beverage', 80.00, TRUE),
('Veg Sandwich', 'Snacks', 90.00, TRUE),
('Cheese Sandwich', 'Snacks', 120.00, TRUE),
('French Fries', 'Snacks', 100.00, TRUE),
('Veg Burger', 'Fast Food', 150.00, TRUE),
('Chicken Burger', 'Fast Food', 180.00, TRUE),
('Pizza', 'Fast Food', 200.00, TRUE),
('Chocolate Cake', 'Dessert', 130.00, TRUE),
('Brownie', 'Dessert', 110.00, TRUE),
('Ice Cream', 'Dessert', 90.00, TRUE);

INSERT INTO orders
(customer_id, employee_id, total_amount, status)
VALUES
(1, 2, 220.00, 'Completed'),
(2, 3, 180.00, 'Completed'),
(3, 2, 200.00, 'Pending'),
(4, 5, 240.00, 'Completed'),
(5, 3, 150.00, 'Pending');

INSERT INTO order_items
(order_id, item_id, quantity, price)
VALUES
(1, 1, 1, 120.00),
(1, 2, 1, 100.00),
(2, 9, 1, 180.00),
(3, 10, 1, 200.00),
(4, 6, 2, 120.00),
(5, 8, 1, 150.00);

INSERT INTO payments
(order_id, amount, payment_method, payment_status)
VALUES
(1, 220.00, 'Cash', 'Paid'),
(2, 180.00, 'UPI', 'Paid'),
(3, 200.00, 'Card', 'Pending'),
(4, 240.00, 'UPI', 'Paid'),
(5, 150.00, 'Cash', 'Pending');

