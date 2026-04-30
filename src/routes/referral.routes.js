/**
 * REFERRAL Routes
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


// PATIENT REFERRAL
// ===== PATIENT REFERRAL =====
router.put('/api/patients/:id/referral', requireAuth, async (req, res) => {
    try {
        const { department } = req.body;
        await pool.query('UPDATE patients SET department=$1 WHERE id=$2', [department, req.params.id]);
        res.json((await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PATIENT REFERRALS
// ===== PATIENT REFERRALS =====
router.get('/api/referrals', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) {
            res.json((await pool.query('SELECT * FROM patient_referrals WHERE patient_id=$1 ORDER BY id DESC', [patient_id])).rows);
        } else {
            res.json((await pool.query('SELECT * FROM patient_referrals ORDER BY id DESC')).rows);
        }
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/referrals', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, to_department, to_doctor, reason, urgency, notes } = req.body;
        const fromDoctor = req.session.user.name || '';
        const fromDoctorId = req.session.user.id || 0;
        const result = await pool.query(
            'INSERT INTO patient_referrals (patient_id, patient_name, from_doctor_id, from_doctor, to_department, to_doctor, reason, urgency, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
            [patient_id, patient_name || '', fromDoctorId, fromDoctor, to_department || '', to_doctor || '', reason || '', urgency || 'Normal', notes || '']);
        res.json((await pool.query('SELECT * FROM patient_referrals WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/referrals/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE patient_referrals SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json((await pool.query('SELECT * FROM patient_referrals WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// REFERRAL SYSTEM
// ===== REFERRAL SYSTEM =====
router.post('/api/referrals', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, from_doctor, from_dept, to_dept, to_doctor, reason, urgency, notes } = req.body;
        await pool.query(`CREATE TABLE IF NOT EXISTS referrals (
            id SERIAL PRIMARY KEY, patient_id INTEGER, patient_name TEXT DEFAULT '', from_doctor TEXT DEFAULT '', from_dept TEXT DEFAULT '',
            to_dept TEXT DEFAULT '', to_doctor TEXT DEFAULT '', reason TEXT DEFAULT '', urgency TEXT DEFAULT 'Routine',
            notes TEXT DEFAULT '', status TEXT DEFAULT 'Pending', response TEXT DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        const result = await pool.query('INSERT INTO referrals (patient_id, patient_name, from_doctor, from_dept, to_dept, to_doctor, reason, urgency, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [patient_id, patient_name || '', from_doctor || req.session.user?.display_name || '', from_dept || '', to_dept || '', to_doctor || '', reason || '', urgency || 'Routine', notes || '']);
        await pool.query('INSERT INTO notifications (target_role, title, message, type, module) VALUES ($1,$2,$3,$4,$5)',
            ['Doctor', 'New Referral', 'Patient: ' + patient_name + ' referred to ' + to_dept + ' - ' + reason, 'info', 'Referrals']);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'REFERRAL', 'Doctor', 'Referred ' + patient_name + ' to ' + to_dept, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/referrals', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS referrals (
            id SERIAL PRIMARY KEY, patient_id INTEGER, patient_name TEXT DEFAULT '', from_doctor TEXT DEFAULT '', from_dept TEXT DEFAULT '',
            to_dept TEXT DEFAULT '', to_doctor TEXT DEFAULT '', reason TEXT DEFAULT '', urgency TEXT DEFAULT 'Routine',
            notes TEXT DEFAULT '', status TEXT DEFAULT 'Pending', response TEXT DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        const { patient_id } = req.query;
        if (patient_id) res.json((await pool.query('SELECT * FROM referrals WHERE patient_id=$1 ORDER BY created_at DESC', [patient_id])).rows);
        else res.json((await pool.query('SELECT * FROM referrals ORDER BY created_at DESC LIMIT 100')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
