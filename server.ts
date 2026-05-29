import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('[Server] Starting Aria ERP Backend (MySQL Mode)...');
  
  const app = express();
  const PORT = 3000; 

  app.use(cors());
  app.use(express.json());

  // Database Connection Pool
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pharmacy_erp',
    port: parseInt(process.env.DB_PORT || '3306'),
    multipleStatements: true,
    connectTimeout: 5000,
  };

  const isDbConfigured = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

  let pool: mysql.Pool | null = null;
  if (isDbConfigured) {
    console.log(`[Database] Configuration detected. Host: ${dbConfig.host}, User: ${dbConfig.user}, DB: ${dbConfig.database}`);
    
    // Safety check for common mistakes
    if (dbConfig.host === 'abiy' || dbConfig.host?.includes('@')) {
      console.warn(`[Database Warning] The host "${dbConfig.host}" looks incorrect. For local MySQL, use "127.0.0.1" or "localhost".`);
    }

    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

      // Verify connection
      try {
        const connection = await pool.getConnection();
        console.log('[Database] Connected to MySQL successfully.');
        
        // Execute Schema
        console.log('[Database] Initializing schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
          
          for (const statement of statements) {
            try {
              await connection.query(statement);
            } catch (stmtErr: any) {
              // Ignore "table already exists" or similar if needed, or log specifically
              if (!stmtErr.message.includes('already exists')) {
                console.error(`[Schema Error] Failed statement: ${statement.substring(0, 50)}...`);
                console.error(`[Details]: ${stmtErr.message}`);
              }
            }
          }
          console.log('[Database] Schema initialization process complete.');
        }

        // Schema Column Normalizations for compatibility across divergent schemas
        try {
          await connection.query('ALTER TABLE Products ADD COLUMN selling_price DECIMAL(15, 2) DEFAULT 0.00');
        } catch (e) {}
        try {
          await connection.query('ALTER TABLE Products ADD COLUMN cost_price DECIMAL(15, 2) DEFAULT 0.00');
        } catch (e) {}
        try {
          await connection.query('ALTER TABLE Suppliers ADD COLUMN name VARCHAR(255)');
        } catch (e) {}
        try {
          await connection.query('ALTER TABLE Suppliers ADD COLUMN supplier_name VARCHAR(255)');
        } catch (e) {}
        try {
          await connection.query('UPDATE Suppliers SET name = supplier_name WHERE name IS NULL AND supplier_name IS NOT NULL');
          await connection.query('UPDATE Suppliers SET supplier_name = name WHERE supplier_name IS NULL AND name IS NOT NULL');
        } catch (e) {}


        // Seed Roles if empty
        const [roles]: any = await connection.execute('SELECT COUNT(*) as count FROM Roles');
        if (roles[0].count === 0) {
          console.log('[Database] Seeding default roles...');
          await connection.execute(`
            INSERT INTO Roles (role_name, permissions) VALUES 
            ('Administrator', '{"inventory": ["read", "write", "delete"], "sales": ["read", "write", "refund"], "employees": ["read", "write", "delete"], "settings": ["read", "write"]}'),
            ('Pharmacist', '{"inventory": ["read", "write"], "sales": ["read", "write"], "prescriptions": ["read", "write"]}'),
            ('Cashier', '{"sales": ["read", "write"], "inventory": ["read"]}'),
            ('Patient', '{"portal": ["read"]}')
          `);
        }

        // Seed Categories if empty
        const [categories]: any = await connection.execute('SELECT COUNT(*) as count FROM Categories');
        if (categories[0].count === 0) {
          console.log('[Database] Seeding default categories...');
          await connection.execute("INSERT INTO Categories (name) VALUES ('Antibiotics'), ('Painkillers'), ('Vitamins'), ('First Aid')");
        }

        // Seed Admin if empty
        const [employees]: any = await connection.execute('SELECT COUNT(*) as count FROM Employees');
        if (employees[0].count === 0) {
          console.log('[Database] Seeding primary administrator...');
          try {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const [adminRole]: any = await connection.execute('SELECT role_id FROM Roles WHERE role_name = ?', ['Administrator']);
            const roleId = adminRole[0]?.role_id || 1;
            
            await connection.execute(
              'INSERT INTO Employees (username, password_hash, role_id, first_name, last_name, email) VALUES (?, ?, ?, ?, ?, ?)',
              ['admin', hashedPassword, roleId, 'Master', 'Admin', 'abiyetesfaye83@gmail.com']
            );
            console.log(`[Database] Admin seeded: admin / admin123 (Role ID: ${roleId})`);
          } catch (seedErr: any) {
            console.error('[Database Error] Admin seeding failed:', seedErr.message);
          }
        }

        connection.release();
      } catch (err: any) {
        console.error('[Database] Failed to initialize database:', err.message);
      }
  } else {
    console.warn('[Database] MySQL configuration is incomplete. Please set DB_HOST, DB_USER, and DB_NAME in Settings.');
  }

  // Auth Middleware
  const JWT_SECRET = process.env.JWT_SECRET || 'aria-premium-pharmacy-default-secret-key-2026';

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });
      req.user = user;
      next();
    });
  };

  // Helper to check pool
  const ensurePool = (res: any) => {
    if (!pool) {
      res.status(503).json({ error: 'Database not connected. Please check server configuration.' });
      return false;
    }
    return true;
  };

  // Helper for audit logging
  const auditLog = async (employee_id: number, action: string, table_name: string, record_id: number | null = null, old_data: any = null, new_data: any = null) => {
    if (!pool) return;
    try {
      await pool.execute(
        'INSERT INTO Audit_Logs (employee_id, action, table_name, record_id, old_data, new_data) VALUES (?, ?, ?, ?, ?, ?)',
        [employee_id, action, table_name, record_id, old_data ? JSON.stringify(old_data) : null, new_data ? JSON.stringify(new_data) : null]
      );
    } catch (err) {
      console.error('[Audit Log Error]:', err);
    }
  };

  app.get('/api/health', async (req, res) => {
    const dbStatus = pool ? 'Configured' : 'Not Configured';
    let dbConnectivity = 'N/A';
    const hostInfo = dbConfig.host ? `${dbConfig.host.substring(0, 3)}***` : 'None';
    
    if (pool) {
      try {
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        dbConnectivity = 'Healthy';
      } catch (err: any) {
        dbConnectivity = `Error: ${err.message}`;
      }
    }
    
    res.json({
      status: 'ok',
      database: {
        status: dbStatus,
        connectivity: dbConnectivity,
        host_configured: hostInfo,
        details: dbConfig
      }
    });
  });

  app.post('/api/settings/database', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Permission denied. Administrator role required.' });
    }

    const { host, user, password, database, port } = req.body;
    
    // Test connection with new config
    const testConfig = {
      host,
      user,
      password,
      database,
      port: parseInt(port || '3306'),
      multipleStatements: true,
      connectTimeout: 5000
    };

    try {
      const testPool = mysql.createPool(testConfig);
      const connection = await testPool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      await testPool.end();

      // If success, update live config
      dbConfig.host = host;
      dbConfig.user = user;
      dbConfig.password = password;
      dbConfig.database = database;
      dbConfig.port = testConfig.port;

      // Re-create pool
      if (pool) await pool.end();
      pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Attempt to persist to .env (best effort for local dev)
      const envPath = path.join(process.cwd(), '.env');
      const envContent = `DB_HOST=${host}\nDB_USER=${user}\nDB_PASSWORD=${password}\nDB_NAME=${database}\nDB_PORT=${port}\nJWT_SECRET=${process.env.JWT_SECRET || 'aria-premium-pharmacy-default-secret-key-2026'}`;
      
      try {
        fs.writeFileSync(envPath, envContent);
        console.log('[Server] .env updated with new database configuration.');
      } catch (writeErr) {
        console.warn('[Server] Could not write to .env. Config updated for current session only.');
      }

      res.json({ status: 'success', message: 'Database configuration updated and verified.' });
    } catch (err: any) {
      console.error('[Database Config Error]:', err.message);
      res.status(500).json({ error: 'Connection Failed', details: err.message });
    }
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/login', async (req, res) => {
    if (!ensurePool(res)) return;
    const { username, password } = req.body;
    try {
      // Test connectivity before primary query if it was failing
      const [rows]: any = await pool!.execute(
        'SELECT e.*, r.role_name FROM Employees e LEFT JOIN Roles r ON e.role_id = r.role_id WHERE e.username = ?',
        [username]
      );
      const user = rows[0];

      if (!user) {
        console.warn(`[Login Attempt] User not found: ${username}`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Check if role is missing (fall back to a default or error out clearly)
      if (!user.role_name) {
        console.error(`[Login Error] User ${username} found but Role ID ${user.role_id} is missing from Roles table.`);
        return res.status(500).json({ error: 'System configuration error: Role not defined.' });
      }

      // Check if user is active
      if (!user.is_active) return res.status(401).json({ error: 'Account suspended. Contact Administrator.' });

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(401).json({ error: 'Invalid username or password' });

      const token = jwt.sign(
        { id: user.employee_id, username: user.username, role: user.role_name },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        user: {
          id: user.employee_id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_name
        }
      });
    } catch (err: any) {
      console.error('[Login API Error]:', err.message);
      let userFriendlyDetail = err.message;
      
      if (err.message.includes('EAI_AGAIN') || err.message.includes('ENOTFOUND')) {
        userFriendlyDetail = `Database host "${dbConfig.host}" could not be resolved. If running locally, use "127.0.0.1". If in the cloud, ensure DB_HOST is a valid domain or IP in Settings.`;
      } else if (err.message.includes('ECONNREFUSED')) {
        userFriendlyDetail = `Connection refused at ${dbConfig.host}:${dbConfig.port}. Ensure MySQL is running and the port is correct.`;
      } else if (err.message.includes('ER_ACCESS_DENIED_ERROR')) {
        userFriendlyDetail = 'Access denied. Verify DB_USER and DB_PASSWORD in Settings.';
      } else if (err.message.includes('ER_BAD_DB_ERROR')) {
        userFriendlyDetail = `Database "${dbConfig.database}" not found. Ensure it exists in your MySQL instance.`;
      } else if (err.message.includes('connect ETIMEDOUT')) {
        userFriendlyDetail = 'Connection timed out. Check your firewall and network settings.';
      }
      
      res.status(500).json({ 
        error: 'Database Connection Error', 
        details: userFriendlyDetail,
        code: err.code
      });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    if (!ensurePool(res)) return;
    const { first_name, last_name, username, email, password, role_id } = req.body;
    try {
      // Check if user exists
      const [existing]: any = await pool!.execute('SELECT employee_id FROM Employees WHERE username = ? OR email = ?', [username, email]);
      if (existing.length > 0) return res.status(400).json({ error: 'Username or email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const [result]: any = await pool!.execute(
        'INSERT INTO Employees (first_name, last_name, username, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?, ?)',
        [first_name, last_name, username, email, hashedPassword, role_id]
      );
      res.json({ status: 'success', id: result.insertId });
    } catch (err) {
      console.error('[Registration Error]:', err);
      res.status(500).json({ error: 'Registration failed', details: (err as any).message });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows]: any = await pool!.execute(
        'SELECT e.*, r.role_name FROM Employees e JOIN Roles r ON e.role_id = r.role_id WHERE e.employee_id = ?',
        [req.user.id]
      );
      const user = rows[0];

      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({
        id: user.employee_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name
      });
    } catch (err) {
      console.error('[Auth Me Error]:', err);
      res.status(500).json({ error: 'Database error', details: (err as any).message });
    }
  });

  app.get('/api/me/transactions', authenticateToken, async (req: any, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT t.*, ti.product_id, p.product_name, ti.quantity, ti.unit_price
        FROM Transactions t
        JOIN Transaction_Items ti ON t.transaction_id = ti.transaction_id
        JOIN Products p ON ti.product_id = p.product_id
        WHERE t.patient_id = ?
        ORDER BY t.transaction_date DESC
        LIMIT 10
      `, [req.user.id]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // --- ERP ROUTES ---
  app.get('/api/inventory', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT p.*, c.name as category_name, 
        (SELECT SUM(quantity_on_hand) FROM Product_Batches WHERE product_id = p.product_id) as total_stock
        FROM Products p
        JOIN Categories c ON p.category_id = c.category_id
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  app.get('/api/patients', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute('SELECT * FROM Patients ORDER BY created_at DESC');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  app.post('/api/patients', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      gender, 
      date_of_birth, 
      address,
      medical_history,
      allergies,
      insurance_provider,
      insurance_policy_number
    } = req.body;
    try {
      const [result]: any = await pool!.execute(
        `INSERT INTO Patients (
          first_name, 
          last_name, 
          email, 
          phone, 
          gender, 
          date_of_birth, 
          address, 
          medical_history, 
          allergies, 
          insurance_provider, 
          insurance_policy_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          first_name || '', 
          last_name || '', 
          email || '', 
          phone || '', 
          gender || 'Other', 
          date_of_birth || null, 
          address || '', 
          medical_history || '', 
          allergies || '', 
          insurance_provider || '', 
          insurance_policy_number || ''
        ]
      );
      res.json({ status: 'success', id: result.insertId, patient_id: result.insertId });
    } catch (err) {
      console.error('Failed to create patient:', err);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  });

  app.get('/api/transactions', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT t.*, p.first_name as patient_first, p.last_name as patient_last, e.username as cashier
        FROM Transactions t
        LEFT JOIN Patients p ON t.patient_id = p.patient_id
        JOIN Employees e ON t.employee_id = e.employee_id
        ORDER BY t.transaction_date DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.get('/api/categories', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute('SELECT * FROM Categories WHERE is_active = TRUE');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.get('/api/batches', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute('SELECT * FROM Product_Batches');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch batches' });
    }
  });

  app.get('/api/suppliers', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows]: any = await pool!.execute('SELECT * FROM Suppliers');
      const mapped = rows.map((r: any) => ({
        ...r,
        name: r.name || r.supplier_name || '',
        supplier_name: r.supplier_name || r.name || '',
        supplier_id: r.supplier_id || r.id
      }));
      res.json(mapped);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
  });

  app.get('/api/batches', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(
        `SELECT b.*, p.product_name 
         FROM Product_Batches b 
         JOIN Products p ON b.product_id = p.product_id 
         ORDER BY b.expiry_date ASC`
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch batches' });
    }
  });

  app.post('/api/inventory', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { product_name, generic_name, sku, description, category_id, manufacturer, strength, dosage_form, unit_of_measure, reorder_level, is_controlled_substance, requires_prescription, image_url, selling_price, cost_price } = req.body;
    try {
      const [result]: any = await pool!.execute(
        `INSERT INTO Products (product_name, generic_name, sku, description, category_id, manufacturer, strength, dosage_form, unit_of_measure, reorder_level, is_controlled_substance, requires_prescription, image_url, selling_price, cost_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [product_name, generic_name, sku, description, category_id, manufacturer, strength, dosage_form, unit_of_measure, reorder_level, is_controlled_substance, requires_prescription, image_url, selling_price || 0, cost_price || 0]
      );
      res.json({ status: 'success', product_id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.patch('/api/inventory/:id', authenticateToken, async (req: any, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    const { product_name, generic_name, sku, description, category_id, manufacturer, strength, dosage_form, unit_of_measure, reorder_level, is_controlled_substance, requires_prescription, image_url, selling_price, change_reason, batch_id } = req.body;
    
    const connection = await pool!.getConnection();
    try {
      await connection.beginTransaction();

      // Get Current Price
      const [oldRows]: any = await connection.execute('SELECT selling_price FROM Products WHERE product_id = ?', [id]);
      const oldPrice = oldRows[0]?.selling_price;

      // Update Product with COALESCE to keep existing columns if undefined in req.body
      await connection.execute(
        `UPDATE Products SET 
          product_name = COALESCE(?, product_name), 
          generic_name = COALESCE(?, generic_name), 
          sku = COALESCE(?, sku), 
          description = COALESCE(?, description), 
          category_id = COALESCE(?, category_id), 
          manufacturer = COALESCE(?, manufacturer), 
          strength = COALESCE(?, strength), 
          dosage_form = COALESCE(?, dosage_form), 
          unit_of_measure = COALESCE(?, unit_of_measure), 
          reorder_level = COALESCE(?, reorder_level), 
          is_controlled_substance = COALESCE(?, is_controlled_substance), 
          requires_prescription = COALESCE(?, requires_prescription), 
          image_url = COALESCE(?, image_url), 
          selling_price = COALESCE(?, selling_price)
        WHERE product_id = ?`,
        [
          product_name !== undefined ? product_name : null,
          generic_name !== undefined ? generic_name : null,
          sku !== undefined ? sku : null,
          description !== undefined ? description : null,
          category_id !== undefined ? category_id : null,
          manufacturer !== undefined ? manufacturer : null,
          strength !== undefined ? strength : null,
          dosage_form !== undefined ? dosage_form : null,
          unit_of_measure !== undefined ? unit_of_measure : null,
          reorder_level !== undefined ? reorder_level : null,
          is_controlled_substance !== undefined ? is_controlled_substance : null,
          requires_prescription !== undefined ? requires_prescription : null,
          image_url !== undefined ? image_url : null,
          selling_price !== undefined ? selling_price : null,
          id
        ]
      );

      // Record Price History if price changed
      if (oldPrice !== undefined && selling_price !== undefined && parseFloat(oldPrice) !== parseFloat(selling_price)) {
        await connection.execute(
          'INSERT INTO Price_History (product_id, old_price, new_price, change_reason, changed_by) VALUES (?, ?, ?, ?, ?)',
          [id, oldPrice, selling_price, change_reason || 'Price Update', req.user.id]
        );
      }

      // Update specific batch price if provided
      if (batch_id && selling_price !== undefined) {
        await connection.execute(
          'UPDATE Product_Batches SET selling_price = ? WHERE batch_id = ?',
          [selling_price, batch_id]
        );
      }

      // Log Audit
      await auditLog(req.user.id, 'Updated Product', 'Products', parseInt(id), { old_price: oldPrice }, { new_price: selling_price });

      await connection.commit();
      res.json({ status: 'success' });
    } catch (err) {
      await connection.rollback();
      console.error(err);
      res.status(500).json({ error: 'Failed to update product' });
    } finally {
      connection.release();
    }
  });

  app.post('/api/batches', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { product_id, batch_number, expiry_date, manufacturing_date, quantity_on_hand, unit_cost, selling_price, supplier_id } = req.body;
    try {
      const [result]: any = await pool!.execute(
        `INSERT INTO Product_Batches (product_id, batch_number, expiry_date, manufacturing_date, quantity_on_hand, unit_cost, selling_price, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [product_id, batch_number, expiry_date, manufacturing_date, quantity_on_hand, unit_cost, selling_price, supplier_id]
      );
      res.json({ status: 'success', batch_id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create batch' });
    }
  });

  app.post('/api/categories', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { name, description } = req.body;
    try {
      const [result]: any = await pool!.execute(
        'INSERT INTO Categories (name, description) VALUES (?, ?)',
        [name, description]
      );
      res.json({ status: 'success', category_id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  app.post('/api/suppliers', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { name, contact, phone, email, address } = req.body;
    try {
      let result;
      try {
        [result] = await pool!.execute(
          'INSERT INTO Suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
          [name, contact, phone, email, address]
        );
      } catch (insertErr) {
        // Fallback for supplier_name schema
        [result] = await pool!.execute(
          'INSERT INTO Suppliers (supplier_name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
          [name, contact, phone, email, address]
        );
      }
      res.json({ status: 'success', supplier_id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create supplier' });
    }
  });

  app.get('/api/purchase-orders', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      let rows;
      try {
        [rows] = await pool!.execute(`
          SELECT po.*, s.name as supplier_name 
          FROM Purchase_Orders po
          JOIN Suppliers s ON po.supplier_id = s.supplier_id
          ORDER BY po.created_at DESC
        `);
      } catch (fallbackErr) {
        [rows] = await pool!.execute(`
          SELECT po.*, s.supplier_name as supplier_name 
          FROM Purchase_Orders po
          JOIN Suppliers s ON po.supplier_id = s.supplier_id
          ORDER BY po.created_at DESC
        `);
      }
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  });

  app.post('/api/purchase-orders', authenticateToken, async (req: any, res) => {
    if (!ensurePool(res)) return;
    const { supplier_id, order_date, expected_delivery_date, items } = req.body;
    const employee_id = req.user.id;

    const connection = await pool!.getConnection();
    try {
      await connection.beginTransaction();

      const total_amount = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_cost), 0);
      const po_number = `PO-${Date.now()}`;

      const [result]: any = await connection.execute(
        `INSERT INTO Purchase_Orders (po_number, supplier_id, employee_id, order_date, expected_delivery_date, total_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [po_number, supplier_id, employee_id, order_date, expected_delivery_date, total_amount]
      );
      const po_id = result.insertId;

      for (const item of items) {
        await connection.execute(
          'INSERT INTO Purchase_Order_Items (po_id, product_id, quantity_ordered, unit_cost) VALUES (?, ?, ?, ?)',
          [po_id, item.product_id, item.quantity, item.unit_cost]
        );
      }

      await connection.commit();
      res.json({ status: 'success', po_id });
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      await connection.rollback();
      res.status(500).json({ error: 'Failed to create purchase order' });
    } finally {
      connection.release();
    }
  });

  app.patch('/api/purchase-orders/:id/status', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    const { status, actual_delivery_date } = req.body;
    try {
      await pool!.execute(
        'UPDATE Purchase_Orders SET status = ?, actual_delivery_date = ? WHERE po_id = ?',
        [status, actual_delivery_date || null, id]
      );
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  app.get('/api/patients', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute('SELECT * FROM Patients ORDER BY last_name ASC');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  app.get('/api/patients/:id', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    try {
      const [rows]: any = await pool!.execute('SELECT * FROM Patients WHERE patient_id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch patient' });
    }
  });

  app.patch('/api/patients/:id', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    const data = req.body;
    try {
      // Build dynamic update query
      const fields = Object.keys(data).filter(k => k !== 'patient_id' && k !== 'created_at');
      const values = fields.map(k => data[k]);
      const setClause = fields.map(k => `${k} = ?`).join(', ');
      
      await pool!.execute(
        `UPDATE Patients SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE patient_id = ?`,
        [...values, id]
      );
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update patient' });
    }
  });

  app.get('/api/patients/:id/prescriptions', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    try {
      const [rows] = await pool!.execute(`
        SELECT p.*, pr.first_name as prescriber_first, pr.last_name as prescriber_last
        FROM Prescriptions p
        JOIN Prescribers pr ON p.prescriber_id = pr.prescriber_id
        WHERE p.patient_id = ?
        ORDER BY p.created_at DESC
      `, [id]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
  });

  app.post('/api/patients', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      gender, 
      date_of_birth, 
      address,
      medical_history,
      allergies,
      insurance_provider,
      insurance_policy_number
    } = req.body;
    try {
      const [result]: any = await pool!.execute(
        `INSERT INTO Patients (
          first_name, 
          last_name, 
          email, 
          phone, 
          gender, 
          date_of_birth, 
          address, 
          medical_history, 
          allergies, 
          insurance_provider, 
          insurance_policy_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          first_name || '', 
          last_name || '', 
          email || '', 
          phone || '', 
          gender || 'Other', 
          date_of_birth || null, 
          address || '', 
          medical_history || '', 
          allergies || '', 
          insurance_provider || '', 
          insurance_policy_number || ''
        ]
      );
      res.json({ status: 'success', id: result.insertId, patient_id: result.insertId });
    } catch (err) {
      console.error('Failed to create patient:', err);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  });

  app.get('/api/prescribers', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute('SELECT * FROM Prescribers ORDER BY last_name ASC');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch prescribers' });
    }
  });

  app.post('/api/prescribers', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { first_name, last_name, license_number, specialization, clinic_name, phone, email } = req.body;
    try {
      const [result]: any = await pool!.execute(
        `INSERT INTO Prescribers (first_name, last_name, license_number, specialization, clinic_name, phone, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, license_number, specialization, clinic_name, phone, email]
      );
      res.json({ status: 'success', prescriber_id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create prescriber' });
    }
  });

  app.get('/api/prescriptions', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT p.*, pt.first_name as patient_first, pt.last_name as patient_last,
               pr.first_name as prescriber_first, pr.last_name as prescriber_last
        FROM Prescriptions p
        JOIN Patients pt ON p.patient_id = pt.patient_id
        JOIN Prescribers pr ON p.prescriber_id = pr.prescriber_id
        ORDER BY p.created_at DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
  });

  app.post('/api/prescriptions', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { patient_id, prescriber_id, issue_date, expiry_date, status, digital_signature, notes, items } = req.body;
    
    const connection = await pool!.getConnection();
    try {
      await connection.beginTransaction();

      const [result]: any = await connection.execute(
        `INSERT INTO Prescriptions (patient_id, prescriber_id, issue_date, expiry_date, status, digital_signature, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [patient_id, prescriber_id, issue_date, expiry_date || null, status, digital_signature, notes]
      );
      const prescription_id = result.insertId;

      for (const item of items) {
        await connection.execute(
          `INSERT INTO Prescription_Items (prescription_id, product_id, dosage_instructions, quantity_prescribed, refills_allowed, refills_remaining)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [prescription_id, item.product_id, item.dosage_instructions, item.quantity_prescribed, item.refills_allowed, item.refills_allowed]
        );
      }

      await connection.commit();
      res.json({ status: 'success', prescription_id });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: 'Failed to create prescription' });
    } finally {
      connection.release();
    }
  });

  app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      // Today's Sales
      const [sales]: any = await pool!.execute(`
        SELECT COUNT(*) as count, IFNULL(SUM(final_amount), 0) as revenue 
        FROM Transactions 
        WHERE DATE(transaction_date) = CURDATE() AND status = 'Completed'
      `);

      // Inventory Alerts
      const [alerts]: any = await pool!.execute(`
        SELECT p.product_name, SUM(b.quantity_on_hand) as stock, p.reorder_level
        FROM Products p
        LEFT JOIN Product_Batches b ON p.product_id = b.product_id
        GROUP BY p.product_id
        HAVING stock <= p.reorder_level
      `);

      // Employee Count
      const [employees]: any = await pool!.execute('SELECT COUNT(*) as count FROM Employees WHERE is_active = TRUE');

      // Recent Transactions
      const [recentTx]: any = await pool!.execute(`
        SELECT t.*, p.first_name, p.last_name
        FROM Transactions t
        LEFT JOIN Patients p ON t.patient_id = p.patient_id
        ORDER BY t.transaction_date DESC
        LIMIT 5
      `);

      res.json({
        salesSnapshot: {
          today_revenue: sales[0].revenue,
          today_sales: sales[0].count,
          today_refunds: 0
        },
        inventoryAlerts: alerts.map((a: any) => ({
          product_name: a.product_name,
          quantity_on_hand: a.stock
        })),
        employeeCount: employees[0].count,
        recentTransactions: recentTx
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  app.get('/api/employees', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT e.employee_id as id, e.username, e.first_name, e.last_name, e.email, e.is_active, e.created_at, r.role_name, e.role_id
        FROM Employees e
        JOIN Roles r ON e.role_id = r.role_id
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  });

  app.get('/api/employees/roles', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute('SELECT role_id, role_name, permissions FROM Roles');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  });

  app.post('/api/employees', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { first_name, last_name, username, email, phone, password, role_id } = req.body;
    try {
      console.log('[DEBUG] Attempting to create employee:', { first_name, last_name, username, email, phone, role_id });
      if (!password || !password.trim()) {
        return res.status(400).json({ error: 'Password is required' });
      }
      if (!username || !username.trim()) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const cleanFirstName = first_name?.trim() || null;
      const cleanLastName = last_name?.trim() || null;
      const cleanUsername = username.trim();
      const cleanEmail = email && email.trim() !== '' ? email.trim() : null;
      const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;
      const cleanRoleId = role_id || null;

      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      const [result]: any = await pool!.execute(
        'INSERT INTO Employees (first_name, last_name, username, email, phone, password_hash, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cleanFirstName, cleanLastName, cleanUsername, cleanEmail, cleanPhone, hashedPassword, cleanRoleId]
      );
      res.json({ status: 'success', id: result.insertId });
    } catch (err: any) {
      console.error('[Error Details] Failed to create employee:', err);
      // Check for common errors
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.message.includes('username')) {
          return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
        }
        if (err.message.includes('email')) {
          return res.status(400).json({ error: 'Email already registered. Please check or use another email.' });
        }
        return res.status(400).json({ error: 'Duplicate entry detected: ' + err.message });
      }
      res.status(500).json({ error: 'Failed to create employee: ' + (err.message || 'Unknown database issue') });
    }
  });

  app.patch('/api/employees/:id/status', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    const { is_active } = req.body;
    try {
      await pool!.execute('UPDATE Employees SET is_active = ? WHERE employee_id = ?', [is_active, id]);
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update employee status' });
    }
  });

  app.patch('/api/employees/:id/role', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    const { role_id } = req.body;
    try {
      await pool!.execute('UPDATE Employees SET role_id = ? WHERE employee_id = ?', [role_id, id]);
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update employee role' });
    }
  });

  app.post('/api/employees/roles', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { role_name, permissions } = req.body;
    try {
      const [result]: any = await pool!.execute(
        'INSERT INTO Roles (role_name, permissions) VALUES (?, ?)',
        [role_name, JSON.stringify(permissions)]
      );
      res.json({ status: 'success', role_id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create role' });
    }
  });

  app.get('/api/inventory/adjustments', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT a.*, p.product_name, e.first_name, e.last_name
        FROM Inventory_Adjustments a
        JOIN Products p ON a.product_id = p.product_id
        JOIN Employees e ON a.employee_id = e.employee_id
        ORDER BY a.created_at DESC
        LIMIT 50
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch adjustments' });
    }
  });

  app.post('/api/inventory/adjustments', authenticateToken, async (req: any, res) => {
    if (!ensurePool(res)) return;
    const { product_id, batch_id, quantity_adjusted, adjustment_type, reason } = req.body;
    const employee_id = req.user.id;

    const connection = await pool!.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Record Adjustment
      await connection.execute(
        'INSERT INTO Inventory_Adjustments (product_id, batch_id, employee_id, quantity_adjusted, adjustment_type, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [product_id, batch_id, employee_id, quantity_adjusted, adjustment_type, reason]
      );

      // 2. Update Batch Stock
      const factor = adjustment_type === 'Add' ? 1 : -1;
      await connection.execute(
        'UPDATE Product_Batches SET quantity_on_hand = quantity_on_hand + ? WHERE batch_id = ?',
        [quantity_adjusted * factor, batch_id]
      );

      await connection.commit();
      res.json({ status: 'success' });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: 'Adjustment failed' });
    } finally {
      connection.release();
    }
  });

  app.post('/api/transactions', authenticateToken, async (req: any, res) => {
    if (!ensurePool(res)) return;
    const { patient_id, total_amount, tax_amount, discount_amount, final_amount, payment_type, items } = req.body;
    const employee_id = req.user.id;

    const connection = await pool!.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create Transaction Header
      const transactionNumber = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const [txResult]: any = await connection.execute(
        `INSERT INTO Transactions (transaction_number, patient_id, employee_id, total_amount, tax_amount, discount_amount, final_amount, payment_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Completed')`,
        [transactionNumber, patient_id === 'WALK_IN' ? null : patient_id, employee_id, total_amount, tax_amount, discount_amount, final_amount, payment_type]
      );
      const transactionId = txResult.insertId;

      // 2. Process Items and update stock
      for (const item of items) {
        // Deduct from batch
        if (item.batch_id && item.batch_id !== 'SYSTEM_GENERIC') {
          const [batchRows]: any = await connection.execute(
            'SELECT quantity_on_hand FROM Product_Batches WHERE batch_id = ? FOR UPDATE',
            [item.batch_id]
          );
          if (batchRows.length === 0 || batchRows[0].quantity_on_hand < item.quantity) {
            throw new Error(`Insufficient batch stock for item ${item.product_id}`);
          }
          await connection.execute(
            'UPDATE Product_Batches SET quantity_on_hand = quantity_on_hand - ? WHERE batch_id = ?',
            [item.quantity, item.batch_id]
          );
        }

        // Insert Transaction Item
        await connection.execute(
          `INSERT INTO Transaction_Items (transaction_id, product_id, batch_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [transactionId, item.product_id, item.batch_id === 'SYSTEM_GENERIC' ? null : item.batch_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }

    // 3. Record Payment Method and Extra Details
    const { payment_details } = req.body;
    let reference = null;

    if (payment_type === 'Credit Card') {
      reference = `Card: ****${payment_details?.cardLastFour || '0000'} | Auth: ${payment_details?.cardAuthCode || 'AUTH'}`;
    } else if (payment_type === 'Insurance') {
      reference = `Policy: ${payment_details?.policyNumber || 'N/A'}`;
      
      // Create Insurance Claim record
      await connection.execute(
        `INSERT INTO Insurance_Claims (transaction_id, insurance_provider, policy_number, claim_amount, status, claim_date)
         VALUES (?, ?, ?, ?, 'Pending', CURDATE())`,
        [transactionId, payment_details?.insuranceProvider || 'N/A', payment_details?.policyNumber || 'N/A', final_amount]
      );
    } else if (payment_type === 'Other' || payment_type === 'Cash') {
      if (payment_details && payment_details.ethiopianMethod === 'telebirr') {
        reference = `telebirr: ${payment_details.telebirrPhone || 'N/A'} | OTP: Confirmed`;
      } else if (payment_details && payment_details.ethiopianMethod === 'cbe_birr') {
        reference = `CBE Birr: ${payment_details.cbePhone || 'N/A'} | Acct: ${payment_details.cbeWallet || 'N/A'}`;
      } else {
        reference = (payment_details && payment_details.customReference) || 'Cash / Mobile Payment';
      }
    } else {
      reference = (payment_details && payment_details.customReference) || 'N/A';
    }

    await connection.execute(
      'INSERT INTO Payment_Methods (transaction_id, payment_type, amount_paid, transaction_reference) VALUES (?, ?, ?, ?)',
      [transactionId, payment_type, final_amount, reference]
    );

    await connection.commit();
      
      // Log Audit
      await auditLog(employee_id, 'Finalized Sale', 'Transactions', transactionId, null, { transactionNumber, final_amount });

      res.json({ status: 'success', transaction_id: transactionId, transaction_number: transactionNumber });
    } catch (err: any) {
      await connection.rollback();
      console.error('Transaction failure:', err);
      res.status(500).json({ error: err.message || 'Transaction failed' });
    } finally {
      connection.release();
    }
  });

  app.get('/api/settings/pharmacy', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows]: any = await pool!.execute('SELECT * FROM Pharmacy_Settings ORDER BY setting_id DESC LIMIT 1');
      res.json(rows[0] || {});
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings/pharmacy', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { 
      pharmacy_name, license_number, contact_email, contact_phone, 
      address_line_1, city, state, postal_code, currency, tax_rate, theme_config 
    } = req.body;
    
    try {
      // Check if settings exist
      const [rows]: any = await pool!.execute('SELECT setting_id FROM Pharmacy_Settings LIMIT 1');
      
      if (rows.length > 0) {
        await pool!.execute(
          `UPDATE Pharmacy_Settings SET 
            pharmacy_name = ?, license_number = ?, contact_email = ?, contact_phone = ?, 
            address_line_1 = ?, city = ?, state = ?, postal_code = ?, 
            currency = ?, tax_rate = ?, theme_config = ?, updated_by = ?
          WHERE setting_id = ?`,
          [
            pharmacy_name, license_number, contact_email, contact_phone, 
            address_line_1, city, state, postal_code, 
            currency, tax_rate, JSON.stringify(theme_config), (req as any).user.id,
            rows[0].setting_id
          ]
        );
      } else {
        await pool!.execute(
          `INSERT INTO Pharmacy_Settings (
            pharmacy_name, license_number, contact_email, contact_phone, 
            address_line_1, city, state, postal_code, currency, tax_rate, theme_config, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pharmacy_name, license_number, contact_email, contact_phone, 
            address_line_1, city, state, postal_code, 
            currency, tax_rate, JSON.stringify(theme_config), (req as any).user.id
          ]
        );
      }
      res.json({ status: 'success' });
    } catch (err) {
      console.error('Settings update error:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.get('/api/audit-logs', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT a.*, e.username 
        FROM Audit_Logs a
        JOIN Employees e ON a.employee_id = e.employee_id
        ORDER BY a.created_at DESC
        LIMIT 100
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  app.get('/api/analytics/revenue', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT DATE(transaction_date) as date, SUM(final_amount) as total
        FROM Transactions
        WHERE status = 'Completed'
        AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(transaction_date)
        ORDER BY date ASC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
  });

  app.get('/api/analytics/demographics', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT gender, COUNT(*) as count
        FROM Patients
        GROUP BY gender
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch demographic analytics' });
    }
  });

  app.get('/api/analytics/top-selling', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT p.product_name as name, SUM(ti.quantity) as total_sold
        FROM Transaction_Items ti
        JOIN Products p ON ti.product_id = p.product_id
        GROUP BY ti.product_id
        ORDER BY total_sold DESC
        LIMIT 5
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch top selling analytics' });
    }
  });

  app.get('/api/analytics/profit-by-drug', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT p.product_name as name, SUM(ti.quantity * (ti.unit_price - p.cost_price)) as total_profit
        FROM Transaction_Items ti
        JOIN Products p ON ti.product_id = p.product_id
        GROUP BY ti.product_id
        ORDER BY total_profit DESC
        LIMIT 5
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch profit analytics' });
    }
  });

  app.get('/api/analytics/insurance-receivables', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows]: any = await pool!.execute(`
        SELECT IFNULL(SUM(final_amount), 0) as total_owed, COUNT(*) as pending_claims
        FROM Transactions
        WHERE payment_type = 'Insurance' AND status = 'Pending'
      `);
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch insurance analytics' });
    }
  });

  app.get('/api/analytics/expiry-alerts', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT b.*, p.product_name, DATEDIFF(b.expiry_date, CURDATE()) as days_until_expiry
        FROM Product_Batches b
        JOIN Products p ON b.product_id = p.product_id
        WHERE b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
        AND b.quantity_on_hand > 0
        ORDER BY b.expiry_date ASC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch expiry alerts' });
    }
  });

  // --- MISSING TABLE ROUTES ---

  // Price History
  app.get('/api/inventory/:id/price-history', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { id } = req.params;
    try {
      const [rows] = await pool!.execute(
        'SELECT ph.*, e.username FROM Price_History ph LEFT JOIN Employees e ON ph.changed_by = e.employee_id WHERE ph.product_id = ? ORDER BY ph.created_at DESC',
        [id]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch price history' });
    }
  });

  // Sales Returns
  app.get('/api/sales-returns', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT sr.*, t.transaction_number, e.username as refunded_by_user
        FROM Sales_Returns sr
        JOIN Transactions t ON sr.transaction_id = t.transaction_id
        JOIN Employees e ON sr.refunded_by = e.employee_id
        ORDER BY sr.return_date DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch sales returns' });
    }
  });

  app.post('/api/sales-returns', authenticateToken, async (req: any, res) => {
    if (!ensurePool(res)) return;
    const { transaction_id, total_refund_amount, reason } = req.body;
    const refunded_by = req.user.id;

    const connection = await pool!.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert return record
      const [result]: any = await connection.execute(
        'INSERT INTO Sales_Returns (transaction_id, total_refund_amount, reason, refunded_by) VALUES (?, ?, ?, ?)',
        [transaction_id, total_refund_amount, reason, refunded_by]
      );
      const returnId = result.insertId;

      // 2. Update transaction status
      await connection.execute(
        'UPDATE Transactions SET status = "Refunded" WHERE transaction_id = ?',
        [transaction_id]
      );

      // 3. Log Audit
      await auditLog(refunded_by, 'Processed Refund', 'Sales_Returns', returnId, null, { transaction_id, total_refund_amount });

      await connection.commit();
      res.json({ status: 'success', return_id: returnId });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: 'Failed to process return' });
    } finally {
      connection.release();
    }
  });

  // Payment Methods
  app.get('/api/payment-methods', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute('SELECT * FROM Payment_Methods ORDER BY created_at DESC LIMIT 100');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch payment methods records' });
    }
  });

  // Insurance Claims
  app.get('/api/insurance/claims', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    try {
      const [rows] = await pool!.execute(`
        SELECT ic.*, t.transaction_number, p.first_name, p.last_name
        FROM Insurance_Claims ic
        JOIN Transactions t ON ic.transaction_id = t.transaction_id
        JOIN Patients p ON t.patient_id = p.patient_id
        ORDER BY ic.claim_date DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch insurance claims' });
    }
  });

  app.get('/api/dashboard/patient-search', authenticateToken, async (req, res) => {
    if (!ensurePool(res)) return;
    const { q } = req.query;
    try {
      const [rows] = await pool!.execute(
        `SELECT * FROM Patients 
         WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?
         LIMIT 5`,
        [`%${q}%`, `%${q}%`, `%${q}%`]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to search patients' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Aria ERP Server bound to 0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] CRITICAL STARTUP FAILURE:', err);
});
