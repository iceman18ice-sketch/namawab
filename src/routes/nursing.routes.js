/**
 * NURSING Routes
 * Auto-extracted from server.js | 13 routes
 * DO NOT manually edit — regenerate with refactor_tool.js
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth, requireCatalogAccess, requireRole, MAX_DISCOUNT_BY_ROLE } = require('../middleware/auth');
const { logAudit, calcVAT, addVAT } = require('../utils/helpers');
const { emitClinicalAlert, sendCriticalAlert } = require('../services/socket.service');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');


// NURSING
// ===== NURSING =====
router.get('/api/nursing/vitals', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM nursing_vitals ORDER BY id DESC LIMIT 100')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
// ===== NURSING =====
router.get('/api/nursing/vitals', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM nursing_vitals ORDER BY id DESC LIMIT 100')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/nursing/vitals/:patientId', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM nursing_vitals WHERE patient_id=$1 ORDER BY id DESC LIMIT 1', [req.params.patientId])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/nursing/vitals', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, bp, temp, weight, height, pulse, o2_sat, respiratory_rate, blood_sugar, chronic_diseases, current_medications, allergies, notes } = req.body;
        await pool.query('INSERT INTO nursing_vitals (patient_id, patient_name, bp, temp, weight, height, pulse, o2_sat, respiratory_rate, blood_sugar, chronic_diseases, current_medications, allergies, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
            [patient_id, patient_name || '', bp || '', temp || 0, weight || 0, height || 0, pulse || 0, o2_sat || 0, respiratory_rate || 0, blood_sugar || 0, chronic_diseases || '', current_medications || '', allergies || '', notes || '']);
        await pool.query('UPDATE patients SET status=$1 WHERE id=$2', ['Waiting', patient_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// eMAR
// ===== eMAR =====
router.get('/api/emar/orders', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) res.json((await pool.query('SELECT * FROM emar_orders WHERE patient_id=$1 ORDER BY created_at DESC', [patient_id])).rows);
        else res.json((await pool.query('SELECT * FROM emar_orders WHERE status=$1 ORDER BY created_at DESC', ['Active'])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/emar/orders', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, medication, dose, route, frequency, start_date } = req.body;
        const result = await pool.query('INSERT INTO emar_orders (patient_id, patient_name, medication, dose, route, frequency, start_date, prescriber) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [patient_id, patient_name || '', medication || '', dose || '', route || 'Oral', frequency || 'TID', start_date || new Date().toISOString().split('T')[0], req.session.user.name]);
        
        const newOrder = result.rows[0];
        // Notify Pharmacy via Socket
        emitClinicalAlert(patient_id, {
            type: 'info',
            time: 'الآن',
            text: `وصفة طبية جديدة: ${medication} (${dose}) للمريض #${patient_id}`
        });

        res.json(newOrder);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/emar/administrations', requireAuth, async (req, res) => {
    try {
        const { order_id } = req.query;
        if (order_id) res.json((await pool.query('SELECT * FROM emar_administrations WHERE emar_order_id=$1 ORDER BY created_at DESC', [order_id])).rows);
        else res.json((await pool.query('SELECT * FROM emar_administrations ORDER BY created_at DESC LIMIT 50')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/emar/administrations', requireAuth, async (req, res) => {
    try {
        const { emar_order_id, patient_id, medication, dose, scheduled_time, status, reason_not_given, notes } = req.body;
        const result = await pool.query('INSERT INTO emar_administrations (emar_order_id, patient_id, medication, dose, scheduled_time, actual_time, administered_by, status, reason_not_given, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [emar_order_id, patient_id || 0, medication || '', dose || '', scheduled_time || '', new Date().toISOString(), req.session.user.name, status || 'Given', reason_not_given || '', notes || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// NURSING CARE PLANS
router.get('/api/nursing/care-plans', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM nursing_care_plans ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/nursing/care-plans', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, diagnosis, priority, goals, interventions, expected_outcomes } = req.body;
        const result = await pool.query('INSERT INTO nursing_care_plans (patient_id, patient_name, diagnosis, priority, goals, interventions, expected_outcomes, nurse) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [patient_id, patient_name || '', diagnosis || '', priority || 'Medium', goals || '', interventions || '', expected_outcomes || '', req.session.user.name]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/nursing/assessments', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM nursing_assessments ORDER BY created_at DESC LIMIT 50')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/nursing/assessments', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, assessment_type, fall_risk_score, braden_score, pain_score, gcs_score, shift, notes } = req.body;
        const result = await pool.query('INSERT INTO nursing_assessments (patient_id, patient_name, assessment_type, fall_risk_score, braden_score, pain_score, gcs_score, nurse, shift, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [patient_id, patient_name || '', assessment_type || 'General', fall_risk_score || 0, braden_score || 23, pain_score || 0, gcs_score || 15, req.session.user.name, shift || 'Morning', notes || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// NURSING ASSESSMENT SCALES
router.post('/api/nursing/assessment', requireAuth, async (req, res) => {
    try {
        const { patient_id, pain_scale, fall_risk_score, braden_score, notes } = req.body;
        const vitals = (await pool.query('SELECT * FROM nursing_vitals WHERE patient_id=$1 ORDER BY id DESC LIMIT 1', [patient_id])).rows[0];
        if (vitals) {
            await pool.query('UPDATE nursing_vitals SET notes=$1 WHERE id=$2', [
                JSON.stringify({ pain_scale, fall_risk_score, braden_score, notes, assessed_at: new Date().toISOString() }),
                vitals.id
            ]);
        }
        res.json({ success: true, pain_scale, fall_risk_score, braden_score });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// NURSING: TRIAGE + PAIN SCORE
// ===== NURSING: TRIAGE + PAIN SCORE =====
router.post('/api/nursing/triage', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, triage_level, pain_score, chief_complaint, notes, visit_id } = req.body;

        // Update visit lifecycle if visit_id provided
        if (visit_id) {
            await pool.query(
                'UPDATE visit_lifecycle SET status=$1, triage_at=CURRENT_TIMESTAMP, triage_level=$2, pain_score=$3 WHERE id=$4',
                ['triage', triage_level, pain_score, visit_id]
            );
        }

        // Also store in nursing vitals if that table exists
        try {
            await pool.query(
                "UPDATE nursing_vitals SET triage_level=$1, pain_score=$2 WHERE patient_id=$3 AND created_at::date = CURRENT_DATE ORDER BY id DESC LIMIT 1",
                [triage_level, pain_score, patient_id]
            );
        } catch (e) { /* table may not have these columns yet */ }

        res.json({ success: true, triage_level, pain_score });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



