/**
 * Clinical Workflows Migration
 * CPOE Order Sets, Nursing Flowsheets, Clinical Alerts
 * 
 * SAFE: CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS
 */
const { pool } = require('../../db_postgres');

async function runClinicalMigration() {
    const client = await pool.connect();
    try {
        console.log('  🩺 Running Clinical Workflows Migration...');

        // ===== 1. CPOE Order Sets =====
        await client.query(`
            CREATE TABLE IF NOT EXISTS cpoe_order_sets (
                id SERIAL PRIMARY KEY,
                name TEXT DEFAULT '',
                name_ar TEXT DEFAULT '',
                specialty TEXT DEFAULT 'General',
                diagnosis_code TEXT DEFAULT '',
                diagnosis_name TEXT DEFAULT '',
                description TEXT DEFAULT '',
                created_by TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS cpoe_order_set_items (
                id SERIAL PRIMARY KEY,
                order_set_id INTEGER REFERENCES cpoe_order_sets(id) ON DELETE CASCADE,
                item_type TEXT DEFAULT 'lab',
                item_code TEXT DEFAULT '',
                item_name TEXT DEFAULT '',
                item_name_ar TEXT DEFAULT '',
                dosage TEXT DEFAULT '',
                frequency TEXT DEFAULT '',
                duration TEXT DEFAULT '',
                route TEXT DEFAULT '',
                priority TEXT DEFAULT 'Routine',
                instructions TEXT DEFAULT '',
                sort_order INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS cpoe_active_orders (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                order_set_id INTEGER DEFAULT 0,
                item_type TEXT DEFAULT 'lab',
                item_code TEXT DEFAULT '',
                item_name TEXT DEFAULT '',
                dosage TEXT DEFAULT '',
                frequency TEXT DEFAULT '',
                duration TEXT DEFAULT '',
                route TEXT DEFAULT '',
                priority TEXT DEFAULT 'Routine',
                status TEXT DEFAULT 'Ordered',
                ordered_by TEXT DEFAULT '',
                ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                notes TEXT DEFAULT ''
            );
        `);
        console.log('    ✅ CPOE Order Sets tables created');

        // ===== 2. Nursing Flowsheet Tables =====
        await client.query(`
            CREATE TABLE IF NOT EXISTS flowsheet_intake_output (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                shift TEXT DEFAULT 'Morning',
                intake_type TEXT DEFAULT 'Oral',
                intake_amount INTEGER DEFAULT 0,
                intake_details TEXT DEFAULT '',
                output_type TEXT DEFAULT 'Urine',
                output_amount INTEGER DEFAULT 0,
                output_details TEXT DEFAULT '',
                iv_fluid TEXT DEFAULT '',
                iv_rate INTEGER DEFAULT 0,
                nurse TEXT DEFAULT '',
                notes TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS flowsheet_wound_care (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                wound_location TEXT DEFAULT '',
                wound_type TEXT DEFAULT '',
                wound_size TEXT DEFAULT '',
                wound_stage TEXT DEFAULT 'Stage I',
                drainage_type TEXT DEFAULT 'None',
                drainage_amount TEXT DEFAULT '',
                dressing_type TEXT DEFAULT '',
                dressing_changed INTEGER DEFAULT 0,
                wound_status TEXT DEFAULT 'Improving',
                nurse TEXT DEFAULT '',
                next_change TIMESTAMP,
                notes TEXT DEFAULT '',
                photo_path TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS flowsheet_pain (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                pain_score INTEGER DEFAULT 0,
                pain_location TEXT DEFAULT '',
                pain_type TEXT DEFAULT 'Acute',
                pain_quality TEXT DEFAULT '',
                pain_onset TEXT DEFAULT '',
                aggravating TEXT DEFAULT '',
                relieving TEXT DEFAULT '',
                intervention TEXT DEFAULT '',
                post_intervention_score INTEGER DEFAULT 0,
                reassessment_time TIMESTAMP,
                nurse TEXT DEFAULT '',
                notes TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS flowsheet_gcs (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                eye_response INTEGER DEFAULT 4,
                verbal_response INTEGER DEFAULT 5,
                motor_response INTEGER DEFAULT 6,
                total_score INTEGER DEFAULT 15,
                pupil_left TEXT DEFAULT 'PERRL',
                pupil_right TEXT DEFAULT 'PERRL',
                pupil_left_size INTEGER DEFAULT 3,
                pupil_right_size INTEGER DEFAULT 3,
                nurse TEXT DEFAULT '',
                notes TEXT DEFAULT ''
            );
        `);
        console.log('    ✅ Nursing Flowsheet tables created (I/O, Wound, Pain, GCS)');

        // ===== 3. Clinical Alerts =====
        await client.query(`
            CREATE TABLE IF NOT EXISTS clinical_alerts (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name TEXT DEFAULT '',
                alert_type TEXT DEFAULT 'Warning',
                category TEXT DEFAULT 'General',
                title TEXT DEFAULT '',
                message TEXT DEFAULT '',
                severity TEXT DEFAULT 'Medium',
                source TEXT DEFAULT 'System',
                is_read INTEGER DEFAULT 0,
                is_dismissed INTEGER DEFAULT 0,
                dismissed_by TEXT DEFAULT '',
                dismissed_at TIMESTAMP,
                related_order_id INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('    ✅ Clinical Alerts table created');

        // ===== 4. Seed Drug Interactions (common critical pairs) =====
        const diCount = (await client.query('SELECT COUNT(*) as cnt FROM drug_interactions')).rows[0].cnt;
        if (parseInt(diCount) === 0) {
            await client.query(`
                INSERT INTO drug_interactions (drug_a, drug_b, interaction_type, severity, description, clinical_action) VALUES
                ('Warfarin', 'Aspirin', 'Increased Bleeding Risk', 'Major', 'Concurrent use increases risk of serious bleeding', 'Avoid combination or monitor INR closely'),
                ('Warfarin', 'Ibuprofen', 'Increased Bleeding Risk', 'Major', 'NSAIDs increase anticoagulant effect and GI bleeding risk', 'Use alternative analgesic (Paracetamol)'),
                ('Metformin', 'Contrast Dye', 'Lactic Acidosis Risk', 'Major', 'IV contrast can cause acute kidney injury leading to metformin accumulation', 'Hold Metformin 48h before/after contrast'),
                ('ACE Inhibitor', 'Potassium', 'Hyperkalemia', 'Major', 'ACEi reduces potassium excretion; supplements can cause dangerous hyperkalemia', 'Monitor serum K+ regularly'),
                ('Ciprofloxacin', 'Theophylline', 'Theophylline Toxicity', 'Major', 'Ciprofloxacin inhibits theophylline metabolism', 'Reduce theophylline dose by 50% or use alternative'),
                ('Methotrexate', 'NSAIDs', 'Methotrexate Toxicity', 'Contraindicated', 'NSAIDs reduce renal clearance of methotrexate', 'Avoid combination; use alternative pain relief'),
                ('Digoxin', 'Amiodarone', 'Digoxin Toxicity', 'Major', 'Amiodarone increases digoxin levels by 70-100%', 'Reduce digoxin dose by 50% when starting amiodarone'),
                ('Clopidogrel', 'Omeprazole', 'Reduced Antiplatelet Effect', 'Moderate', 'Omeprazole inhibits CYP2C19 activation of clopidogrel', 'Use Pantoprazole instead'),
                ('Simvastatin', 'Erythromycin', 'Rhabdomyolysis Risk', 'Major', 'Macrolides inhibit statin metabolism via CYP3A4', 'Use Rosuvastatin or hold statin during antibiotic course'),
                ('Insulin', 'Beta-Blockers', 'Hypoglycemia Masking', 'Moderate', 'Beta-blockers mask tachycardia signs of hypoglycemia', 'Use cardioselective beta-blockers; educate patient on symptoms'),
                ('Lithium', 'NSAIDs', 'Lithium Toxicity', 'Major', 'NSAIDs reduce renal lithium clearance', 'Monitor lithium levels; use Paracetamol instead'),
                ('Fluconazole', 'Warfarin', 'Increased INR', 'Major', 'Fluconazole inhibits warfarin metabolism via CYP2C9', 'Reduce warfarin dose 25-50%; monitor INR daily'),
                ('Metronidazole', 'Alcohol', 'Disulfiram Reaction', 'Major', 'Causes severe nausea, vomiting, flushing, tachycardia', 'Avoid alcohol during and 48h after treatment'),
                ('Carbamazepine', 'Oral Contraceptives', 'Contraceptive Failure', 'Major', 'Carbamazepine induces metabolism of estrogen/progestin', 'Use alternative contraception method'),
                ('SSRIs', 'MAOIs', 'Serotonin Syndrome', 'Contraindicated', 'Life-threatening serotonin excess: hyperthermia, rigidity, clonus', 'Minimum 14-day washout between agents')
            `);
            console.log('    ✅ Seeded 15 critical drug interactions');
        }

        // ===== 5. Seed CPOE Order Sets (common clinical templates) =====
        const osCount = (await client.query('SELECT COUNT(*) as cnt FROM cpoe_order_sets')).rows[0].cnt;
        if (parseInt(osCount) === 0) {
            // DKA Order Set
            const dka = (await client.query(`INSERT INTO cpoe_order_sets (name, name_ar, specialty, diagnosis_code, diagnosis_name, description, created_by) VALUES ('DKA Management', 'إدارة الحماض الكيتوني السكري', 'Endocrinology', 'E10.1', 'Diabetic Ketoacidosis', 'Complete order set for DKA admission and management', 'System') RETURNING id`)).rows[0].id;
            await client.query(`INSERT INTO cpoe_order_set_items (order_set_id, item_type, item_name, item_name_ar, dosage, frequency, route, priority, sort_order) VALUES
                ($1, 'lab', 'CBC', 'تعداد الدم الكامل', '', 'STAT', '', 'STAT', 1),
                ($1, 'lab', 'Blood Glucose', 'جلوكوز الدم', '', 'q1h', '', 'STAT', 2),
                ($1, 'lab', 'ABG', 'غازات الدم الشريانية', '', 'STAT then q2h', '', 'STAT', 3),
                ($1, 'lab', 'BMP (Na, K, Cl, CO2, BUN, Cr)', 'لوحة الأيض الأساسية', '', 'STAT then q4h', '', 'STAT', 4),
                ($1, 'lab', 'Serum Ketones', 'كيتونات المصل', '', 'STAT', '', 'STAT', 5),
                ($1, 'lab', 'HbA1c', 'السكر التراكمي', '', 'Once', '', 'Routine', 6),
                ($1, 'med', 'Normal Saline 0.9%', 'محلول ملحي 0.9%', '1000ml', '1L/hr x 2hrs then 250ml/hr', 'IV', 'STAT', 7),
                ($1, 'med', 'Insulin Regular', 'أنسولين عادي', '0.1 units/kg/hr', 'Continuous', 'IV Drip', 'STAT', 8),
                ($1, 'med', 'Potassium Chloride', 'كلوريد البوتاسيوم', '20-40 mEq/L', 'Per protocol', 'IV', 'STAT', 9),
                ($1, 'order', 'Cardiac Monitor', 'جهاز مراقبة القلب', '', 'Continuous', '', 'STAT', 10),
                ($1, 'order', 'Strict I&O', 'مراقبة الداخل والخارج', '', 'Continuous', '', 'STAT', 11),
                ($1, 'order', 'Foley Catheter', 'قسطرة بولية', '', 'Insert', '', 'STAT', 12)
            `, [dka]);

            // Chest Pain / ACS Order Set
            const acs = (await client.query(`INSERT INTO cpoe_order_sets (name, name_ar, specialty, diagnosis_code, diagnosis_name, description, created_by) VALUES ('ACS / Chest Pain', 'متلازمة الشريان التاجي الحادة', 'Cardiology', 'I21.9', 'Acute Coronary Syndrome', 'Initial workup and management for chest pain / ACS', 'System') RETURNING id`)).rows[0].id;
            await client.query(`INSERT INTO cpoe_order_set_items (order_set_id, item_type, item_name, item_name_ar, dosage, frequency, route, priority, sort_order) VALUES
                ($1, 'lab', 'Troponin I', 'تروبونين', '', 'STAT then q6h x3', '', 'STAT', 1),
                ($1, 'lab', 'CBC', 'تعداد الدم', '', 'STAT', '', 'STAT', 2),
                ($1, 'lab', 'BMP', 'لوحة الأيض', '', 'STAT', '', 'STAT', 3),
                ($1, 'lab', 'PT/INR', 'وقت البروثرومبين', '', 'STAT', '', 'STAT', 4),
                ($1, 'lab', 'Lipid Panel', 'لوحة الدهون', '', 'Fasting', '', 'Routine', 5),
                ($1, 'med', 'Aspirin', 'أسبرين', '325mg', 'Now then 81mg daily', 'PO', 'STAT', 6),
                ($1, 'med', 'Clopidogrel', 'كلوبيدوجريل', '300mg loading', 'Then 75mg daily', 'PO', 'STAT', 7),
                ($1, 'med', 'Heparin', 'هيبارين', '60 units/kg bolus', 'Then 12 units/kg/hr', 'IV', 'STAT', 8),
                ($1, 'med', 'Nitroglycerin', 'نيتروجليسرين', '0.4mg SL', 'q5min x3 PRN chest pain', 'SL', 'STAT', 9),
                ($1, 'med', 'Morphine', 'مورفين', '2-4mg', 'q5min PRN pain', 'IV', 'STAT', 10),
                ($1, 'order', '12-Lead ECG', 'تخطيط القلب', '', 'STAT then q6h', '', 'STAT', 11),
                ($1, 'order', 'Chest X-Ray', 'أشعة الصدر', '', 'Portable', '', 'STAT', 12)
            `, [acs]);

            // Pneumonia Order Set
            const pn = (await client.query(`INSERT INTO cpoe_order_sets (name, name_ar, specialty, diagnosis_code, diagnosis_name, description, created_by) VALUES ('Community Pneumonia', 'الالتهاب الرئوي المكتسب', 'Pulmonology', 'J18.9', 'Pneumonia', 'Standard admission orders for community-acquired pneumonia', 'System') RETURNING id`)).rows[0].id;
            await client.query(`INSERT INTO cpoe_order_set_items (order_set_id, item_type, item_name, item_name_ar, dosage, frequency, route, priority, sort_order) VALUES
                ($1, 'lab', 'CBC with Differential', 'تعداد الدم التفصيلي', '', 'STAT', '', 'STAT', 1),
                ($1, 'lab', 'Blood Culture x2', 'مزرعة دم', '', 'Before antibiotics', '', 'STAT', 2),
                ($1, 'lab', 'Sputum Culture', 'مزرعة بلغم', '', 'STAT', '', 'STAT', 3),
                ($1, 'lab', 'ABG', 'غازات الدم', '', 'STAT if SpO2 < 92%', '', 'STAT', 4),
                ($1, 'lab', 'Procalcitonin', 'بروكالسيتونين', '', 'STAT', '', 'STAT', 5),
                ($1, 'med', 'Ceftriaxone', 'سيفترياكسون', '1g', 'q24h', 'IV', 'STAT', 6),
                ($1, 'med', 'Azithromycin', 'أزيثروميسين', '500mg', 'q24h', 'IV/PO', 'STAT', 7),
                ($1, 'med', 'Paracetamol', 'باراسيتامول', '1g', 'q6h PRN fever > 38.5', 'IV/PO', 'Routine', 8),
                ($1, 'order', 'Chest X-Ray PA/Lateral', 'أشعة صدر', '', 'STAT', '', 'STAT', 9),
                ($1, 'order', 'O2 via Nasal Cannula', 'أكسجين', '2-6 L/min', 'To keep SpO2 > 94%', '', 'STAT', 10)
            `, [pn]);

            console.log('    ✅ Seeded 3 CPOE Order Sets (DKA, ACS, Pneumonia)');
        }

        console.log('  🩺 Clinical Workflows Migration complete!\n');
    } catch (err) {
        console.error('  ❌ Clinical Migration error:', err.message);
    } finally {
        client.release();
    }
}

module.exports = { runClinicalMigration };
