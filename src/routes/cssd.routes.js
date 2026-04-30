/**
 * CSSD Routes
 * Auto-extracted from server.js | 10 routes
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


// CSSD
// ===== CSSD =====
router.get('/api/cssd/instruments', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM cssd_instrument_sets ORDER BY id')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cssd/instruments', requireAuth, async (req, res) => {
    try {
        const { set_name, set_name_ar, set_code, category, instrument_count, instruments_list, department } = req.body;
        const r = await pool.query('INSERT INTO cssd_instrument_sets (set_name,set_name_ar,set_code,category,instrument_count,instruments_list,department) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [set_name, set_name_ar, set_code, category, instrument_count || 0, instruments_list, department]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/cssd/cycles', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM cssd_sterilization_cycles ORDER BY start_time DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cssd/cycles', requireAuth, async (req, res) => {
    try {
        const { cycle_number, machine_name, cycle_type, temperature, pressure, duration_minutes, operator } = req.body;
        const r = await pool.query('INSERT INTO cssd_sterilization_cycles (cycle_number,machine_name,cycle_type,temperature,pressure,duration_minutes,operator) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [cycle_number, machine_name, cycle_type || 'Steam Autoclave', temperature, pressure, duration_minutes, operator]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/cssd/cycles/:id', requireAuth, async (req, res) => {
    try {
        const { status, bi_test_result, ci_result } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (status) { sets.push(`status=$${i++}`); vals.push(status); if (status === 'Completed') { sets.push(`end_time=$${i++}`); vals.push(new Date().toISOString()); } }
        if (bi_test_result) { sets.push(`bi_test_result=$${i++}`); vals.push(bi_test_result); }
        if (ci_result) { sets.push(`ci_result=$${i++}`); vals.push(ci_result); }
        vals.push(req.params.id);
        await pool.query(`UPDATE cssd_sterilization_cycles SET ${sets.join(',')} WHERE id=$${i}`, vals);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cssd/load-items', requireAuth, async (req, res) => {
    try {
        const { cycle_id, set_id, set_name, barcode } = req.body;
        const r = await pool.query('INSERT INTO cssd_load_items (cycle_id,set_id,set_name,barcode) VALUES ($1,$2,$3,$4) RETURNING *', [cycle_id, set_id, set_name, barcode]);
        if (set_id) await pool.query("UPDATE cssd_instrument_sets SET status='In Sterilization' WHERE id=$1", [set_id]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/cssd/load-items/:cycleId', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM cssd_load_items WHERE cycle_id=$1', [req.params.cycleId])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// CSSD BATCHES
// ===== CSSD BATCHES =====
router.get('/api/cssd/batches', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS cssd_batches (id SERIAL PRIMARY KEY, batch_number VARCHAR(50), items TEXT, department VARCHAR(100), method VARCHAR(50), temperature VARCHAR(20), operator VARCHAR(100), status VARCHAR(30) DEFAULT 'processing', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        res.json((await pool.query('SELECT * FROM cssd_batches ORDER BY created_at DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cssd/batches', requireAuth, async (req, res) => {
    try {
        const { batch_number, items, department, method, temperature, operator, status } = req.body;
        const r = await pool.query('INSERT INTO cssd_batches (batch_number,items,department,method,temperature,operator,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [batch_number, items, department, method, temperature, operator, status || 'processing']);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/cssd/batches/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const r = await pool.query('UPDATE cssd_batches SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