// NURSING EXECUTION LOOP (Flowsheets & Tasks)
// ===== NURSING EXECUTION LOOP =====

// 1. Task Management
router.get('/api/nursing/tasks/:dept_id', requireAuth, async (req, res) => {
    try {
        const { dept_id } = req.params;
        // Fetch all pending/in-progress tasks
        const tasks = (await pool.query(`
            SELECT t.*, p.name_en as patient_name, p.name_ar as patient_name_ar 
            FROM nursing_tasks t 
            LEFT JOIN patients p ON t.patient_id = p.id
            WHERE t.specialty_id = $1 AND t.status IN ('Pending', 'In-Progress')
            ORDER BY t.created_at DESC
        `, [dept_id])).rows;
        res.json(tasks);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/api/nursing/tasks/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        let query = 'UPDATE nursing_tasks SET status=$1';
        const params = [status, id];
        
        if (status === 'Completed') {
            query += ', completion_time=CURRENT_TIMESTAMP';
        }
        query += ' WHERE task_id=$2 RETURNING *';
        
        const result = await pool.query(query, params);
        const task = result.rows[0];
        
        if (task && status === 'Completed') {
            // Auto-Billing Trigger
            // We'll search the catalog for a service matching the task name to get the price
            const catalogItem = (await pool.query('SELECT price, service_code FROM service_catalog WHERE name_en ILIKE $1 OR name_ar ILIKE $1 LIMIT 1', [`%${task.task_name}%`])).rows[0];
            const amount = catalogItem ? catalogItem.price : 100.00; // Default price if not found
            const serviceCode = catalogItem ? catalogItem.service_code : 'GEN-001';

            await pool.query(`
                INSERT INTO billing_transactions (patient_id, order_id, task_id, service_code, amount, status)
                VALUES ($1, $2, $3, $4, $5, 'Billed')
            `, [task.patient_id, task.order_id || null, task.task_id, serviceCode, amount]);

            // Notify doctor
            // Assuming doctor ID is tied to the original order, but here we broadcast to a general doctor room or emit event
            emitClinicalAlert(task.patient_id, {
                type: 'success',
                time: 'الآن',
                text: `✅ تم إنجاز المهمة: ${task.task_name} للمريض #${task.patient_id} بواسطة التمريض. (تم الفوترة)`,
                taskId: task.task_id
            });
        }
        res.json({ success: true, task });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// 2. Flowsheet Entry
router.post('/api/nursing/flowsheet/entry', requireAuth, async (req, res) => {
    try {
        const { patient_id, parameter_type, parameter_value, unit } = req.body;
        const nurse_id = req.session.user?.id || 1;
        
        let is_critical = false;
        const valueNum = parseFloat(parameter_value);
        
        if (parameter_type === 'GCS' && valueNum <= 8) is_critical = true;
        if (parameter_type === 'Pain_Scale' && valueNum >= 8) is_critical = true;
        
        const result = await pool.query(`
            INSERT INTO clinical_flowsheets (patient_id, nurse_id, parameter_type, parameter_value, unit, is_critical)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [patient_id, nurse_id, parameter_type, parameter_value, unit || '', is_critical]);
        
        if (is_critical) {
            // Send standard alert
            emitClinicalAlert(patient_id, {
                type: 'urgent',
                time: 'الآن',
                text: `🚨 تنبيه حرج: ${parameter_type} = ${parameter_value} للمريض #${patient_id}. تدخل فوري مطلوب!`
            });

            // Send Full-Screen Critical Promt Overlay
            sendCriticalAlert({
                patientId: patient_id,
                patientName: `مريض #${patient_id}`,
                location: `غرفة التنويم / العناية`,
                message: `انخفاض ${parameter_type} إلى مستوى حرج (${parameter_value})`,
                actionRequired: `التوجه فوراً وتقييم الحالة / استدعاء فريق الإنعاش السريع`
            });
        }
        
        res.json({ success: true, entry: result.rows[0], is_critical });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
