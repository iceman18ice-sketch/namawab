/**
 * PHARMACY Routes
 * Auto-extracted from server.js | 25 routes
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


// PHARMACY
// ===== PHARMACY =====
router.get('/api/pharmacy/drugs', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM pharmacy_drug_catalog WHERE is_active=1 ORDER BY drug_name')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Pharmacy low stock alerts
router.get('/api/pharmacy/low-stock', requireAuth, async (req, res) => {
    try {
        const lowStock = (await pool.query('SELECT * FROM pharmacy_drug_catalog WHERE is_active=1 AND stock_qty <= COALESCE(min_stock_level, 10) ORDER BY stock_qty ASC')).rows;
        res.json(lowStock);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/pharmacy/drugs', requireAuth, async (req, res) => {
    try {
        const { drug_name, active_ingredient, category, unit, selling_price, cost_price, stock_qty } = req.body;
        const result = await pool.query('INSERT INTO pharmacy_drug_catalog (drug_name, active_ingredient, category, unit, selling_price, cost_price, stock_qty) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
            [drug_name, active_ingredient || '', category || '', unit || '', selling_price || 0, cost_price || 0, stock_qty || 0]);
        res.json((await pool.query('SELECT * FROM pharmacy_drug_catalog WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/pharmacy/queue', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT pq.*, p.name_en as patient_name FROM pharmacy_prescriptions_queue pq LEFT JOIN patients p ON pq.patient_id=p.id ORDER BY pq.id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/pharmacy/queue/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (status) await pool.query('UPDATE pharmacy_prescriptions_queue SET status=$1, dispensed_at=CURRENT_TIMESTAMP WHERE id=$2', [status, req.params.id]);
        res.json((await pool.query('SELECT * FROM pharmacy_prescriptions_queue WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PRESCRIPTIONS
// ===== PRESCRIPTIONS =====
router.get('/api/prescriptions', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) { res.json((await pool.query('SELECT * FROM prescriptions WHERE patient_id=$1 ORDER BY id DESC', [patient_id])).rows); }
        else { res.json((await pool.query('SELECT * FROM prescriptions ORDER BY id DESC')).rows); }
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/prescriptions', requireAuth, async (req, res) => {
    try {
        const { patient_id, medication_name, dosage, frequency, duration, notes } = req.body;
        // Lookup drug price from catalog
        let drugPrice = 0;
        if (medication_name) {
            const drug = (await pool.query('SELECT selling_price FROM pharmacy_drug_catalog WHERE drug_name ILIKE $1 LIMIT 1', [`%${medication_name}%`])).rows[0];
            if (drug) drugPrice = drug.selling_price;
        }
        const result = await pool.query('INSERT INTO prescriptions (patient_id, medication_id, dosage, duration, status) VALUES ($1,0,$2,$3,$4) RETURNING id',
            [patient_id, `${medication_name} ${dosage} ${frequency}`, duration || '', 'Pending']);
        await pool.query('INSERT INTO pharmacy_prescriptions_queue (patient_id, prescription_text, status) VALUES ($1,$2,$3)',
            [patient_id, `${medication_name} - ${dosage} - ${frequency} - ${duration}`, 'Pending']);
        // Auto-create invoice for prescription drug (with VAT for non-Saudis)
        if (drugPrice > 0 && patient_id) {
            const p = (await pool.query('SELECT name_en, name_ar FROM patients WHERE id=$1', [patient_id])).rows[0];
            const vat = await calcVAT(patient_id);
            const { total: finalTotal, vatAmount } = addVAT(drugPrice, vat.rate);
            const desc = `دواء: ${medication_name}` + (vat.applyVAT ? ` (+ ضريبة ${vatAmount} SAR)` : '');
            await pool.query('INSERT INTO invoices (patient_id, patient_name, total, vat_amount, description, service_type, paid) VALUES ($1,$2,$3,$4,$5,$6,0)',
                [patient_id, p?.name_en || p?.name_ar || '', finalTotal, vatAmount, desc, 'Pharmacy']);
        }

        // AUTO: Send prescription to pharmacy queue
        try {
            if (Array.isArray(items)) {
                for (const item of items) {
                    await pool.query(
                        "INSERT INTO pharmacy_queue (patient_id, patient_name, drug_name, dosage, quantity, doctor, status, prescription_id) VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)",
                        [patient_id, patient_name || '', item.drug || item.name, item.dosage || '', item.quantity || 1, req.session.user?.display_name || '', result.rows[0]?.id || null]
                    );
                }
            }
        } catch (pe) { console.error('Pharmacy queue auto-insert:', pe.message); }
        res.json((await pool.query('SELECT * FROM prescriptions WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// CLINICAL PHARMACY
// ===== CLINICAL PHARMACY =====
router.get('/api/clinical-pharmacy/reviews', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM clinical_pharmacy_reviews ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/clinical-pharmacy/reviews', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, prescription_id, review_type, findings, recommendations, interventions, severity } = req.body;
        const result = await pool.query('INSERT INTO clinical_pharmacy_reviews (patient_id, patient_name, prescription_id, review_type, pharmacist, findings, recommendations, interventions, severity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [patient_id, patient_name || '', prescription_id || 0, review_type || 'Medication Review', req.session.user.name, findings || '', recommendations || '', interventions || '', severity || 'Low']);
        logAudit(req.session.user.id, req.session.user.name, 'CLINICAL_REVIEW', 'Clinical Pharmacy', `Review for patient ${patient_name}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/clinical-pharmacy/reviews/:id', requireAuth, async (req, res) => {
    try {
        const { outcome, status } = req.body;
        await pool.query('UPDATE clinical_pharmacy_reviews SET outcome=$1, status=$2 WHERE id=$3', [outcome || 'Resolved', status || 'Closed', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/clinical-pharmacy/interactions', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM drug_interactions ORDER BY severity DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/clinical-pharmacy/education', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM patient_drug_education ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/clinical-pharmacy/education', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, medication, instructions, side_effects, precautions } = req.body;
        const result = await pool.query('INSERT INTO patient_drug_education (patient_id, patient_name, medication, instructions, side_effects, precautions, educated_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [patient_id, patient_name || '', medication || '', instructions || '', side_effects || '', precautions || '', req.session.user.name]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PHARMACY & PRESCRIPTIONS
// ===== PHARMACY & PRESCRIPTIONS =====
// Doctor sends prescription → Pharmacy queue
router.post('/api/prescriptions', requireAuth, async (req, res) => {
    try {
        const { patient_id, medication_name, dosage, quantity_per_day, frequency, duration } = req.body;
        const rxText = `${medication_name || ''} | ${dosage || ''}${quantity_per_day && quantity_per_day !== '1' ? ' (×' + quantity_per_day + ')' : ''} | ${frequency || ''} | ${duration || ''}`;
        // Ensure individual columns exist
        await pool.query(`ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN IF NOT EXISTS medication_name TEXT DEFAULT ''`).catch(() => { });
        await pool.query(`ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN IF NOT EXISTS dosage TEXT DEFAULT ''`).catch(() => { });
        await pool.query(`ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN IF NOT EXISTS quantity_per_day TEXT DEFAULT '1'`).catch(() => { });
        await pool.query(`ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT ''`).catch(() => { });
        await pool.query(`ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT ''`).catch(() => { });
        const r = await pool.query(
            `INSERT INTO pharmacy_prescriptions_queue (patient_id, doctor_id, prescription_text, medication_name, dosage, quantity_per_day, frequency, duration, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING *`,
            [patient_id, req.session.user?.id || 0, rxText, medication_name || '', dosage || '', quantity_per_day || '1', frequency || '', duration || '']
        );
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Get pharmacy prescriptions queue
router.get('/api/pharmacy/queue', requireAuth, async (req, res) => {
    try {
        const rows = (await pool.query(`SELECT q.*, p.name_ar as patient_name, p.file_number, p.phone, p.age, p.department, q.doctor
            FROM pharmacy_prescriptions_queue q 
            LEFT JOIN patients p ON q.patient_id = p.id 
            ORDER BY q.id DESC`)).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Update prescription status (Dispense with sale)
router.put('/api/pharmacy/queue/:id', requireAuth, async (req, res) => {
    try {
        const { status, price, payment_method, patient_id } = req.body;
        // Ensure columns exist
        await pool.query(`ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN IF NOT EXISTS price REAL DEFAULT 0`).catch(() => { });
        await pool.query(`ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT ''`).catch(() => { });
        await pool.query(
            `UPDATE pharmacy_prescriptions_queue SET status=$1, dispensed_by=$2, dispensed_at=CURRENT_TIMESTAMP, price=$3, payment_method=$4 WHERE id=$5`,
            [status || 'Dispensed', req.session.user?.display_name || '', price || 0, payment_method || 'Cash', req.params.id]
        );
        // Create invoice if price > 0
        if (price && price > 0 && patient_id) {
            const rx = (await pool.query('SELECT * FROM pharmacy_prescriptions_queue WHERE id=$1', [req.params.id])).rows[0];
            const patient = patient_id ? (await pool.query('SELECT name_ar, name_en, nationality FROM patients WHERE id=$1', [patient_id])).rows[0] : null;
            const vat = await calcVAT(patient_id);
            const { total: finalTotal, vatAmount } = addVAT(price, vat.rate);
            await pool.query(
                `INSERT INTO invoices (patient_id, patient_name, total, amount, vat_amount, description, service_type, paid, payment_method) 
                 VALUES ($1, $2, $3, $4, $5, $6, 'Pharmacy', 1, $7)`,
                [patient_id, patient?.name_ar || patient?.name_en || '', finalTotal, price, vatAmount,
                    `Pharmacy: ${rx?.prescription_text || ''}`, payment_method || 'Cash']
            );
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Get drug catalog
router.get('/api/pharmacy/drugs', requireAuth, async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM pharmacy_drug_catalog ORDER BY drug_name')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Add drug to catalog
router.post('/api/pharmacy/drugs', requireAuth, async (req, res) => {
    try {
        const { drug_name, selling_price, stock_qty, category, active_ingredient } = req.body;
        const r = await pool.query(
            `INSERT INTO pharmacy_drug_catalog (drug_name, selling_price, stock_qty, category, active_ingredient) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [drug_name || '', selling_price || 0, stock_qty || 0, category || '', active_ingredient || '']
        );
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PHARMACY STOCK DEDUCTION ON DISPENSE
// ===== PHARMACY STOCK DEDUCTION ON DISPENSE =====
router.post('/api/pharmacy/deduct-stock', requireAuth, async (req, res) => {
    try {
        const { drug_id, drug_name, quantity, patient_id, prescription_id, reason } = req.body;
        const drug = (await pool.query('SELECT * FROM pharmacy_drug_catalog WHERE id=$1', [drug_id])).rows[0];
        if (!drug) return res.status(404).json({ error: 'Drug not found' });
        if (drug.stock_qty < quantity) return res.status(400).json({ error: 'Insufficient stock', available: drug.stock_qty });
        const newQty = drug.stock_qty - quantity;
        await pool.query('UPDATE pharmacy_drug_catalog SET stock_qty=$1 WHERE id=$2', [newQty, drug_id]);
        await pool.query('INSERT INTO pharmacy_stock_log (drug_id, drug_name, movement_type, quantity, previous_qty, new_qty, reason, patient_id, prescription_id, performed_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
            [drug_id, drug_name || drug.drug_name, 'OUT', quantity, drug.stock_qty, newQty, reason || 'Dispensed', patient_id, prescription_id, req.session.user?.display_name || '']);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'STOCK_OUT', 'Pharmacy', drug_name + ': ' + drug.stock_qty + ' -> ' + newQty, req.ip);
        const isLow = newQty <= (drug.min_stock_level || 10);
        if (isLow) {
            await pool.query('INSERT INTO notifications (target_role, title, message, type, module) VALUES ($1,$2,$3,$4,$5)',
                ['Pharmacist', 'Low Stock Alert', drug_name + ' stock: ' + newQty, 'warning', 'Pharmacy']);
        }
        res.json({ success: true, previous_qty: drug.stock_qty, new_qty: newQty, is_low_stock: isLow });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DRUG EXPIRY ALERTS
// ===== DRUG EXPIRY ALERTS =====
router.get('/api/pharmacy/expiring', requireAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 90;
        const expiring = (await pool.query("SELECT * FROM pharmacy_drug_catalog WHERE is_active=1 AND expiry_date IS NOT NULL AND expiry_date != '' AND expiry_date <= (CURRENT_DATE + INTERVAL '1 day' * $1)::text ORDER BY expiry_date ASC", [days])).rows;
        res.json(expiring);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DRUG INTERACTION CHECK
// ===== DRUG INTERACTION CHECK =====
router.post('/api/drug-interactions/check', requireAuth, async (req, res) => {
    try {
        const { drugs } = req.body; // Array of drug names
        if (!drugs || !Array.isArray(drugs)) return res.json({ interactions: [] });

        // Common drug interaction database
        const INTERACTIONS = [
            { drugs: ['Warfarin', 'Aspirin'], severity: 'high', message_ar: 'خطر نزيف شديد', message_en: 'High bleeding risk' },
            { drugs: ['Warfarin', 'Ibuprofen'], severity: 'high', message_ar: 'خطر نزيف شديد', message_en: 'High bleeding risk' },
            { drugs: ['Warfarin', 'Diclofenac'], severity: 'high', message_ar: 'خطر نزيف', message_en: 'Bleeding risk' },
            { drugs: ['Warfarin', 'Omeprazole'], severity: 'moderate', message_ar: 'قد يزيد تأثير الوارفارين', message_en: 'May increase Warfarin effect' },
            { drugs: ['Warfarin', 'Ciprofloxacin'], severity: 'high', message_ar: 'يزيد INR بشكل خطير', message_en: 'Dangerously increases INR' },
            { drugs: ['Warfarin', 'Metronidazole'], severity: 'high', message_ar: 'يزيد تأثير الوارفارين', message_en: 'Increases Warfarin effect' },
            { drugs: ['Metformin', 'Contrast'], severity: 'high', message_ar: 'خطر حماض لاكتيكي', message_en: 'Lactic acidosis risk' },
            { drugs: ['ACE Inhibitor', 'Potassium'], severity: 'high', message_ar: 'خطر ارتفاع البوتاسيوم', message_en: 'Hyperkalemia risk' },
            { drugs: ['Enalapril', 'Spironolactone'], severity: 'high', message_ar: 'خطر ارتفاع البوتاسيوم', message_en: 'Hyperkalemia risk' },
            { drugs: ['Lisinopril', 'Spironolactone'], severity: 'high', message_ar: 'خطر ارتفاع البوتاسيوم', message_en: 'Hyperkalemia risk' },
            { drugs: ['Digoxin', 'Amiodarone'], severity: 'high', message_ar: 'سمية الديجوكسين', message_en: 'Digoxin toxicity' },
            { drugs: ['Digoxin', 'Verapamil'], severity: 'high', message_ar: 'سمية الديجوكسين', message_en: 'Digoxin toxicity' },
            { drugs: ['Methotrexate', 'TMP/SMX'], severity: 'high', message_ar: 'سمية الميثوتركسات', message_en: 'Methotrexate toxicity' },
            { drugs: ['Methotrexate', 'NSAIDs'], severity: 'high', message_ar: 'سمية كلوية', message_en: 'Renal toxicity' },
            { drugs: ['Simvastatin', 'Clarithromycin'], severity: 'high', message_ar: 'خطر انحلال العضلات', message_en: 'Rhabdomyolysis risk' },
            { drugs: ['Atorvastatin', 'Clarithromycin'], severity: 'moderate', message_ar: 'زيادة تأثير الستاتين', message_en: 'Increased statin effect' },
            { drugs: ['Clopidogrel', 'Omeprazole'], severity: 'moderate', message_ar: 'يقلل فعالية كلوبيدوقرل', message_en: 'Reduces Clopidogrel efficacy' },
            { drugs: ['Lithium', 'NSAIDs'], severity: 'high', message_ar: 'سمية الليثيوم', message_en: 'Lithium toxicity' },
            { drugs: ['Lithium', 'ACE Inhibitor'], severity: 'high', message_ar: 'سمية الليثيوم', message_en: 'Lithium toxicity' },
            { drugs: ['Ciprofloxacin', 'Theophylline'], severity: 'high', message_ar: 'سمية الثيوفيلين', message_en: 'Theophylline toxicity' },
            { drugs: ['MAO Inhibitor', 'SSRI'], severity: 'critical', message_ar: 'متلازمة السيروتونين - مميت', message_en: 'Serotonin syndrome - FATAL' },
            { drugs: ['Tramadol', 'SSRI'], severity: 'high', message_ar: 'خطر متلازمة السيروتونين', message_en: 'Serotonin syndrome risk' },
            { drugs: ['Tramadol', 'Sertraline'], severity: 'high', message_ar: 'خطر متلازمة السيروتونين', message_en: 'Serotonin syndrome risk' },
            { drugs: ['Sildenafil', 'Nitrate'], severity: 'critical', message_ar: 'انخفاض ضغط مميت', message_en: 'Fatal hypotension' },
            { drugs: ['Sildenafil', 'Nitroglycerin'], severity: 'critical', message_ar: 'انخفاض ضغط مميت', message_en: 'Fatal hypotension' },
            { drugs: ['Amlodipine', 'Simvastatin'], severity: 'moderate', message_ar: 'لا تتجاوز سيمفاستاتين 20مج', message_en: 'Do not exceed Simvastatin 20mg' },
            { drugs: ['Carbamazepine', 'OCP'], severity: 'high', message_ar: 'يقلل فعالية حبوب منع الحمل', message_en: 'Reduces OCP efficacy' },
            { drugs: ['Phenytoin', 'Warfarin'], severity: 'high', message_ar: 'تفاعل معقد - مراقبة', message_en: 'Complex interaction - monitor' },
            { drugs: ['Erythromycin', 'Simvastatin'], severity: 'high', message_ar: 'انحلال عضلات', message_en: 'Rhabdomyolysis' },
            { drugs: ['Fluconazole', 'Warfarin'], severity: 'high', message_ar: 'يزيد نزيف', message_en: 'Increases bleeding' },
            { drugs: ['Amiodarone', 'Warfarin'], severity: 'high', message_ar: 'يزيد INR', message_en: 'Increases INR' },
            { drugs: ['Aspirin', 'Ibuprofen'], severity: 'moderate', message_ar: 'يقلل تأثير الأسبرين القلبي', message_en: 'Reduces cardiac aspirin effect' },
            { drugs: ['Metformin', 'Alcohol'], severity: 'moderate', message_ar: 'خطر حماض لاكتيكي', message_en: 'Lactic acidosis risk' },
            { drugs: ['Insulin', 'Beta Blocker'], severity: 'moderate', message_ar: 'يخفي أعراض هبوط السكر', message_en: 'Masks hypoglycemia symptoms' },
            { drugs: ['Potassium', 'Spironolactone'], severity: 'high', message_ar: 'خطر ارتفاع بوتاسيوم شديد', message_en: 'Severe hyperkalemia risk' },
            { drugs: ['Azithromycin', 'Amiodarone'], severity: 'high', message_ar: 'إطالة QT', message_en: 'QT prolongation' },
            { drugs: ['Domperidone', 'Clarithromycin'], severity: 'high', message_ar: 'إطالة QT', message_en: 'QT prolongation' },
            { drugs: ['Metoclopramide', 'Haloperidol'], severity: 'moderate', message_ar: 'أعراض خارج هرمية', message_en: 'Extrapyramidal symptoms' },
            { drugs: ['Rifampin', 'OCP'], severity: 'high', message_ar: 'يلغي فعالية حبوب منع الحمل', message_en: 'Eliminates OCP efficacy' },
            { drugs: ['Rifampin', 'Warfarin'], severity: 'high', message_ar: 'يقلل فعالية الوارفارين بشدة', message_en: 'Greatly reduces Warfarin' },
            { drugs: ['Ciprofloxacin', 'Antacid'], severity: 'moderate', message_ar: 'يقلل امتصاص سيبرو', message_en: 'Reduces Cipro absorption' },
            { drugs: ['Tetracycline', 'Antacid'], severity: 'moderate', message_ar: 'يقلل الامتصاص', message_en: 'Reduces absorption' },
            { drugs: ['Levothyroxine', 'Calcium'], severity: 'moderate', message_ar: 'يقلل امتصاص الثايروكسين', message_en: 'Reduces thyroxine absorption' },
            { drugs: ['Levothyroxine', 'Iron'], severity: 'moderate', message_ar: 'يقلل امتصاص الثايروكسين', message_en: 'Reduces thyroxine absorption' },
            { drugs: ['Bisoprolol', 'Verapamil'], severity: 'high', message_ar: 'بطء قلب خطير', message_en: 'Dangerous bradycardia' },
            { drugs: ['Atenolol', 'Verapamil'], severity: 'high', message_ar: 'بطء قلب خطير', message_en: 'Dangerous bradycardia' },
            { drugs: ['Clonidine', 'Beta Blocker'], severity: 'high', message_ar: 'ارتداد ارتفاع ضغط', message_en: 'Rebound hypertension' },
            { drugs: ['Allopurinol', 'Azathioprine'], severity: 'critical', message_ar: 'سمية نخاع العظم', message_en: 'Bone marrow toxicity' },
            { drugs: ['Clarithromycin', 'Colchicine'], severity: 'high', message_ar: 'سمية الكولشيسين', message_en: 'Colchicine toxicity' },
        ];

        const found = [];
        const drugNamesLower = drugs.map(d => d.toLowerCase());

        for (const interaction of INTERACTIONS) {
            const [d1, d2] = interaction.drugs.map(d => d.toLowerCase());
            const match1 = drugNamesLower.some(dn => dn.includes(d1) || d1.includes(dn));
            const match2 = drugNamesLower.some(dn => dn.includes(d2) || d2.includes(dn));
            if (match1 && match2) {
                found.push(interaction);
            }
        }

        res.json({ interactions: found, total_checked: INTERACTIONS.length });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// ALLERGY CROSS-CHECK
// ===== ALLERGY CROSS-CHECK =====
router.post('/api/allergy-check', requireAuth, async (req, res) => {
    try {
        const { patient_id, drugs } = req.body;
        if (!patient_id || !drugs) return res.json({ alerts: [] });

        const patient = (await pool.query('SELECT allergies FROM patients WHERE id=$1', [patient_id])).rows[0];
        if (!patient || !patient.allergies) return res.json({ alerts: [] });

        const allergyGroups = {
            'penicillin': ['amoxicillin', 'ampicillin', 'augmentin', 'amoxicillin-clavulanate', 'piperacillin', 'flucloxacillin'],
            'sulfa': ['sulfamethoxazole', 'tmp/smx', 'co-trimoxazole', 'sulfasalazine', 'dapsone'],
            'nsaid': ['ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'indomethacin', 'piroxicam', 'meloxicam', 'celecoxib'],
            'aspirin': ['aspirin', 'acetylsalicylic'],
            'cephalosporin': ['cephalexin', 'cefuroxime', 'ceftriaxone', 'cefazolin', 'cefixime', 'ceftazidime'],
            'macrolide': ['erythromycin', 'azithromycin', 'clarithromycin'],
            'quinolone': ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin'],
            'tetracycline': ['doxycycline', 'tetracycline', 'minocycline'],
            'codeine': ['codeine', 'tramadol', 'morphine', 'oxycodone'],
            'contrast': ['iodine', 'contrast', 'gadolinium'],
        };

        const allergies = patient.allergies.toLowerCase();
        const alerts = [];

        for (const drug of drugs) {
            const drugLower = drug.toLowerCase();
            // Direct match
            if (allergies.includes(drugLower)) {
                alerts.push({ drug, severity: 'critical', message_ar: 'حساسية مباشرة مسجلة!', message_en: 'Direct allergy recorded!' });
                continue;
            }
            // Group match
            for (const [allergen, family] of Object.entries(allergyGroups)) {
                if (allergies.includes(allergen) && family.some(f => drugLower.includes(f))) {
                    alerts.push({ drug, severity: 'high', message_ar: 'ينتمي لعائلة ' + allergen + ' المسجل حساسية منها', message_en: 'Belongs to ' + allergen + ' family (allergy recorded)' });
                }
            }
        }

        res.json({ alerts, patient_allergies: patient.allergies });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PHARMACY PRESCRIPTIONS
// ===== PHARMACY PRESCRIPTIONS =====
router.get('/api/pharmacy/prescriptions', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS pharmacy_prescriptions (
            id SERIAL PRIMARY KEY, patient_id INTEGER, patient_name VARCHAR(200),
            medication VARCHAR(200), drug_name VARCHAR(200), dosage VARCHAR(100),
            frequency VARCHAR(100), duration VARCHAR(100), quantity INTEGER,
            doctor VARCHAR(200), status VARCHAR(30) DEFAULT 'pending',
            notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        res.json((await pool.query('SELECT * FROM pharmacy_prescriptions ORDER BY created_at DESC')).rows);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/pharmacy/prescriptions', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, medication, drug_name, dosage, frequency, duration, quantity, doctor, status, notes } = req.body;
        const r = await pool.query('INSERT INTO pharmacy_prescriptions (patient_id,patient_name,medication,drug_name,dosage,frequency,duration,quantity,doctor,status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
            [patient_id, patient_name, medication || drug_name, drug_name || medication, dosage, frequency, duration, quantity, doctor, status || 'pending', notes]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/pharmacy/prescriptions/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const r = await pool.query('UPDATE pharmacy_prescriptions SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
