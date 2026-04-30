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
    "Otolaryngology (ENT)", "Otology/Neurotology", "Pediatric Otolaryngology", "Head and Neck Surgery", "Facial Plastic Surgery",
    "Rhinology", "Laryngology", "Thyroid/Parathyroid Surgery", "Sleep Medicine (ENT)", "Allergy (ENT)",
    "Anesthesiology", "Cardiothoracic Anesthesiology", "Critical Care Anesthesiology", "Obstetric Anesthesiology", "Pediatric Anesthesiology",
    "Neuroanesthesiology", "Pain Medicine (Anesthesiology)", "Regional Anesthesiology", "Hospice and Palliative Anesthesiology", "Dental Anesthesiology",
    "Pathology", "Blood Banking", "Chemical Pathology", "Cytopathology", "Forensic Pathology",
    "Hematopathology", "Medical Microbiology", "Molecular Genetic Pathology", "Neuropathology", "Pediatric Pathology",
    "Emergency Medicine", "Medical Toxicology", "Undersea Medicine", "Wilderness Medicine", "Observation Medicine",
    "Pre-hospital Emergency Medicine", "Disaster Medicine", "Aerospace Medicine", "Tactical Medicine", "Emergency Ultrasound",
    "Radiology", "Diagnostic Radiology", "Interventional Radiology", "Neuroradiology", "Nuclear Medicine",
    "Pediatric Radiology", "Musculoskeletal Radiology", "Breast Imaging", "Cardiothoracic Radiology", "Gastrointestinal Radiology",
    "Urology", "Pediatric Urology", "Urologic Oncology", "Female Pelvic Medicine", "Male Infertility",
    "Calculi (Stone Disease)", "Neurourology", "Renal Transplantation", "Erectile Dysfunction", "Endourology",
    "Physical Medicine", "Spinal Cord Injury Medicine", "Brain Injury Medicine", "Sports Medicine (PM&R)", "Neuromuscular Medicine (PM&R)",
    "Pediatric Rehabilitation", "Pain Medicine (PM&R)", "Amputee Rehabilitation", "Cardiopulmonary Rehabilitation", "Occupational Rehabilitation",
    "Preventive Medicine", "Public Health", "Occupational Medicine", "Addiction Medicine", "Medical Toxicology (Preventive)",
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

// Helper to shuffle array
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Generate realistic looking data
function generateDiagnoses(specialtyName, count) {
    const conditions = ["Acute", "Chronic", "Malignant", "Benign", "Congenital", "Idiopathic", "Primary", "Secondary"];
    const types = ["Syndrome", "Disease", "Disorder", "Inflammation", "Infection", "Failure", "Deficiency"];
    const results = [];
    for(let i=0; i<count; i++) {
        const cnd = conditions[Math.floor(Math.random() * conditions.length)];
        const typ = types[Math.floor(Math.random() * types.length)];
        const codeNum = Math.floor(Math.random()*900)+100;
        const codeChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        results.push({
            icd_code: `${codeChar}${codeNum}.${Math.floor(Math.random()*9)}`,
            name_en: `${cnd} ${specialtyName} ${typ} ${i+1}`,
            name_ar: `اضطراب ${specialtyName} ${cnd === 'Acute' ? 'الحاد' : 'المزمن'} - ${i+1}`,
            is_chronic: (cnd === 'Chronic' || cnd === 'Congenital'),
            is_recommended: true
        });
    }
    return results;
}

function generateLabs(specialtyName, count) {
    const testTypes = ["Panel", "Antibody", "Level", "Screen", "Culture", "Profile", "Assay"];
    const results = [];
    for(let i=0; i<count; i++) {
        const tt = testTypes[Math.floor(Math.random() * testTypes.length)];
        results.push({
            test_code: `LAB-${specialtyName.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*9000)}`,
            test_name: `Specialized ${specialtyName} ${tt} ${i+1}`,
            is_recommended: true
        });
    }
    // Add some generics
    results.push(
        { test_code: 'LAB-CBC', test_name: 'Complete Blood Count', is_recommended: true },
        { test_code: 'LAB-BMP', test_name: 'Basic Metabolic Panel', is_recommended: true }
    );
    return results;
}

function generateRadiology(specialtyName, count) {
    const modalities = ["X-Ray", "MRI", "CT Scan", "Ultrasound", "PET Scan", "Fluoroscopy"];
    const regions = ["Abdomen", "Pelvis", "Chest", "Brain", "Spine", "Extremity", "Neck", "Whole Body"];
    const results = [];
    for(let i=0; i<count; i++) {
        const mod = modalities[Math.floor(Math.random() * modalities.length)];
        const reg = regions[Math.floor(Math.random() * regions.length)];
        results.push({
            exam_code: `RAD-${mod.replace(/\s+/g,'').substring(0,3).toUpperCase()}-${Math.floor(Math.random()*9000)}`,
            exam_name: `${mod} of ${reg} for ${specialtyName} Assessment`,
            modality: mod,
            is_recommended: true
        });
    }
    return results;
}

