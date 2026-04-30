const { getDb } = require('./database.js');
const db = getDb();

// 1. Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS consent_templates (
    template_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_ar TEXT,
    title_en TEXT,
    content_ar TEXT,
    content_en TEXT,
    category TEXT,
    specialty_id TEXT,
    is_mandatory INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS patient_consents (
    consent_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    template_id INTEGER,
    doctor_id INTEGER,
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    signature_image TEXT,
    witness_signature TEXT,
    witness_name TEXT
  );
`);

// 2. Knowledge Engine Data (Bilingual Medical Consents)
const templates = [
  {
    specialty_id: 'CARDIO_INT',
    category: 'High-Risk',
    mandatory: 1,
    title_en: 'Informed Consent for Coronary Angiography and Angioplasty',
    title_ar: 'إقرار مستنير لإجراء قسطرة القلب التشخيصية والعلاجية',
    content_en: `I hereby authorize the medical team to perform a coronary angiography and possible angioplasty.
Risks discussed include:
1. Allergic reaction to contrast media (dye).
2. Bleeding or hematoma at the puncture site (arterial puncture).
3. Damage to the blood vessel requiring surgery.
4. Acute myocardial infarction (Heart Attack), stroke, or death (Rare, <1%).
I confirm I have understood the procedure, alternatives, and risks.`,
    content_ar: `أفوض الفريق الطبي بإجراء قسطرة القلب التشخيصية و/أو العلاجية.
تمت مناقشة المخاطر التالية:
1. رد فعل تحسسي للمادة الملونة (الصبغة).
2. نزيف أو تجمع دموي في مكان إدخال القسطرة (ثقب الشريان).
3. إصابة الوعاء الدموي مما قد يستدعي تدخلاً جراحياً.
4. احتشاء عضلة القلب (جلطة)، سكتة دماغية، أو الوفاة (نادر، أقل من 1٪).
أؤكد أنني فهمت الإجراء والبدائل والمخاطر المترتبة.`
  },
  {
    specialty_id: 'NEUROSURGERY', // Note: I'll map this or it just acts as string
    category: 'High-Risk',
    mandatory: 1,
    title_en: 'Informed Consent for Neurosurgical Procedure',
    title_ar: 'إقرار مستنير لإجراء عملية جراحة أعصاب',
    content_en: `I authorize the surgical team to perform a neurosurgical procedure.
Risks discussed include:
1. Infection (Meningitis, Brain Abscess).
2. Bleeding (Intracranial hemorrhage).
3. Neurological deficits (Paralysis, weakness, numbness, speech or vision loss).
4. Cognitive loss or changes in personality.
5. Seizures or coma.
6. Death.`,
    content_ar: `أفوض الفريق الجراحي بإجراء جراحة الأعصاب.
تمت مناقشة المخاطر التالية:
1. العدوى (التهاب السحايا، خراج الدماغ).
2. النزيف (النزيف داخل الجمجمة).
3. العجز العصبي (الشلل، الضعف، الخدر، فقدان النطق أو البصر).
4. فقدان القدرات الإدراكية أو تغير في الشخصية.
5. النوبات أو الغيبوبة.
6. الوفاة.`
  },
  {
    specialty_id: 'IVF', // Note: I'll map this or it just acts as string
    category: 'Specialized',
    mandatory: 1,
    title_en: 'Informed Consent for In Vitro Fertilization (IVF)',
    title_ar: 'إقرار مستنير لإجراء التلقيح الصناعي / أطفال الأنابيب',
    content_en: `I consent to undergo IVF treatment.
Risks discussed include:
1. Ovarian Hyperstimulation Syndrome (OHSS).
2. Multiple pregnancies (twins or more).
3. Ectopic pregnancy.
4. Surgical risks during egg retrieval (bleeding, infection).
I also understand and agree to the policies regarding the disposition of unused embryos.`,
    content_ar: `أوافق على الخضوع لعلاج التلقيح الصناعي.
تمت مناقشة المخاطر التالية:
1. متلازمة فرط تنشيط المبيض (OHSS).
2. الحمل المتعدد (توائم أو أكثر).
3. الحمل خارج الرحم.
4. المخاطر الجراحية أثناء سحب البويضات (النزيف، العدوى).
كما أتفهم وأوافق على السياسات المتعلقة بالتخلص من الأجنة غير المستخدمة.`
  },
  {
    specialty_id: 'OPHTHALMOLOGY',
    category: 'Specialized',
    mandatory: 1,
    title_en: 'Informed Consent for Cataract Surgery',
    title_ar: 'إقرار مستنير لجراحة إزالة المياه البيضاء (الساد)',
    content_en: `I authorize the ophthalmologist to perform cataract surgery.
Risks discussed include:
1. Infection inside the eye (Endophthalmitis).
2. Retinal detachment.
3. Glaucoma (increased pressure in the eye).
4. Loss of vision or blindness (Rare).
5. Need for additional surgeries.`,
    content_ar: `أفوض طبيب العيون بإجراء جراحة إزالة المياه البيضاء.
تمت مناقشة المخاطر التالية:
1. العدوى داخل العين (التهاب باطن المقلة).
2. انفصال الشبكية.
3. الجلوكوما (ارتفاع ضغط العين).
4. فقدان البصر أو العمى (نادر).
5. الحاجة إلى جراحات إضافية.`
  },
  {
    specialty_id: 'UROLOGY',
    category: 'General',
    mandatory: 1,
    title_en: 'Informed Consent for Urological Procedure / Cystoscopy',
    title_ar: 'إقرار مستنير لإجراء تنظير المثانة / جراحة المسالك البولية',
    content_en: `I consent to the urological procedure/cystoscopy.
Risks discussed include:
1. Urinary tract infection (UTI).
2. Bleeding or hematuria (blood in urine).
3. Stricture or scarring of the urethra.
4. Temporary inability to urinate requiring a catheter.`,
    content_ar: `أوافق على إجراء تنظير المثانة / جراحة المسالك البولية.
تمت مناقشة المخاطر التالية:
1. عدوى المسالك البولية.
2. النزيف أو البيلة الدموية (دم في البول).
3. تضيق أو ندوب في الإحليل (مجرى البول).
4. عدم القدرة المؤقتة على التبول مما يتطلب قسطرة.`
  }
];

const insertStmt = db.prepare(`
  INSERT INTO consent_templates (title_ar, title_en, content_ar, content_en, category, specialty_id, is_mandatory) 
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Clear existing and re-seed
db.exec("DELETE FROM consent_templates");

db.transaction(() => {
  for (const t of templates) {
    insertStmt.run(t.title_ar, t.title_en, t.content_ar, t.content_en, t.category, t.specialty_id, t.mandatory);
  }
})();

console.log("✅ Seeded 5 advanced bilingual medical consent templates across High-Risk and Specialized categories.");
