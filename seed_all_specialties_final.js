const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'nama_medical_web',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
});

const masterSpecialties = [
    "Internal Medicine", "Cardiology", "Pulmonology", "Gastroenterology", "Nephrology",
    "Endocrinology", "Rheumatology", "Infectious Disease", "Hematology", "Medical Oncology",
    "Geriatric Medicine", "Hepatology", "Allergy and Immunology", "Sleep Medicine", "Sports Medicine",
    "General Surgery", "Cardiothoracic Surgery", "Neurosurgery", "Orthopedic Surgery", "Plastic Surgery",
    "Pediatric Surgery", "Trauma Surgery", "Vascular Surgery", "Bariatric Surgery", "Transplant Surgery",
    "Colorectal Surgery", "Endocrine Surgery", "Surgical Oncology", "Maxillofacial Surgery", "Hand Surgery",
    "Pediatrics", "Pediatric Cardiology", "Pediatric Pulmonology", "Pediatric Gastroenterology", "Pediatric Nephrology",
    "Pediatric Endocrinology", "Pediatric Rheumatology", "Pediatric Infectious Disease", "Pediatric Hematology", "Pediatric Oncology",
    "Neonatology", "Adolescent Medicine", "Child Abuse Pediatrics", "Developmental Pediatrics", "Pediatric Emergency Medicine",
    "Pediatric Critical Care", "Pediatric Allergy", "Pediatric Neurology", "Pediatric Psychiatry", "Pediatric Dermatology",
    "Obstetrics and Gynecology", "Maternal-Fetal Medicine", "Gynecologic Oncology", "Reproductive Endocrinology", "Urogynecology",
    "Family Planning", "Menopausal Medicine", "Minimally Invasive Gynecologic Surgery", "Pediatric Gynecology", "Fetal Surgery",
    "Psychiatry", "Child and Adolescent Psychiatry", "Geriatric Psychiatry", "Addiction Psychiatry", "Forensic Psychiatry",
    "Consultation-Liaison Psychiatry", "Neuropsychiatry", "Emergency Psychiatry", "Sleep Psychiatry", "Cross-Cultural Psychiatry",
    "Neurology", "Clinical Neurophysiology", "Epilepsy", "Neuromuscular Medicine", "Pain Medicine",
    "Vascular Neurology", "Neurodevelopmental Disabilities", "Neuro-oncology", "Multiple Sclerosis", "Movement Disorders",
    "Headache Medicine", "Autonomic Disorders", "Behavioral Neurology", "Neurocritical Care", "Neurogenetics",
    "Dermatology", "Dermatopathology", "Pediatric Dermatology", "Procedural Dermatology", "Mohs Surgery",
    "Cosmetic Dermatology", "Medical Dermatology", "Immunodermatology", "Trichology", "Teledermatology",
    "Ophthalmology", "Cornea and External Disease", "Glaucoma", "Neuro-Ophthalmology", "Ophthalmic Pathology",
    "Ophthalmic Plastic Surgery", "Pediatric Ophthalmology", "Retina and Vitreous", "Uveitis", "Refractive Surgery",
    "Otolaryngology", "Otology", "Pediatric Otolaryngology", "Head and Neck Surgery", "Facial Plastic Surgery",
    "Rhinology", "Laryngology", "Thyroid Surgery", "Sleep Medicine ENT", "Allergy ENT",
    "Anesthesiology", "Cardiothoracic Anesthesiology", "Critical Care Anesthesiology", "Obstetric Anesthesiology", "Pediatric Anesthesiology",
    "Neuroanesthesiology", "Pain Medicine Anesthesiology", "Regional Anesthesiology", "Hospice Anesthesiology", "Dental Anesthesiology",
    "Pathology", "Blood Banking", "Chemical Pathology", "Cytopathology", "Forensic Pathology",
    "Hematopathology", "Medical Microbiology", "Molecular Genetic Pathology", "Neuropathology", "Pediatric Pathology",
    "Emergency Medicine", "Medical Toxicology", "Undersea Medicine", "Wilderness Medicine", "Observation Medicine",
    "Pre-hospital Emergency Medicine", "Disaster Medicine", "Aerospace Medicine", "Tactical Medicine", "Emergency Ultrasound",
    "Radiology", "Diagnostic Radiology", "Interventional Radiology", "Neuroradiology", "Nuclear Medicine",
    "Pediatric Radiology", "Musculoskeletal Radiology", "Breast Imaging", "Cardiothoracic Radiology", "Gastrointestinal Radiology",
    "Urology", "Pediatric Urology", "Urologic Oncology", "Female Pelvic Medicine", "Male Infertility",
    "Calculi", "Neurourology", "Renal Transplantation", "Erectile Dysfunction", "Endourology",
    "Physical Medicine", "Spinal Cord Injury Medicine", "Brain Injury Medicine", "Sports Medicine PMR", "Neuromuscular Medicine PMR",
    "Pediatric Rehabilitation", "Pain Medicine PMR", "Amputee Rehabilitation", "Cardiopulmonary Rehabilitation", "Occupational Rehabilitation",
    "Preventive Medicine", "Public Health", "Occupational Medicine", "Addiction Medicine Prev", "Medical Toxicology Prev",
    "Clinical Informatics", "Lifestyle Medicine", "Medical Genetics", "Clinical Biochemical Genetics", "Clinical Cytogenetics",
    "Molecular Imaging", "In Vivo Nuclear Medicine", "In Vitro Nuclear Medicine", "Nuclear Cardiology", "Nuclear Oncology",
    "Radiation Oncology", "Brachytherapy", "Proton Therapy", "Stereotactic Radiosurgery", "Intraoperative Radiation Therapy",
    "Palliative Medicine", "Hospice Care", "Pain Management", "Symptom Control", "End-of-Life Care",
    "Forensic Toxicology", "Clinical Toxicology", "Environmental Toxicology", "Occupational Toxicology",
    "Clinical Pharmacology", "Pharmacogenomics", "Pharmacovigilance", "Toxicokinetics", "Pharmacoepidemiology",
    "Medical Education", "Simulation in Healthcare", "Medical Ethics", "Bioethics", "Clinical Ethics",
    "Medical Law", "Health Policy", "Global Health", "Tropical Medicine", "Travel Medicine",
    "Space Medicine", "Aviation Medicine", "Diving Medicine", "Hyperbaric Medicine", "Naval Medicine",
    "Military Medicine", "Combat Casualty Care", "Veterans Health", "Telemedicine", "Digital Health",
    "Nanomedicine", "Precision Medicine", "Personalized Medicine", "Genomic Medicine", "Regenerative Medicine",
    "Stem Cell Therapy", "Tissue Engineering", "Biomaterials in Medicine", "Artificial Organs", "Bionics"
];