function generateConsents(specialtyName) {
    return [
        {
            template_type: 'General',
            title_en: `General Consent for ${specialtyName} Treatment`,
            title_ar: `إقرار الموافقة العامة لعلاج ${specialtyName}`,
            content_en: `I hereby consent to general procedures and treatments under the specialty of ${specialtyName}.`,
            content_ar: `أقر بموافقتي على الإجراءات والعلاجات العامة تحت تخصص ${specialtyName}.`,
            requires_signature: true
        },
        {
            template_type: 'Surgical',
            title_en: `Surgical / Invasive Procedure Consent for ${specialtyName}`,
            title_ar: `إقرار عملية جراحية / تدخل جراحي لتخصص ${specialtyName}`,
            content_en: `I consent to the invasive procedure as explained by my ${specialtyName} physician.`,
            content_ar: `أقر بموافقتي على الإجراء الجراحي كما شرحه طبيب ${specialtyName}.`,
            requires_signature: true
        },
        {
            template_type: 'Anesthesia',
            title_en: `High-Risk Consent for ${specialtyName}`,
            title_ar: `إقرار الإجراءات عالية الخطورة لتخصص ${specialtyName}`,
            content_en: `I understand the high risks involved with the specific ${specialtyName} procedure.`,
            content_ar: `أتفهم المخاطر العالية المرتبطة بهذا الإجراء الخاص بتخصص ${specialtyName}.`,
            requires_signature: true
        }
    ];
}

async function run() {
    console.log(`🚀 Starting Full Master Seeding for ${masterSpecialties.length} Specialties...`);
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Ensure tables exist (they should, but just in case)
        await client.query(`
            CREATE TABLE IF NOT EXISTS specialties (
                id SERIAL PRIMARY KEY,
                name_en VARCHAR(255),
                name_ar VARCHAR(255),
                code VARCHAR(50) UNIQUE,
                status VARCHAR(50) DEFAULT 'Active'
            )
        `);

        // We will insert specialties one by one and get their ID
        let count = 0;
        for (const spec of masterSpecialties) {
            count++;
            const code = spec.replace(/[^A-Za-z]/g, '').substring(0, 8).toUpperCase() + `_${count}`;
            
            let res = await client.query(`SELECT id FROM specialties WHERE code = $1`, [code]);
            let specialtyId;
            
            if (res.rows.length === 0) {
                res = await client.query(`
                    INSERT INTO specialties (name_en, name_ar, code)
                    VALUES ($1, $2, $3)
                    RETURNING id
                `, [spec, `تخصص ${spec}`, code]);
                specialtyId = res.rows[0].id;
                console.log(`[${count}/${masterSpecialties.length}] Created: ${spec}`);
            } else {
                specialtyId = res.rows[0].id;
                console.log(`[${count}/${masterSpecialties.length}] Exists: ${spec}`);
            }

            // 1. Generate 40 Diagnoses
            const diagnoses = generateDiagnoses(spec, 40);
            for (const d of diagnoses) {
                await client.query(`
                    INSERT INTO specialty_diagnoses (specialty_id, icd_code, name_en, name_ar, is_chronic, is_recommended)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT DO NOTHING
                `, [specialtyId, d.icd_code, d.name_en, d.name_ar, d.is_chronic ? 1 : 0, d.is_recommended ? 1 : 0]);
            }

            // 2. Generate 25 Labs
            const labs = generateLabs(spec, 25);
            for (const l of labs) {
                await client.query(`
                    INSERT INTO specialty_labs (specialty_id, test_name, test_code, is_recommended)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                `, [specialtyId, l.test_name, l.test_code, l.is_recommended ? 1 : 0]);
            }

            // 3. Generate 25 Radiology
            const rads = generateRadiology(spec, 25);
            for (const r of rads) {
                await client.query(`
                    INSERT INTO specialty_radiology (specialty_id, exam_name, exam_code, modality, is_recommended)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT DO NOTHING
                `, [specialtyId, r.exam_name, r.exam_code, r.modality, r.is_recommended ? 1 : 0]);
            }

            // 4. Generate 3 Consents
            const consents = generateConsents(spec);
            for (const c of consents) {
                await client.query(`
                    INSERT INTO consent_templates (specialty_id, title_ar, title_en, content_ar, content_en, requires_signature, template_type)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT DO NOTHING
                `, [specialtyId, c.title_ar, c.title_en, c.content_ar, c.content_en, c.requires_signature ? 1 : 0, c.template_type]);
            }
        }

        await client.query('COMMIT');
        console.log(`\n✅ Full Master Seeding Completed for ${masterSpecialties.length} Specialties!`);
        
        // Print Summary for the User
        const countRes = await client.query('SELECT COUNT(*) FROM specialties');
        console.log(`\n📊 Total Specialties in DB: ${countRes.rows[0].count}`);
        
        const last5 = await client.query('SELECT name_en, code FROM specialties ORDER BY id DESC LIMIT 5');
        console.log(`\n🔍 Last 5 Specialties Created:`);
        last5.rows.forEach(r => console.log(` - ${r.name_en} (${r.code})`));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
