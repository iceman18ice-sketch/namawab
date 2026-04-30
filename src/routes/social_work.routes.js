/**
 * SOCIAL_WORK Routes
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


// SOCIAL WORK
// ===== SOCIAL WORK =====
router.get('/api/social-work/cases', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM social_work_cases ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/social-work/cases', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, case_type, assessment, plan, priority } = req.body;
        const result = await pool.query('INSERT INTO social_work_cases (patient_id, patient_name, case_type, social_worker, assessment, plan, priority) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [patient_id, patient_name || '', case_type || 'General', req.session.user.name, assessment || '', plan || '', priority || 'Medium']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/social-work/cases/:id', requireAuth, async (req, res) => {
    try {
        const { status, interventions, referrals, follow_up_date } = req.body;
        await pool.query('UPDATE social_work_cases SET status=$1, interventions=$2, referrals=$3, follow_up_date=$4 WHERE id=$5',
            [status || 'Open', interventions || '', referrals || '', follow_up_date || '', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
