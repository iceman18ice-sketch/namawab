/**
 * PATHOLOGY Routes
 * Auto-extracted from server.js | 5 routes
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


// PATHOLOGY
// ===== PATHOLOGY =====
router.get('/api/pathology/cases', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM pathology_cases ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/pathology/cases', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, specimen_type, collection_date, gross_description, notes } = req.body;
        const result = await pool.query('INSERT INTO pathology_cases (patient_id, patient_name, specimen_type, collection_date, received_date, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [patient_id, patient_name || '', specimen_type || '', collection_date || new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], 'Received']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/pathology/cases/:id', requireAuth, async (req, res) => {
    try {
        const { gross_description, microscopic_findings, diagnosis, icd_code, stage, grade, status } = req.body;
        await pool.query('UPDATE pathology_cases SET gross_description=$1, microscopic_findings=$2, diagnosis=$3, icd_code=$4, stage=$5, grade=$6, status=$7, pathologist=$8, report_date=$9 WHERE id=$10',
            [gross_description || '', microscopic_findings || '', diagnosis || '', icd_code || '', stage || '', grade || '', status || 'Reported', req.session.user.name, new Date().toISOString().split('T')[0], req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PATHOLOGY SPECIMENS
// ===== PATHOLOGY SPECIMENS =====
router.get('/api/pathology/specimens', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS pathology_specimens (id SERIAL PRIMARY KEY, patient_name VARCHAR(200), specimen_type VARCHAR(100), site VARCHAR(200), doctor VARCHAR(200), clinical_details TEXT, priority VARCHAR(30), status VARCHAR(30) DEFAULT 'received', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        res.json((await pool.query('SELECT * FROM pathology_specimens ORDER BY created_at DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/pathology/specimens', requireAuth, async (req, res) => {
    try {
        const { patient_name, specimen_type, site, doctor, clinical_details, priority, status } = req.body;
        const r = await pool.query('INSERT INTO pathology_specimens (patient_name,specimen_type,site,doctor,clinical_details,priority,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [patient_name, specimen_type, site, doctor, clinical_details, priority, status || 'received']);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
