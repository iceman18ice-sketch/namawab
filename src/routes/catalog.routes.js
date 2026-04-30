/**
 * CATALOG Routes
 * Auto-extracted from server.js | 7 routes
 * DO NOT manually edit — regenerate with refactor_tool.js
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth, requireCatalogAccess, requireRole, MAX_DISCOUNT_BY_ROLE } = require('../middleware/auth');
const { logAudit, calcVAT, addVAT } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');


// MEDICAL SERVICES
// ===== MEDICAL SERVICES =====
router.get('/api/medical/services', requireAuth, async (req, res) => {
    try {
        const { specialty } = req.query;
        if (specialty) { res.json((await pool.query('SELECT * FROM medical_services WHERE specialty=$1 ORDER BY category, name_en', [specialty])).rows); }
        else { res.json((await pool.query('SELECT * FROM medical_services ORDER BY specialty, category, name_en')).rows); }
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/medical/services/:id', requireAuth, async (req, res) => {
    try {
        const { price } = req.body;
        if (price !== undefined) await pool.query('UPDATE medical_services SET price=$1 WHERE id=$2', [price, req.params.id]);
        res.json((await pool.query('SELECT * FROM medical_services WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// CATALOG APIs
// ===== CATALOG APIs =====
router.get('/api/catalog/', requireAuth, requireCatalogAccess, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM lab_tests_catalog ORDER BY category, test_name')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/catalog/', requireAuth, requireCatalogAccess, async (req, res) => {
    try {
        const { price } = req.body;
        if (price !== undefined) await pool.query('UPDATE lab_tests_catalog SET price=$1 WHERE id=$2', [price, req.params.id]);
        res.json((await pool.query('SELECT * FROM lab_tests_catalog WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/catalog/', requireAuth, requireCatalogAccess, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM radiology_catalog ORDER BY modality, exact_name')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/catalog/', requireAuth, requireCatalogAccess, async (req, res) => {
    try {
        const { price } = req.body;
        if (price !== undefined) await pool.query('UPDATE radiology_catalog SET price=$1 WHERE id=$2', [price, req.params.id]);
        res.json((await pool.query('SELECT * FROM radiology_catalog WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// COMPREHENSIVE DIAGNOSIS TEMPLATES (80+ diagnoses, 12 specialties)
// ===== COMPREHENSIVE DIAGNOSIS TEMPLATES (80+ diagnoses, 12 specialties) =====
router.get('/api/diagnosis-templates', requireAuth, async (req, res) => {
    try {
        const templates = {
            'General / عام': [
                { name: 'Upper Respiratory Tract Infection', name_ar: 'التهاب الجهاز التنفسي العلوي', icd: 'J06.9', symptoms: 'Cough, runny nose, sore throat, fever', treatment: 'Paracetamol 500mg QID, rest, fluids, saline nasal spray' },
                { name: 'Acute Gastroenteritis', name_ar: 'التهاب المعدة والأمعاء الحاد', icd: 'K52.9', symptoms: 'Nausea, vomiting, diarrhea, abdominal cramps', treatment: 'ORS, Ondansetron 4mg, Loperamide if needed, probiotics' },
                { name: 'Urinary Tract Infection', name_ar: 'التهاب المسالك البولية', icd: 'N39.0', symptoms: 'Dysuria, frequency, urgency, suprapubic pain, cloudy urine', treatment: 'Ciprofloxacin 500mg BID x7d or Nitrofurantoin 100mg BID x5d' },
                { name: 'Tension Headache', name_ar: 'صداع توتري', icd: 'G44.2', symptoms: 'Bilateral pressure-like headache, no nausea, no photophobia', treatment: 'Paracetamol 1g, Ibuprofen 400mg, stress management, adequate sleep' },
                { name: 'Essential Hypertension', name_ar: 'ارتفاع ضغط الدم الأساسي', icd: 'I10', symptoms: 'Usually asymptomatic, headache, dizziness if severe', treatment: 'Amlodipine 5mg daily, lifestyle modification, low salt diet, follow-up 2 weeks' },
                { name: 'Type 2 Diabetes Mellitus', name_ar: 'السكري النوع الثاني', icd: 'E11.9', symptoms: 'Polyuria, polydipsia, fatigue, blurred vision, weight loss', treatment: 'Metformin 500mg BID, diet control, exercise 30min/day, HbA1c in 3 months' },
                { name: 'Acute Bronchitis', name_ar: 'التهاب الشعب الهوائية الحاد', icd: 'J20.9', symptoms: 'Productive cough, chest discomfort, wheezing, low-grade fever', treatment: 'Ambroxol 30mg TID, Salbutamol inhaler PRN, fluids, no antibiotics if viral' },
                { name: 'Allergic Rhinitis', name_ar: 'التهاب الأنف التحسسي', icd: 'J30.4', symptoms: 'Sneezing, nasal congestion, watery rhinorrhea, itchy eyes', treatment: 'Cetirizine 10mg daily, Fluticasone nasal spray BID, avoid allergens' },
                { name: 'Iron Deficiency Anemia', name_ar: 'فقر الدم بنقص الحديد', icd: 'D50.9', symptoms: 'Fatigue, pallor, dyspnea on exertion, brittle nails, pica', treatment: 'Ferrous sulfate 325mg BID on empty stomach with vitamin C, CBC in 4 weeks' },
                { name: 'Low Back Pain (Mechanical)', name_ar: 'ألم أسفل الظهر الميكانيكي', icd: 'M54.5', symptoms: 'Lower back pain, muscle spasm, limited range of motion, no radiation', treatment: 'Diclofenac 75mg BID, Cyclobenzaprine 10mg HS, hot packs, physiotherapy referral' },
                { name: 'Vitamin D Deficiency', name_ar: 'نقص فيتامين د', icd: 'E55.9', symptoms: 'Bone pain, muscle weakness, fatigue, depression, frequent infections', treatment: 'Cholecalciferol 50,000IU weekly x8 weeks then 2,000IU daily maintenance' },
                { name: 'Dyslipidemia', name_ar: 'اضطراب الدهون', icd: 'E78.5', symptoms: 'Usually asymptomatic, discovered on routine labs', treatment: 'Atorvastatin 20mg HS, low-fat diet, exercise, lipid panel in 6 weeks' },
                { name: 'Hypothyroidism', name_ar: 'قصور الغدة الدرقية', icd: 'E03.9', symptoms: 'Fatigue, weight gain, cold intolerance, constipation, dry skin, hair loss', treatment: 'Levothyroxine 50mcg daily on empty stomach, TSH in 6 weeks' },
                { name: 'Gastroesophageal Reflux Disease', name_ar: 'ارتجاع المريء', icd: 'K21.0', symptoms: 'Heartburn, regurgitation, chest pain after eating, sour taste', treatment: 'Omeprazole 20mg daily before breakfast, avoid spicy food, elevate head of bed' },
                { name: 'Acute Sinusitis', name_ar: 'التهاب الجيوب الأنفية الحاد', icd: 'J01.9', symptoms: 'Facial pain/pressure, nasal congestion, purulent discharge, headache', treatment: 'Amoxicillin 500mg TID x10d, decongestant spray x3d max, saline irrigation' }
            ],
            'Internal Medicine / الباطنية': [
                { name: 'Community Acquired Pneumonia', name_ar: 'التهاب رئوي مكتسب من المجتمع', icd: 'J18.9', symptoms: 'Fever, productive cough, dyspnea, pleuritic chest pain, crackles', treatment: 'Azithromycin 500mg D1 then 250mg D2-5 + Amoxicillin-Clav 625mg TID, CXR follow-up' },
                { name: 'Acute Kidney Injury', name_ar: 'إصابة كلوية حادة', icd: 'N17.9', symptoms: 'Decreased urine output, edema, fatigue, nausea, confusion', treatment: 'IV fluids, stop nephrotoxic drugs, monitor I/O, BMP Q12h, nephrology consult' },
                { name: 'Congestive Heart Failure', name_ar: 'فشل القلب الاحتقاني', icd: 'I50.9', symptoms: 'Dyspnea, orthopnea, PND, leg edema, weight gain, crackles', treatment: 'Furosemide 40mg IV, fluid restriction <1.5L, daily weights, O2 PRN, cardiology consult' },
                { name: 'Diabetic Ketoacidosis', name_ar: 'حماض كيتوني سكري', icd: 'E10.1', symptoms: 'Polyuria, nausea/vomiting, abdominal pain, Kussmaul breathing, fruity breath', treatment: 'NS bolus, insulin drip 0.1U/kg/hr, K+ replacement, BMP Q2h, ICU admission' },
                { name: 'Deep Vein Thrombosis', name_ar: 'جلطة الأوردة العميقة', icd: 'I82.9', symptoms: 'Unilateral leg swelling, pain, warmth, redness, pitting edema', treatment: 'Enoxaparin 1mg/kg BID, Warfarin bridge, compression stockings, Doppler US' },
                { name: 'Chronic Kidney Disease', name_ar: 'مرض كلوي مزمن', icd: 'N18.9', symptoms: 'Fatigue, edema, decreased appetite, nocturia, pruritus', treatment: 'ACE inhibitor, low protein diet, phosphate binders, EPO if anemia, nephrology F/U' },
                { name: 'Peptic Ulcer Disease', name_ar: 'قرحة المعدة', icd: 'K27.9', symptoms: 'Epigastric pain, relation to meals, nausea, melena if bleeding', treatment: 'PPI high dose, H.pylori triple therapy if positive, avoid NSAIDs, EGD if alarm symptoms' },
                { name: 'Acute Pancreatitis', name_ar: 'التهاب البنكرياس الحاد', icd: 'K85.9', symptoms: 'Severe epigastric pain radiating to back, nausea/vomiting, elevated lipase', treatment: 'NPO, aggressive IV hydration, pain management (Morphine), monitor in hospital' }
            ],
            'Pediatrics / الأطفال': [
                { name: 'Acute Otitis Media', name_ar: 'التهاب الأذن الوسطى الحاد', icd: 'H66.9', symptoms: 'Ear pain, fever, irritability, pulling ear, decreased hearing', treatment: 'Amoxicillin 80-90mg/kg/day BID x10d, Paracetamol for pain, F/U 48h' },
                { name: 'Viral Pharyngitis', name_ar: 'التهاب البلعوم الفيروسي', icd: 'J02.9', symptoms: 'Sore throat, fever, redness, no exudate, rhinorrhea, cough', treatment: 'Supportive care, Paracetamol 15mg/kg Q6h, warm fluids, rest' },
                { name: 'Acute Gastroenteritis (Pediatric)', name_ar: 'نزلة معوية حادة للأطفال', icd: 'A09', symptoms: 'Vomiting, watery diarrhea, dehydration signs, irritability', treatment: 'ORS small frequent sips, Zinc 20mg daily x10-14d, Ondansetron if severe vomiting' },
                { name: 'Asthma Exacerbation', name_ar: 'نوبة ربو حادة', icd: 'J45.9', symptoms: 'Wheezing, dyspnea, cough worse at night, chest tightness, retractions', treatment: 'Salbutamol neb Q20min x3, Ipratropium neb, Prednisolone 1mg/kg x3-5d' },
                { name: 'Hand Foot and Mouth Disease', name_ar: 'مرض اليد والقدم والفم', icd: 'B08.4', symptoms: 'Fever, oral ulcers, vesicular rash on palms/soles/buttocks', treatment: 'Supportive care, Paracetamol, cold fluids, oral gel for ulcers' },
                { name: 'Febrile Seizure (Simple)', name_ar: 'نوبة حمية بسيطة', icd: 'R56.0', symptoms: 'Generalized seizure <15min with fever, age 6m-5y, no focal features', treatment: 'Reassure parents, antipyretics, identify fever source, no AEDs needed' },
                { name: 'Iron Deficiency Anemia (Pediatric)', name_ar: 'فقر الدم بنقص الحديد للأطفال', icd: 'D50.9', symptoms: 'Pallor, irritability, poor appetite, pica, fatigue', treatment: 'Ferrous sulfate 3-6mg/kg/day elemental iron, vitamin C, dietary counseling' },
                { name: 'Bronchiolitis', name_ar: 'التهاب القصيبات', icd: 'J21.9', symptoms: 'Rhinorrhea, cough, wheezing, tachypnea, retractions, poor feeding, age <2y', treatment: 'O2 if SpO2<92%, nasal suctioning, careful hydration, admit if respiratory distress' }
            ],
            'Dermatology / الجلدية': [
                { name: 'Eczema / Atopic Dermatitis', name_ar: 'الإكزيما', icd: 'L30.9', symptoms: 'Itchy dry red patches on flexures, lichenification in chronic', treatment: 'Moisturizers BID, Betamethasone 0.05% cream BID x2w, avoid triggers' },
                { name: 'Acne Vulgaris (Mild)', name_ar: 'حب الشباب الخفيف', icd: 'L70.0', symptoms: 'Comedones, few papules on face, no scarring', treatment: 'Benzoyl peroxide 5% gel HS, Adapalene 0.1% gel HS, gentle cleanser' },
                { name: 'Acne Vulgaris (Moderate-Severe)', name_ar: 'حب الشباب المتوسط-الشديد', icd: 'L70.0', symptoms: 'Papules, pustules, nodules on face/back, possible scarring', treatment: 'Doxycycline 100mg BID x3m, Adapalene-BPO gel, consider Isotretinoin' },
                { name: 'Tinea (Ringworm)', name_ar: 'فطريات جلدية (السعفة)', icd: 'B35.4', symptoms: 'Ring-shaped red patch, raised scaly border, central clearing', treatment: 'Clotrimazole 1% cream BID x2-4w, keep dry, avoid sharing towels' },
                { name: 'Psoriasis (Plaque)', name_ar: 'الصدفية', icd: 'L40.0', symptoms: 'Erythematous plaques with silvery scales, elbows/knees/scalp', treatment: 'Betamethasone cream BID, Calcipotriol ointment, coal tar shampoo' },
                { name: 'Urticaria', name_ar: 'الشرى (الأرتيكاريا)', icd: 'L50.9', symptoms: 'Itchy wheals, migratory, angioedema possible', treatment: 'Cetirizine 10mg BID, avoid triggers, Epinephrine IM if anaphylaxis' },
                { name: 'Contact Dermatitis', name_ar: 'التهاب الجلد التماسي', icd: 'L25.9', symptoms: 'Erythema, vesicles, pruritus at contact site', treatment: 'Remove causative agent, Hydrocortisone 1% cream BID, antihistamine' },
                { name: 'Vitiligo', name_ar: 'البهاق', icd: 'L80', symptoms: 'Depigmented macules/patches, symmetrical, no itching', treatment: 'Tacrolimus 0.1% ointment BID, phototherapy referral, sunscreen' },
                { name: 'Melasma', name_ar: 'الكلف', icd: 'L81.1', symptoms: 'Brown-gray patches on face, bilateral, worse with sun', treatment: 'Hydroquinone 4% cream HS, SPF 50+, Vitamin C serum' }
            ],
            'Orthopedics / العظام': [
                { name: 'Knee Osteoarthritis', name_ar: 'خشونة الركبة', icd: 'M17.9', symptoms: 'Knee pain worse with activity, stiffness <30min, crepitus', treatment: 'Paracetamol 1g TID, Glucosamine 1500mg, physiotherapy, weight loss' },
                { name: 'Lumbar Disc Herniation', name_ar: 'انزلاق غضروفي قطني', icd: 'M51.1', symptoms: 'Low back pain radiating to leg, numbness, positive SLR', treatment: 'NSAIDs, Gabapentin 300mg TID, physiotherapy, epidural if severe, MRI' },
                { name: 'Rotator Cuff Tendinitis', name_ar: 'التهاب وتر الكتف', icd: 'M75.1', symptoms: 'Shoulder pain with overhead activities, night pain, painful arc', treatment: 'NSAIDs, ice, physiotherapy, subacromial injection if persistent' },
                { name: 'Plantar Fasciitis', name_ar: 'التهاب اللفافة الأخمصية', icd: 'M72.2', symptoms: 'Heel pain worst with first steps in morning, point tenderness', treatment: 'Stretching, heel cups, NSAIDs, night splint, steroid injection if chronic' },
                { name: 'Carpal Tunnel Syndrome', name_ar: 'متلازمة النفق الرسغي', icd: 'G56.0', symptoms: 'Numbness in thumb-middle fingers, worse at night, weak grip', treatment: 'Wrist splint at night, NSAIDs, steroid injection, NCS/EMG, surgery if severe' },
                { name: 'Ankle Sprain', name_ar: 'التواء الكاحل', icd: 'S93.4', symptoms: 'Pain/swelling after inversion injury, ecchymosis', treatment: 'RICE protocol, ankle brace, Ibuprofen, gradual rehab, X-ray to rule out fracture' },
                { name: 'Cervical Spondylosis', name_ar: 'خشونة الرقبة', icd: 'M47.8', symptoms: 'Neck pain/stiffness, reduced ROM, referred pain to shoulders', treatment: 'NSAIDs, muscle relaxant, cervical collar short-term, physiotherapy' }
            ],
            'ENT / الأنف والأذن والحنجرة': [
                { name: 'Acute Tonsillitis', name_ar: 'التهاب اللوزتين الحاد', icd: 'J03.9', symptoms: 'Severe sore throat, odynophagia, fever, tonsillar exudate', treatment: 'Penicillin V 500mg QID x10d, Paracetamol, warm salt water gargle' },
                { name: 'Chronic Sinusitis', name_ar: 'التهاب الجيوب المزمن', icd: 'J32.9', symptoms: 'Nasal congestion >12w, facial pressure, post-nasal drip', treatment: 'Fluticasone nasal BID, saline irrigation, Augmentin 625mg TID x14d' },
                { name: 'Allergic Rhinitis', name_ar: 'حساسية الأنف', icd: 'J30.4', symptoms: 'Sneezing, rhinorrhea, itching, congestion, pale turbinates', treatment: 'Cetirizine 10mg daily, Fluticasone nasal BID, allergen avoidance' },
                { name: 'BPPV (Vertigo)', name_ar: 'دوار الوضعة الحميد', icd: 'H81.1', symptoms: 'Brief vertigo with head position change, positive Dix-Hallpike', treatment: 'Epley maneuver, Betahistine 16mg TID, vestibular rehab' },
                { name: 'Otitis Externa', name_ar: 'التهاب الأذن الخارجية', icd: 'H60.9', symptoms: 'Ear pain worse with tragal pressure, itching, discharge', treatment: 'Ciprofloxacin-Dexamethasone drops TID x7d, keep ear dry' },
                { name: 'Epistaxis (Anterior)', name_ar: 'رعاف أنفي أمامي', icd: 'R04.0', symptoms: 'Unilateral nasal bleeding, usually from Little area', treatment: 'Direct pressure 15min, Oxymetazoline, anterior packing if persistent' }
            ],
            'Ophthalmology / العيون': [
                { name: 'Allergic Conjunctivitis', name_ar: 'التهاب الملتحمة التحسسي', icd: 'H10.1', symptoms: 'Bilateral itchy eyes, tearing, redness, seasonal', treatment: 'Olopatadine 0.1% drops BID, cold compresses, oral antihistamine' },
                { name: 'Bacterial Conjunctivitis', name_ar: 'التهاب الملتحمة البكتيري', icd: 'H10.0', symptoms: 'Purulent discharge, crusting, redness, unilateral then bilateral', treatment: 'Moxifloxacin 0.5% drops QID x7d, warm compresses, hand hygiene' },
                { name: 'Dry Eye Syndrome', name_ar: 'جفاف العين', icd: 'H04.1', symptoms: 'Burning, grittiness, foreign body sensation, tearing', treatment: 'Artificial tears QID, warm compresses, omega-3, reduce screen time' },
                { name: 'Stye (Hordeolum)', name_ar: 'الدمل (الشحاذ)', icd: 'H00.0', symptoms: 'Painful red swelling at eyelid margin, tenderness', treatment: 'Warm compresses QID, Chloramphenicol ointment TID, do not squeeze' },
                { name: 'Refractive Error', name_ar: 'خطأ انكساري', icd: 'H52.7', symptoms: 'Blurred vision, headache, eye strain, squinting', treatment: 'Refraction test, prescribe glasses/contact lenses, annual follow-up' }
            ],
            'Dental / الأسنان': [
                { name: 'Dental Caries', name_ar: 'تسوس الأسنان', icd: 'K02.9', symptoms: 'Toothache, sensitivity to hot/cold/sweet, visible cavitation', treatment: 'Dental filling, oral hygiene instructions, fluoride treatment' },
                { name: 'Acute Pulpitis', name_ar: 'التهاب لب السن الحاد', icd: 'K04.0', symptoms: 'Severe spontaneous toothache, worse at night, lingering pain', treatment: 'Root canal or extraction, Ibuprofen 400mg TID, Amoxicillin if infection' },
                { name: 'Periodontal Disease', name_ar: 'أمراض اللثة', icd: 'K05.1', symptoms: 'Gum bleeding, redness, swelling, bad breath, loose teeth', treatment: 'Scaling and root planing, Chlorhexidine mouthwash BID, oral hygiene' },
                { name: 'Periapical Abscess', name_ar: 'خراج حول الذروة', icd: 'K04.7', symptoms: 'Severe pain, swelling, tender to percussion, pus, fever', treatment: 'I&D, Amoxicillin + Metronidazole, root canal or extraction' },
                { name: 'TMJ Disorder', name_ar: 'اضطراب المفصل الصدغي', icd: 'K07.6', symptoms: 'Jaw pain, clicking, limited opening, headache, ear pain', treatment: 'Soft diet, jaw exercises, night guard, NSAIDs, warm compresses' },
                { name: 'Wisdom Tooth Impaction', name_ar: 'ضرس العقل المطمور', icd: 'K01.1', symptoms: 'Pain at angle of jaw, swelling, difficulty opening', treatment: 'Surgical extraction, Amoxicillin, Ibuprofen, chlorhexidine rinse' }
            ],
            'Emergency / الطوارئ': [
                { name: 'Acute MI (STEMI)', name_ar: 'احتشاء عضلة القلب الحاد', icd: 'I21.9', symptoms: 'Crushing chest pain, radiation to jaw/arm, diaphoresis, ST elevation', treatment: 'MONA, Heparin, urgent PCI, cardiology STAT' },
                { name: 'Acute Appendicitis', name_ar: 'التهاب الزائدة الحاد', icd: 'K35.9', symptoms: 'RLQ pain, nausea, fever, McBurney tenderness, Rovsing +', treatment: 'NPO, IV antibiotics, surgical consult STAT, CT if unclear' },
                { name: 'Anaphylaxis', name_ar: 'صدمة حساسية', icd: 'T78.2', symptoms: 'Urticaria, angioedema, bronchospasm, hypotension, dyspnea', treatment: 'Epinephrine 0.3mg IM STAT, IV fluids, diphenhydramine, steroids' },
                { name: 'Acute Stroke', name_ar: 'سكتة دماغية حادة', icd: 'I63.9', symptoms: 'Sudden weakness one side, speech difficulty, facial droop', treatment: 'CT head STAT, tPA if <4.5h, Aspirin 325mg, admit stroke unit' },
                { name: 'Severe Asthma Attack', name_ar: 'نوبة ربو شديدة', icd: 'J46', symptoms: 'Severe dyspnea, unable to speak, SpO2<92%, accessory muscle use', treatment: 'O2, continuous Salbutamol neb, Ipratropium, Methylprednisolone 125mg IV' },
                { name: 'Pneumothorax', name_ar: 'استرواح الصدر', icd: 'J93.9', symptoms: 'Sudden pleuritic pain, dyspnea, decreased breath sounds', treatment: 'Needle decompression if tension, chest tube, CXR, O2, admit' },
                { name: 'Hypoglycemia', name_ar: 'انخفاض السكر', icd: 'E16.2', symptoms: 'Tremor, sweating, confusion, tachycardia, glucose <70', treatment: 'Conscious: 15g oral glucose. Unconscious: Dextrose 50% IV or Glucagon IM' }
            ],
            'Cardiology / القلب': [
                { name: 'Stable Angina', name_ar: 'ذبحة صدرية مستقرة', icd: 'I20.9', symptoms: 'Exertional chest pain, relieved by rest/nitroglycerin', treatment: 'Aspirin 81mg, Atenolol 50mg, Nitroglycerin SL PRN, stress test' },
                { name: 'Atrial Fibrillation', name_ar: 'رجفان أذيني', icd: 'I48.9', symptoms: 'Palpitations, irregular pulse, fatigue, dyspnea', treatment: 'Metoprolol 50mg BID, Rivaroxaban 20mg if CHA2DS2-VASc 2+, echo' },
                { name: 'Hypertensive Crisis', name_ar: 'نوبة ارتفاع ضغط حادة', icd: 'I16.0', symptoms: 'BP >180/120, headache, visual changes, chest pain', treatment: 'Nicardipine IV, lower BP 25% in first hour, ICU/CCU monitoring' },
                { name: 'Acute Coronary Syndrome - NSTEMI', name_ar: 'متلازمة شريانية حادة - احتشاء بدون ارتفاع ST', icd: 'I21.4', symptoms: 'Chest pain at rest, troponin elevated, ST depression/T-wave inversion, GRACE score', treatment: 'Aspirin 300mg + Clopidogrel 300mg, Enoxaparin, Atorvastatin 80mg, cardiology/cath within 72hrs' },
                { name: 'Acute MI - STEMI', name_ar: 'احتشاء حاد مع ارتفاع ST', icd: 'I21.9', symptoms: 'Severe crushing chest pain >20min, ST elevation ≥2 leads, troponin rising, diaphoresis', treatment: 'EMERGENCY: Aspirin+Clopidogrel+Heparin, primary PCI <90min or thrombolysis <30min, CCU admission' },
                { name: 'Heart Failure - Acute Decompensated', name_ar: 'فشل قلبي حاد', icd: 'I50.9', symptoms: 'Acute dyspnea, orthopnea, PND, bilateral crackles, elevated JVP, peripheral edema, BNP elevated', treatment: 'IV Furosemide 40-80mg, O2, Nitroglycerin if SBP>110, restrict fluids, ACEi, monitor UO, cardiology' },
                { name: 'Heart Failure - Chronic', name_ar: 'فشل قلبي مزمن', icd: 'I50.0', symptoms: 'Exertional dyspnea, fatigue, bilateral ankle edema, NYHA classification, reduced EF', treatment: 'ACEi/ARB, Bisoprolol, Spironolactone, Furosemide, SGLT2i (Dapagliflozin), fluid restriction, cardiac rehab' },
                { name: 'Atrial Fibrillation', name_ar: 'رجفان أذيني', icd: 'I48.9', symptoms: 'Irregular palpitations, dyspnea, dizziness, irregularly irregular pulse, absent P waves on ECG', treatment: 'Rate control: Bisoprolol/Diltiazem, CHA2DS2-VASc score, Rivaroxaban/Warfarin if ≥2, cardioversion if acute' },
                { name: 'Supraventricular Tachycardia', name_ar: 'تسارع فوق بطيني', icd: 'I47.1', symptoms: 'Sudden palpitations, regular tachycardia >150bpm, lightheadedness, narrow QRS, abrupt onset/offset', treatment: 'Vagal maneuvers first, Adenosine 6mg IV rapid push (12mg if no response), Verapamil, electrophysiology' },
                { name: 'Hypertensive Crisis', name_ar: 'أزمة ارتفاع ضغط الدم', icd: 'I16.1', symptoms: 'SBP>180 or DBP>120, headache, visual changes, chest pain, end-organ damage signs', treatment: 'IV Labetalol or Nicardipine if emergency, Amlodipine 10mg PO if urgency, gradual reduction, monitor q15min' },
                { name: 'Pericarditis - Acute', name_ar: 'التهاب التامور الحاد', icd: 'I30.9', symptoms: 'Sharp pleuritic chest pain worse supine/improved sitting forward, pericardial rub, diffuse ST elevation', treatment: 'Ibuprofen 600mg TID + Colchicine 0.5mg BD x3months, avoid exercise, Echo if effusion suspected' },
                { name: 'Valvular Heart Disease - Aortic Stenosis', name_ar: 'تضيق الصمام الأبهري', icd: 'I35.0', symptoms: 'Exertional dyspnea, angina, syncope, systolic ejection murmur radiating to carotids, narrow pulse pressure', treatment: 'Echo assessment, TAVR or surgical AVR if symptomatic/severe, avoid vasodilators, regular follow-up' }
            ],
            'Urology / المسالك البولية': [
                { name: 'Renal Colic', name_ar: 'مغص كلوي (حصوات)', icd: 'N20.0', symptoms: 'Severe colicky flank pain to groin, hematuria, nausea', treatment: 'Ketorolac 30mg IV, Tamsulosin 0.4mg, hydration, CT KUB, urology referral if >6mm' },
                { name: 'BPH', name_ar: 'تضخم البروستاتا', icd: 'N40.0', symptoms: 'Frequency, urgency, nocturia, weak stream, incomplete emptying', treatment: 'Tamsulosin 0.4mg HS, Finasteride 5mg, PSA, IPSS, urology F/U' },
                { name: 'Acute Pyelonephritis', name_ar: 'التهاب الكلى الحاد', icd: 'N10', symptoms: 'High fever, chills, flank pain, CVA tenderness, dysuria', treatment: 'Ciprofloxacin 500mg BID x14d, blood/urine cultures, hydration' },
                { name: 'Benign Prostatic Hyperplasia', name_ar: 'تضخم البروستات الحميد', icd: 'N40.0', symptoms: 'Frequency, urgency, weak stream, nocturia, incomplete emptying, IPSS score', treatment: 'Tamsulosin 0.4mg nocte, Finasteride 5mg if large, IPSS monitoring, TURP if severe, PSA screening' },
                { name: 'Prostatitis - Acute', name_ar: 'التهاب البروستات الحاد', icd: 'N41.0', symptoms: 'Fever, perineal pain, dysuria, frequency, tender boggy prostate on DRE, elevated WBC', treatment: 'Ciprofloxacin 500mg BD x4wks or TMP/SMX, Paracetamol, sitz baths, urine culture' },
                { name: 'Erectile Dysfunction', name_ar: 'ضعف الانتصاب', icd: 'N52.9', symptoms: 'Inability to achieve/maintain erection, associated with DM, HTN, smoking, medications', treatment: 'Sildenafil 50mg PRN (1hr before), lifestyle changes, testosterone if low, screen CVD, psychology' },
                { name: 'Testicular Torsion', name_ar: 'التواء الخصية', icd: 'N44.0', symptoms: 'EMERGENCY: Sudden severe testicular pain, nausea, high-riding testis, absent cremasteric reflex', treatment: 'EMERGENCY: Manual detorsion attempt, surgical exploration within 6hrs, US Doppler, urology stat' },
                { name: 'Hydrocele', name_ar: 'قيلة مائية', icd: 'N43.3', symptoms: 'Painless scrotal swelling, transilluminant, fluctuant, no tenderness usually', treatment: 'Observation if small/asymptomatic, surgical hydrocelectomy if large/symptomatic, US scrotum' },
                { name: 'Varicocele', name_ar: 'دوالي الخصية', icd: 'I86.1', symptoms: 'Scrotal heaviness/dull ache, "bag of worms" palpation, worse standing, may cause infertility', treatment: 'Observation if mild, surgical varicocelectomy if symptomatic/infertility, semen analysis' }
            ],
            'Psychiatry / الطب النفسي': [
                { name: 'Major Depressive Disorder', name_ar: 'اضطراب اكتئابي رئيسي', icd: 'F32.9', symptoms: 'Depressed mood >2w, anhedonia, sleep/appetite changes, hopelessness', treatment: 'Sertraline 50mg daily, CBT referral, safety assessment, F/U 2 weeks' },
                { name: 'Generalized Anxiety Disorder', name_ar: 'اضطراب القلق العام', icd: 'F41.1', symptoms: 'Excessive worry >6m, restlessness, muscle tension, insomnia', treatment: 'Escitalopram 10mg daily, CBT, relaxation, regular exercise' },
                { name: 'Insomnia', name_ar: 'اضطراب الأرق', icd: 'G47.0', symptoms: 'Difficulty initiating/maintaining sleep, daytime impairment', treatment: 'Sleep hygiene, CBT-I, Melatonin 3mg HS, Trazodone 50mg if persistent' },
                { name: 'Panic Disorder', name_ar: 'اضطراب الهلع', icd: 'F41.0', symptoms: 'Recurrent panic attacks: palpitations, sweating, trembling, SOB', treatment: 'Sertraline 25-100mg, Alprazolam 0.25mg PRN short-term, CBT' },
                { name: 'Major Depressive Disorder', name_ar: 'اكتئاب شديد', icd: 'F32.2', symptoms: 'Persistent low mood, anhedonia, sleep/appetite change, fatigue, worthlessness, suicidal ideation, PHQ-9>15', treatment: 'Sertraline 50mg or Escitalopram 10mg, CBT referral, safety plan, follow-up 2wks, PHQ-9 monitoring' },
                { name: 'Bipolar Disorder', name_ar: 'اضطراب ثنائي القطب', icd: 'F31.9', symptoms: 'Alternating mania (grandiosity, decreased sleep, pressured speech) and depression episodes', treatment: 'Lithium 300mg BD (monitor levels), Valproate, Quetiapine, mood charting, psychiatry referral' },
                { name: 'Panic Disorder', name_ar: 'اضطراب الهلع', icd: 'F41.0', symptoms: 'Recurrent unexpected panic attacks, palpitations, chest pain, SOB, dizziness, derealization, fear of dying', treatment: 'Sertraline 50mg, CBT with exposure, breathing retraining, Alprazolam 0.5mg PRN (short-term only)' },
                { name: 'PTSD', name_ar: 'اضطراب ما بعد الصدمة', icd: 'F43.1', symptoms: 'Flashbacks, nightmares, avoidance, hypervigilance, emotional numbing, after traumatic event', treatment: 'Trauma-focused CBT, EMDR, Sertraline 50-200mg, Prazosin for nightmares, psychology referral' },
                { name: 'ADHD', name_ar: 'اضطراب فرط الحركة وتشتت الانتباه', icd: 'F90.0', symptoms: 'Inattention, hyperactivity, impulsivity, onset before 12yo, symptoms in 2+ settings', treatment: 'Methylphenidate 10mg AM, behavioral strategies, school accommodation, parental training, monitor growth' },
                { name: 'Autism Spectrum Disorder', name_ar: 'اضطراب طيف التوحد', icd: 'F84.0', symptoms: 'Social communication deficits, restricted/repetitive behaviors, early onset, developmental delay', treatment: 'ABA therapy, speech therapy, OT, social skills training, special education, psychiatry if comorbid' },
                { name: 'Schizophrenia', name_ar: 'انفصام الشخصية', icd: 'F20.9', symptoms: 'Hallucinations, delusions, disorganized thinking/behavior, negative symptoms, onset 15-35yo', treatment: 'Risperidone 2mg daily or Olanzapine 10mg, CBT for psychosis, family psychoeducation, monitor metabolic' },
                { name: 'Eating Disorder - Anorexia', name_ar: 'فقدان الشهية العصبي', icd: 'F50.0', symptoms: 'BMI<17.5, fear of weight gain, body image distortion, amenorrhea, restrictive eating', treatment: 'Medical stabilization, nutritional rehabilitation, FBT (adolescents), CBT-E, psychiatry, monitor BMI/labs' }
            ],
            'OB/GYN / النساء والتوليد': [
                { name: 'Dysmenorrhea', name_ar: 'عسر الطمث', icd: 'N94.6', symptoms: 'Crampy lower abdominal pain with menses, backache, nausea', treatment: 'Ibuprofen 400mg TID before menses, heat pad, OCP if recurrent' },
                { name: 'Vaginal Candidiasis', name_ar: 'التهاب مهبلي فطري', icd: 'B37.3', symptoms: 'Vulvar itching, thick white discharge, erythema, dysuria', treatment: 'Fluconazole 150mg single dose PO, Clotrimazole vaginal cream x7d' },
                { name: 'PCOS', name_ar: 'تكيس المبايض', icd: 'E28.2', symptoms: 'Irregular menses, hirsutism, acne, obesity, infertility', treatment: 'Weight loss, Metformin 500mg BID, OCP for cycles, US pelvis' },
                { name: 'UTI in Pregnancy', name_ar: 'التهاب مسالك أثناء الحمل', icd: 'O23.1', symptoms: 'Dysuria, frequency, urgency in pregnant patient', treatment: 'Nitrofurantoin 100mg BID x7d (avoid 3rd trimester), urine culture' },
                { name: 'Normal Pregnancy (First Trimester)', name_ar: 'حمل طبيعي (الثلث الأول)', icd: 'Z34.0', symptoms: 'Amenorrhea, nausea, breast tenderness, fatigue, positive hCG', treatment: 'Folic acid 5mg daily, booking labs, dating US, avoid teratogens, next visit 4 weeks' },
                { name: 'Normal Pregnancy (Second Trimester)', name_ar: 'حمل طبيعي (الثلث الثاني)', icd: 'Z34.0', symptoms: 'Quickening, growing abdomen, decreased nausea', treatment: 'Iron+calcium supplements, anatomy scan 18-22w, GCT 24-28w, continue folic acid' },
                { name: 'Normal Pregnancy (Third Trimester)', name_ar: 'حمل طبيعي (الثلث الثالث)', icd: 'Z34.0', symptoms: 'Large abdomen, Braxton Hicks, backache, edema, fetal movement', treatment: 'Growth US, weekly NST from 36w, GBS screen 35-37w, birth plan, kick count' },
                { name: 'Hyperemesis Gravidarum', name_ar: 'القيء الحملي المفرط', icd: 'O21.0', symptoms: 'Severe persistent vomiting, weight loss >5%, dehydration, ketosis', treatment: 'IV fluids NS+KCl, Ondansetron 4mg IV, Thiamine 100mg, NPO then bland diet, admit if severe' },
                { name: 'Gestational Diabetes', name_ar: 'سكري الحمل', icd: 'O24.4', symptoms: 'Abnormal GCT/GTT, polyuria, polydipsia, macrosomia on US', treatment: 'Diet control, glucose monitoring QID, Insulin if FBS>95 or 2h PP>120, growth US Q4w' },
                { name: 'Preeclampsia (Mild)', name_ar: 'تسمم الحمل الخفيف', icd: 'O14.0', symptoms: 'BP >=140/90 after 20w, proteinuria, mild edema, no symptoms', treatment: 'BP monitoring BID, 24h urine protein, CBC/LFT/Cr weekly, Aspirin 150mg, NST 2x/week' },
                { name: 'Preeclampsia (Severe)', name_ar: 'تسمم الحمل الشديد', icd: 'O14.1', symptoms: 'BP >=160/110, proteinuria >5g/24h, headache, visual changes, epigastric pain, HELLP', treatment: 'MgSO4 loading+maintenance, Labetalol/Nifedipine, Dexamethasone if <34w, deliver if >=37w or worsening' },
                { name: 'Eclampsia', name_ar: 'الإرجاج (تشنجات الحمل)', icd: 'O15.0', symptoms: 'Seizures in preeclamptic patient, unresponsive, postictal', treatment: 'MgSO4 4g IV then 1g/hr, secure airway, O2, emergency delivery after stabilization' },
                { name: 'Placenta Previa', name_ar: 'المشيمة المنزاحة', icd: 'O44.1', symptoms: 'Painless vaginal bleeding 2nd/3rd trimester, low-lying placenta on US', treatment: 'Bedrest, avoid intercourse, steroids if <34w, type & screen, planned C/S at 37-38w' },
                { name: 'Placental Abruption', name_ar: 'انفصال المشيمة المبكر', icd: 'O45.9', symptoms: 'Painful vaginal bleeding, rigid abdomen, fetal distress, hypovolemia', treatment: 'Large bore IV, blood crossmatch, continuous CTG, emergency C/S if severe, manage DIC' },
                { name: 'Ectopic Pregnancy', name_ar: 'حمل خارج الرحم', icd: 'O00.9', symptoms: 'Amenorrhea, unilateral pelvic pain, vaginal bleeding, positive hCG, empty uterus on US', treatment: 'If stable: Methotrexate 50mg/m2 IM. If unstable: emergency laparoscopy, blood crossmatch' },
                { name: 'Threatened Abortion', name_ar: 'إجهاض منذر', icd: 'O20.0', symptoms: 'Vaginal bleeding <20w, closed cervix, viable fetus on US, mild cramps', treatment: 'Bedrest, Progesterone 400mg PV, avoid intercourse, repeat US in 1 week, Rh immunoglobulin if Rh-neg' },
                { name: 'Missed Abortion', name_ar: 'إجهاض فائت', icd: 'O02.1', symptoms: 'No fetal heartbeat on US, uterus smaller than dates, brown discharge', treatment: 'Options: expectant, Misoprostol 800mcg PV, or surgical evacuation (D&C), Rh immunoglobulin' },
                { name: 'Incomplete Abortion', name_ar: 'إجهاض ناقص', icd: 'O03.4', symptoms: 'Heavy bleeding, open cervix, retained products on US, cramping', treatment: 'Surgical evacuation (MVA/D&C), Oxytocin 20IU in NS, antibiotics if infected, CBC' },
                { name: 'Preterm Labor', name_ar: 'ولادة مبكرة', icd: 'O60.0', symptoms: 'Regular contractions <37w, cervical dilation/effacement, PPROM possible', treatment: 'Tocolysis (Nifedipine 20mg Q20min x3), Betamethasone 12mg IM x2 (24h apart), MgSO4 neuroprotection if <32w, antibiotics' },
                { name: 'PROM (Term)', name_ar: 'تمزق الأغشية المبكر', icd: 'O42.0', symptoms: 'Gush of fluid, positive pooling/ferning/Nitrazine, no contractions', treatment: 'GBS prophylaxis, induction with Oxytocin within 12-24h, continuous CTG, antibiotics if GBS+' },
                { name: 'PPROM (Preterm)', name_ar: 'تمزق الأغشية المبكر قبل الأوان', icd: 'O42.1', symptoms: 'Preterm fluid leak <37w, positive pooling, oligohydramnios on US', treatment: 'Latency antibiotics (Ampicillin+Azithromycin), steroids, no tocolysis, monitor for chorioamnionitis' },
                { name: 'IUGR / FGR', name_ar: 'تأخر نمو الجنين', icd: 'O36.5', symptoms: 'EFW <10th percentile, reduced AC, oligohydramnios, abnormal Dopplers', treatment: 'Serial growth US Q2w, umbilical artery Doppler, twice weekly NST, deliver 37-38w or earlier if abnormal' },
                { name: 'Postpartum Hemorrhage', name_ar: 'نزيف ما بعد الولادة', icd: 'O72.1', symptoms: 'Blood loss >500ml (NVD) or >1000ml (CS), tachycardia, hypotension, boggy uterus', treatment: 'Uterine massage, Oxytocin 40IU IV, Misoprostol 1000mcg PR, Tranexamic acid 1g IV, balloon tamponade' },
                { name: 'Puerperal Sepsis', name_ar: 'إنتان النفاس', icd: 'O85', symptoms: 'Fever >38°C postpartum, uterine tenderness, foul lochia, tachycardia', treatment: 'IV Ampicillin+Gentamicin+Metronidazole, blood cultures, fluid resuscitation, remove retained products' },
                { name: 'Mastitis', name_ar: 'التهاب الثدي', icd: 'O91.1', symptoms: 'Breast pain, redness, fever, flu-like symptoms, breastfeeding difficulties', treatment: 'Continue breastfeeding, Dicloxacillin 500mg QID x10d, warm compresses, I&D if abscess' },
                { name: 'Uterine Fibroids', name_ar: 'أورام ليفية رحمية', icd: 'D25.9', symptoms: 'Heavy menstrual bleeding, pelvic pressure, urinary frequency, enlarged uterus', treatment: 'NSAIDs for pain, OCP/Mirena IUD, GnRH agonist, myomectomy or hysterectomy if severe' },
                { name: 'Endometriosis', name_ar: 'بطانة الرحم المهاجرة', icd: 'N80.9', symptoms: 'Chronic pelvic pain, dysmenorrhea, dyspareunia, infertility, cyclical symptoms', treatment: 'NSAIDs, combined OCP continuous, GnRH agonist, laparoscopic excision, fertility treatment' },
                { name: 'Ovarian Cyst', name_ar: 'كيس المبيض', icd: 'N83.2', symptoms: 'Unilateral pelvic pain, fullness, irregular menses, US findings', treatment: 'If <5cm: follow-up US in 6-8 weeks. If >5cm or complex: tumor markers (CA-125), laparoscopy' },
                { name: 'PID (Pelvic Inflammatory Disease)', name_ar: 'التهاب الحوض', icd: 'N73.0', symptoms: 'Lower abdominal pain, fever, vaginal discharge, cervical motion tenderness', treatment: 'Ceftriaxone 250mg IM + Doxycycline 100mg BID x14d + Metronidazole 500mg BID x14d' },
                { name: 'Bacterial Vaginosis', name_ar: 'التهاب مهبلي بكتيري', icd: 'N76.0', symptoms: 'Thin grayish discharge, fishy odor, positive whiff test, clue cells', treatment: 'Metronidazole 500mg BID x7d or Metronidazole gel PV x5d' },
                { name: 'Menorrhagia', name_ar: 'غزارة الطمث', icd: 'N92.0', symptoms: 'Heavy menstrual bleeding >80ml/cycle, clots, anemia', treatment: 'Tranexamic acid 1g TID during menses, Mirena IUD, combined OCP, investigate cause (US, biopsy)' },
                { name: 'Amenorrhea', name_ar: 'انقطاع الطمث', icd: 'N91.2', symptoms: 'Absence of menses >3 months, rule out pregnancy, evaluate hormones', treatment: 'Check: pregnancy test, TSH, Prolactin, FSH/LH, US pelvis, Progesterone challenge test' },
                { name: 'Menopause', name_ar: 'سن اليأس', icd: 'N95.1', symptoms: 'Hot flashes, night sweats, vaginal dryness, mood changes, irregular menses >12m', treatment: 'HRT (if indicated), vaginal estrogen for atrophy, calcium+Vit D, DEXA scan, lifestyle modification' },
                { name: 'Cervical Dysplasia (CIN)', name_ar: 'خلل التنسج العنقي', icd: 'N87.9', symptoms: 'Abnormal Pap smear, HPV positive, usually asymptomatic', treatment: 'Colposcopy + biopsy, CIN1: follow-up, CIN2-3: LEEP/cone biopsy, HPV vaccination' },
                { name: 'Breast Lump Evaluation', name_ar: 'تقييم كتلة بالثدي', icd: 'N63', symptoms: 'Palpable breast mass, +/- pain, nipple discharge', treatment: 'Triple assessment: clinical exam + US/mammogram + FNA/core biopsy, refer if suspicious' }
            ],
            'Neurology / الأعصاب': [
                { name: 'Migraine without Aura', name_ar: 'صداع نصفي بدون هالة', icd: 'G43.0', symptoms: 'Unilateral throbbing headache, nausea, photophobia, phonophobia, 4-72hrs', treatment: 'Sumatriptan 50mg PRN, Paracetamol 1g, dark room, prophylaxis: Propranolol 40mg BD' },
                { name: 'Migraine with Aura', name_ar: 'صداع نصفي مع هالة', icd: 'G43.1', symptoms: 'Visual aura (zigzag lines, scotoma) 20-60min before headache, unilateral', treatment: 'Sumatriptan 50mg at aura onset, avoid triggers, prophylaxis: Topiramate 25mg' },
                { name: 'Tension-Type Headache', name_ar: 'صداع التوتر', icd: 'G44.2', symptoms: 'Bilateral pressing/tightening, mild-moderate, no nausea/vomiting', treatment: 'Paracetamol 1g or Ibuprofen 400mg, stress management, physiotherapy' },
                { name: 'Cluster Headache', name_ar: 'صداع عنقودي', icd: 'G44.0', symptoms: 'Severe unilateral orbital/temporal pain, lacrimation, rhinorrhea, 15-180min, clusters', treatment: 'O2 100% 12L/min via mask, Sumatriptan 6mg SC, Verapamil prophylaxis' },
                { name: 'Epilepsy - Generalized Tonic-Clonic', name_ar: 'صرع توتري رمعي معمم', icd: 'G40.3', symptoms: 'Loss of consciousness, tonic stiffening, clonic jerking, postictal confusion', treatment: 'Valproate 500mg BD or Levetiracetam 500mg BD, seizure precautions, EEG' },
                { name: 'Epilepsy - Absence Seizures', name_ar: 'صرع غيابي', icd: 'G40.0', symptoms: 'Brief staring episodes, eyelid fluttering, unresponsive 10-30sec, mainly children', treatment: 'Ethosuximide 250mg BD or Valproate, EEG with hyperventilation' },
                { name: 'Stroke - Ischemic', name_ar: 'سكتة دماغية إقفارية', icd: 'I63.9', symptoms: 'Sudden hemiparesis, facial droop, speech difficulty, FAST positive', treatment: 'EMERGENCY: tPA if <4.5hrs, Aspirin 300mg, CT head stat, admission, Neurology' },
                { name: 'Stroke - Hemorrhagic', name_ar: 'سكتة دماغية نزفية', icd: 'I61.9', symptoms: 'Sudden severe headache, vomiting, rapidly deteriorating consciousness, hypertension', treatment: 'EMERGENCY: CT stat, BP control, reverse anticoagulants, Neurosurgery consult' },
                { name: 'TIA - Transient Ischemic Attack', name_ar: 'نوبة إقفارية عابرة', icd: 'G45.9', symptoms: 'Transient neurological deficit <24hrs, hemiparesis, speech, vision, fully resolves', treatment: 'Aspirin 300mg, Clopidogrel 75mg, CT/MRI, carotid duplex, ABCD2 score' },
                { name: 'Bell Palsy', name_ar: 'شلل بل (شلل العصب الوجهي)', icd: 'G51.0', symptoms: 'Acute unilateral facial weakness, inability to close eye, drooling, taste loss', treatment: 'Prednisolone 50mg x 10 days, eye protection, artificial tears, Acyclovir if HSV' },
                { name: 'Carpal Tunnel Syndrome', name_ar: 'متلازمة النفق الرسغي', icd: 'G56.0', symptoms: 'Numbness/tingling in thumb, index, middle fingers, worse at night, Tinel/Phalen positive', treatment: 'Wrist splint at night, NSAIDs, steroid injection, NCS/EMG, surgery if severe' },
                { name: 'Parkinson Disease', name_ar: 'مرض باركنسون', icd: 'G20', symptoms: 'Resting tremor, bradykinesia, rigidity, postural instability, masked facies', treatment: 'Levodopa/Carbidopa 100/25 TID, Pramipexole, physiotherapy, OT referral' },
                { name: 'Multiple Sclerosis', name_ar: 'التصلب اللويحي المتعدد', icd: 'G35', symptoms: 'Optic neuritis, limb weakness, sensory changes, fatigue, Lhermitte sign, relapsing-remitting', treatment: 'IV Methylprednisolone for relapse, DMT: Interferon beta/Fingolimod, MRI monitoring' },
                { name: 'Trigeminal Neuralgia', name_ar: 'ألم العصب الثلاثي التوائم', icd: 'G50.0', symptoms: 'Electric shock-like facial pain, V2/V3 distribution, triggered by touch/eating/wind', treatment: 'Carbamazepine 100mg BD titrate up, Gabapentin, MRI brain, surgical options' },
                { name: 'Sciatica', name_ar: 'عرق النسا', icd: 'M54.3', symptoms: 'Radiating pain from lower back to leg, positive SLR, dermatomal distribution, weakness', treatment: 'NSAIDs, Pregabalin 75mg BD, physiotherapy, MRI if red flags, epidural injection' },
                { name: 'Meningitis - Bacterial', name_ar: 'التهاب السحايا الجرثومي', icd: 'G00.9', symptoms: 'Fever, severe headache, neck stiffness, photophobia, rash (Meningococcal), Kernig/Brudzinski', treatment: 'EMERGENCY: Ceftriaxone 2g IV stat, Dexamethasone, LP, blood cultures, admission ICU' },
                { name: 'Vertigo - BPPV', name_ar: 'دوار وضعي انتيابي حميد', icd: 'H81.1', symptoms: 'Brief spinning with head position change, positive Dix-Hallpike, nystagmus, no hearing loss', treatment: 'Epley maneuver, Brandt-Daroff exercises, Betahistine 16mg TID, avoid triggers' },
                { name: 'Myasthenia Gravis', name_ar: 'الوهن العضلي الوبيل', icd: 'G70.0', symptoms: 'Fluctuating weakness, ptosis, diplopia, dysphagia, worse with exertion, improves with rest', treatment: 'Pyridostigmine 60mg TID, Prednisolone, Azathioprine, CT chest (thymoma), crisis plan' }
            ],
            'Pulmonology / الصدرية': [
                { name: 'Asthma - Mild Intermittent', name_ar: 'ربو متقطع خفيف', icd: 'J45.0', symptoms: 'Wheeze <2x/week, night symptoms <2x/month, normal FEV1, no activity limitation', treatment: 'SABA PRN (Salbutamol 2 puffs), no controller needed, peak flow monitoring' },
                { name: 'Asthma - Moderate Persistent', name_ar: 'ربو مستمر متوسط', icd: 'J45.1', symptoms: 'Daily symptoms, night symptoms >1x/week, FEV1 60-80%, some activity limitation', treatment: 'ICS/LABA (Seretide 250/50 BD), SABA PRN, spacer device, action plan' },
                { name: 'Asthma - Acute Exacerbation', name_ar: 'نوبة ربو حادة', icd: 'J46', symptoms: 'Severe dyspnea, wheeze, unable to complete sentences, tachycardia, low O2 sat', treatment: 'Salbutamol nebulizer 5mg q20min x3, Ipratropium, Prednisolone 40mg, O2, admit if severe' },
                { name: 'COPD', name_ar: 'مرض الانسداد الرئوي المزمن', icd: 'J44.1', symptoms: 'Chronic cough, sputum, dyspnea on exertion, smoking history, barrel chest, decreased air entry', treatment: 'Tiotropium 18mcg daily, ICS/LABA, Salbutamol PRN, smoking cessation, pulmonary rehab' },
                { name: 'COPD Acute Exacerbation', name_ar: 'تفاقم حاد للانسداد الرئوي', icd: 'J44.0', symptoms: 'Increased dyspnea, increased sputum volume/purulence, wheeze, hypoxia', treatment: 'Nebulized bronchodilators, Prednisolone 40mg x5d, Antibiotics (Amoxicillin-Clav), O2 target 88-92%' },
                { name: 'Pneumonia - Community Acquired', name_ar: 'التهاب رئوي مكتسب من المجتمع', icd: 'J18.9', symptoms: 'Fever, productive cough, dyspnea, pleuritic pain, crackles, consolidation on CXR', treatment: 'Amoxicillin 1g TID + Azithromycin 500mg daily, or Levofloxacin 750mg daily, CXR, CBC' },
                { name: 'Pneumonia - Hospital Acquired', name_ar: 'التهاب رئوي مكتسب من المستشفى', icd: 'J18.1', symptoms: 'New fever/infiltrate >48hrs after admission, purulent sputum, hypoxia', treatment: 'Piperacillin-Tazobactam + Vancomycin, cultures before antibiotics, CXR, procalcitonin' },
                { name: 'Pulmonary Embolism', name_ar: 'انسداد رئوي (جلطة رئوية)', icd: 'I26.9', symptoms: 'Sudden dyspnea, pleuritic chest pain, tachycardia, hemoptysis, DVT risk factors, Wells score', treatment: 'EMERGENCY: CTPA, Heparin/Enoxaparin, Warfarin/DOAC, thrombolysis if massive, O2' },
                { name: 'Pleural Effusion', name_ar: 'انصباب جنبي', icd: 'J90', symptoms: 'Dyspnea, decreased breath sounds, dullness to percussion, CXR: meniscus sign', treatment: 'Diagnostic thoracentesis, treat underlying cause, therapeutic drainage if large, CT chest' },
                { name: 'Pneumothorax', name_ar: 'استرواح صدري', icd: 'J93.9', symptoms: 'Sudden pleuritic pain, dyspnea, decreased breath sounds, hyperresonant, tracheal deviation if tension', treatment: 'Small: observation + O2, Large: chest tube, Tension: needle decompression + chest tube stat' },
                { name: 'Tuberculosis - Pulmonary', name_ar: 'سل رئوي', icd: 'A15.0', symptoms: 'Chronic cough >2wks, hemoptysis, night sweats, weight loss, upper lobe infiltrates', treatment: 'RIPE: Rifampin+Isoniazid+Pyrazinamide+Ethambutol x2m then RI x4m, sputum AFB, isolation' },
                { name: 'Sleep Apnea - Obstructive', name_ar: 'انقطاع النفس الانسدادي أثناء النوم', icd: 'G47.33', symptoms: 'Snoring, witnessed apneas, daytime somnolence, morning headache, BMI>30, Epworth >10', treatment: 'CPAP therapy, weight loss, sleep hygiene, polysomnography, ENT evaluation' },
                { name: 'Bronchitis - Acute', name_ar: 'التهاب شعب هوائية حاد', icd: 'J20.9', symptoms: 'Cough with/without sputum, chest discomfort, low fever, no consolidation on CXR', treatment: 'Supportive: fluids, rest, honey, Dextromethorphan PRN, Albuterol if wheezing, NO antibiotics if viral' }
            ],
            'Gastroenterology / الجهاز الهضمي': [
                { name: 'GERD', name_ar: 'ارتجاع المريء', icd: 'K21.0', symptoms: 'Heartburn, acid regurgitation, worse postprandial/supine, dysphagia, chronic cough', treatment: 'Omeprazole 20mg before breakfast x8wks, lifestyle: elevate HOB, avoid triggers, weight loss' },
                { name: 'Peptic Ulcer - Gastric', name_ar: 'قرحة معدية', icd: 'K25.9', symptoms: 'Epigastric pain worse with meals, nausea, bloating, weight loss, NSAID/H.pylori history', treatment: 'Omeprazole 40mg BD x4wks, H.pylori triple therapy if positive, stop NSAIDs, endoscopy' },
                { name: 'Peptic Ulcer - Duodenal', name_ar: 'قرحة اثني عشرية', icd: 'K26.9', symptoms: 'Epigastric pain relieved by meals/antacids, nocturnal pain, H.pylori common', treatment: 'Omeprazole 20mg BD + Amoxicillin 1g BD + Clarithromycin 500mg BD x14d, then PPI x4wks' },
                { name: 'Acute Gastroenteritis', name_ar: 'التهاب معدي معوي حاد', icd: 'K52.9', symptoms: 'Diarrhea, vomiting, abdominal cramps, fever, dehydration', treatment: 'ORS, IV fluids if dehydrated, Ondansetron 4mg for vomiting, BRAT diet, stool culture if bloody' },
                { name: 'Irritable Bowel Syndrome', name_ar: 'القولون العصبي', icd: 'K58.9', symptoms: 'Recurrent abdominal pain, bloating, altered bowel habit (constipation/diarrhea), relief with defecation', treatment: 'Mebeverine 135mg TID, fiber supplement, low FODMAP diet, CBT, Amitriptyline 10mg nocte' },
                { name: 'Inflammatory Bowel Disease - Crohn', name_ar: 'داء كرون', icd: 'K50.9', symptoms: 'Chronic diarrhea, abdominal pain, weight loss, perianal disease, fistulae, skip lesions', treatment: 'Mesalazine, Prednisolone for flares, Azathioprine, Infliximab, colonoscopy, GI referral' },
                { name: 'Inflammatory Bowel Disease - UC', name_ar: 'التهاب القولون التقرحي', icd: 'K51.9', symptoms: 'Bloody diarrhea, urgency, tenesmus, LLQ pain, continuous from rectum, toxic megacolon risk', treatment: 'Mesalazine 2.4g daily, Prednisolone for flares, Azathioprine, colonoscopy, GI referral' },
                { name: 'Cholelithiasis / Biliary Colic', name_ar: 'حصوات المرارة / مغص مراري', icd: 'K80.2', symptoms: 'RUQ colicky pain after fatty meals, nausea, vomiting, Murphy sign, US gallstones', treatment: 'NSAIDs (Diclofenac 75mg IM), Hyoscine, elective cholecystectomy, US abdomen' },
                { name: 'Acute Cholecystitis', name_ar: 'التهاب مرارة حاد', icd: 'K81.0', symptoms: 'RUQ pain >6hrs, fever, positive Murphy, elevated WBC, US: wall thickening/pericholecystic fluid', treatment: 'NPO, IV fluids, Ceftriaxone + Metronidazole, Piperacillin-Tazobactam, urgent cholecystectomy' },
                { name: 'Acute Pancreatitis', name_ar: 'التهاب بنكرياس حاد', icd: 'K85.9', symptoms: 'Severe epigastric pain radiating to back, vomiting, elevated amylase/lipase >3x, Ranson criteria', treatment: 'NPO, aggressive IV fluids, pain control (Morphine), monitor organ failure, CT if no improvement 72hrs' },
                { name: 'Hemorrhoids', name_ar: 'بواسير', icd: 'K64.9', symptoms: 'Rectal bleeding, anal itching/pain, prolapsing mass, constipation history', treatment: 'Fiber 25g/day, sitz baths, Daflon 1g BD x2wks, topical Proctosedyl, rubber band ligation if grade 2-3' },
                { name: 'Hepatitis B - Chronic', name_ar: 'التهاب كبد بائي مزمن', icd: 'B18.1', symptoms: 'Often asymptomatic, fatigue, RUQ discomfort, HBsAg+, elevated ALT, fibrosis', treatment: 'Tenofovir 300mg daily or Entecavir 0.5mg daily, monitor HBV DNA, fibroscan, HCC screening' },
                { name: 'Hepatitis C - Chronic', name_ar: 'التهاب كبد جيمي مزمن', icd: 'B18.2', symptoms: 'Often asymptomatic, fatigue, elevated ALT, HCV Ab+, HCV RNA detectable', treatment: 'Sofosbuvir/Ledipasvir (Harvoni) 1 tab daily x12wks, SVR12 check, genotype, fibroscan' },
                { name: 'Liver Cirrhosis', name_ar: 'تليف الكبد', icd: 'K74.6', symptoms: 'Jaundice, ascites, spider angiomas, palmar erythema, hepatomegaly, varices, INR elevated', treatment: 'Treat cause, Spironolactone 100mg for ascites, Propranolol for varices, HCC screening q6m, transplant eval' },
                { name: 'Celiac Disease', name_ar: 'مرض حساسية القمح (السيلياك)', icd: 'K90.0', symptoms: 'Chronic diarrhea, bloating, malabsorption, iron deficiency, dermatitis herpetiformis, failure to thrive in children', treatment: 'Strict gluten-free diet lifelong, nutritional supplementation, anti-tTG monitoring, dietitian referral' }
            ],
            'Nephrology / الكلى': [
                { name: 'Acute Kidney Injury', name_ar: 'إصابة كلوية حادة', icd: 'N17.9', symptoms: 'Oliguria, elevated creatinine, fluid overload, hyperkalemia, metabolic acidosis', treatment: 'IV fluids (if prerenal), stop nephrotoxins, K+ management, monitor UO, dialysis if severe' },
                { name: 'Chronic Kidney Disease', name_ar: 'فشل كلوي مزمن', icd: 'N18.9', symptoms: 'Fatigue, nausea, edema, hypertension, anemia, elevated creatinine/BUN, proteinuria', treatment: 'ACEi/ARB, BP control <130/80, DM control, low protein diet, EPO if anemic, dialysis planning' },
                { name: 'Urinary Tract Infection - Lower', name_ar: 'التهاب مسالك بولية سفلي', icd: 'N39.0', symptoms: 'Dysuria, frequency, urgency, suprapubic pain, cloudy/malodorous urine, positive dip', treatment: 'Nitrofurantoin 100mg BD x5d or TMP/SMX DS BD x3d, fluids, urine culture' },
                { name: 'Pyelonephritis', name_ar: 'التهاب الحويضة والكلية', icd: 'N10', symptoms: 'Fever, flank pain, CVA tenderness, nausea/vomiting, UTI symptoms, elevated WBC', treatment: 'Ciprofloxacin 500mg BD x7d or Ceftriaxone 1g IV, urine/blood cultures, US renal, IV fluids' },
                { name: 'Nephrolithiasis (Renal Stone)', name_ar: 'حصوات الكلى', icd: 'N20.0', symptoms: 'Severe colicky flank pain radiating to groin, hematuria, nausea/vomiting, restless', treatment: 'Diclofenac 75mg IM, Tamsulosin 0.4mg daily (MET), CT KUB, strain urine, urology if >10mm' },
                { name: 'Nephrotic Syndrome', name_ar: 'المتلازمة الكلوية', icd: 'N04.9', symptoms: 'Periorbital/peripheral edema, massive proteinuria >3.5g/day, hypoalbuminemia, hyperlipidemia', treatment: 'Prednisolone 1mg/kg, Furosemide, ACEi, low salt diet, anticoagulation, renal biopsy' },
                { name: 'Diabetic Nephropathy', name_ar: 'اعتلال الكلى السكري', icd: 'E11.22', symptoms: 'Microalbuminuria progressing to proteinuria, declining GFR, hypertension, DM history', treatment: 'ACEi/ARB, HbA1c <7%, BP <130/80, SGLT2 inhibitor, low protein diet, monitor GFR/UACR' }
            ],
            'Endocrinology / الغدد الصماء': [
                { name: 'Type 2 Diabetes Mellitus', name_ar: 'سكري النوع الثاني', icd: 'E11.9', symptoms: 'Polyuria, polydipsia, fatigue, blurred vision, HbA1c >6.5%, FBG >126', treatment: 'Metformin 500mg BD titrate, SGLT2i (Empagliflozin), lifestyle, HbA1c q3m, foot/eye screening' },
                { name: 'Type 1 Diabetes Mellitus', name_ar: 'سكري النوع الأول', icd: 'E10.9', symptoms: 'Young onset, polyuria, polydipsia, weight loss, DKA, positive GAD/IA2 antibodies', treatment: 'Basal-bolus insulin (Lantus + NovoRapid), CGMS, carb counting, DKA education, HbA1c <7%' },
                { name: 'Diabetic Ketoacidosis', name_ar: 'حماض كيتوني سكري', icd: 'E10.10', symptoms: 'Hyperglycemia >250, metabolic acidosis pH<7.3, ketonuria/ketonemia, Kussmaul breathing, dehydration', treatment: 'EMERGENCY: IV NS 1L/hr, Insulin infusion 0.1U/kg/hr, K+ replacement, monitor q1h, ICU admission' },
                { name: 'Hypothyroidism', name_ar: 'قصور الغدة الدرقية', icd: 'E03.9', symptoms: 'Fatigue, weight gain, cold intolerance, constipation, dry skin, bradycardia, elevated TSH', treatment: 'Levothyroxine 50-100mcg AM empty stomach, TSH check q6-8wks, titrate dose' },
                { name: 'Hyperthyroidism - Graves', name_ar: 'فرط نشاط الدرقية (قريفز)', icd: 'E05.0', symptoms: 'Weight loss, tremor, heat intolerance, palpitations, exophthalmos, goiter, low TSH, high T3/T4', treatment: 'Carbimazole 20mg daily, Propranolol 40mg TID, TFTs q4-6wks, consider RAI or surgery' },
                { name: 'Thyroid Nodule', name_ar: 'عقدة درقية', icd: 'E04.1', symptoms: 'Palpable neck mass, usually asymptomatic, compression symptoms if large, TFTs usually normal', treatment: 'US thyroid, FNA if >1cm or suspicious, TFTs, monitor if benign, surgery if suspicious/large' },
                { name: 'Cushing Syndrome', name_ar: 'متلازمة كوشنق', icd: 'E24.9', symptoms: 'Central obesity, moon face, buffalo hump, striae, hypertension, DM, proximal myopathy', treatment: '24hr cortisol, dexamethasone suppression test, MRI pituitary, CT adrenals, surgical excision' },
                { name: 'Addison Disease', name_ar: 'قصور الغدة الكظرية (أديسون)', icd: 'E27.1', symptoms: 'Fatigue, weight loss, hyperpigmentation, hypotension, hyponatremia, hyperkalemia', treatment: 'Hydrocortisone 15-20mg AM + 5-10mg PM, Fludrocortisone 0.1mg, sick day rules, MedicAlert' },
                { name: 'Hyperprolactinemia', name_ar: 'ارتفاع هرمون الحليب', icd: 'E22.1', symptoms: 'Galactorrhea, amenorrhea, infertility, decreased libido, visual field defects if macroadenoma', treatment: 'Cabergoline 0.25mg twice weekly, MRI pituitary, visual fields, prolactin level monitoring' },
                { name: 'PCOS', name_ar: 'متلازمة تكيس المبايض', icd: 'E28.2', symptoms: 'Oligomenorrhea, hirsutism, acne, obesity, infertility, US: polycystic ovaries, elevated testosterone', treatment: 'OCP (Diane 35), Metformin 500mg BD, weight loss, Spironolactone for hirsutism, Clomiphene for fertility' },
                { name: 'Osteoporosis', name_ar: 'هشاشة العظام', icd: 'M81.0', symptoms: 'Often asymptomatic until fracture, height loss, kyphosis, DEXA T-score ≤-2.5, fragility fractures', treatment: 'Alendronate 70mg weekly, Ca 1200mg + Vit D 800IU daily, weight-bearing exercise, fall prevention' }
            ],
            'Hematology / أمراض الدم': [
                { name: 'Iron Deficiency Anemia', name_ar: 'فقر دم نقص الحديد', icd: 'D50.9', symptoms: 'Fatigue, pallor, dyspnea, pica, koilonychia, low MCV/MCH, low ferritin, low iron', treatment: 'Ferrous sulfate 200mg TID with Vit C, investigate cause (GI bleed, menorrhagia), CBC follow-up' },
                { name: 'B12 Deficiency Anemia', name_ar: 'فقر دم نقص فيتامين ب12', icd: 'D51.9', symptoms: 'Fatigue, glossitis, neurological symptoms (numbness, ataxia), macrocytic anemia, low B12', treatment: 'Hydroxocobalamin 1mg IM alternate days x2wks then q2-3 months, B12 level monitoring' },
                { name: 'Sickle Cell Disease', name_ar: 'مرض الخلايا المنجلية', icd: 'D57.1', symptoms: 'Painful crises, acute chest syndrome, splenomegaly (children), jaundice, chronic hemolysis', treatment: 'Hydroxyurea 15mg/kg, folic acid, pain management, transfusion for ACS, pneumococcal vaccine' },
                { name: 'Thalassemia - Beta Major', name_ar: 'ثلاسيميا كبرى', icd: 'D56.1', symptoms: 'Severe anemia from 6 months, hepatosplenomegaly, bone deformities, transfusion dependent', treatment: 'Regular transfusions q3-4wks, Deferasirox chelation, folic acid, splenectomy if hypersplenism, BMT' },
                { name: 'Thrombocytopenia - ITP', name_ar: 'نقص صفائح مناعي', icd: 'D69.3', symptoms: 'Petechiae, purpura, epistaxis, gum bleeding, platelets <100K, no splenomegaly', treatment: 'Observation if mild, Prednisolone 1mg/kg if <30K or bleeding, IVIG, Eltrombopag, splenectomy' },
                { name: 'Deep Vein Thrombosis', name_ar: 'جلطة وريدية عميقة', icd: 'I82.4', symptoms: 'Unilateral leg swelling, pain, warmth, erythema, positive Wells score, US Doppler positive', treatment: 'Enoxaparin 1mg/kg SC BD, Warfarin/Rivaroxaban, compression stockings, 3-6 months anticoagulation' },
                { name: 'G6PD Deficiency', name_ar: 'نقص إنزيم G6PD', icd: 'D55.0', symptoms: 'Episodic hemolysis triggered by fava beans/drugs, jaundice, dark urine, anemia, reticulocytosis', treatment: 'Avoid triggers (fava, sulfonamides, dapsone), transfusion if severe, list of prohibited drugs' },
                { name: 'Leukemia - ALL (Acute)', name_ar: 'ابيضاض الدم الليمفاوي الحاد', icd: 'C91.0', symptoms: 'Fatigue, fever, bleeding, bone pain, lymphadenopathy, hepatosplenomegaly, pancytopenia', treatment: 'Urgent: Hematology referral, bone marrow biopsy, chemotherapy protocol, supportive care, transplant eval' }
            ],
            'Rheumatology / الروماتيزم': [
                { name: 'Rheumatoid Arthritis', name_ar: 'التهاب المفاصل الروماتيزمي', icd: 'M05.9', symptoms: 'Symmetric polyarthritis, morning stiffness >1hr, MCP/PIP swelling, RF/Anti-CCP positive', treatment: 'Methotrexate 7.5-25mg weekly + Folic acid, Prednisolone bridge, Hydroxychloroquine, biologics' },
                { name: 'Systemic Lupus Erythematosus', name_ar: 'الذئبة الحمراء', icd: 'M32.9', symptoms: 'Malar rash, joint pain, photosensitivity, oral ulcers, serositis, nephritis, ANA positive', treatment: 'Hydroxychloroquine 200mg BD, Prednisolone for flares, Mycophenolate for nephritis, sun protection' },
                { name: 'Gout - Acute', name_ar: 'نقرس حاد', icd: 'M10.9', symptoms: 'Acute monoarthritis (1st MTP), severe pain, redness, swelling, elevated uric acid, tophi', treatment: 'Colchicine 0.5mg BD or Indomethacin 50mg TID, NOT allopurinol during acute, rest, ice' },
                { name: 'Gout - Chronic/Prophylaxis', name_ar: 'نقرس مزمن / وقائي', icd: 'M10.0', symptoms: 'Recurrent gout attacks, tophi, elevated uric acid, renal stones', treatment: 'Allopurinol 100mg daily titrate to target urate <6, Colchicine 0.5mg daily prophylaxis x6m, diet' },
                { name: 'Osteoarthritis', name_ar: 'خشونة المفاصل', icd: 'M15.9', symptoms: 'Joint pain worse with activity, morning stiffness <30min, crepitus, bony enlargement, Heberden nodes', treatment: 'Paracetamol 1g QID, Topical Diclofenac, physiotherapy, weight loss, IA steroid injection, joint replacement' },
                { name: 'Ankylosing Spondylitis', name_ar: 'التهاب الفقار المقسط', icd: 'M45.9', symptoms: 'Low back pain/stiffness worse AM and improving with exercise, <40yo onset, HLA-B27, sacroiliitis', treatment: 'NSAIDs (Indomethacin), physiotherapy, Anti-TNF (Adalimumab) if inadequate response, MRI sacroiliac' },
                { name: 'Fibromyalgia', name_ar: 'الفيبروميالجيا (ألم عضلي ليفي)', icd: 'M79.7', symptoms: 'Widespread pain >3months, fatigue, sleep disturbance, cognitive fog, tender points, normal labs', treatment: 'Pregabalin 75mg BD, Duloxetine 60mg, graded exercise, CBT, sleep hygiene, reassurance' },
                { name: 'Psoriatic Arthritis', name_ar: 'التهاب مفاصل صدفي', icd: 'L40.50', symptoms: 'Asymmetric oligoarthritis, dactylitis, nail changes, psoriasis rash, enthesitis, DIP involvement', treatment: 'Methotrexate 15mg weekly, NSAIDs, Anti-TNF if inadequate, Apremilast, Dermatology co-management' }
            ],
            'Infectious Disease / الأمراض المعدية': [
                { name: 'COVID-19', name_ar: 'كوفيد-19', icd: 'U07.1', symptoms: 'Fever, cough, dyspnea, anosmia, myalgia, fatigue, sore throat, GI symptoms', treatment: 'Supportive care, Paracetamol, O2 if SpO2<94%, Dexamethasone if severe, antivirals per protocol' },
                { name: 'Influenza', name_ar: 'الإنفلونزا', icd: 'J10.1', symptoms: 'Sudden fever, myalgia, headache, cough, sore throat, fatigue, 3-7 day course', treatment: 'Oseltamivir 75mg BD x5d if <48hrs, Paracetamol, fluids, rest, influenza rapid test' },
                { name: 'Dengue Fever', name_ar: 'حمى الضنك', icd: 'A90', symptoms: 'High fever, severe headache, retro-orbital pain, myalgia, rash, thrombocytopenia, hemoconcentration', treatment: 'Supportive: IV fluids, Paracetamol (NO NSAIDs), monitor platelets/hematocrit, warning signs education' },
                { name: 'Malaria', name_ar: 'الملاريا', icd: 'B54', symptoms: 'Cyclic fever/chills/sweats, headache, hepatosplenomegaly, anemia, travel to endemic area', treatment: 'ACT (Artemether-Lumefantrine) x3d, thin/thick smear, species identification, G6PD if Primaquine needed' },
                { name: 'Brucellosis', name_ar: 'الحمى المالطية (البروسيلا)', icd: 'A23.9', symptoms: 'Undulant fever, sweats, arthralgia, hepatosplenomegaly, exposure to livestock/unpasteurized dairy', treatment: 'Doxycycline 100mg BD + Rifampicin 600mg daily x6wks, or Doxy + Gentamicin x3wks, serology' },
                { name: 'Cellulitis', name_ar: 'التهاب النسيج الخلوي', icd: 'L03.9', symptoms: 'Erythema, warmth, swelling, pain, well-demarcated border, fever, elevated WBC', treatment: 'Amoxicillin-Clavulanate 625mg TID or Cephalexin 500mg QID, mark borders, elevate limb, IV if severe' },
                { name: 'Herpes Zoster (Shingles)', name_ar: 'الحزام الناري', icd: 'B02.9', symptoms: 'Painful vesicular rash in dermatomal distribution, prodromal pain, unilateral, postherpetic neuralgia risk', treatment: 'Acyclovir 800mg 5x/day x7d or Valacyclovir 1g TID, analgesics, Pregabalin if PHN, ophthalmology if V1' },
                { name: 'Infectious Mononucleosis', name_ar: 'داء كثرة الوحيدات العدوائية', icd: 'B27.0', symptoms: 'Fever, pharyngitis, lymphadenopathy, fatigue, splenomegaly, atypical lymphocytes, positive monospot', treatment: 'Supportive: rest, Paracetamol, avoid contact sports x4wks (splenic rupture risk), NO Amoxicillin' }
            ],
            'Allergy & Immunology / الحساسية والمناعة': [
                { name: 'Anaphylaxis', name_ar: 'صدمة تحسسية', icd: 'T78.2', symptoms: 'EMERGENCY: Urticaria, angioedema, bronchospasm, hypotension, airway compromise, rapid onset after exposure', treatment: 'IM Adrenaline 0.5mg (1:1000) mid-thigh, O2, IV fluids, Hydrocortisone 200mg IV, Chlorpheniramine, monitor 6hrs' },
                { name: 'Allergic Rhinitis', name_ar: 'التهاب الأنف التحسسي', icd: 'J30.4', symptoms: 'Sneezing, rhinorrhea, nasal congestion, itchy nose/eyes, allergic shiners, pale turbinates', treatment: 'Intranasal Fluticasone 2 sprays BD, Cetirizine 10mg daily, allergen avoidance, consider immunotherapy' },
                { name: 'Urticaria - Acute', name_ar: 'أرتيكاريا (شرى) حادة', icd: 'L50.9', symptoms: 'Pruritic wheals, migratory, resolve <24hrs each, may follow food/drug/infection trigger', treatment: 'Cetirizine 10mg or Loratadine 10mg, remove trigger, IM Adrenaline if anaphylaxis signs, short Prednisolone' },
                { name: 'Urticaria - Chronic', name_ar: 'أرتيكاريا مزمنة', icd: 'L50.8', symptoms: 'Recurrent wheals >6 weeks, no clear trigger, autoimmune association, severely impacts QoL', treatment: 'Non-sedating H1 up to 4x dose, add H2 blocker, Montelukast, Omalizumab if refractory, autoimmune screen' },
                { name: 'Drug Allergy', name_ar: 'حساسية دوائية', icd: 'T88.7', symptoms: 'Rash, urticaria, angioedema after drug exposure, may be immediate or delayed (7-14d), document drug', treatment: 'Stop offending drug, Cetirizine, Prednisolone if severe, allergy documentation in chart, MedicAlert, alternatives' },
                { name: 'Food Allergy', name_ar: 'حساسية غذائية', icd: 'T78.1', symptoms: 'Urticaria, GI symptoms, anaphylaxis after food ingestion, common: nuts, shellfish, eggs, milk', treatment: 'Strict avoidance, EpiPen prescription + training, emergency action plan, dietitian, specific IgE/skin prick' },
                { name: 'Angioedema', name_ar: 'وذمة وعائية', icd: 'T78.3', symptoms: 'Deep tissue swelling of face/lips/tongue/throat, non-pruritic, may compromise airway, ACEi-related or hereditary', treatment: 'Airway assessment FIRST, IM Adrenaline if airway risk, stop ACEi if culprit, ENT if stridor, C4/C1-INH if hereditary' }
            ]
        };
        res.json(templates);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
