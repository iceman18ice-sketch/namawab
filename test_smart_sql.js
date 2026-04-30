const { pool } = require('./db_postgres');

async function testSmartQuery(specialtyId) {
    console.log(`\n=================================================`);
    console.log(`👨‍⚕️ Simulating Login for Specialty: ${specialtyId}`);
    console.log(`=================================================`);
    
    // Simulate API: /api/smart/diagnoses
    const diagQuery = `
        SELECT i.code, i.description_en,
               CASE WHEN sd.specialty_id IS NOT NULL THEN true ELSE false END as is_recommended
        FROM icd10_codes i
        LEFT JOIN specialty_diagnoses sd 
               ON i.code = sd.icd10_code AND sd.specialty_id = $1
        ORDER BY is_recommended DESC, i.code ASC
        LIMIT 5
    `;
    const diagRes = await pool.query(diagQuery, [specialtyId]);
    console.log(`\n🩺 Smart Diagnoses Dropdown (Top 5):`);
    diagRes.rows.forEach(r => {
        const tag = r.is_recommended ? '[⭐ RECOMMENDED]' : '                 ';
        console.log(`${tag} ${r.code} - ${r.description_en}`);
    });

    // Simulate API: /api/smart/labs
    const labQuery = `
        SELECT l.test_name, l.category,
               CASE WHEN sl.specialty_id IS NOT NULL THEN true ELSE false END as is_recommended
        FROM lab_tests_catalog l
        LEFT JOIN specialty_labs sl 
               ON l.id = sl.lab_id AND sl.specialty_id = $1
        ORDER BY is_recommended DESC, l.test_name ASC
        LIMIT 5
    `;
    const labRes = await pool.query(labQuery, [specialtyId]);
    console.log(`\n🔬 Smart Lab Orders (Top 5):`);
    labRes.rows.forEach(r => {
        const tag = r.is_recommended ? '[⭐ QUICK ORDER]' : '                 ';
        console.log(`${tag} ${r.test_name} (${r.category})`);
    });
}

async function run() {
    await testSmartQuery('CARDIO_INT');
    await testSmartQuery('PEDS_ENT');
    process.exit(0);
}

run();
