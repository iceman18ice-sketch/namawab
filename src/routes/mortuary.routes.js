/**
 * MORTUARY Routes
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


// MORTUARY
// ===== MORTUARY =====
router.get('/api/mortuary/cases', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM mortuary_cases ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/mortuary/cases', requireAuth, async (req, res) => {
    try {
        const { patient_id, deceased_name, date_of_death, time_of_death, cause_of_death, attending_physician, next_of_kin, next_of_kin_phone, notes } = req.body;
        const result = await pool.query('INSERT INTO mortuary_cases (patient_id, deceased_name, date_of_death, time_of_death, cause_of_death, attending_physician, next_of_kin, next_of_kin_phone, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [patient_id || 0, deceased_name || '', date_of_death || new Date().toISOString().split('T')[0], time_of_death || '', cause_of_death || '', attending_physician || '', next_of_kin || '', next_of_kin_phone || '', notes || '']);
        logAudit(req.session.user.id, req.session.user.name, 'DEATH_RECORD', 'Mortuary', `Death record for ${deceased_name}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/mortuary/cases/:id', requireAuth, async (req, res) => {
    try {
        const { release_status, released_to, death_certificate_number } = req.body;
        await pool.query('UPDATE mortuary_cases SET release_status=$1, released_to=$2, released_date=$3, death_certificate_number=$4 WHERE id=$5',
            [release_status || 'Released', released_to || '', new Date().toISOString().split('T')[0], death_certificate_number || '', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
