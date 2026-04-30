/**
 * NOTIFICATIONS Routes
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


// NOTIFICATIONS
// ===== NOTIFICATIONS =====
router.get('/api/notifications', requireAuth, async (req, res) => {
    try {
        const role = req.session.user?.role || '';
        const userId = req.session.user?.id;
        const notifs = (await pool.query("SELECT * FROM notifications WHERE (user_id=$1 OR target_role=$2 OR target_role='') ORDER BY created_at DESC LIMIT 50", [userId, role])).rows;
        res.json({ notifications: notifs, unread: notifs.filter(n => !n.is_read).length });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read=1 WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
