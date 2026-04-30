/**
 * REHAB Routes
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


// REHABILITATION / PT
// ===== REHABILITATION / PT =====
router.get('/api/rehab/patients', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM rehab_patients ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/rehab/patients', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, diagnosis, referral_source, therapist, therapy_type, start_date, target_end_date, notes } = req.body;
        const result = await pool.query('INSERT INTO rehab_patients (patient_id, patient_name, diagnosis, referral_source, therapist, therapy_type, start_date, target_end_date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [patient_id, patient_name || '', diagnosis || '', referral_source || '', therapist || '', therapy_type || 'Physical Therapy', start_date || new Date().toISOString().split('T')[0], target_end_date || '', notes || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/rehab/sessions', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) res.json((await pool.query('SELECT * FROM rehab_sessions WHERE rehab_patient_id=$1 ORDER BY session_number DESC', [patient_id])).rows);
        else res.json((await pool.query('SELECT * FROM rehab_sessions ORDER BY created_at DESC LIMIT 100')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/rehab/sessions', requireAuth, async (req, res) => {
    try {
        const { rehab_patient_id, patient_id, session_number, therapist, session_type, exercises, duration_minutes, pain_before, pain_after, progress_notes } = req.body;
        const result = await pool.query('INSERT INTO rehab_sessions (rehab_patient_id, patient_id, session_date, session_number, therapist, session_type, exercises, duration_minutes, pain_before, pain_after, progress_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
            [rehab_patient_id, patient_id || 0, new Date().toISOString().split('T')[0], session_number || 1, therapist || req.session.user.name, session_type || 'Individual', exercises || '', duration_minutes || 30, pain_before || 0, pain_after || 0, progress_notes || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/rehab/goals', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) res.json((await pool.query('SELECT * FROM rehab_goals WHERE rehab_patient_id=$1 ORDER BY id', [patient_id])).rows);
        else res.json((await pool.query('SELECT * FROM rehab_goals ORDER BY id DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/rehab/goals', requireAuth, async (req, res) => {
    try {
        const { rehab_patient_id, goal_description, target_date } = req.body;
        const result = await pool.query('INSERT INTO rehab_goals (rehab_patient_id, goal_description, target_date) VALUES ($1,$2,$3) RETURNING *',
            [rehab_patient_id, goal_description || '', target_date || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/rehab/goals/:id', requireAuth, async (req, res) => {
    try {
        const { progress, status } = req.body;
        await pool.query('UPDATE rehab_goals SET progress=$1, status=$2 WHERE id=$3', [progress || 0, status || 'In Progress', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
