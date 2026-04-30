/**
 * INFECTION Routes
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


// INFECTION CONTROL
// ===== INFECTION CONTROL =====
router.get('/api/infection/surveillance', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM infection_surveillance ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/infection/surveillance', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, infection_type, infection_site, organism, sensitivity, hai_category, device_related, device_type, ward, bed, isolation_type, reported_by, notes } = req.body;
        const r = await pool.query('INSERT INTO infection_surveillance (patient_id,patient_name,infection_type,infection_site,organism,sensitivity,detection_date,hai_category,device_related,device_type,ward,bed,isolation_type,reported_by,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *',
            [patient_id, patient_name, infection_type, infection_site, organism, sensitivity, new Date().toISOString().split('T')[0], hai_category, device_related ? 1 : 0, device_type, ward, bed, isolation_type, reported_by, notes]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/infection/outbreaks', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM infection_outbreaks ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/infection/outbreaks', requireAuth, async (req, res) => {
    try {
        const { outbreak_name, organism, affected_ward, investigation_notes, control_measures, reported_by } = req.body;
        const r = await pool.query('INSERT INTO infection_outbreaks (outbreak_name,organism,start_date,affected_ward,investigation_notes,control_measures,reported_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [outbreak_name, organism, new Date().toISOString().split('T')[0], affected_ward, investigation_notes, control_measures, reported_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/infection/outbreaks/:id', requireAuth, async (req, res) => {
    try {
        const { status, total_cases, control_measures } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (status) { sets.push(`status=$${i++}`); vals.push(status); if (status === 'Resolved') { sets.push(`end_date=$${i++}`); vals.push(new Date().toISOString().split('T')[0]); } }
        if (total_cases !== undefined) { sets.push(`total_cases=$${i++}`); vals.push(total_cases); }
        if (control_measures) { sets.push(`control_measures=$${i++}`); vals.push(control_measures); }
        vals.push(req.params.id);
        await pool.query(`UPDATE infection_outbreaks SET ${sets.join(',')} WHERE id=$${i}`, vals);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/infection/exposures', requireAuth, async (req, res) => {
    try {
        const { employee_id, employee_name, exposure_type, source_patient, body_fluid, ppe_worn, action_taken, followup_date, reported_by } = req.body;
        const r = await pool.query('INSERT INTO employee_exposures (employee_id,employee_name,exposure_type,exposure_date,source_patient,body_fluid,ppe_worn,action_taken,followup_date,reported_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [employee_id, employee_name, exposure_type, new Date().toISOString().split('T')[0], source_patient, body_fluid, ppe_worn, action_taken, followup_date, reported_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/infection/exposures', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM employee_exposures ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/infection/hand-hygiene', requireAuth, async (req, res) => {
    try {
        const { auditor, department, moments_observed, moments_compliant, notes } = req.body;
        const rate = moments_observed > 0 ? parseFloat((moments_compliant / moments_observed * 100).toFixed(1)) : 0;
        const r = await pool.query('INSERT INTO hand_hygiene_audits (audit_date,auditor,department,moments_observed,moments_compliant,compliance_rate,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [new Date().toISOString().split('T')[0], auditor, department, moments_observed, moments_compliant, rate, notes]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/infection/hand-hygiene', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM hand_hygiene_audits ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/infection/stats', requireAuth, async (req, res) => {
    try {
        const total = (await pool.query('SELECT COUNT(*) as cnt FROM infection_surveillance')).rows[0].cnt;
        const active = (await pool.query("SELECT COUNT(*) as cnt FROM infection_outbreaks WHERE status='Active'")).rows[0].cnt;
        const hai = (await pool.query("SELECT COUNT(*) as cnt FROM infection_surveillance WHERE hai_category != ''")).rows[0].cnt;
        const avgHH = (await pool.query('SELECT COALESCE(AVG(compliance_rate),0) as avg FROM hand_hygiene_audits')).rows[0].avg;
        res.json({ totalInfections: total, activeOutbreaks: active, haiCount: hai, avgHandHygiene: parseFloat(parseFloat(avgHH).toFixed(1)) });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
