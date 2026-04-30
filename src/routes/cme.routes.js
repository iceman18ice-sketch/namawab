/**
 * CME Routes
 * Auto-extracted from server.js | 6 routes
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


// CME
// ===== CME =====
router.get('/api/cme/activities', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM cme_activities ORDER BY activity_date DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cme/activities', requireAuth, async (req, res) => {
    try {
        const { title, category, provider, credit_hours, activity_date, location, max_participants, description } = req.body;
        const result = await pool.query('INSERT INTO cme_activities (title, category, provider, credit_hours, activity_date, location, max_participants, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [title || '', category || 'Conference', provider || '', credit_hours || 0, activity_date || '', location || '', max_participants || 50, description || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/cme/registrations', requireAuth, async (req, res) => {
    try {
        const { activity_id } = req.query;
        if (activity_id) res.json((await pool.query('SELECT * FROM cme_registrations WHERE activity_id=$1', [activity_id])).rows);
        else res.json((await pool.query('SELECT * FROM cme_registrations ORDER BY id DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cme/registrations', requireAuth, async (req, res) => {
    try {
        const { activity_id, employee_name } = req.body;
        const result = await pool.query('INSERT INTO cme_registrations (activity_id, employee_name, registration_date) VALUES ($1,$2,$3) RETURNING *',
            [activity_id, employee_name || req.session.user.name, new Date().toISOString().split('T')[0]]);
        await pool.query('UPDATE cme_activities SET registered=registered+1 WHERE id=$1', [activity_id]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// CME EVENTS
// ===== CME EVENTS =====
router.get('/api/cme/events', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS cme_events (id SERIAL PRIMARY KEY, title VARCHAR(300), speaker VARCHAR(200), event_date DATE, cme_hours NUMERIC(4,1), category VARCHAR(50), department VARCHAR(100), status VARCHAR(30) DEFAULT 'upcoming', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        res.json((await pool.query('SELECT * FROM cme_events ORDER BY event_date DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cme/events', requireAuth, async (req, res) => {
    try {
        const { title, speaker, event_date, cme_hours, category, department, status } = req.body;
        const r = await pool.query('INSERT INTO cme_events (title,speaker,event_date,cme_hours,category,department,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [title, speaker, event_date, cme_hours || 0, category, department, status || 'upcoming']);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
