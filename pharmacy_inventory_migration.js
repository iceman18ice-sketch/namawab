const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'nama_medical_web',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
});

async function runMigration() {
    console.log('🚀 Starting Pharmacy & Inventory Migration...');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('📦 Dropping old tables if they exist...');
        await client.query('DROP TABLE IF EXISTS pharmacy_dispensing CASCADE');
        await client.query('DROP TABLE IF EXISTS pharmacy_batches CASCADE');
        await client.query('DROP TABLE IF EXISTS inventory_items CASCADE');

        console.log('📦 Creating inventory_items table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory_items (
                item_code VARCHAR(50) PRIMARY KEY,
                item_name_en VARCHAR(255) NOT NULL,
                item_name_ar VARCHAR(255) NOT NULL,
                category VARCHAR(100), -- Medication, Consumable, IV Fluid
                unit_of_measure VARCHAR(50),
                unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                min_stock_level INT DEFAULT 10,
                current_stock INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('💊 Creating pharmacy_batches table (Expiry Tracking)...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS pharmacy_batches (
                batch_id SERIAL PRIMARY KEY,
                item_code VARCHAR(50) REFERENCES inventory_items(item_code),
                batch_number VARCHAR(100) NOT NULL,
                quantity INT NOT NULL,
                expiry_date DATE NOT NULL,
                received_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('🏥 Creating pharmacy_dispensing table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS pharmacy_dispensing (
                dispense_id SERIAL PRIMARY KEY,
                order_id INT, -- Link to emar_orders
                patient_id INT,
                item_code VARCHAR(50) REFERENCES inventory_items(item_code),
                quantity INT NOT NULL,
                dispensed_by VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Dispensed',
                dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed some sample inventory data
        console.log('🌱 Seeding Medical Inventory...');
        const inventory = [
            { code: 'MED-001', en: 'Paracetamol 500mg', ar: 'باراسيتامول 500 مجم', cat: 'Medication', uom: 'Tablet', price: 0.50, stock: 500, min: 100 },
            { code: 'MED-002', en: 'Amoxicillin 250mg', ar: 'أموكسيسيلين 250 مجم', cat: 'Medication', uom: 'Capsule', price: 2.00, stock: 200, min: 50 },
            { code: 'MED-003', en: 'Lisinopril 10mg', ar: 'ليسينوبريل 10 مجم', cat: 'Medication', uom: 'Tablet', price: 1.50, stock: 300, min: 50 },
            { code: 'MED-004', en: 'Omeprazole 20mg', ar: 'أوميبرازول 20 مجم', cat: 'Medication', uom: 'Capsule', price: 3.00, stock: 150, min: 40 },
            { code: 'IV-001', en: 'Normal Saline 500ml', ar: 'محلول ملحي 500 مل', cat: 'IV Fluid', uom: 'Bag', price: 15.00, stock: 120, min: 30 },
            { code: 'CON-001', en: 'Syringe 5ml', ar: 'محقنة 5 مل', cat: 'Consumable', uom: 'Piece', price: 1.00, stock: 1000, min: 200 },
            { code: 'CON-002', en: 'IV Cannula 20G', ar: 'قسطرة وريدية مقاس 20', cat: 'Consumable', uom: 'Piece', price: 5.00, stock: 50, min: 100 } // Notice low stock here
        ];

        for (const item of inventory) {
            await client.query(`
                INSERT INTO inventory_items (item_code, item_name_en, item_name_ar, category, unit_of_measure, unit_price, current_stock, min_stock_level)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (item_code) DO NOTHING
            `, [item.code, item.en, item.ar, item.cat, item.uom, item.price, item.stock, item.min]);
            
            // Seed a batch for each item expiring in 1 year
            await client.query(`
                INSERT INTO pharmacy_batches (item_code, batch_number, quantity, expiry_date)
                VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '1 year')
            `, [item.code, 'BATCH-' + Math.floor(Math.random() * 10000), item.stock]);
        }

        // Also make sure service_catalog knows about these for billing consistency
        console.log('🔄 Syncing Inventory to Service Catalog for Billing...');
        for (const item of inventory) {
            await client.query(`
                INSERT INTO service_catalog (service_code, name_en, name_ar, price, department)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (service_code) DO NOTHING
            `, [item.code, item.en, item.ar, item.price, 'Pharmacy']);
        }

        await client.query('COMMIT');
        console.log('✅ Pharmacy & Inventory Migration Completed Successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
