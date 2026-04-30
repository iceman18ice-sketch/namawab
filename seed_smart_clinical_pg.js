require('dotenv').config();
const { pool } = require('./db_postgres');

async function seedSmartClinical() {
    console.log('Seeding Smart Clinical Suggestions to PostgreSQL...');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS specialties (
                specialty_id TEXT PRIMARY KEY,
                name_en TEXT,
                name_ar TEXT,
                parent_department TEXT
            );

            CREATE TABLE IF NOT EXISTS specialty_diagnoses (
                specialty_id TEXT,
                icd10_code TEXT,
                PRIMARY KEY (specialty_id, icd10_code)
            );

            CREATE TABLE IF NOT EXISTS specialty_labs (
                specialty_id TEXT,
                lab_id INTEGER,
                PRIMARY KEY (specialty_id, lab_id)
            );

            CREATE TABLE IF NOT EXISTS specialty_radiology (
                specialty_id TEXT,
                radiology_id INTEGER,
                PRIMARY KEY (specialty_id, radiology_id)
            );

            CREATE TABLE IF NOT EXISTS icd10_codes (
                code TEXT PRIMARY KEY,
                description_en TEXT,
                description_ar TEXT
            );
        `);

        // Clear existing to re-seed cleanly
        await pool.query('TRUNCATE TABLE specialties CASCADE');
        await pool.query('TRUNCATE TABLE specialty_diagnoses CASCADE');
        await pool.query('TRUNCATE TABLE specialty_labs CASCADE');
        await pool.query('TRUNCATE TABLE specialty_radiology CASCADE');

        const knowledgeBase = [
            {
              id: 'CARDIO_INT', en: 'Interventional Cardiology', ar: 'قسطرة القلب', dept: 'Internal Medicine',
              diagnoses: [
                { code: 'I21.9', en: 'Acute myocardial infarction, unspecified', ar: 'احتشاء عضلة القلب الحاد' },
                { code: 'I20.0', en: 'Unstable angina', ar: 'الذبحة الصدرية غير المستقرة' }
              ],
              labs: [{ name: 'Troponin High Sensitivity', category: 'Cardiac', normal: '<14 ng/L' }],
              radiology: [{ name: 'Coronary Angiography', modality: 'Cath Lab' }]
            },
            {
              id: 'PEDS_ENT', en: 'Pediatric ENT', ar: 'أنف وأذن وحنجرة للأطفال', dept: 'Pediatrics',
              diagnoses: [
                { code: 'H65.0', en: 'Acute serous otitis media', ar: 'التهاب الأذن الوسطى المصلي الحاد' },
                { code: 'J03.90', en: 'Acute tonsillitis, unspecified', ar: 'التهاب اللوزتين الحاد' }
              ],
              labs: [{ name: 'Strep A Rapid Test', category: 'Microbiology', normal: 'Negative' }],
              radiology: []
            }
        ];

        for (const spec of knowledgeBase) {
            await pool.query('INSERT INTO specialties (specialty_id, name_en, name_ar, parent_department) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [spec.id, spec.en, spec.ar, spec.dept]);
            
            for (const diag of spec.diagnoses) {
                await pool.query('INSERT INTO icd10_codes (code, description_en, description_ar) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [diag.code, diag.en, diag.ar]);
                await pool.query('INSERT INTO specialty_diagnoses (specialty_id, icd10_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', [spec.id, diag.code]);
            }
            
            for (const lab of spec.labs) {
                const existing = await pool.query('SELECT id FROM lab_tests_catalog WHERE test_name = $1 LIMIT 1', [lab.name]);
                let labId;
                if (existing.rows.length > 0) {
                    labId = existing.rows[0].id;
                } else {
                    const insert = await pool.query('INSERT INTO lab_tests_catalog (test_name, category, normal_range) VALUES ($1, $2, $3) RETURNING id', [lab.name, lab.category, lab.normal]);
                    labId = insert.rows[0].id;
                }
                await pool.query('INSERT INTO specialty_labs (specialty_id, lab_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [spec.id, labId]);
            }

            for (const rad of spec.radiology) {
                const existing = await pool.query('SELECT id FROM radiology_catalog WHERE exact_name = $1 LIMIT 1', [rad.name]);
                let radId;
                if (existing.rows.length > 0) {
                    radId = existing.rows[0].id;
                } else {
                    const insert = await pool.query('INSERT INTO radiology_catalog (exact_name, modality) VALUES ($1, $2) RETURNING id', [rad.name, rad.modality]);
                    radId = insert.rows[0].id;
                }
                await pool.query('INSERT INTO specialty_radiology (specialty_id, radiology_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [spec.id, radId]);
            }
        }
        console.log('✅ Smart Clinical Tables Seeded to PostgreSQL.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seedSmartClinical();
