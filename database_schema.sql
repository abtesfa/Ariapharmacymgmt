-- Aria Premium Pharmacy & Wellness ERP - Database Schema (MySQL)
-- Luxe Boutique Theme - 21 Table System

CREATE DATABASE IF NOT EXISTS pharmacy_erp;
USE pharmacy_erp;

-- 1. Pharmacy_Settings
CREATE TABLE Pharmacy_Settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(50),
    address_line_1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'USD',
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    theme_config JSON, -- For luxury aesthetic persistence
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Categories
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    description TEXT,
    manufacturer VARCHAR(255),
    strength VARCHAR(50),
    dosage_form VARCHAR(50), -- e.g., Tablet, Syrup
    unit_of_measure VARCHAR(20), -- e.g., Box, Bottle, Strip
    reorder_level INT DEFAULT 10,
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    requires_prescription BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

-- 4. Product_Batches
CREATE TABLE Product_Batches (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturing_date DATE,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(15, 2) NOT NULL,
    selling_price DECIMAL(15, 2) NOT NULL,
    supplier_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 5. Price_History
CREATE TABLE Price_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    old_price DECIMAL(15, 2),
    new_price DECIMAL(15, 2) NOT NULL,
    change_reason VARCHAR(255),
    changed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 6. Inventory_Adjustments
CREATE TABLE Inventory_Adjustments (
    adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    batch_id INT,
    quantity_adjusted INT NOT NULL,
    adjustment_type ENUM('Add', 'Subtract') NOT NULL,
    reason ENUM('Damage', 'Loss', 'Correction', 'Expiry') NOT NULL,
    adjusted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (batch_id) REFERENCES Product_Batches(batch_id)
);

-- 7. Roles
CREATE TABLE Roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Roles (role_name, permissions) VALUES 
('Administrator', '{"inventory": ["read", "write", "delete"], "sales": ["read", "write", "refund"], "employees": ["read", "write", "delete"], "settings": ["read", "write"]}'),
('Pharmacist', '{"inventory": ["read", "write"], "sales": ["read", "write"], "prescriptions": ["read", "write"]}'),
('Cashier', '{"sales": ["read", "write"], "inventory": ["read"]}'),
('Patient', '{"portal": ["read"]}');

-- 8. Employees
CREATE TABLE Employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);

-- 9. Patients
CREATE TABLE Patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    medical_history TEXT,
    allergies TEXT,
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Prescribers
CREATE TABLE Prescribers (
    prescriber_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    license_number VARCHAR(100) UNIQUE,
    clinic_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Prescriptions
CREATE TABLE Prescriptions (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    prescriber_id INT,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    status ENUM('Active', 'Dispensed', 'Expired', 'Cancelled') DEFAULT 'Active',
    digital_signature VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (prescriber_id) REFERENCES Prescribers(prescriber_id)
);

-- 12. Prescription_Items
CREATE TABLE Prescription_Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT,
    product_id INT,
    dosage_instructions TEXT,
    quantity_prescribed INT NOT NULL,
    refills_allowed INT DEFAULT 0,
    refills_remaining INT DEFAULT 0,
    FOREIGN KEY (prescription_id) REFERENCES Prescriptions(prescription_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 13. Suppliers
CREATE TABLE Suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Purchase_Orders
CREATE TABLE Purchase_Orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('Pending', 'In-Transit', 'Received', 'Cancelled') DEFAULT 'Pending',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);

-- 15. PO_Items
CREATE TABLE PO_Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT,
    product_id INT,
    quantity_ordered INT NOT NULL,
    unit_cost DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES Purchase_Orders(po_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 16. Transactions
CREATE TABLE Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NULL,
    employee_id INT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    final_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('Completed', 'Refunded', 'Pending') DEFAULT 'Completed',
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
);

-- 17. ransaction_Items
CREATE TABLE Transaction_Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    product_id INT,
    batch_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECTIMAL(15, 2) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (batch_id) REFERENCES Product_Batches(batch_id)
);

