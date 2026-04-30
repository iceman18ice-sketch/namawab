const { getDb } = require('./database.js');
const db = getDb();

// 1. Create Tables
db.exec(`
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
    PRIMARY KEY (specialty_id, lab_id),
    FOREIGN KEY (lab_id) REFERENCES lab_tests_catalog(id)
  );

  CREATE TABLE IF NOT EXISTS specialty_radiology (
    specialty_id TEXT,
    radiology_id INTEGER,
    PRIMARY KEY (specialty_id, radiology_id),
    FOREIGN KEY (radiology_id) REFERENCES radiology_catalog(id)
  );
`);

// 2. The Medical Knowledge Engine (Sample of Comprehensive Seed Data)
const knowledgeBase = [
  {
    id: 'CARDIO_GEN',
    en: 'General Cardiology',
    ar: 'أمراض القلب العامة',
    dept: 'Internal Medicine',
    diagnoses: [
      { code: 'I50.9', en: 'Heart failure, unspecified', ar: 'فشل القلب، غير محدد' },
      { code: 'I20.9', en: 'Angina pectoris, unspecified', ar: 'الذبحة الصدرية، غير محددة' },
      { code: 'I10', en: 'Essential (primary) hypertension', ar: 'ارتفاع ضغط الدم الأساسي' }
    ],
    labs: [
      { name: 'Troponin I', category: 'Cardiac', normal: '<0.04 ng/mL' },
      { name: 'CK-MB', category: 'Cardiac', normal: '0-3 ng/mL' },
      { name: 'BNP', category: 'Cardiac', normal: '<100 pg/mL' },
      { name: 'Lipid Profile', category: 'Chemistry', normal: 'Varies' }
    ],
    radiology: [
      { name: 'Echocardiogram', modality: 'Ultrasound' },
      { name: 'Chest X-Ray', modality: 'X-Ray' },
      { name: 'ECG', modality: 'Cardiology' }
    ]
  },
  {
    id: 'CARDIO_INT',
    en: 'Interventional Cardiology',
    ar: 'قسطرة القلب',
    dept: 'Internal Medicine',
    diagnoses: [
      { code: 'I21.9', en: 'Acute myocardial infarction, unspecified', ar: 'احتشاء عضلة القلب الحاد' },
      { code: 'I20.0', en: 'Unstable angina', ar: 'الذبحة الصدرية غير المستقرة' },
      { code: 'I25.10', en: 'Atherosclerotic heart disease', ar: 'تصلب شرايين القلب' }
    ],
    labs: [
      { name: 'Troponin High Sensitivity', category: 'Cardiac', normal: '<14 ng/L' },
      { name: 'PT/INR', category: 'Hematology', normal: '0.8-1.1' },
      { name: 'CBC', category: 'Hematology', normal: 'Varies' }
    ],
    radiology: [
      { name: 'Coronary Angiography', modality: 'Cath Lab' },
      { name: 'CT Coronary Angiogram', modality: 'CT' }
    ]
  },
  {
    id: 'NEPHRO',
    en: 'Nephrology',
    ar: 'أمراض الكلى',
    dept: 'Internal Medicine',
    diagnoses: [
      { code: 'N18.9', en: 'Chronic kidney disease, unspecified', ar: 'مرض الكلى المزمن' },
      { code: 'N17.9', en: 'Acute kidney failure, unspecified', ar: 'الفشل الكلوي الحاد' },
      { code: 'N20.0', en: 'Calculus of kidney', ar: 'حصى الكلى' }
    ],
    labs: [
      { name: 'Creatinine', category: 'Chemistry', normal: '0.6-1.2 mg/dL' },
      { name: 'eGFR', category: 'Chemistry', normal: '>90 mL/min' },
      { name: 'Urea (BUN)', category: 'Chemistry', normal: '7-20 mg/dL' },
      { name: 'Urine Analysis', category: 'Urine', normal: 'Normal' },
      { name: 'CBC', category: 'Hematology', normal: 'Varies' } // Shared with Cardio
    ],
    radiology: [
      { name: 'Renal Ultrasound', modality: 'Ultrasound' },
      { name: 'CT KUB', modality: 'CT' }
    ]
  },
  {
    id: 'ENT',
    en: 'Otolaryngology (ENT)',
    ar: 'الأنف والأذن والحنجرة',
    dept: 'Surgery',
    diagnoses: [
      { code: 'J01.90', en: 'Acute sinusitis, unspecified', ar: 'التهاب الجيوب الأنفية الحاد' },
      { code: 'J03.90', en: 'Acute tonsillitis, unspecified', ar: 'التهاب اللوزتين الحاد' },
      { code: 'H66.90', en: 'Otitis media, unspecified', ar: 'التهاب الأذن الوسطى' }
    ],
    labs: [
      { name: 'Throat Swab Culture', category: 'Microbiology', normal: 'Negative' },
      { name: 'CBC', category: 'Hematology', normal: 'Varies' }
    ],
    radiology: [
      { name: 'CT Paranasal Sinuses', modality: 'CT' },
      { name: 'X-Ray Neck Soft Tissue', modality: 'X-Ray' }
    ]
  },
  {
    id: 'NEURO',
    en: 'Neurology',
    ar: 'طب الأعصاب',
    dept: 'Internal Medicine',
    diagnoses: [
      { code: 'G40.909', en: 'Epilepsy, unspecified', ar: 'الصرع' },
      { code: 'I63.9', en: 'Cerebral infarction, unspecified', ar: 'الجلطة الدماغية' },
      { code: 'G20', en: 'Parkinson disease', ar: 'مرض باركنسون' }
    ],
    labs: [
      { name: 'Vitamin B12', category: 'Chemistry', normal: '200-900 pg/mL' },
      { name: 'HbA1c', category: 'Chemistry', normal: '<5.7%' },
      { name: 'CSF Analysis', category: 'Fluid Analysis', normal: 'Clear' }
    ],
    radiology: [
      { name: 'MRI Brain', modality: 'MRI' },
      { name: 'CT Brain', modality: 'CT' },
      { name: 'EEG', modality: 'Neurophysiology' }
    ]
  }
];

