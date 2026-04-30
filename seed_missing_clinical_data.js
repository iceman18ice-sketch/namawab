require('dotenv').config();
const { pool } = require('./db_postgres');

async function seedMissingData() {
    console.log('Starting Auto-Fix Seed for Missing Clinical Data...');
    try {
        const knowledgeBase = [
            {
                id: 'PEDS_ENT',
                diagnoses: [
                    { code: 'H65.0', en: 'Acute serous otitis media', ar: 'التهاب الأذن الوسطى المصلي الحاد' },
                    { code: 'J03.90', en: 'Acute tonsillitis, unspecified', ar: 'التهاب اللوزتين الحاد' },
                    { code: 'J02.9', en: 'Acute pharyngitis, unspecified', ar: 'التهاب البلعوم الحاد' },
                    { code: 'J32.9', en: 'Chronic sinusitis, unspecified', ar: 'التهاب الجيوب الأنفية المزمن' },
                    { code: 'J35.1', en: 'Hypertrophy of tonsils', ar: 'تضخم اللوزتين' },
                    { code: 'J35.2', en: 'Hypertrophy of adenoids', ar: 'تضخم اللحمية' }
                ],
                labs: [
                    { name: 'Strep A Rapid Test', category: 'Microbiology', normal: 'Negative' },
                    { name: 'Complete Blood Count (CBC)', category: 'Hematology', normal: 'Normal' },
                    { name: 'C-Reactive Protein (CRP)', category: 'Immunology', normal: '< 5 mg/L' },
                    { name: 'Monospot Test', category: 'Immunology', normal: 'Negative' },
                    { name: 'Epstein-Barr Virus (EBV) Antibodies', category: 'Immunology', normal: 'Negative' }
                ],
                radiology: [
                    { name: 'X-Ray Neck Lateral (Soft Tissue)', modality: 'X-Ray' },
                    { name: 'CT Sinuses without contrast', modality: 'CT' },
                    { name: 'MRI Temporal Bone', modality: 'MRI' },
                    { name: 'Ultrasound Neck', modality: 'Ultrasound' },
                    { name: 'X-Ray Adenoids', modality: 'X-Ray' }
                ],
                consents: [
                    {
                        category: 'Surgical',
                        mandatory: true,
                        title_en: 'Informed Consent for Tonsillectomy and Adenoidectomy',
                        title_ar: 'إقرار مستنير لعملية استئصال اللوزتين واللحمية',
                        content_en: 'I authorize the surgical team to perform a Tonsillectomy and Adenoidectomy. Risks discussed include: bleeding, infection, and changes in voice.',
                        content_ar: 'أفوض الفريق الجراحي بإجراء عملية استئصال اللوزتين واللحمية. تمت مناقشة المخاطر بما فيها: النزيف، العدوى، وتغير في الصوت.'
                    }
                ]
            },
            {
                id: 'CARDIO_INT',
                diagnoses: [
                    { code: 'I21.9', en: 'Acute myocardial infarction, unspecified', ar: 'احتشاء عضلة القلب الحاد' },
                    { code: 'I20.0', en: 'Unstable angina', ar: 'الذبحة الصدرية غير المستقرة' },
                    { code: 'I50.9', en: 'Heart failure, unspecified', ar: 'قصور القلب' },
                    { code: 'I25.10', en: 'Atherosclerotic heart disease', ar: 'تصلب الشرايين التاجية' },
                    { code: 'I48.91', en: 'Unspecified atrial fibrillation', ar: 'الرجفان الأذيني' }
                ],
                labs: [
                    { name: 'Troponin High Sensitivity', category: 'Cardiac', normal: '<14 ng/L' },
                    { name: 'BNP (B-Type Natriuretic Peptide)', category: 'Cardiac', normal: '<100 pg/mL' },
                    { name: 'Lipid Profile', category: 'Chemistry', normal: 'Normal' },
                    { name: 'CK-MB', category: 'Cardiac', normal: '0-3 ng/mL' },
                    { name: 'D-Dimer', category: 'Hematology', normal: '<0.50 mg/L' }
                ],
                radiology: [
                    { name: 'Coronary Angiography', modality: 'Cath Lab' },
                    { name: 'Echocardiogram', modality: 'Ultrasound' },
                    { name: 'CT Coronary Angiography', modality: 'CT' },
                    { name: 'Cardiac MRI', modality: 'MRI' },
                    { name: 'Chest X-Ray (PA/LAT)', modality: 'X-Ray' }
                ],
                consents: [
                    {
                        category: 'High-Risk',
                        mandatory: true,
                        title_en: 'Informed Consent for Coronary Angiography and Angioplasty',
                        title_ar: 'إقرار مستنير لإجراء قسطرة القلب التشخيصية والعلاجية',
                        content_en: 'I authorize the medical team to perform a coronary angiography and possible angioplasty. Risks discussed include: allergic reaction to contrast media, bleeding, and stroke.',
                        content_ar: 'أفوض الفريق الطبي بإجراء قسطرة القلب التشخيصية والعلاجية. تمت مناقشة المخاطر بما فيها: الحساسية للصبغة، النزيف، والسكتة.'
                    }
                ]
            }
        ];

        for (const spec of knowledgeBase) {
            console.log(`Processing ${spec.id}...`);
            
            // Diagnoses
            for (const diag of spec.diagnoses) {
                await pool.query('INSERT INTO icd10_codes (code, description_en, description_ar) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [diag.code, diag.en, diag.ar]);
                await pool.query('INSERT INTO specialty_diagnoses (specialty_id, icd10_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', [spec.id, diag.code]);
            }
            
            // Labs
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

            // Radiology
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

            // Consents
            for (const consent of spec.consents) {
                // Check if already exists for this specialty and title
                const existing = await pool.query('SELECT template_id FROM consent_templates WHERE specialty_id = $1 AND title_en = $2', [spec.id, consent.title_en]);
                if (existing.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO consent_templates (title_ar, title_en, content_ar, content_en, category, specialty_id, is_mandatory) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [consent.title_ar, consent.title_en, consent.content_ar, consent.content_en, consent.category, spec.id, consent.mandatory]
                    );
                }
            }
        }
        
        console.log('✅ Auto-Fix Seed Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedMissingData();
