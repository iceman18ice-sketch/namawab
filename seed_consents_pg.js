require('dotenv').config();
const { pool } = require('./db_postgres');

async function seedConsents() {
    try {
        console.log('Connecting to PostgreSQL to seed Bilingual Consents...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consent_templates (
                template_id SERIAL PRIMARY KEY,
                title_ar TEXT,
                title_en TEXT,
                content_ar TEXT,
                content_en TEXT,
                category TEXT,
                specialty_id TEXT,
                is_mandatory BOOLEAN DEFAULT false
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS patient_consents (
                consent_id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                template_id INTEGER,
                doctor_id INTEGER,
                signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                signature_image TEXT,
                witness_signature TEXT,
                witness_name TEXT
            );
        `);

        // Clear existing to re-seed
        await pool.query('TRUNCATE TABLE consent_templates RESTART IDENTITY CASCADE');

        const templates = [
            {
              specialty_id: 'CARDIO_INT',
              category: 'High-Risk',
              mandatory: true,
              title_en: 'Informed Consent for Coronary Angiography and Angioplasty',
              title_ar: 'إقرار مستنير لإجراء قسطرة القلب التشخيصية والعلاجية',
              content_en: `I hereby authorize the medical team to perform a coronary angiography and possible angioplasty.\nRisks discussed include:\n1. Allergic reaction to contrast media (dye).\n2. Bleeding or hematoma at the puncture site.\n3. Damage to the blood vessel requiring surgery.\n4. Acute myocardial infarction, stroke, or death.\nI confirm I have understood the procedure, alternatives, and risks.`,
              content_ar: `أفوض الفريق الطبي بإجراء قسطرة القلب التشخيصية و/أو العلاجية.\nتمت مناقشة المخاطر التالية:\n1. رد فعل تحسسي للمادة الملونة (الصبغة).\n2. نزيف أو تجمع دموي في مكان إدخال القسطرة.\n3. إصابة الوعاء الدموي مما قد يستدعي تدخلاً جراحياً.\n4. احتشاء عضلة القلب، سكتة دماغية، أو الوفاة.\nأؤكد أنني فهمت الإجراء والبدائل والمخاطر المترتبة.`
            },
            {
              specialty_id: 'NEUROSURGERY',
              category: 'High-Risk',
              mandatory: true,
              title_en: 'Informed Consent for Neurosurgical Procedure',
              title_ar: 'إقرار مستنير لإجراء عملية جراحة أعصاب',
              content_en: `I authorize the surgical team to perform a neurosurgical procedure.\nRisks discussed include:\n1. Infection (Meningitis, Brain Abscess).\n2. Bleeding (Intracranial hemorrhage).\n3. Neurological deficits (Paralysis, weakness, numbness, speech or vision loss).\n4. Cognitive loss or changes in personality.\n5. Seizures or coma.\n6. Death.`,
              content_ar: `أفوض الفريق الجراحي بإجراء جراحة الأعصاب.\nتمت مناقشة المخاطر التالية:\n1. العدوى (التهاب السحايا، خراج الدماغ).\n2. النزيف (النزيف داخل الجمجمة).\n3. العجز العصبي (الشلل، الضعف، الخدر، فقدان النطق أو البصر).\n4. فقدان القدرات الإدراكية أو تغير في الشخصية.\n5. النوبات أو الغيبوبة.\n6. الوفاة.`
            },
            {
              specialty_id: 'IVF',
              category: 'Specialized',
              mandatory: true,
              title_en: 'Informed Consent for In Vitro Fertilization (IVF)',
              title_ar: 'إقرار مستنير لإجراء التلقيح الصناعي / أطفال الأنابيب',
              content_en: `I consent to undergo IVF treatment.\nRisks discussed include:\n1. Ovarian Hyperstimulation Syndrome (OHSS).\n2. Multiple pregnancies.\n3. Ectopic pregnancy.\n4. Surgical risks during egg retrieval.\nI also agree to policies regarding the disposition of unused embryos.`,
              content_ar: `أوافق على الخضوع لعلاج التلقيح الصناعي.\nتمت مناقشة المخاطر التالية:\n1. متلازمة فرط تنشيط المبيض (OHSS).\n2. الحمل المتعدد.\n3. الحمل خارج الرحم.\n4. المخاطر الجراحية أثناء سحب البويضات.\nكما أتفهم وأوافق على السياسات المتعلقة بالتخلص من الأجنة غير المستخدمة.`
            },
            {
              specialty_id: 'OPHTHALMOLOGY',
              category: 'Specialized',
              mandatory: true,
              title_en: 'Informed Consent for Cataract Surgery',
              title_ar: 'إقرار مستنير لجراحة إزالة المياه البيضاء (الساد)',
              content_en: `I authorize the ophthalmologist to perform cataract surgery.\nRisks discussed include:\n1. Infection inside the eye.\n2. Retinal detachment.\n3. Glaucoma.\n4. Loss of vision or blindness (Rare).\n5. Need for additional surgeries.`,
              content_ar: `أفوض طبيب العيون بإجراء جراحة إزالة المياه البيضاء.\nتمت مناقشة المخاطر التالية:\n1. العدوى داخل العين.\n2. انفصال الشبكية.\n3. الجلوكوما.\n4. فقدان البصر أو العمى.\n5. الحاجة إلى جراحات إضافية.`
            },
            {
              specialty_id: 'UROLOGY',
              category: 'General',
              mandatory: true,
              title_en: 'Informed Consent for Urological Procedure / Cystoscopy',
              title_ar: 'إقرار مستنير لإجراء تنظير المثانة / جراحة المسالك البولية',
              content_en: `I consent to the urological procedure/cystoscopy.\nRisks discussed include:\n1. Urinary tract infection (UTI).\n2. Bleeding or hematuria.\n3. Stricture or scarring of the urethra.\n4. Temporary inability to urinate requiring a catheter.`,
              content_ar: `أوافق على إجراء تنظير المثانة / جراحة المسالك البولية.\nتمت مناقشة المخاطر التالية:\n1. عدوى المسالك البولية.\n2. النزيف أو البيلة الدموية.\n3. تضيق أو ندوب في الإحليل.\n4. عدم القدرة المؤقتة على التبول مما يتطلب قسطرة.`
            }
        ];

        const query = `INSERT INTO consent_templates (title_ar, title_en, content_ar, content_en, category, specialty_id, is_mandatory) VALUES ($1, $2, $3, $4, $5, $6, $7)`;

        for (const t of templates) {
            await pool.query(query, [t.title_ar, t.title_en, t.content_ar, t.content_en, t.category, t.specialty_id, t.mandatory]);
        }

        console.log("✅ Seeded 5 advanced bilingual medical consent templates in PostgreSQL.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    }
}

seedConsents();