// Stats
const stats = {
  specialties: 0,
  diagnoses: 0,
  labs_created: 0,
  labs_mapped: 0,
  radiology_created: 0,
  radiology_mapped: 0
};

// 3. Execution
const seedData = db.transaction(() => {
  // Prepared Statements - Specialties
  const insertSpecialty = db.prepare('INSERT OR REPLACE INTO specialties (specialty_id, name_en, name_ar, parent_department) VALUES (?, ?, ?, ?)');
  
  // Prepared Statements - Diagnoses
  const insertICD10 = db.prepare('INSERT OR IGNORE INTO icd10_codes (code, description_en, description_ar) VALUES (?, ?, ?)');
  const mapDiagnosis = db.prepare('INSERT OR IGNORE INTO specialty_diagnoses (specialty_id, icd10_code) VALUES (?, ?)');
  
  // Prepared Statements - Labs
  const findLab = db.prepare('SELECT id FROM lab_tests_catalog WHERE test_name = ?');
  const insertLab = db.prepare('INSERT INTO lab_tests_catalog (test_name, category, normal_range) VALUES (?, ?, ?)');
  const mapLab = db.prepare('INSERT OR IGNORE INTO specialty_labs (specialty_id, lab_id) VALUES (?, ?)');
  
  // Prepared Statements - Radiology
  const findRadiology = db.prepare('SELECT id FROM radiology_catalog WHERE exact_name = ?');
  const insertRadiology = db.prepare('INSERT INTO radiology_catalog (exact_name, modality) VALUES (?, ?)');
  const mapRadiology = db.prepare('INSERT OR IGNORE INTO specialty_radiology (specialty_id, radiology_id) VALUES (?, ?)');

  for (const spec of knowledgeBase) {
    // Insert Specialty
    insertSpecialty.run(spec.id, spec.en, spec.ar, spec.dept);
    stats.specialties++;

    // Process Diagnoses
    for (const diag of spec.diagnoses) {
      const res = insertICD10.run(diag.code, diag.en, diag.ar);
      mapDiagnosis.run(spec.id, diag.code);
      stats.diagnoses++;
    }

    // Process Labs with Deduplication
    for (const lab of spec.labs) {
      let labId;
      const existing = findLab.get(lab.name);
      if (existing) {
        labId = existing.id;
      } else {
        const result = insertLab.run(lab.name, lab.category, lab.normal);
        labId = result.lastInsertRowid;
        stats.labs_created++;
      }
      mapLab.run(spec.id, labId);
      stats.labs_mapped++;
    }

    // Process Radiology with Deduplication
    for (const rad of spec.radiology) {
      let radId;
      const existing = findRadiology.get(rad.name);
      if (existing) {
        radId = existing.id;
      } else {
        const result = insertRadiology.run(rad.name, rad.modality);
        radId = result.lastInsertRowid;
        stats.radiology_created++;
      }
      mapRadiology.run(spec.id, radId);
      stats.radiology_mapped++;
    }
  }
});

console.log('--- Starting Clinical Data Seeder ---');
seedData();
console.log('--- Seeding Complete ---');
console.log('Summary Report:');
console.table(stats);