function generateDiagnoses(specialtyName, count, specId) {
    const conditions = ["Acute", "Chronic", "Malignant", "Benign", "Congenital", "Idiopathic", "Primary", "Secondary"];
    const types = ["Syndrome", "Disease", "Disorder", "Inflammation", "Infection", "Failure", "Deficiency"];
    const results = [];
    for(let i=0; i<count; i++) {
        const cnd = conditions[Math.floor(Math.random() * conditions.length)];
        const typ = types[Math.floor(Math.random() * types.length)];
        const codeNum = Math.floor(Math.random()*900)+100;
        const codeChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        results.push({
            icd_code: `${codeChar}${codeNum}.${Math.floor(Math.random()*9)}-${specId.substring(0,3)}`,
            name_en: `${cnd} ${specialtyName} ${typ} ${i+1}`,
            name_ar: `اضطراب ${specialtyName} ${cnd === 'Acute' ? 'الحاد' : 'المزمن'} - ${i+1}`
        });
    }
    return results;
}

function generateLabs(specialtyName, count, specId) {
    const testTypes = ["Panel", "Antibody", "Level", "Screen", "Culture", "Profile", "Assay"];
    const results = [];
    for(let i=0; i<count; i++) {
        const tt = testTypes[Math.floor(Math.random() * testTypes.length)];
        results.push({
            name: `Specialized ${specialtyName} ${tt} ${i+1}`,
            category: specialtyName
        });
    }
    return results;
}

function generateRadiology(specialtyName, count) {
    const modalities = ["X-Ray", "MRI", "CT", "Ultrasound", "PET", "Fluoroscopy"];
    const regions = ["Abdomen", "Pelvis", "Chest", "Brain", "Spine", "Extremity", "Neck", "Whole Body"];
    const results = [];
    for(let i=0; i<count; i++) {
        const mod = modalities[Math.floor(Math.random() * modalities.length)];
        const reg = regions[Math.floor(Math.random() * regions.length)];
        results.push({
            name: `${mod} of ${reg} for ${specialtyName} Assessment`,
            modality: mod
        });
    }
    return results;
}

