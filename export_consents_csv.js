const { pool } = require('./db_postgres');
const fs = require('fs');

async function exportConsents() {
    try {
        console.log('Connecting to PostgreSQL to export templates...');
        const res = await pool.query('SELECT * FROM consent_templates ORDER BY category, specialty_id');
        
        // Use a delimiter that works well with Excel and Arabic text.
        // We will output a UTF-8 CSV with BOM for proper Arabic rendering in Excel.
        const csvRows = [];
        
        // Header
        csvRows.push(['Specialty', 'Category', 'Mandatory', 'Title (EN)', 'Title (AR)', 'Content (EN)', 'Content (AR)']);
        
        for (const row of res.rows) {
            const specialty = `"${(row.specialty_id || '').replace(/"/g, '""')}"`;
            const category = `"${(row.category || '').replace(/"/g, '""')}"`;
            const mandatory = row.is_mandatory ? '"Yes"' : '"No"';
            const titleEn = `"${(row.title_en || '').replace(/"/g, '""')}"`;
            const titleAr = `"${(row.title_ar || '').replace(/"/g, '""')}"`;
            const contentEn = `"${(row.content_en || '').replace(/"/g, '""')}"`;
            const contentAr = `"${(row.content_ar || '').replace(/"/g, '""')}"`;
            
            csvRows.push([specialty, category, mandatory, titleEn, titleAr, contentEn, contentAr].join(','));
        }
        
        const csvContent = '\uFEFF' + csvRows.join('\n'); // Add UTF-8 BOM
        
        fs.writeFileSync('Legal_Medical_Consents_Review.csv', csvContent, 'utf8');
        console.log('✅ Exported successfully to Legal_Medical_Consents_Review.csv');
        process.exit(0);
    } catch (e) {
        console.error('❌ Export failed:', e);
        process.exit(1);
    }
}

exportConsents();