-- 18. Payment_Methods
CREATE TABLE Payment_Methods (
    method_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    payment_type ENUM('Cash', 'Credit Card', 'Insurance', 'Other') NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL,
    transaction_reference VARCHAR(255), -- card last 4 or auth code
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

-- 19. Insurance_Claims
CREATE TABLE Insurance_Claims (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    insurance_provider VARCHAR(255),
    policy_number VARCHAR(100),
    claim_amount DECIMAL(15, 2),
    approved_amount DECIMAL(15, 2),
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    claim_date DATE,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

-- 20. Sales_Returns
CREATE TABLE Sales_Returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_refund_amount DECIMAL(15, 2) NOT NULL,
    reason TEXT,
    refunded_by INT,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

-- 21. Audit_Logs
CREATE TABLE Audit_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_data JSON,
    new_data JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
);

-- Seed Data (Optional for testing the luxury dashboard)
INSERT INTO Patients (first_name, last_name, date_of_birth, gender, allergies, medical_history, insurance_provider) VALUES 
('Isabella', 'Cavendish', '1985-05-12', 'Female', 'Penicillin', 'Hypertension', 'BlueCross Platinum'),
('Marcus', 'Smith', '1992-11-20', 'Male', 'Latex', 'No significant history', 'Cigna Luxury');

INSERT INTO Insurance_Claims (insurance_provider, policy_number, claim_amount, status, claim_date) VALUES 
('BlueCross Platinum', 'BC-90210-A', 842.00, 'Pending', CURDATE()),
('Cigna Luxury', 'CL-1102-X', 1250.50, 'Pending', DATE_SUB(CURDATE(), INTERVAL 1 DAY));

INSERT INTO Suppliers (supplier_name, contact_person, phone) VALUES 
('Elite Pharma Wholesalers', 'James Vance', '555-0102'),
('Global Bio-Care', 'Sarah Sterling', '555-0199');

INSERT INTO Purchase_Orders (supplier_id, order_date, expected_delivery_date, status) VALUES 
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'In-Transit'),
(2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Pending');

INSERT INTO Audit_Logs (employee_id, action, table_name) VALUES 
(1, 'Updated Inventory', 'Products'),
(1, 'Logged In', 'Employees');

INSERT INTO Products (category_id, sku, product_name, reorder_level) VALUES (1, 'SKU-LOW-01', 'Amoxicillin 500mg', 10);
INSERT INTO Product_Batches (product_id, batch_number, expiry_date, quantity_on_hand, unit_cost, selling_price) VALUES 
(LAST_INSERT_ID(), 'B-9021', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 4, 5.00, 12.99);

-- --- REPORTING VIEWS ---

-- 1. Low Stock Report View
CREATE OR REPLACE VIEW View_Low_Stock AS
SELECT 
    p.product_id,
    p.product_name,
    p.sku,
    c.name as category,
    SUM(b.quantity_on_hand) as total_stock,
    p.reorder_level
FROM Products p
LEFT JOIN Product_Batches b ON p.product_id = b.product_id
JOIN Categories c ON p.category_id = c.category_id
GROUP BY p.product_id
HAVING total_stock <= p.reorder_level;

-- 2. Daily Sales Report View
CREATE OR REPLACE VIEW View_Daily_Sales AS
SELECT 
    DATE(transaction_date) as sale_date,
    COUNT(transaction_id) as total_transactions,
    SUM(final_amount) as total_revenue,
    SUM(tax_amount) as total_tax,
    AVG(final_amount) as average_ticket_size
FROM Transactions
WHERE status = 'Completed'
GROUP BY DATE(transaction_date);

-- 3. Expiring Inventory View
CREATE OR REPLACE VIEW View_Expiring_Inventory AS
SELECT 
    p.product_name,
    b.batch_number,
    b.expiry_date,
    b.quantity_on_hand,
    DATEDIFF(b.expiry_date, CURDATE()) as days_until_expiry
FROM Product_Batches b
JOIN Products p ON b.product_id = p.product_id
WHERE b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
AND b.quantity_on_hand > 0;

-- 4. Employee Sales Performance View
CREATE OR REPLACE VIEW View_Employee_Performance AS
SELECT 
    e.employee_id,
    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
    r.role_name,
    COUNT(t.transaction_id) as sales_count,
    SUM(t.final_amount) as total_revenue
FROM Employees e
JOIN Roles r ON e.role_id = r.role_id
LEFT JOIN Transactions t ON e.employee_id = t.employee_id
GROUP BY e.employee_id;

-- 5. Financial Audit View
CREATE OR REPLACE VIEW View_Financial_Audit AS
SELECT 
    t.transaction_id,
    t.transaction_date,
    t.final_amount,
    pm.payment_type,
    ic.status as insurance_claim_status,
    e.username as cashier
FROM Transactions t
LEFT JOIN Payment_Methods pm ON t.transaction_id = pm.transaction_id
LEFT JOIN Insurance_Claims ic ON t.transaction_id = ic.transaction_id
JOIN Employees e ON t.employee_id = e.employee_id;
