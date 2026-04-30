/**
 * EMERGENCY Routes
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


// EMERGENCY DEPARTMENT
// ===== EMERGENCY DEPARTMENT =====
router.get('/api/emergency/visits', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM emergency_visits ORDER BY arrival_time DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/emergency/visits', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, arrival_mode, chief_complaint, chief_complaint_ar, triage_level, triage_color, triage_nurse, triage_vitals, assigned_doctor, assigned_bed, acuity_notes } = req.body;
        const r = await pool.query('INSERT INTO emergency_visits (patient_id,patient_name,arrival_mode,chief_complaint,chief_complaint_ar,triage_level,triage_color,triage_nurse,triage_vitals,assigned_doctor,assigned_bed,acuity_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
            [patient_id, patient_name, arrival_mode || 'Walk-in', chief_complaint, chief_complaint_ar, triage_level || 3, triage_color || 'Yellow', triage_nurse, triage_vitals, assigned_doctor, assigned_bed, acuity_notes]);
        if (assigned_bed) await pool.query("UPDATE emergency_beds SET status='Occupied', current_patient_id=$1 WHERE bed_name=$2", [patient_id, assigned_bed]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/emergency/visits/:id', requireAuth, async (req, res) => {
    try {
        const { status, disposition, assigned_doctor, assigned_bed, triage_level, triage_color,
            discharge_diagnosis, discharge_instructions, discharge_medications, followup_date } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (status) { sets.push(`status=$${i++}`); vals.push(status); }
        if (disposition) { sets.push(`disposition=$${i++}`); vals.push(disposition); sets.push(`disposition_time=$${i++}`); vals.push(new Date().toISOString()); }
        if (assigned_doctor) { sets.push(`assigned_doctor=$${i++}`); vals.push(assigned_doctor); }
        if (assigned_bed) { sets.push(`assigned_bed=$${i++}`); vals.push(assigned_bed); }
        if (triage_level) { sets.push(`triage_level=$${i++}`); vals.push(triage_level); }
        if (triage_color) { sets.push(`triage_color=$${i++}`); vals.push(triage_color); }
        if (discharge_diagnosis) { sets.push(`discharge_diagnosis=$${i++}`); vals.push(discharge_diagnosis); }
        if (discharge_instructions) { sets.push(`discharge_instructions=$${i++}`); vals.push(discharge_instructions); }
        if (discharge_medications) { sets.push(`discharge_medications=$${i++}`); vals.push(discharge_medications); }
        if (followup_date) { sets.push(`followup_date=$${i++}`); vals.push(followup_date); }
        if (status === 'Discharged') { sets.push(`discharge_time=$${i++}`); vals.push(new Date().toISOString()); }
        vals.push(req.params.id);
        await pool.query(`UPDATE emergency_visits SET ${sets.join(',')} WHERE id=$${i}`, vals);
        if (status === 'Discharged' || status === 'Admitted') {
            const v = (await pool.query('SELECT assigned_bed FROM emergency_visits WHERE id=$1', [req.params.id])).rows[0];
            if (v?.assigned_bed) await pool.query("UPDATE emergency_beds SET status='Available', current_patient_id=0 WHERE bed_name=$1", [v.assigned_bed]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/emergency/beds', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM emergency_beds ORDER BY id')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/emergency/stats', requireAuth, async (req, res) => {
    try {
        const active = (await pool.query("SELECT COUNT(*) as cnt FROM emergency_visits WHERE status='Active'")).rows[0].cnt;
        const today = (await pool.query("SELECT COUNT(*) as cnt FROM emergency_visits WHERE DATE(arrival_time)=CURRENT_DATE")).rows[0].cnt;
        const critical = (await pool.query("SELECT COUNT(*) as cnt FROM emergency_visits WHERE status='Active' AND triage_level<=2")).rows[0].cnt;
        const beds = (await pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE status='Available') as available FROM emergency_beds")).rows[0];
        const byTriage = (await pool.query("SELECT triage_color, COUNT(*) as cnt FROM emergency_visits WHERE status='Active' GROUP BY triage_color")).rows;
        res.json({ active, today, critical, totalBeds: beds.total, availableBeds: beds.available, byTriage });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/emergency/trauma/:visitId', requireAuth, async (req, res) => {
    try {
        const { patient_id, airway, breathing, circulation, disability, exposure, gcs_eye, gcs_verbal, gcs_motor, mechanism_of_injury, trauma_team_activated, assessed_by } = req.body;
        const gcs_total = (parseInt(gcs_eye) || 4) + (parseInt(gcs_verbal) || 5) + (parseInt(gcs_motor) || 6);
        const r = await pool.query('INSERT INTO emergency_trauma_assessments (visit_id,patient_id,airway,breathing,circulation,disability,exposure,gcs_eye,gcs_verbal,gcs_motor,gcs_total,mechanism_of_injury,trauma_team_activated,assessed_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
            [req.params.visitId, patient_id, airway, breathing, circulation, disability, exposure, gcs_eye || 4, gcs_verbal || 5, gcs_motor || 6, gcs_total, mechanism_of_injury, trauma_team_activated ? 1 : 0, assessed_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
