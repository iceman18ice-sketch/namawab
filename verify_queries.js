const { getDb } = require('./database.js');
const db = getDb();

// 1. Add Pediatric ENT to the database to demonstrate
try {
  db.prepare("INSERT OR REPLACE INTO specialties (specialty_id, name_en, name_ar, parent_department) VALUES ('PEDS_ENT', 'Pediatric ENT', 'أنف وأذن وحنجرة للأطفال', 'Pediatrics')").run();
  
  // Diagnoses
  const icdStmt = db.prepare("INSERT OR IGNORE INTO icd10_codes (code, description_en, description_ar) VALUES (?, ?, ?)");
  const specDiagStmt = db.prepare("INSERT OR IGNORE INTO specialty_diagnoses (specialty_id, icd10_code) VALUES ('PEDS_ENT', ?)");
  
  const diagnoses = [
    ['J03.90', 'Acute tonsillitis, unspecified', 'التهاب اللوزتين الحاد'], // Shared with Adult ENT
    ['H65.0', 'Acute serous otitis media', 'التهاب الأذن الوسطى المصلي الحاد'],
    ['Q31.5', 'Laryngomalacia', 'تلين الحنجرة']
  ];
  
  for (const d of diagnoses) {
    icdStmt.run(d[0], d[1], d[2]);
    specDiagStmt.run(d[0]);
  }

  // Labs
  const findLab = db.prepare('SELECT id FROM lab_tests_catalog WHERE test_name = ?');
  const insertLab = db.prepare('INSERT INTO lab_tests_catalog (test_name, category, normal_range) VALUES (?, ?, ?)');
  const specLabStmt = db.prepare("INSERT OR IGNORE INTO specialty_labs (specialty_id, lab_id) VALUES ('PEDS_ENT', ?)");

  const labs = [
    ['CBC', 'Hematology', 'Varies'], // Shared
    ['Strep A Rapid Test', 'Microbiology', 'Negative'],
    ['Allergy Panel (Pediatric)', 'Immunology', 'Negative']
  ];

  for (const l of labs) {
    let labId;
    const existing = findLab.get(l[0]);
    if (existing) {
      labId = existing.id;
    } else {
      labId = insertLab.run(l[0], l[1], l[2]).lastInsertRowid;
    }
    specLabStmt.run(labId);
  }

} catch (err) {
  console.error("Error inserting Pediatric ENT:", err);
}

// 2. The Sample Queries
function runQuery(specialtyId) {
  const specialty = db.prepare("SELECT name_en, name_ar FROM specialties WHERE specialty_id = ?").get(specialtyId);
  if (!specialty) return console.log(`Specialty ${specialtyId} not found.`);

  console.log(`=================================================`);
  console.log(`👨‍⚕️ Doctor Profile: ${specialty.name_en} (${specialty.name_ar})`);
  console.log(`=================================================`);

  // Query 1: Diagnoses
  const diagnoses = db.prepare(`
    SELECT i.code, i.description_en 
    FROM icd10_codes i
    JOIN specialty_diagnoses sd ON i.code = sd.icd10_code
    WHERE sd.specialty_id = ?
  `).all(specialtyId);

  console.log(`\n📋 Mapped Diagnoses (ICD-10):`);
  diagnoses.forEach(d => console.log(`   - [${d.code}] ${d.description_en}`));

  // Query 2: Labs
  const labs = db.prepare(`
    SELECT l.test_name, l.category 
    FROM lab_tests_catalog l
    JOIN specialty_labs sl ON l.id = sl.lab_id
    WHERE sl.specialty_id = ?
  `).all(specialtyId);

  console.log(`\n🔬 Mapped Lab Tests:`);
  labs.forEach(l => console.log(`   - ${l.test_name} (${l.category})`));

  // Query 3: Radiology
  const radiology = db.prepare(`
    SELECT r.exact_name, r.modality 
    FROM radiology_catalog r
    JOIN specialty_radiology sr ON r.id = sr.radiology_id
    WHERE sr.specialty_id = ?
  `).all(specialtyId);

  console.log(`\n☢️ Mapped Radiology Exams:`);
  if (radiology.length === 0) console.log(`   - (No specific radiology mapped)`);
  radiology.forEach(r => console.log(`   - ${r.exact_name} (${r.modality})`));
  console.log('\n');
}

// Execute for Interventional Cardiology and Pediatric ENT
console.log('\n🚀 EXECUTING DATABASE FILTERING QUERIES 🚀\n');
runQuery('CARDIO_INT');
runQuery('PEDS_ENT');
