require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// Use same config as other scripts
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'nama_medical_web',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function runAudit() {
    console.log('Starting Comprehensive Clinical Data Coverage Audit...');
    
    try {
        // 1. Get all specialties
        const specialtiesResult = await pool.query('SELECT specialty_id, name_en FROM specialties ORDER BY specialty_id');
        const specialties = specialtiesResult.rows;

        console.log(`Found ${specialties.length} specialties in the master list.`);

        let csvContent = 'Specialty_ID,Specialty_Name,Diagnosis_Count,Lab_Count,Rad_Count,Consent_Count,Status\n';
        
        let stats = {
            total: specialties.length,
            full: 0,
            low: 0,
            critical: 0,
            missingCategories: { diagnoses: 0, labs: 0, radiology: 0, consents: 0 }
        };
        
        let criticalList = [];

        // 2. Loop through each specialty and count
        for (const spec of specialties) {
            const sid = spec.specialty_id;
            
            const diagResult = await pool.query('SELECT count(*) as c FROM specialty_diagnoses WHERE specialty_id = $1', [sid]);
            const diagCount = parseInt(diagResult.rows[0].c);
            
            const labResult = await pool.query('SELECT count(*) as c FROM specialty_labs WHERE specialty_id = $1', [sid]);
            const labCount = parseInt(labResult.rows[0].c);
            
            const radResult = await pool.query('SELECT count(*) as c FROM specialty_radiology WHERE specialty_id = $1', [sid]);
            const radCount = parseInt(radResult.rows[0].c);
            
            const consentResult = await pool.query('SELECT count(*) as c FROM consent_templates WHERE specialty_id = $1', [sid]);
            const consentCount = parseInt(consentResult.rows[0].c);
            
            let status = 'Full';
            
            if (diagCount === 0 || labCount === 0 || radCount === 0 || consentCount === 0) {
                status = 'CRITICAL_GAP';
                stats.critical++;
                criticalList.push(spec);
                
                if (diagCount === 0) stats.missingCategories.diagnoses++;
                if (labCount === 0) stats.missingCategories.labs++;
                if (radCount === 0) stats.missingCategories.radiology++;
                if (consentCount === 0) stats.missingCategories.consents++;
            } else if (diagCount < 30 || labCount < 30 || radCount < 30 || consentCount < 3) {
                status = 'LOW_COVERAGE';
                stats.low++;
            } else {
                status = 'FULL_COVERAGE';
                stats.full++;
            }
            
            // Clean name for CSV (escape commas)
            const safeName = '"' + spec.name_en.replace(/"/g, '""') + '"';
            csvContent += `${sid},${safeName},${diagCount},${labCount},${radCount},${consentCount},${status}\n`;
        }
        
        // 3. Write CSV
        fs.writeFileSync('coverage_report.csv', csvContent, 'utf8');
        console.log('✅ Generated coverage_report.csv successfully.');
        
        // 4. Reporting
        const coveragePercentage = stats.total > 0 ? ((stats.full / stats.total) * 100).toFixed(2) : 0;
        
        console.log('\n--- AUDIT SUMMARY ---');
        console.log(`Total Specialties: ${stats.total}`);
        console.log(`FULL Coverage (>= 30 clinical, >= 3 consents): ${stats.full}`);
        console.log(`LOW_COVERAGE (< 30 clinical, < 3 consents): ${stats.low}`);
        console.log(`CRITICAL_GAP (0 items in some categories): ${stats.critical}`);
        console.log(`\nOverall System Coverage: ${coveragePercentage}%`);
        
        console.log('\n--- MISSING DATA BREAKDOWN ---');
        console.log(`Specialties missing Diagnoses: ${stats.missingCategories.diagnoses}`);
        console.log(`Specialties missing Labs: ${stats.missingCategories.labs}`);
        console.log(`Specialties missing Radiology: ${stats.missingCategories.radiology}`);
        console.log(`Specialties missing Consents: ${stats.missingCategories.consents}`);
        
        // 5. Auto-Fix Proposal
        if (criticalList.length > 0) {
            console.log('\n--- 🚨 CRITICAL GAPS DETECTED ---');
            console.log('The following specialties lack essential clinical data:');
            // Show up to 10 to avoid console spam
            criticalList.slice(0, 10).forEach(c => console.log(` - [${c.specialty_id}] ${c.name_en}`));
            if (criticalList.length > 10) console.log(`   ... and ${criticalList.length - 10} more.`);
            
            console.log('\n--- 💡 AUTO-FIX PROPOSAL ---');
            console.log('To resolve these gaps rapidly, use the following prompt with your AI assistant:');
            console.log('--------------------------------------------------');
            console.log(`"Generate a seed file (seed_missing_clinical_data.js) to populate the missing clinical mappings (Diagnoses, Labs, Radiology, Consents) for the following specialties: ${criticalList.slice(0, 5).map(s => s.specialty_id).join(', ')}. Provide at least 5 standard ICD-10 codes, 5 lab tests, 5 radiology exams, and 1 legal consent for each. Ensure it connects to PostgreSQL."`);
            console.log('--------------------------------------------------');
        } else {
            console.log('\n🎉 Fantastic! All specialties have baseline clinical coverage. No critical gaps found.');
        }

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await pool.end();
    }
}

runAudit();
