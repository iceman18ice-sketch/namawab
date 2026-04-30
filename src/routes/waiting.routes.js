/**
 * WAITING Routes
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


// WAITING QUEUE
// ===== WAITING QUEUE =====
router.get('/api/queue/patients', requireAuth, async (req, res) => {
    try { res.json((await pool.query("SELECT * FROM patients WHERE status IN ('Waiting','With Doctor','With Nurse') ORDER BY id DESC")).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/queue/patients/:id/status', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE patients SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json((await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/queue/ads', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM queue_advertisements WHERE is_active=1 ORDER BY display_order')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/queue/ads', requireAuth, async (req, res) => {
    try {
        const { title, image_path, duration_seconds } = req.body;
        const result = await pool.query('INSERT INTO queue_advertisements (title, image_path, duration_seconds) VALUES ($1,$2,$3) RETURNING id',
            [title || '', image_path || '', duration_seconds || 10]);
        res.json((await pool.query('SELECT * FROM queue_advertisements WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
