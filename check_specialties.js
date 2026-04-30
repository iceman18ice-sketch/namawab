require('dotenv').config();
const { pool } = require('./db_postgres');

async function checkSpecialties() {
    try {
        const countRes = await pool.query('SELECT COUNT(*) as count FROM specialties');
        const total = countRes.rows[0].count;

        // Use ctid to approximate insertion order if no timestamp exists
        const firstRes = await pool.query('SELECT specialty_id, name_en FROM specialties ORDER BY ctid ASC LIMIT 5');
        const lastRes = await pool.query('SELECT specialty_id, name_en FROM specialties ORDER BY ctid DESC LIMIT 5');

        console.log(`TOTAL_COUNT:${total}`);
        console.log('FIRST_5:');
        firstRes.rows.forEach(r => console.log(` - ${r.specialty_id}: ${r.name_en}`));
        console.log('LAST_5:');
        lastRes.rows.forEach(r => console.log(` - ${r.specialty_id}: ${r.name_en}`));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSpecialties();
