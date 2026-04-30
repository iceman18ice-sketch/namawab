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
    console.log('🚀 Starting Financial RCM Migration...');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('📦 Creating service_catalog table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS service_catalog (
                id SERIAL PRIMARY KEY,
                service_code VARCHAR(50) UNIQUE,
                name_en VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                department VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('💰 Creating billing_transactions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing_transactions (
                transaction_id SERIAL PRIMARY KEY,
                patient_id INT NOT NULL,
                order_id INT,
                task_id INT,
                service_code VARCHAR(50),
                amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                status VARCHAR(50) DEFAULT 'Draft', -- Draft -> Billed -> Paid -> Claimed
                nphies_status VARCHAR(50) DEFAULT 'Not Submitted', -- Not Submitted -> Submitted -> Awaiting Approval -> Approved -> Rejected
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed some service catalog data to test pricing
        console.log('🌱 Seeding Service Catalog...');
        const services = [
            { code: 'LAB-001', en: 'Troponin Draw', ar: 'سحب عينة تروبونين', price: 150.00, dept: 'ICU' },
            { code: 'LAB-002', en: 'CBC Panel', ar: 'تحليل دم شامل', price: 85.00, dept: 'Laboratory' },
            { code: 'RAD-001', en: 'Chest X-Ray', ar: 'أشعة سينية للصدر', price: 200.00, dept: 'Radiology' },
            { code: 'NUR-001', en: 'IV Insertion', ar: 'تركيب قسطرة وريدية', price: 50.00, dept: 'Nursing' },
            { code: 'NUR-002', en: 'Foley Catheter', ar: 'تركيب قسطرة بولية', price: 120.00, dept: 'Nursing' }
        ];

        for (const s of services) {
            await client.query(`
                INSERT INTO service_catalog (service_code, name_en, name_ar, price, department)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (service_code) DO NOTHING
            `, [s.code, s.en, s.ar, s.price, s.dept]);
        }

        await client.query('COMMIT');
        console.log('✅ Financial RCM Migration Completed Successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
