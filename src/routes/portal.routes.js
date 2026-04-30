/**
 * PORTAL Routes
 * Auto-extracted from server.js | 4 routes
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


// PATIENT PORTAL
// ===== PATIENT PORTAL =====
router.get('/api/portal/users', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT pu.*, p.name_ar, p.name_en, p.file_number FROM portal_users pu LEFT JOIN patients p ON pu.patient_id=p.id ORDER BY pu.id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/portal/users', requireAuth, async (req, res) => {
    try {
        const { patient_id, username, password, email, phone } = req.body;
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(password || '123456', 10);
        const result = await pool.query('INSERT INTO portal_users (patient_id, username, password_hash, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [patient_id, username || '', hash, email || '', phone || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/portal/appointments', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM portal_appointments ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/portal/appointments/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE portal_appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
