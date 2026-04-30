require('dotenv').config();
const { pool } = require('./db_postgres');

async function seedDeepCoverage() {
    console.log('Starting Deep Clinical Coverage Seed (FULL_COVERAGE Target)...');
    try {
        const knowledgeBase = [
            {
                id: 'CARDIO_INT',
                diagnoses: [
                    { code: 'I05.0', en: 'Mitral stenosis', ar: 'تضيق الصمام التاجي' },
                    { code: 'I05.1', en: 'Rheumatic mitral insufficiency', ar: 'قصور الصمام التاجي الروماتيزمي' },
                    { code: 'I06.0', en: 'Rheumatic aortic stenosis', ar: 'تضيق الصمام الأبهري الروماتيزمي' },
                    { code: 'I11.0', en: 'Hypertensive heart disease with heart failure', ar: 'مرض القلب الناتج عن ارتفاع ضغط الدم مع قصور القلب' },
                    { code: 'I20.1', en: 'Angina pectoris with documented spasm', ar: 'ذبحة صدرية مع تشنج موثق' },
                    { code: 'I21.0', en: 'Acute transmural myocardial infarction of anterior wall', ar: 'احتشاء جداري أمامي حاد في عضلة القلب' },
                    { code: 'I21.1', en: 'Acute transmural myocardial infarction of inferior wall', ar: 'احتشاء جداري سفلي حاد في عضلة القلب' },
                    { code: 'I21.4', en: 'Non-ST elevation (NSTEMI) myocardial infarction', ar: 'احتشاء عضلة القلب غير المصحوب بارتفاع قطعة ST' },
                    { code: 'I25.110', en: 'Atherosclerotic heart disease of native coronary artery with unstable angina', ar: 'تصلب الشرايين التاجية الأصلية مع ذبحة غير مستقرة' },
                    { code: 'I34.0', en: 'Nonrheumatic mitral (valve) insufficiency', ar: 'قصور الصمام التاجي غير الروماتيزمي' },
                    { code: 'I35.0', en: 'Nonrheumatic aortic (valve) stenosis', ar: 'تضيق الصمام الأبهري غير الروماتيزمي' },
                    { code: 'I42.0', en: 'Dilated cardiomyopathy', ar: 'اعتلال عضلة القلب التوسعي' },
                    { code: 'I42.1', en: 'Obstructive hypertrophic cardiomyopathy', ar: 'اعتلال عضلة القلب الضخامي الانسدادي' },
                    { code: 'I44.2', en: 'Atrioventricular block, complete', ar: 'إحصار أذيني بطيني كامل' },
                    { code: 'I47.1', en: 'Supraventricular tachycardia', ar: 'تسرع القلب فوق البطيني' },
                    { code: 'I47.2', en: 'Ventricular tachycardia', ar: 'تسرع القلب البطيني' },
                    { code: 'I48.0', en: 'Paroxysmal atrial fibrillation', ar: 'رجفان أذيني انتيابي' },
                    { code: 'I48.2', en: 'Chronic atrial fibrillation', ar: 'رجفان أذيني مزمن' },
                    { code: 'I50.21', en: 'Acute systolic (congestive) heart failure', ar: 'قصور القلب الانقباضي الحاد' },
                    { code: 'I50.31', en: 'Acute diastolic (congestive) heart failure', ar: 'قصور القلب الانبساطي الحاد' },
                    { code: 'Q21.1', en: 'Atrial septal defect', ar: 'عيب الحاجز الأذيني' },
                    { code: 'Q21.0', en: 'Ventricular septal defect', ar: 'عيب الحاجز البطيني' },
                    { code: 'I33.0', en: 'Acute and subacute infective endocarditis', ar: 'التهاب الشغاف العدوائي الحاد ودون الحاد' },
                    { code: 'I31.3', en: 'Pericardial effusion (noninflammatory)', ar: 'انصباب التامور' },
                    { code: 'I71.2', en: 'Thoracic aortic aneurysm, without rupture', ar: 'تمدد الأوعية الدموية الأبهري الصدري بدون تمزق' },
                    { code: 'I74.3', en: 'Embolism and thrombosis of arteries of lower extremities', ar: 'انسداد وخثار شرايين الأطراف السفلية' },
                    { code: 'I26.99', en: 'Other pulmonary embolism without acute cor pulmonale', ar: 'انسداد رئوي آخر بدون قلب رئوي حاد' },
                    { code: 'I45.81', en: 'Long QT syndrome', ar: 'متلازمة فترة QT الطويلة' },
                    { code: 'R07.9', en: 'Chest pain, unspecified', ar: 'ألم في الصدر، غير محدد' },
                    { code: 'R00.0', en: 'Tachycardia, unspecified', ar: 'تسرع القلب، غير محدد' }
                ],
                labs: [
                    { name: 'NT-proBNP', category: 'Cardiac', normal: '<125 pg/mL' },
                    { name: 'Myoglobin', category: 'Cardiac', normal: '<85 ng/mL' },
                    { name: 'Homocysteine', category: 'Chemistry', normal: '4-14 µmol/L' },
                    { name: 'hs-CRP', category: 'Immunology', normal: '<3 mg/L' },
                    { name: 'Apolipoprotein A1', category: 'Chemistry', normal: '110-205 mg/dL' },
                    { name: 'Apolipoprotein B', category: 'Chemistry', normal: '50-130 mg/dL' },
                    { name: 'Lp(a)', category: 'Chemistry', normal: '<30 mg/dL' },
                    { name: 'Electrolytes Panel (Na, K, Cl)', category: 'Chemistry', normal: 'Varies' },
                    { name: 'Magnesium', category: 'Chemistry', normal: '1.7-2.2 mg/dL' },
                    { name: 'Calcium, Total', category: 'Chemistry', normal: '8.5-10.2 mg/dL' },
                    { name: 'Phosphorus', category: 'Chemistry', normal: '2.5-4.5 mg/dL' },
                    { name: 'PT/INR', category: 'Coagulation', normal: 'INR 0.8-1.1' },
                    { name: 'aPTT', category: 'Coagulation', normal: '25-35 sec' },
                    { name: 'Fibrinogen', category: 'Coagulation', normal: '200-400 mg/dL' },
                    { name: 'Lactate Dehydrogenase (LDH)', category: 'Chemistry', normal: '140-280 U/L' },
                    { name: 'AST (SGOT)', category: 'Chemistry', normal: '10-40 U/L' },
                    { name: 'Digoxin Level', category: 'Toxicology', normal: '0.8-2.0 ng/mL' },
                    { name: 'Amiodarone Level', category: 'Toxicology', normal: '1.0-2.5 µg/mL' },
                    { name: 'Aldosterone', category: 'Endocrinology', normal: 'Varies' },
                    { name: 'Renin Activity', category: 'Endocrinology', normal: 'Varies' },
                    { name: 'Thyroid Stimulating Hormone (TSH)', category: 'Endocrinology', normal: '0.4-4.0 mIU/L' },
                    { name: 'Free T4', category: 'Endocrinology', normal: '0.8-1.8 ng/dL' },
                    { name: 'Blood Culture (Aerobic)', category: 'Microbiology', normal: 'No growth' },
                    { name: 'Blood Culture (Anaerobic)', category: 'Microbiology', normal: 'No growth' },
                    { name: 'HbA1c', category: 'Chemistry', normal: '<5.7%' },
                    { name: 'Fasting Blood Glucose', category: 'Chemistry', normal: '70-99 mg/dL' },
                    { name: 'Urea', category: 'Chemistry', normal: '7-20 mg/dL' },
                    { name: 'Creatinine', category: 'Chemistry', normal: '0.6-1.2 mg/dL' },
                    { name: 'eGFR', category: 'Chemistry', normal: '>90 mL/min' },
                    { name: 'Microalbumin (Urine)', category: 'Urinalysis', normal: '<30 mg/g' }
                ],
                radiology: [
                    { name: 'ECG 12-Lead', modality: 'Cardiology' },
                    { name: 'Holter Monitor 24h', modality: 'Cardiology' },
                    { name: 'Treadmill Exercise Test', modality: 'Cardiology' },
                    { name: 'Transesophageal Echocardiogram (TEE)', modality: 'Ultrasound' },
                    { name: 'Transthoracic Echocardiogram (TTE)', modality: 'Ultrasound' },
                    { name: 'Stress Echocardiogram', modality: 'Ultrasound' },
                    { name: 'Myocardial Perfusion Scan (Thallium)', modality: 'Nuclear Medicine' },
                    { name: 'MUGA Scan', modality: 'Nuclear Medicine' },
                    { name: 'PET Scan Heart', modality: 'Nuclear Medicine' },
                    { name: 'Cardiac CT for Calcium Scoring', modality: 'CT' },
                    { name: 'CT Pulmonary Angiography', modality: 'CT' },
                    { name: 'CT Aortogram', modality: 'CT' },
                    { name: 'MRI Heart without contrast', modality: 'MRI' },
                    { name: 'MRI Heart with contrast', modality: 'MRI' },
                    { name: 'MRA Thoracic Aorta', modality: 'MRI' },
                    { name: 'Right Heart Catheterization', modality: 'Cath Lab' },
                    { name: 'Left Heart Catheterization', modality: 'Cath Lab' },
                    { name: 'Electrophysiology Study (EPS)', modality: 'Cath Lab' },
                    { name: 'Peripheral Angiography', modality: 'Cath Lab' },
                    { name: 'Carotid Doppler Ultrasound', modality: 'Ultrasound' },
                    { name: 'Venous Doppler Lower Extremity', modality: 'Ultrasound' },
                    { name: 'Arterial Doppler Lower Extremity', modality: 'Ultrasound' },
                    { name: 'Renal Artery Doppler', modality: 'Ultrasound' },
                    { name: 'Chest X-Ray AP', modality: 'X-Ray' },
                    { name: 'Aortic Root Angiogram', modality: 'Cath Lab' },
                    { name: 'Intravascular Ultrasound (IVUS)', modality: 'Cath Lab' },
                    { name: 'Fractional Flow Reserve (FFR)', modality: 'Cath Lab' },
                    { name: 'Optical Coherence Tomography (OCT)', modality: 'Cath Lab' },
                    { name: 'Pericardiocentesis Fluoroscopy', modality: 'Cath Lab' },
                    { name: 'Pacemaker Interrogation', modality: 'Cardiology' }
                ],
                consents: [
                    {
                        category: 'Surgical', mandatory: true,
                        title_en: 'Informed Consent for Pacemaker Insertion', title_ar: 'إقرار مستنير لتركيب منظم ضربات القلب',
                        content_en: 'Consent to insert a permanent pacemaker. Risks: infection, bleeding, pneumothorax, lead dislodgment.',
                        content_ar: 'الموافقة على تركيب منظم ضربات قلب دائم. المخاطر: عدوى، نزيف، استرواح الصدر، تحرك السلك.'
                    },
                    {
                        category: 'Surgical', mandatory: true,
                        title_en: 'Informed Consent for Transesophageal Echocardiogram (TEE)', title_ar: 'إقرار مستنير لإجراء تخطيط صدى القلب عبر المريء',
                        content_en: 'Consent for TEE procedure. Risks: esophageal injury, sore throat, reaction to sedation.',
                        content_ar: 'الموافقة على إجراء تخطيط صدى القلب عبر المريء. المخاطر: إصابة المريء، التهاب الحلق، تفاعل مع المهدئات.'
                    },
                    {
                        category: 'Surgical', mandatory: true,
                        title_en: 'Informed Consent for Electrophysiology Study (EPS)', title_ar: 'إقرار مستنير لدراسة كهروفيزيولوجية القلب',
                        content_en: 'Consent for EPS and possible ablation. Risks: arrhythmias, bleeding, heart block requiring pacemaker.',
                        content_ar: 'الموافقة على دراسة كهروفيزيولوجية لاحتمال الكي. المخاطر: عدم انتظام ضربات القلب، نزيف، إحصار قلبي يستدعي منظم.'
                    }
                ]
            },
            {
                id: 'PEDS_ENT',
                diagnoses: [
                    { code: 'H65.1', en: 'Other acute nonsuppurative otitis media', ar: 'التهاب الأذن الوسطى غير القيحي الحاد' },
                    { code: 'H66.0', en: 'Acute suppurative otitis media', ar: 'التهاب الأذن الوسطى القيحي الحاد' },
                    { code: 'H66.9', en: 'Otitis media, unspecified', ar: 'التهاب الأذن الوسطى، غير محدد' },
                    { code: 'H61.2', en: 'Impacted cerumen', ar: 'انحشار الصملاخ (شمع الأذن)' },
                    { code: 'J02.0', en: 'Streptococcal pharyngitis', ar: 'التهاب البلعوم بالعقديات' },
                    { code: 'J03.0', en: 'Streptococcal tonsillitis', ar: 'التهاب اللوزتين بالعقديات' },
                    { code: 'J04.0', en: 'Acute laryngitis', ar: 'التهاب الحنجرة الحاد' },
                    { code: 'J04.2', en: 'Acute laryngotracheitis', ar: 'التهاب الحنجرة والرغامى الحاد' },
                    { code: 'J05.0', en: 'Acute obstructive laryngitis (croup)', ar: 'التهاب الحنجرة الانسدادي الحاد (الخانوق)' },
                    { code: 'J06.9', en: 'Acute upper respiratory infection, unspecified', ar: 'عدوى الجهاز التنفسي العلوي الحادة' },
                    { code: 'J30.1', en: 'Allergic rhinitis due to pollen', ar: 'التهاب الأنف التحسسي بسبب حبوب اللقاح' },
                    { code: 'J30.4', en: 'Allergic rhinitis, unspecified', ar: 'التهاب الأنف التحسسي، غير محدد' },
                    { code: 'J32.0', en: 'Chronic maxillary sinusitis', ar: 'التهاب الجيب الفكي المزمن' },
                    { code: 'J33.0', en: 'Polyp of nasal cavity', ar: 'سليلة التجويف الأنفي' },
                    { code: 'J34.2', en: 'Deviated nasal septum', ar: 'انحراف الحاجز الأنفي' },
                    { code: 'J38.0', en: 'Paralysis of vocal cords and larynx', ar: 'شلل الحبال الصوتية والحنجرة' },
                    { code: 'J38.3', en: 'Other diseases of vocal cords', ar: 'أمراض أخرى في الحبال الصوتية' },
                    { code: 'Q31.1', en: 'Congenital subglottic stenosis', ar: 'تضيق تحت المزمار الخلقي' },
                    { code: 'Q31.5', en: 'Congenital laryngomalacia', ar: 'تلين الحنجرة الخلقي' },
                    { code: 'R04.0', en: 'Epistaxis', ar: 'رعاف (نزيف الأنف)' },
                    { code: 'H72.9', en: 'Unspecified perforation of tympanic membrane', ar: 'ثقب طبلة الأذن، غير محدد' },
                    { code: 'H90.0', en: 'Conductive hearing loss, bilateral', ar: 'فقدان السمع التوصيلي، ثنائي' },
                    { code: 'H90.3', en: 'Sensorineural hearing loss, bilateral', ar: 'فقدان السمع الحسي العصبي، ثنائي' },
                    { code: 'T16', en: 'Foreign body in ear', ar: 'جسم غريب في الأذن' },
                    { code: 'T17.0', en: 'Foreign body in nasal sinus', ar: 'جسم غريب في الجيوب الأنفية' },
                    { code: 'T17.1', en: 'Foreign body in nostril', ar: 'جسم غريب في فتحة الأنف' },
                    { code: 'T17.2', en: 'Foreign body in pharynx', ar: 'جسم غريب في البلعوم' },
                    { code: 'T17.3', en: 'Foreign body in larynx', ar: 'جسم غريب في الحنجرة' },
                    { code: 'Q16.9', en: 'Congenital malformation of ear, unspecified', ar: 'تشوه خلقي في الأذن، غير محدد' },
                    { code: 'Q18.8', en: 'Other specified congenital malformations of face and neck', ar: 'تشوهات خلقية أخرى محددة للوجه والرقبة' }
                ],
                labs: [
                    { name: 'Throat Culture (Aerobic)', category: 'Microbiology', normal: 'Normal flora' },
                    { name: 'Rapid RSV Test', category: 'Virology', normal: 'Negative' },
                    { name: 'Influenza A/B PCR', category: 'Virology', normal: 'Negative' },
                    { name: 'COVID-19 PCR', category: 'Virology', normal: 'Negative' },
                    { name: 'ASO Titer', category: 'Immunology', normal: '<200 IU/mL' },
                    { name: 'IgE Total', category: 'Immunology', normal: '<100 kU/L' },
                    { name: 'Allergy Panel (Inhalants)', category: 'Immunology', normal: 'Negative' },
                    { name: 'Allergy Panel (Food)', category: 'Immunology', normal: 'Negative' },
                    { name: 'Blood Culture (Pediatric)', category: 'Microbiology', normal: 'No growth' },
                    { name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'Hematology', normal: '0-10 mm/hr' },
                    { name: 'Procalcitonin', category: 'Immunology', normal: '<0.15 ng/mL' },
                    { name: 'Peripheral Blood Smear', category: 'Hematology', normal: 'Normal morphology' },
                    { name: 'PT/INR (Pre-op)', category: 'Coagulation', normal: 'INR 0.8-1.1' },
                    { name: 'aPTT (Pre-op)', category: 'Coagulation', normal: '25-35 sec' },
                    { name: 'Bleeding Time', category: 'Coagulation', normal: '2-9 mins' },
                    { name: 'Basic Metabolic Panel', category: 'Chemistry', normal: 'Varies' },
                    { name: 'Calcium', category: 'Chemistry', normal: '8.8-10.8 mg/dL' },
                    { name: 'Vitamin D (25-OH)', category: 'Chemistry', normal: '30-100 ng/mL' },
                    { name: 'Iron Profile', category: 'Chemistry', normal: 'Varies' },
                    { name: 'Ferritin', category: 'Chemistry', normal: '12-150 ng/mL' },
                    { name: 'Sweat Chloride Test', category: 'Chemistry', normal: '<30 mmol/L' },
                    { name: 'Ear Swab Culture', category: 'Microbiology', normal: 'No growth' },
                    { name: 'Nasal Swab Culture', category: 'Microbiology', normal: 'Normal flora' },
                    { name: 'Audiometry (Tympanogram)', category: 'Audiology', normal: 'Type A' },
                    { name: 'Otoacoustic Emissions (OAE)', category: 'Audiology', normal: 'Pass' },
                    { name: 'Auditory Brainstem Response (ABR)', category: 'Audiology', normal: 'Normal latencies' },
                    { name: 'Blood Group & Rh (Pre-op)', category: 'Blood Bank', normal: 'N/A' },
                    { name: 'Crossmatch (Pre-op)', category: 'Blood Bank', normal: 'Compatible' },
                    { name: 'Hepatitis B Surface Antigen', category: 'Virology', normal: 'Negative' },
                    { name: 'HIV 1/2 Antibodies', category: 'Virology', normal: 'Negative' }
                ],
                radiology: [
                    { name: 'X-Ray Mastoids', modality: 'X-Ray' },
                    { name: 'X-Ray Paranasal Sinuses', modality: 'X-Ray' },
                    { name: 'X-Ray Soft Tissue Neck AP/LAT', modality: 'X-Ray' },
                    { name: 'X-Ray Nasal Bone', modality: 'X-Ray' },
                    { name: 'X-Ray Chest (Pediatric)', modality: 'X-Ray' },
                    { name: 'Fluoroscopy Airway (Fluoroscopy)', modality: 'Fluoroscopy' },
                    { name: 'Barium Swallow', modality: 'Fluoroscopy' },
                    { name: 'CT Temporal Bones', modality: 'CT' },
                    { name: 'CT Neck with contrast', modality: 'CT' },
                    { name: 'CT Facial Bones', modality: 'CT' },
                    { name: 'CT Brain/Head', modality: 'CT' },
                    { name: 'CT Orbits', modality: 'CT' },
                    { name: 'MRI Neck with contrast', modality: 'MRI' },
                    { name: 'MRI Brain', modality: 'MRI' },
                    { name: 'MRI Face/Sinuses', modality: 'MRI' },
                    { name: 'Ultrasound Thyroid', modality: 'Ultrasound' },
                    { name: 'Ultrasound Salivary Glands', modality: 'Ultrasound' },
                    { name: 'Ultrasound Lymph Nodes Neck', modality: 'Ultrasound' },
                    { name: 'Endoscopy Rigid Bronchoscopy', modality: 'Endoscopy' },
                    { name: 'Endoscopy Flexible Laryngoscopy', modality: 'Endoscopy' },
                    { name: 'Endoscopy Rigid Esophagoscopy', modality: 'Endoscopy' },
                    { name: 'Nasal Endoscopy', modality: 'Endoscopy' },
                    { name: 'Otoscopy (Video)', modality: 'Endoscopy' },
                    { name: 'Stroboscopy Larynx', modality: 'Endoscopy' },
                    { name: 'Nuclear Medicine Thyroid Scan', modality: 'Nuclear Medicine' },
                    { name: 'PET Scan Head/Neck', modality: 'Nuclear Medicine' },
                    { name: 'Cone Beam CT Maxillofacial', modality: 'CT' },
                    { name: 'Polysomnography (Sleep Study)', modality: 'Diagnostics' },
                    { name: 'Allergy Skin Prick Test', modality: 'Diagnostics' },
                    { name: 'Rhinomanometry', modality: 'Diagnostics' }
                ],
                consents: [
                    {
                        category: 'Surgical', mandatory: true,
                        title_en: 'Informed Consent for Myringotomy and Tympanostomy Tube Insertion', title_ar: 'إقرار مستنير لشق طبلة الأذن ووضع أنابيب تهوية',
                        content_en: 'Consent for ear tube placement. Risks: chronic perforation, scarring, recurrent infection.',
                        content_ar: 'الموافقة على وضع أنابيب أذن. المخاطر: ثقب دائم، ندوب، تكرار الالتهاب.'
                    },
                    {
                        category: 'Surgical', mandatory: true,
                        title_en: 'Informed Consent for Foreign Body Removal from Airway', title_ar: 'إقرار مستنير لاستخراج جسم غريب من مجرى التنفس',
                        content_en: 'Consent for bronchoscopy to remove foreign object. Risks: airway injury, bleeding, respiratory distress.',
                        content_ar: 'الموافقة على تنظير القصبات لاستخراج جسم. المخاطر: إصابة المجرى التنفسي، نزيف، ضيق تنفس.'
                    },
                    {
                        category: 'Surgical', mandatory: true,
                        title_en: 'Informed Consent for Cochlear Implant', title_ar: 'إقرار مستنير لزراعة القوقعة',
                        content_en: 'Consent for cochlear implantation. Risks: facial nerve injury, taste changes, device failure, meningitis.',
                        content_ar: 'الموافقة على زراعة القوقعة. المخاطر: إصابة العصب الوجهي، تغير التذوق، تعطل الجهاز، التهاب السحايا.'
                    }
                ]
            }
        ];

        let insertCount = 0;

        for (const spec of knowledgeBase) {
            console.log(`Deep Seeding ${spec.id}...`);
            
            // Diagnoses
            for (const diag of spec.diagnoses) {
                await pool.query('INSERT INTO icd10_codes (code, description_en, description_ar) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [diag.code, diag.en, diag.ar]);
                await pool.query('INSERT INTO specialty_diagnoses (specialty_id, icd10_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', [spec.id, diag.code]);
                insertCount++;
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
                insertCount++;
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
                insertCount++;
            }

            // Consents
            for (const consent of spec.consents) {
                const existing = await pool.query('SELECT template_id FROM consent_templates WHERE specialty_id = $1 AND title_en = $2', [spec.id, consent.title_en]);
                if (existing.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO consent_templates (title_ar, title_en, content_ar, content_en, category, specialty_id, is_mandatory) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [consent.title_ar, consent.title_en, consent.content_ar, consent.content_en, consent.category, spec.id, consent.mandatory]
                    );
                    insertCount++;
                }
            }
        }
        
        console.log(`✅ Deep Auto-Fix Seed Completed Successfully! Inserted/Processed ${insertCount} deep relations.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedDeepCoverage();
