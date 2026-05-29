-- Aria Premium Pharmacy & Wellness ERP - Consolidated MySQL Schema
-- LUXE BOUTIQUE EDITION (21 Table System)


-- 1. Roles & Permissions (No dependencies)
CREATE TABLE IF NOT EXISTS Roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories (No dependencies)
CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Suppliers (No dependencies)
CREATE TABLE IF NOT EXISTS Suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Patients (No dependencies)
CREATE TABLE IF NOT EXISTS Patients (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Prescribers (No dependencies)
CREATE TABLE IF NOT EXISTS Prescribers (
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

-- 6. Employees (Depends on Roles)
CREATE TABLE IF NOT EXISTS Employees (
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

-- 7. Pharmacy_Settings (Depends on Employees)
CREATE TABLE IF NOT EXISTS Pharmacy_Settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    tax_id VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(50),
    address_line_1 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'USD',
    tax_rate DECIMAL(5, 2) DEFAULT 15.00,
    theme_config JSON,
    logo_url VARCHAR(500),
    ip_address VARCHAR(45),
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES Employees(employee_id)
);

-- 8. Products (Depends on Categories)
CREATE TABLE IF NOT EXISTS Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    description TEXT,
    manufacturer VARCHAR(255),
    strength VARCHAR(50),
    dosage_form VARCHAR(50),
    unit_of_measure VARCHAR(20),
    cost_price DECIMAL(15, 2) DEFAULT 0.00,
    selling_price DECIMAL(15, 2) NOT NULL,
    reorder_level INT DEFAULT 10,
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    requires_prescription BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

-- 9. Product_Batches (Depends on Products, Suppliers)
CREATE TABLE IF NOT EXISTS Product_Batches (
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
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
);

-- 10. Price_History (Depends on Products)
CREATE TABLE IF NOT EXISTS Price_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    old_price DECIMAL(15, 2),
    new_price DECIMAL(15, 2) NOT NULL,
    change_reason VARCHAR(255),
    changed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 11. Inventory_Adjustments (Depends on Products, Product_Batches, Employees)
CREATE TABLE IF NOT EXISTS Inventory_Adjustments (
    adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    batch_id INT,
    employee_id INT,
    quantity_adjusted INT NOT NULL,
    adjustment_type ENUM('Add', 'Subtract') NOT NULL,
    reason ENUM('Damage', 'Loss', 'Correction', 'Expiry') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (batch_id) REFERENCES Product_Batches(batch_id),
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
);

-- 12. Prescriptions (Depends on Patients, Prescribers)
CREATE TABLE IF NOT EXISTS Prescriptions (
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

-- 13. Prescription_Items (Depends on Prescriptions, Products)
CREATE TABLE IF NOT EXISTS Prescription_Items (
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

-- 14. Purchase_Orders (Depends on Suppliers, Employees)
CREATE TABLE IF NOT EXISTS Purchase_Orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE,
    supplier_id INT,
    employee_id INT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('Pending', 'In-Transit', 'Received', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id),
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
);

-- 15. Purchase_Order_Items (Depends on Purchase_Orders, Products)
CREATE TABLE IF NOT EXISTS Purchase_Order_Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT,
    product_id INT,
    quantity_ordered INT NOT NULL,
    unit_cost DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES Purchase_Orders(po_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- 16. Transactions (Depends on Patients, Employees)
CREATE TABLE IF NOT EXISTS Transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE,
    patient_id INT NULL,
    employee_id INT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    final_amount DECIMAL(15, 2) NOT NULL,
    payment_type ENUM('Cash', 'Credit Card', 'Insurance', 'Mobile Money', 'Other') DEFAULT 'Cash',
    status ENUM('Completed', 'Refunded', 'Pending', 'Cancelled') DEFAULT 'Completed',
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
);

-- 17. Transaction_Items (Depends on Transactions, Products, Product_Batches)
CREATE TABLE IF NOT EXISTS Transaction_Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    product_id INT,
    batch_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    subtotal DECIMAL(15, 2),
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (batch_id) REFERENCES Product_Batches(batch_id)
);

-- 18. Insurance_Claims (Depends on Transactions)
CREATE TABLE IF NOT EXISTS Insurance_Claims (
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

-- 19. Sales_Returns (Depends on Transactions, Employees)
CREATE TABLE IF NOT EXISTS Sales_Returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_refund_amount DECIMAL(15, 2) NOT NULL,
    reason TEXT,
    refunded_by INT,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id),
    FOREIGN KEY (refunded_by) REFERENCES Employees(employee_id)
);

-- 20. Audit_Logs (Depends on Employees)
CREATE TABLE IF NOT EXISTS Audit_Logs (
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

-- 21. Payment_Methods (Depends on Transactions)
CREATE TABLE IF NOT EXISTS Payment_Methods (
    method_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    payment_type ENUM('Cash', 'Credit Card', 'Insurance', 'Mobile Money', 'Other') NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL,
    transaction_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

-- --- VIEWS ---

CREATE OR REPLACE VIEW View_Low_Stock AS
SELECT 
    p.product_id,
    p.product_name,
    p.sku,
    c.name as category,
    IFNULL(SUM(b.quantity_on_hand), 0) as total_stock,
    p.reorder_level
FROM Products p
LEFT JOIN Product_Batches b ON p.product_id = b.product_id
JOIN Categories c ON p.category_id = c.category_id
GROUP BY p.product_id
HAVING total_stock <= p.reorder_level;

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