function generateConsents(specialtyName, specId) {
    return [
        {
            category: 'General',
            title_en: `General Consent for ${specialtyName}`,
            title_ar: `إقرار الموافقة العامة لعلاج ${specialtyName}`,
            content_en: `I hereby consent to general procedures and treatments under the specialty of ${specialtyName}.`,
            content_ar: `أقر بموافقتي على الإجراءات والعلاجات العامة تحت تخصص ${specialtyName}.`,
            mandatory: true
        },
        {
            category: 'Surgical',
            title_en: `Surgical Procedure Consent for ${specialtyName}`,
            title_ar: `إقرار عملية جراحية لتخصص ${specialtyName}`,
            content_en: `I consent to the invasive procedure as explained by my ${specialtyName} physician.`,
            content_ar: `أقر بموافقتي على الإجراء الجراحي كما شرحه طبيب ${specialtyName}.`,
            mandatory: true
        },
        {
            category: 'Anesthesia',
            title_en: `High-Risk Consent for ${specialtyName}`,
            title_ar: `إقرار الإجراءات عالية الخطورة لتخصص ${specialtyName}`,
            content_en: `I understand the high risks involved with the specific ${specialtyName} procedure.`,
            content_ar: `أتفهم المخاطر العالية المرتبطة بهذا الإجراء الخاص بتخصص ${specialtyName}.`,
            mandatory: true
        }
    ];
}

async function run() {
    console.log(`🚀 Starting Full Master Seeding for ${masterSpecialties.length} Specialties...`);
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        let count = 0;
        for (const spec of masterSpecialties) {
            count++;
            const specId = spec.replace(/[^A-Za-z]/g, '').substring(0, 15).toUpperCase() + '_' + count;
            
            let res = await client.query(`SELECT specialty_id FROM specialties WHERE name_en = $1`, [spec]);
            let specialtyId = res.rows[0]?.specialty_id;
            
            if (!specialtyId) {
                await client.query(`
                    INSERT INTO specialties (specialty_id, name_en, name_ar)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (specialty_id) DO NOTHING
                `, [specId, spec, `تخصص ${spec}`]);
                specialtyId = specId;
                console.log(`[${count}/${masterSpecialties.length}] Created: ${spec}`);
            } else {
                console.log(`[${count}/${masterSpecialties.length}] Exists: ${spec}`);
            }

            // 1. Generate 35 Diagnoses
            const diagnoses = generateDiagnoses(spec, 35, specId);
            for (const diag of diagnoses) {
                await client.query('INSERT INTO icd10_codes (code, description_en, description_ar) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [diag.icd_code, diag.name_en, diag.name_ar]);
                await client.query('INSERT INTO specialty_diagnoses (specialty_id, icd10_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', [specialtyId, diag.icd_code]);
            }

            // 2. Generate 35 Labs
            const labs = generateLabs(spec, 35, specId);
            for (const lab of labs) {
                const existing = await client.query('SELECT id FROM lab_tests_catalog WHERE test_name = $1 LIMIT 1', [lab.name]);
                let labId;
                if (existing.rows.length > 0) {
                    labId = existing.rows[0].id;
                } else {
                    const insert = await client.query('INSERT INTO lab_tests_catalog (test_name, category, normal_range) VALUES ($1, $2, $3) RETURNING id', [lab.name, lab.category, 'Normal']);
                    labId = insert.rows[0].id;
                }
                await client.query('INSERT INTO specialty_labs (specialty_id, lab_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [specialtyId, labId]);
            }

            // 3. Generate 35 Radiology
            const rads = generateRadiology(spec, 35);
            for (const rad of rads) {
                const existing = await client.query('SELECT id FROM radiology_catalog WHERE exact_name = $1 LIMIT 1', [rad.name]);
                let radId;
                if (existing.rows.length > 0) {
                    radId = existing.rows[0].id;
                } else {
                    const insert = await client.query('INSERT INTO radiology_catalog (exact_name, modality) VALUES ($1, $2) RETURNING id', [rad.name, rad.modality]);
                    radId = insert.rows[0].id;
                }
                await client.query('INSERT INTO specialty_radiology (specialty_id, radiology_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [specialtyId, radId]);
            }

            // 4. Generate 3 Consents
            const consents = generateConsents(spec, specId);
            for (const consent of consents) {
                const existing = await client.query('SELECT template_id FROM consent_templates WHERE specialty_id = $1 AND title_en = $2', [specialtyId, consent.title_en]);
                if (existing.rows.length === 0) {
                    await client.query(
                        `INSERT INTO consent_templates (title_ar, title_en, content_ar, content_en, category, specialty_id, is_mandatory) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [consent.title_ar, consent.title_en, consent.content_ar, consent.content_en, consent.category, specialtyId, consent.mandatory ? 1 : 0]
                    );
                }
            }
        }

        await client.query('COMMIT');
        console.log(`\n✅ Full Master Seeding Completed for ${masterSpecialties.length} Specialties!`);
        
        const countRes = await client.query('SELECT COUNT(*) FROM specialties');
        console.log(`\n📊 Total Specialties in DB: ${countRes.rows[0].count}`);
        
        const last5 = await client.query('SELECT name_en, specialty_id FROM specialties ORDER BY specialty_id DESC LIMIT 5');
        console.log(`\n🔍 Last 5 Specialties Created:`);
        last5.rows.forEach(r => console.log(` - ${r.name_en} (${r.specialty_id})`));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
