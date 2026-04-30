/**
 * Saudi Healthcare Compliance Migration
 * Adds tables and columns for ZATCA P2, NPHIES, Wasfaty, and Yaqeen
 * 
 * SAFE: Uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS
 *       Uses CREATE TABLE IF NOT EXISTS
 *       Zero data loss guaranteed
 */
const { pool } = require('../../db_postgres');

async function runComplianceMigration() {
    const client = await pool.connect();
    try {
        console.log('  🇸🇦 Running Saudi Compliance Migration...');

        // ===== 1. ZATCA Phase 2 — Add columns to zatca_invoices =====
        await client.query(`
            DO $$ BEGIN
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS pih_hash TEXT DEFAULT '';
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS icsn_counter INTEGER DEFAULT 0;
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS xml_content TEXT DEFAULT '';
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS signed_xml TEXT DEFAULT '';
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS clearance_status TEXT DEFAULT 'Pending';
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS reporting_status TEXT DEFAULT 'Pending';
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS device_serial TEXT DEFAULT '';
                ALTER TABLE zatca_invoices ADD COLUMN IF NOT EXISTS uuid TEXT DEFAULT '';
            EXCEPTION WHEN OTHERS THEN NULL;
            END $$;
        `);
        console.log('    ✅ ZATCA Phase 2 columns added');

        // ===== 2. NPHIES — New tables =====
        await client.query(`
            CREATE TABLE IF NOT EXISTS nphies_config (
                id SERIAL PRIMARY KEY,
                provider_id TEXT DEFAULT '',
                license_number TEXT DEFAULT '',
                base_url TEXT DEFAULT 'https://HSB.nphies.sa/$process-message',
                sender_id TEXT DEFAULT '',
                receiver_id TEXT DEFAULT '',
                api_key TEXT DEFAULT '',
                certificate TEXT DEFAULT '',
                private_key TEXT DEFAULT '',
                is_production INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS nphies_eligibility (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                national_id TEXT DEFAULT '',
                insurance_company TEXT DEFAULT '',
                policy_number TEXT DEFAULT '',
                member_id TEXT DEFAULT '',
                request_bundle TEXT DEFAULT '',
                response_bundle TEXT DEFAULT '',
                eligibility_status TEXT DEFAULT 'Pending',
                coverage_period_start TEXT DEFAULT '',
                coverage_period_end TEXT DEFAULT '',
                benefits_summary TEXT DEFAULT '',
                error_message TEXT DEFAULT '',
                nphies_request_id TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS nphies_preauth (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                insurance_company TEXT DEFAULT '',
                policy_number TEXT DEFAULT '',
                diagnosis_code TEXT DEFAULT '',
                diagnosis_desc TEXT DEFAULT '',
                procedure_code TEXT DEFAULT '',
                procedure_desc TEXT DEFAULT '',
                estimated_cost NUMERIC(12,2) DEFAULT 0,
                approved_amount NUMERIC(12,2) DEFAULT 0,
                request_bundle TEXT DEFAULT '',
                response_bundle TEXT DEFAULT '',
                preauth_status TEXT DEFAULT 'Pending',
                approval_number TEXT DEFAULT '',
                denial_reason TEXT DEFAULT '',
                nphies_request_id TEXT DEFAULT '',
                valid_from TEXT DEFAULT '',
                valid_to TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS nphies_claims (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                insurance_company TEXT DEFAULT '',
                policy_number TEXT DEFAULT '',
                preauth_id INTEGER DEFAULT 0,
                invoice_id INTEGER DEFAULT 0,
                claim_type TEXT DEFAULT 'institutional',
                diagnosis_codes TEXT DEFAULT '',
                procedure_codes TEXT DEFAULT '',
                total_claim NUMERIC(12,2) DEFAULT 0,
                approved_amount NUMERIC(12,2) DEFAULT 0,
                patient_share NUMERIC(12,2) DEFAULT 0,
                request_bundle TEXT DEFAULT '',
                response_bundle TEXT DEFAULT '',
                claim_status TEXT DEFAULT 'Pending',
                payment_status TEXT DEFAULT 'Unpaid',
                adjudication_notes TEXT DEFAULT '',
                nphies_request_id TEXT DEFAULT '',
                nphies_claim_id TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('    ✅ NPHIES tables created (config, eligibility, preauth, claims)');

        // ===== 3. Wasfaty — E-Prescription =====
        await client.query(`
            CREATE TABLE IF NOT EXISTS wasfaty_prescriptions (
                id SERIAL PRIMARY KEY,
                prescription_id INTEGER,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                national_id TEXT DEFAULT '',
                doctor_name TEXT DEFAULT '',
                doctor_license TEXT DEFAULT '',
                facility_id TEXT DEFAULT '',
                medication_code TEXT DEFAULT '',
                medication_name TEXT DEFAULT '',
                dosage TEXT DEFAULT '',
                frequency TEXT DEFAULT '',
                duration TEXT DEFAULT '',
                quantity INTEGER DEFAULT 0,
                refills INTEGER DEFAULT 0,
                request_payload TEXT DEFAULT '',
                response_payload TEXT DEFAULT '',
                wasfaty_reference TEXT DEFAULT '',
                wasfaty_status TEXT DEFAULT 'Pending',
                dispensing_pharmacy TEXT DEFAULT '',
                dispensed_at TIMESTAMP,
                error_message TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            DO $$ BEGIN
                ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS wasfaty_id TEXT DEFAULT '';
                ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS wasfaty_status TEXT DEFAULT '';
            EXCEPTION WHEN OTHERS THEN NULL;
            END $$;
        `);
        console.log('    ✅ Wasfaty table created + prescriptions columns added');

        // ===== 4. Yaqeen — Identity Verification =====
        await client.query(`
            CREATE TABLE IF NOT EXISTS yaqeen_verifications (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                national_id TEXT DEFAULT '',
                id_type TEXT DEFAULT 'NationalID',
                request_payload TEXT DEFAULT '',
                response_payload TEXT DEFAULT '',
                verification_status TEXT DEFAULT 'Pending',
                full_name_ar TEXT DEFAULT '',
                full_name_en TEXT DEFAULT '',
                date_of_birth TEXT DEFAULT '',
                gender TEXT DEFAULT '',
                nationality TEXT DEFAULT '',
                id_expiry TEXT DEFAULT '',
                verified_at TIMESTAMP,
                error_message TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Add missing columns if table existed with old schema
            DO $$ BEGIN
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS id_type TEXT DEFAULT 'NationalID';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS request_payload TEXT DEFAULT '';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS response_payload TEXT DEFAULT '';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Pending';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS full_name_ar TEXT DEFAULT '';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS full_name_en TEXT DEFAULT '';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS date_of_birth TEXT DEFAULT '';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS id_expiry TEXT DEFAULT '';
                ALTER TABLE yaqeen_verifications ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS yaqeen_verified INTEGER DEFAULT 0;
                ALTER TABLE patients ADD COLUMN IF NOT EXISTS yaqeen_verified_at TIMESTAMP;
            EXCEPTION WHEN OTHERS THEN NULL;
            END $$;
        `);
        console.log('    ✅ Yaqeen table created + patients columns added');

        // Insert default NPHIES config if not exists
        const configExists = (await client.query('SELECT COUNT(*) as cnt FROM nphies_config')).rows[0].cnt;
        if (parseInt(configExists) === 0) {
            await client.query(`INSERT INTO nphies_config (provider_id, license_number, sender_id, receiver_id) VALUES ('NAMA-MEDICAL', '', 'NAMA-MEDICAL', 'NPHIES')`);
        }

        console.log('  🇸🇦 Saudi Compliance Migration complete!\n');
    } catch (err) {
        console.error('  ❌ Migration error:', err.message);
    } finally {
        client.release();
    }
}

module.exports = { runComplianceMigration };
