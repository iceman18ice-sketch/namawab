/**
 * BLOOD_BANK Routes
 * Auto-extracted from server.js | 11 routes
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


// BLOOD BANK
// ===== BLOOD BANK =====
router.get('/api/blood-bank/units', requireAuth, async (req, res) => {
    try {
        const { status, blood_type } = req.query;
        let q = 'SELECT * FROM blood_bank_units'; const params = []; const conds = [];
        if (status) { params.push(status); conds.push(`status=$${params.length}`); }
        if (blood_type) { params.push(blood_type); conds.push(`blood_type=$${params.length}`); }
        if (conds.length) q += ' WHERE ' + conds.join(' AND ');
        q += ' ORDER BY id DESC';
        res.json((await pool.query(q, params)).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/blood-bank/units', requireAuth, async (req, res) => {
    try {
        const { bag_number, blood_type, rh_factor, component, donor_id, collection_date, expiry_date, volume_ml, storage_location, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO blood_bank_units (bag_number, blood_type, rh_factor, component, donor_id, collection_date, expiry_date, volume_ml, storage_location, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
            [bag_number || '', blood_type || '', rh_factor || '+', component || 'Whole Blood', donor_id || 0, collection_date || '', expiry_date || '', volume_ml || 450, storage_location || '', notes || '']);
        res.json((await pool.query('SELECT * FROM blood_bank_units WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/blood-bank/units/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (status) await pool.query('UPDATE blood_bank_units SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json((await pool.query('SELECT * FROM blood_bank_units WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/blood-bank/donors', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM blood_bank_donors ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/blood-bank/donors', requireAuth, async (req, res) => {
    try {
        const { donor_name, donor_name_ar, national_id, phone, blood_type, rh_factor, age, gender, medical_history, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO blood_bank_donors (donor_name, donor_name_ar, national_id, phone, blood_type, rh_factor, age, gender, last_donation_date, medical_history, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE::TEXT,$9,$10) RETURNING id',
            [donor_name || '', donor_name_ar || '', national_id || '', phone || '', blood_type || '', rh_factor || '+', age || 0, gender || '', medical_history || '', notes || '']);
        res.json((await pool.query('SELECT * FROM blood_bank_donors WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/blood-bank/crossmatch', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, patient_blood_type, units_needed, unit_id, surgery_id, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO blood_bank_crossmatch (patient_id, patient_name, patient_blood_type, units_needed, unit_id, lab_technician, surgery_id, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
            [patient_id || 0, patient_name || '', patient_blood_type || '', units_needed || 1, unit_id || 0, req.session.user.name || '', surgery_id || 0, notes || '']);
        res.json((await pool.query('SELECT * FROM blood_bank_crossmatch WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/blood-bank/crossmatch', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM blood_bank_crossmatch ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/blood-bank/crossmatch/:id', requireAuth, async (req, res) => {
    try {
        const { result: matchResult } = req.body;
        if (matchResult) await pool.query('UPDATE blood_bank_crossmatch SET result=$1 WHERE id=$2', [matchResult, req.params.id]);
        res.json((await pool.query('SELECT * FROM blood_bank_crossmatch WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/blood-bank/transfusions', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM blood_bank_transfusions ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/blood-bank/transfusions', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, unit_id, bag_number, blood_type, component, administered_by, start_time, volume_ml, notes } = req.body;
        // Mark unit as Used
        if (unit_id) await pool.query("UPDATE blood_bank_units SET status='Used' WHERE id=$1", [unit_id]);
        const result = await pool.query(
            'INSERT INTO blood_bank_transfusions (patient_id, patient_name, unit_id, bag_number, blood_type, component, administered_by, start_time, volume_ml, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
            [patient_id || 0, patient_name || '', unit_id || 0, bag_number || '', blood_type || '', component || '', administered_by || req.session.user.name || '', start_time || new Date().toISOString(), volume_ml || 0, notes || '']);
        res.json((await pool.query('SELECT * FROM blood_bank_transfusions WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/blood-bank/stats', requireAuth, async (req, res) => {
    try {
        const total = (await pool.query("SELECT COUNT(*) as cnt FROM blood_bank_units WHERE status='Available'")).rows[0].cnt;
        const expiring = (await pool.query("SELECT COUNT(*) as cnt FROM blood_bank_units WHERE status='Available' AND expiry_date != '' AND expiry_date <= (CURRENT_DATE + INTERVAL '7 days')::TEXT")).rows[0].cnt;
        const todayTransfusions = (await pool.query("SELECT COUNT(*) as cnt FROM blood_bank_transfusions WHERE created_at::date = CURRENT_DATE")).rows[0].cnt;
        const byType = (await pool.query("SELECT blood_type, rh_factor, COUNT(*) as cnt FROM blood_bank_units WHERE status='Available' GROUP BY blood_type, rh_factor ORDER BY blood_type")).rows;
        const totalDonors = (await pool.query('SELECT COUNT(*) as cnt FROM blood_bank_donors')).rows[0].cnt;
        const pendingCrossmatch = (await pool.query("SELECT COUNT(*) as cnt FROM blood_bank_crossmatch WHERE result='Pending'")).rows[0].cnt;
        res.json({ total, expiring, todayTransfusions, byType, totalDonors, pendingCrossmatch });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
