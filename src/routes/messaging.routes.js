/**
 * MESSAGING Routes
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


// MESSAGING
// ===== MESSAGING =====
router.get('/api/messages', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        res.json((await pool.query('SELECT im.*, su.display_name as sender_name FROM internal_messages im LEFT JOIN system_users su ON im.sender_id=su.id WHERE im.receiver_id=$1 ORDER BY im.id DESC', [userId])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/messages', requireAuth, async (req, res) => {
    try {
        const { receiver_id, subject, body, priority } = req.body;
        const result = await pool.query('INSERT INTO internal_messages (sender_id, receiver_id, subject, body, priority) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [req.session.user.id, receiver_id, subject || '', body || '', priority || 'Normal']);
        res.json((await pool.query('SELECT * FROM internal_messages WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// MESSAGING
// ===== MESSAGING =====
router.get('/api/messages', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        res.json((await pool.query(`SELECT m.*, su.display_name as sender_name FROM internal_messages m LEFT JOIN system_users su ON m.sender_id=su.id WHERE m.receiver_id=$1 ORDER BY m.created_at DESC`, [userId])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/messages/sent', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        res.json((await pool.query(`SELECT m.*, su.display_name as receiver_name FROM internal_messages m LEFT JOIN system_users su ON m.receiver_id=su.id WHERE m.sender_id=$1 ORDER BY m.created_at DESC`, [userId])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/messages', requireAuth, async (req, res) => {
    try {
        const { receiver_id, subject, body, priority } = req.body;
        const senderId = req.session.user.id;
        const result = await pool.query('INSERT INTO internal_messages (sender_id, receiver_id, subject, body, priority) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [senderId, receiver_id, subject || '', body || '', priority || 'Normal']);
        logAudit(senderId, req.session.user.name, 'SEND_MESSAGE', 'Messaging', `Message to user ${receiver_id}: ${subject}`, req.ip);
        res.json({ success: true, id: result.rows[0].id });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/messages/:id/read', requireAuth, async (req, res) => {
    try {
        await pool.query('UPDATE internal_messages SET is_read=1 WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/api/messages/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM internal_messages WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
