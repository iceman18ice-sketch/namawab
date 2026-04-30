/**
 * AUDIT Routes
 * Auto-extracted from server.js | 2 routes
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


// AUDIT TRAIL
// ===== AUDIT TRAIL =====
router.get('/api/audit-trail', requireAuth, async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        res.json((await pool.query('SELECT * FROM audit_trail ORDER BY created_at DESC LIMIT $1', [parseInt(limit)])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// AUDIT TRAIL VIEWER
// ===== AUDIT TRAIL VIEWER =====
router.get('/api/admin/audit-trail', requireAuth, async (req, res) => {
    try {
        const { module, action, limit: lim } = req.query;
        let query = 'SELECT * FROM audit_trail';
        const conds = [], params = [];
        if (module) { conds.push('module=$' + (params.length + 1)); params.push(module); }
        if (action) { conds.push('action=$' + (params.length + 1)); params.push(action); }
        if (conds.length) query += ' WHERE ' + conds.join(' AND ');
        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
        params.push(parseInt(lim) || 100);
        res.json((await pool.query(query, params)).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
