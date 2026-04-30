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
    console.log('🚀 Starting Nursing Execution Loop Migration...');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('📦 Creating nursing_tasks table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS nursing_tasks (
                task_id SERIAL PRIMARY KEY,
                patient_id INT NOT NULL,
                order_id INT, -- Linked to lab_radiology_orders or other CPOE
                nurse_id INT,
                specialty_id VARCHAR(50),
                task_name VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending', -- Pending, In-Progress, Completed, Cancelled
                scheduled_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completion_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('📈 Creating clinical_flowsheets table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS clinical_flowsheets (
                entry_id SERIAL PRIMARY KEY,
                patient_id INT NOT NULL,
                nurse_id INT,
                parameter_type VARCHAR(100) NOT NULL, -- GCS, Pain_Scale, I/O_Balance, Vitals
                parameter_value VARCHAR(255) NOT NULL,
                unit VARCHAR(50),
                is_critical BOOLEAN DEFAULT FALSE,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query('COMMIT');
        console.log('✅ Nursing Execution Loop Migration Completed Successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
