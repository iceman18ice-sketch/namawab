/**
 * TELEMEDICINE Routes
 * Auto-extracted from server.js | 3 routes
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


// TELEMEDICINE
// ===== TELEMEDICINE =====
router.get('/api/telemedicine/sessions', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM telemedicine_sessions ORDER BY scheduled_date DESC, scheduled_time DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/telemedicine/sessions', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, speciality, session_type, scheduled_date, scheduled_time, duration_minutes, notes } = req.body;
        const link = 'https://meet.nama.sa/' + Math.random().toString(36).substring(7);
        const result = await pool.query('INSERT INTO telemedicine_sessions (patient_id, patient_name, doctor, speciality, session_type, scheduled_date, scheduled_time, duration_minutes, meeting_link, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [patient_id, patient_name || '', req.session.user.name, speciality || '', session_type || 'Video', scheduled_date || '', scheduled_time || '', duration_minutes || 15, link, notes || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/telemedicine/sessions/:id', requireAuth, async (req, res) => {
    try {
        const { status, diagnosis, prescription } = req.body;
        await pool.query('UPDATE telemedicine_sessions SET status=$1, diagnosis=$2, prescription=$3 WHERE id=$4', [status || 'Completed', diagnosis || '', prescription || '', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
