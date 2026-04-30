/**
 * INSURANCE Routes
 * Auto-extracted from server.js | 8 routes
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


// INSURANCE
// ===== INSURANCE =====
router.get('/api/insurance/companies', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM insurance_companies ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/insurance/companies', requireAuth, async (req, res) => {
    try {
        const { name_ar, name_en, contact_info } = req.body;
        const result = await pool.query('INSERT INTO insurance_companies (name_ar, name_en, contact_info) VALUES ($1,$2,$3) RETURNING id',
            [name_ar || '', name_en || '', contact_info || '']);
        res.json((await pool.query('SELECT * FROM insurance_companies WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/insurance/claims', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM insurance_claims ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/insurance/claims', requireAuth, async (req, res) => {
    try {
        const { patient_name, insurance_company, claim_amount } = req.body;
        const result = await pool.query('INSERT INTO insurance_claims (patient_name, insurance_company, claim_amount) VALUES ($1,$2,$3) RETURNING id',
            [patient_name, insurance_company, claim_amount || 0]);
        res.json((await pool.query('SELECT * FROM insurance_claims WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/insurance/claims/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (status) await pool.query('UPDATE insurance_claims SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json((await pool.query('SELECT * FROM insurance_claims WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/medical/records', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) {
            res.json((await pool.query('SELECT mr.*, p.name_en as patient_name FROM medical_records mr LEFT JOIN patients p ON mr.patient_id=p.id WHERE mr.patient_id=$1 ORDER BY mr.id DESC', [patient_id])).rows);
        } else {
            res.json((await pool.query('SELECT mr.*, p.name_en as patient_name FROM medical_records mr LEFT JOIN patients p ON mr.patient_id=p.id ORDER BY mr.id DESC')).rows);
        }
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/medical/records', requireAuth, async (req, res) => {
    try {
        const { patient_id, doctor_id, diagnosis, symptoms, icd10_codes, notes } = req.body;
        const result = await pool.query('INSERT INTO medical_records (patient_id, doctor_id, diagnosis, symptoms, icd10_codes, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
            [patient_id, doctor_id || 0, diagnosis || '', symptoms || '', icd10_codes || '', notes || '']);
        res.json((await pool.query('SELECT * FROM medical_records WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// INSURANCE POLICIES
// ===== INSURANCE POLICIES =====
router.get('/api/insurance/policies', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS insurance_policies (id SERIAL PRIMARY KEY, patient_id INTEGER, patient_name VARCHAR(200), company VARCHAR(200), policy_number VARCHAR(100), class VARCHAR(50), coverage_percent NUMERIC(5,2) DEFAULT 80, start_date DATE, end_date DATE, status VARCHAR(30) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        res.json((await pool.query('SELECT * FROM insurance_policies ORDER BY created_at DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



module.exports = router;
