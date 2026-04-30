/**
 * MEDICAL_RECORDS Routes
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


// MEDICAL RECORDS / HIM
// ===== MEDICAL RECORDS / HIM =====
router.get('/api/medical-records/files', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM medical_records_files ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/medical-records/requests', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM medical_records_requests ORDER BY requested_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/medical-records/requests', requireAuth, async (req, res) => {
    try {
        const { patient_id, file_number, department, purpose, notes } = req.body;
        const result = await pool.query('INSERT INTO medical_records_requests (patient_id, file_number, requested_by, department, purpose, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [patient_id, file_number, req.session.user.name, department || '', purpose || 'Clinic Visit', notes || '']);
        logAudit(req.session.user.id, req.session.user.name, 'REQUEST_FILE', 'Medical Records', `File ${file_number} requested`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/medical-records/requests/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const now = new Date().toISOString();
        if (status === 'Delivered') await pool.query('UPDATE medical_records_requests SET status=$1, delivered_at=$2 WHERE id=$3', [status, now, req.params.id]);
        else if (status === 'Returned') await pool.query('UPDATE medical_records_requests SET status=$1, returned_at=$2 WHERE id=$3', [status, now, req.params.id]);
        else await pool.query('UPDATE medical_records_requests SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/medical-records/coding', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM medical_records_coding ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/medical-records/coding', requireAuth, async (req, res) => {
    try {
        const { patient_id, visit_id, primary_diagnosis, primary_icd10, secondary_diagnoses, drg_code, notes } = req.body;
        const result = await pool.query('INSERT INTO medical_records_coding (patient_id, visit_id, primary_diagnosis, primary_icd10, secondary_diagnoses, drg_code, coder, coding_date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [patient_id, visit_id || 0, primary_diagnosis || '', primary_icd10 || '', secondary_diagnoses || '', drg_code || '', req.session.user.name, new Date().toISOString().split('T')[0], 'Coded']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// MEDICAL RECORDS BY PATIENT
// ===== MEDICAL RECORDS BY PATIENT =====
router.get('/api/medical-records/patient/:patientId', requireAuth, async (req, res) => {
    try {
        const records = (await pool.query("SELECT * FROM medical_records WHERE patient_id=$1 ORDER BY created_at DESC", [req.params.patientId])).rows;
        res.json(records);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});




module.exports = router;
