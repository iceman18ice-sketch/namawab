/**
 * QUALITY Routes
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


// QUALITY & PATIENT SAFETY
// ===== QUALITY & PATIENT SAFETY =====
router.get('/api/quality/incidents', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM quality_incidents ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/quality/incidents', requireAuth, async (req, res) => {
    try {
        const { incident_type, severity, incident_date, incident_time, department, location, patient_id, patient_name, description, immediate_action, reported_by } = req.body;
        const r = await pool.query('INSERT INTO quality_incidents (incident_type,severity,incident_date,incident_time,department,location,patient_id,patient_name,description,immediate_action,reported_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
            [incident_type, severity || 'Minor', incident_date || new Date().toISOString().split('T')[0], incident_time, department, location, patient_id || 0, patient_name, description, immediate_action, reported_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/quality/incidents/:id', requireAuth, async (req, res) => {
    try {
        const { status, assigned_to, root_cause, corrective_action, preventive_action } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (status) { sets.push(`status=$${i++}`); vals.push(status); if (status === 'Closed') { sets.push(`closed_date=$${i++}`); vals.push(new Date().toISOString().split('T')[0]); } }
        if (assigned_to) { sets.push(`assigned_to=$${i++}`); vals.push(assigned_to); }
        if (root_cause) { sets.push(`root_cause=$${i++}`); vals.push(root_cause); }
        if (corrective_action) { sets.push(`corrective_action=$${i++}`); vals.push(corrective_action); }
        if (preventive_action) { sets.push(`preventive_action=$${i++}`); vals.push(preventive_action); }
        vals.push(req.params.id);
        await pool.query(`UPDATE quality_incidents SET ${sets.join(',')} WHERE id=$${i}`, vals);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/quality/satisfaction', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM quality_patient_satisfaction ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/quality/satisfaction', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, department, overall_rating, cleanliness, staff_courtesy, wait_time, communication, pain_management, food_quality, comments, would_recommend } = req.body;
        const r = await pool.query('INSERT INTO quality_patient_satisfaction (patient_id,patient_name,department,survey_date,overall_rating,cleanliness,staff_courtesy,wait_time,communication,pain_management,food_quality,comments,would_recommend) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
            [patient_id || 0, patient_name, department, new Date().toISOString().split('T')[0], overall_rating, cleanliness, staff_courtesy, wait_time, communication, pain_management, food_quality, comments, would_recommend ? 1 : 0]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/quality/kpis', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM quality_kpis ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/quality/kpis', requireAuth, async (req, res) => {
    try {
        const { kpi_name, kpi_name_ar, category, target_value, actual_value, unit, period, department } = req.body;
        const status = actual_value >= target_value ? 'On Track' : actual_value >= target_value * 0.8 ? 'At Risk' : 'Below Target';
        const r = await pool.query('INSERT INTO quality_kpis (kpi_name,kpi_name_ar,category,target_value,actual_value,unit,period,department,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [kpi_name, kpi_name_ar, category, target_value, actual_value, unit || '%', period, department, status]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/quality/stats', requireAuth, async (req, res) => {
    try {
        const open = (await pool.query("SELECT COUNT(*) as cnt FROM quality_incidents WHERE status='Open'")).rows[0].cnt;
        const total = (await pool.query('SELECT COUNT(*) as cnt FROM quality_incidents')).rows[0].cnt;
        const avgSat = (await pool.query('SELECT COALESCE(AVG(overall_rating),0) as avg FROM quality_patient_satisfaction')).rows[0].avg;
        const kpiOnTrack = (await pool.query("SELECT COUNT(*) as cnt FROM quality_kpis WHERE status='On Track'")).rows[0].cnt;
        const kpiTotal = (await pool.query('SELECT COUNT(*) as cnt FROM quality_kpis')).rows[0].cnt;
        res.json({ openIncidents: open, totalIncidents: total, avgSatisfaction: parseFloat(parseFloat(avgSat).toFixed(1)), kpiOnTrack, kpiTotal });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
