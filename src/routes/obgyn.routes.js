/**
 * OBGYN Routes
 * Auto-extracted from server.js | 12 routes
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


// OB/GYN DEPARTMENT
// ===== OB/GYN DEPARTMENT =====
// Pregnancy Records
router.get('/api/obgyn/pregnancies', requireAuth, async (req, res) => {
    try {
        const { patient_id, status } = req.query;
        let q = 'SELECT * FROM obgyn_pregnancies';
        const conds = [], params = [];
        if (patient_id) { conds.push('patient_id=$' + (params.length + 1)); params.push(patient_id); }
        if (status) { conds.push('status=$' + (params.length + 1)); params.push(status); }
        if (conds.length) q += ' WHERE ' + conds.join(' AND ');
        q += ' ORDER BY created_at DESC';
        res.json((await pool.query(q, params)).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/obgyn/pregnancies', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, lmp, gravida, para, abortions, living_children,
            blood_group, rh_factor, risk_level, pre_pregnancy_weight, height,
            allergies, chronic_conditions, previous_cs, previous_complications,
            husband_name, husband_blood_group, attending_doctor } = req.body;
        // Calculate EDD (Naegele's rule: LMP + 280 days)
        let edd = null;
        if (lmp) {
            const d = new Date(lmp);
            d.setDate(d.getDate() + 280);
            edd = d.toISOString().split('T')[0];
        }
        const result = await pool.query(
            `INSERT INTO obgyn_pregnancies (patient_id, patient_name, lmp, edd, gravida, para, abortions, living_children,
             blood_group, rh_factor, risk_level, pre_pregnancy_weight, height, allergies, chronic_conditions,
             previous_cs, previous_complications, husband_name, husband_blood_group, attending_doctor, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
            [patient_id, patient_name || '', lmp, edd, gravida || 1, para || 0, abortions || 0, living_children || 0,
                blood_group || '', rh_factor || '', risk_level || 'Low', pre_pregnancy_weight || 0, height || 0,
                allergies || '', chronic_conditions || '', previous_cs || 0, previous_complications || '',
                husband_name || '', husband_blood_group || '', attending_doctor || '', req.session.user?.display_name || '']);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'CREATE_PREGNANCY', 'OB/GYN', 'Pregnancy record for ' + patient_name, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/obgyn/pregnancies/:id', requireAuth, async (req, res) => {
    try {
        const fields = req.body;
        const sets = [], params = [];
        for (const [k, v] of Object.entries(fields)) {
            if (['id', 'created_at'].includes(k)) continue;
            params.push(v);
            sets.push(k + '=$' + params.length);
        }
        if (!sets.length) return res.json({ success: false });
        params.push(req.params.id);
        await pool.query('UPDATE obgyn_pregnancies SET ' + sets.join(',') + ',updated_at=NOW() WHERE id=$' + params.length, params);
        res.json((await pool.query('SELECT * FROM obgyn_pregnancies WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Antenatal Visits
router.get('/api/obgyn/antenatal/:pregnancy_id', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM obgyn_antenatal_visits WHERE pregnancy_id=$1 ORDER BY visit_number DESC', [req.params.pregnancy_id])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/obgyn/antenatal', requireAuth, async (req, res) => {
    try {
        const { pregnancy_id, patient_id, gestational_age, weight, blood_pressure,
            systolic, diastolic, fundal_height, fetal_heart_rate, fetal_presentation,
            fetal_movement, edema, proteinuria, glucose_urine, hemoglobin,
            complaints, examination_notes, plan, next_visit, risk_flags } = req.body;
        const count = (await pool.query('SELECT COUNT(*) as cnt FROM obgyn_antenatal_visits WHERE pregnancy_id=$1', [pregnancy_id])).rows[0].cnt;
        // Calculate weight gain from first visit
        const firstVisit = (await pool.query('SELECT weight FROM obgyn_antenatal_visits WHERE pregnancy_id=$1 ORDER BY visit_number LIMIT 1', [pregnancy_id])).rows[0];
        const wGain = firstVisit ? (weight - firstVisit.weight) : 0;
        const result = await pool.query(
            `INSERT INTO obgyn_antenatal_visits (pregnancy_id, patient_id, visit_number, gestational_age, weight, weight_gain,
             blood_pressure, systolic, diastolic, fundal_height, fetal_heart_rate, fetal_presentation,
             fetal_movement, edema, proteinuria, glucose_urine, hemoglobin, complaints, examination_notes,
             plan, next_visit, doctor, risk_flags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING *`,
            [pregnancy_id, patient_id, parseInt(count) + 1, gestational_age || '', weight || 0, wGain,
                blood_pressure || '', systolic || 0, diastolic || 0, fundal_height || 0, fetal_heart_rate || 0,
                fetal_presentation || '', fetal_movement || 'Active', edema || 'None', proteinuria || 'Negative',
                glucose_urine || 'Negative', hemoglobin || 0, complaints || '', examination_notes || '',
                plan || '', next_visit || null, req.session.user?.display_name || '', risk_flags || '']);
        // Check for risk flags
        let flags = [];
        if (systolic >= 140 || diastolic >= 90) flags.push('Hypertension');
        if (proteinuria !== 'Negative' && (systolic >= 140 || diastolic >= 90)) flags.push('Pre-eclampsia risk');
        if (hemoglobin > 0 && hemoglobin < 10) flags.push('Anemia');
        if (fetal_heart_rate > 0 && (fetal_heart_rate < 110 || fetal_heart_rate > 160)) flags.push('Abnormal FHR');
        if (flags.length) {
            await pool.query('UPDATE obgyn_antenatal_visits SET risk_flags=$1 WHERE id=$2', [flags.join(', '), result.rows[0].id]);
            await pool.query('INSERT INTO notifications (target_role, title, message, type, module) VALUES ($1,$2,$3,$4,$5)',
                ['Doctor', 'OB/GYN Risk Alert', 'Patient #' + patient_id + ': ' + flags.join(', '), 'warning', 'OB/GYN']);
        }
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Ultrasound Records
router.get('/api/obgyn/ultrasounds/:pregnancy_id', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM obgyn_ultrasounds WHERE pregnancy_id=$1 ORDER BY scan_date DESC', [req.params.pregnancy_id])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/obgyn/ultrasounds', requireAuth, async (req, res) => {
    try {
        const b = req.body;
        const result = await pool.query(
            `INSERT INTO obgyn_ultrasounds (pregnancy_id, patient_id, scan_type, gestational_age,
             bpd, hc, ac, fl, efw, amniotic_fluid_index, placenta_location, placenta_grade,
             fetal_heart_rate, fetal_presentation, fetal_gender, number_of_fetuses, cervical_length,
             anomalies, findings, impression, performed_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
            [b.pregnancy_id, b.patient_id, b.scan_type || 'Routine', b.gestational_age || '',
            b.bpd || 0, b.hc || 0, b.ac || 0, b.fl || 0, b.efw || 0, b.amniotic_fluid_index || 0,
            b.placenta_location || '', b.placenta_grade || '', b.fetal_heart_rate || 0,
            b.fetal_presentation || '', b.fetal_gender || 'Not determined', b.number_of_fetuses || 1,
            b.cervical_length || 0, b.anomalies || '', b.findings || '', b.impression || '',
            req.session.user?.display_name || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Delivery Records
router.post('/api/obgyn/deliveries', requireAuth, async (req, res) => {
    try {
        const b = req.body;
        const result = await pool.query(
            `INSERT INTO obgyn_deliveries (pregnancy_id, patient_id, delivery_date, gestational_age_at_delivery,
             delivery_type, delivery_method, indication_for_cs, anesthesia_type, labor_duration_hours,
             episiotomy, perineal_tear, blood_loss_ml, placenta_delivery, complications,
             attending_doctor, assisting_nurse, anesthetist, pediatrician, notes,
             apgar_1min, apgar_5min, baby_weight, baby_length, baby_head_circumference,
             baby_gender, baby_status, baby_anomalies, nicu_admission, nicu_reason, breastfeeding_initiated)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) RETURNING *`,
            [b.pregnancy_id, b.patient_id, b.delivery_date || new Date(), b.gestational_age_at_delivery || '',
            b.delivery_type || 'NVD', b.delivery_method || '', b.indication_for_cs || '', b.anesthesia_type || '',
            b.labor_duration_hours || 0, b.episiotomy || 0, b.perineal_tear || 'None', b.blood_loss_ml || 0,
            b.placenta_delivery || 'Complete', b.complications || '', b.attending_doctor || '',
            b.assisting_nurse || '', b.anesthetist || '', b.pediatrician || '', b.notes || '',
            b.apgar_1min || 0, b.apgar_5min || 0, b.baby_weight || 0, b.baby_length || 0,
            b.baby_head_circumference || 0, b.baby_gender || '', b.baby_status || 'Alive',
            b.baby_anomalies || '', b.nicu_admission || 0, b.nicu_reason || '', b.breastfeeding_initiated || 0]);
        // Update pregnancy status
        await pool.query('UPDATE obgyn_pregnancies SET status=$1, delivery_date=$2, delivery_type=$3, outcome=$4 WHERE id=$5',
            ['Delivered', b.delivery_date || new Date(), b.delivery_type || 'NVD', b.baby_status || 'Alive', b.pregnancy_id]);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'DELIVERY', 'OB/GYN', 'Delivery recorded for pregnancy #' + b.pregnancy_id, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/obgyn/deliveries/:pregnancy_id', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM obgyn_deliveries WHERE pregnancy_id=$1', [req.params.pregnancy_id])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// NST Records
router.post('/api/obgyn/nst', requireAuth, async (req, res) => {
    try {
        const b = req.body;
        const result = await pool.query(
            `INSERT INTO obgyn_nst (pregnancy_id, patient_id, duration_minutes, baseline_fhr, variability,
             accelerations, decelerations, contractions, result, interpretation, action_taken, performed_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
            [b.pregnancy_id, b.patient_id, b.duration_minutes || 20, b.baseline_fhr || 0, b.variability || '',
            b.accelerations || 0, b.decelerations || 'None', b.contractions || 0, b.result || 'Reactive',
            b.interpretation || '', b.action_taken || '', req.session.user?.display_name || '']);
        // Alert if non-reactive
        if (b.result === 'Non-Reactive') {
            await pool.query('INSERT INTO notifications (target_role, title, message, type, module) VALUES ($1,$2,$3,$4,$5)',
                ['Doctor', 'Non-Reactive NST', 'Patient #' + b.patient_id + ' - Non-reactive NST: ' + (b.interpretation || ''), 'danger', 'OB/GYN']);
        }
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// OB/GYN Lab Panels
router.get('/api/obgyn/lab-panels', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM obgyn_lab_panels WHERE is_active=1 ORDER BY id')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// OB/GYN Dashboard Stats
router.get('/api/obgyn/stats', requireAuth, async (req, res) => {
    try {
        const active = (await pool.query("SELECT COUNT(*) as cnt FROM obgyn_pregnancies WHERE status='Active'")).rows[0].cnt;
        const highRisk = (await pool.query("SELECT COUNT(*) as cnt FROM obgyn_pregnancies WHERE status='Active' AND risk_level='High'")).rows[0].cnt;
        const dueThisWeek = (await pool.query("SELECT COUNT(*) as cnt FROM obgyn_pregnancies WHERE status='Active' AND edd BETWEEN CURRENT_DATE AND CURRENT_DATE + 7")).rows[0].cnt;
        const deliveredThisMonth = (await pool.query("SELECT COUNT(*) as cnt FROM obgyn_deliveries WHERE delivery_date >= date_trunc('month', CURRENT_DATE)")).rows[0].cnt;
        res.json({ activePregnancies: active, highRisk, dueThisWeek, deliveredThisMonth });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



module.exports = router;
