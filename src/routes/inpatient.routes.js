/**
 * INPATIENT Routes
 * Auto-extracted from server.js | 9 routes
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


// INPATIENT ADT
// ===== INPATIENT ADT =====
router.get('/api/wards', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM wards ORDER BY id')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/beds', requireAuth, async (req, res) => {
    try {
        const { ward_id } = req.query;
        const q = ward_id ? await pool.query('SELECT b.*, w.ward_name, w.ward_name_ar FROM beds b JOIN wards w ON b.ward_id=w.id WHERE b.ward_id=$1 ORDER BY b.bed_number', [ward_id])
            : await pool.query('SELECT b.*, w.ward_name, w.ward_name_ar FROM beds b JOIN wards w ON b.ward_id=w.id ORDER BY w.id, b.bed_number');
        res.json(q.rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/beds/census', requireAuth, async (req, res) => {
    try {
        const wards = (await pool.query('SELECT * FROM wards ORDER BY id')).rows;
        const beds = (await pool.query('SELECT b.*, w.ward_name, w.ward_name_ar, a.patient_name, a.diagnosis, a.admission_date, a.attending_doctor FROM beds b JOIN wards w ON b.ward_id=w.id LEFT JOIN admissions a ON b.current_admission_id=a.id AND a.status=\'Active\' ORDER BY w.id, b.bed_number')).rows;
        const total = beds.length; const occupied = beds.filter(b => b.status === 'Occupied').length;
        res.json({ wards, beds, total, occupied, available: total - occupied, occupancyRate: total > 0 ? Math.round(occupied / total * 100) : 0 });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/admissions', requireAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const q = status ? await pool.query('SELECT * FROM admissions WHERE status=$1 ORDER BY admission_date DESC', [status])
            : await pool.query('SELECT * FROM admissions ORDER BY admission_date DESC');
        res.json(q.rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/admissions', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, admission_type, admitting_doctor, attending_doctor, department, ward_id, bed_id, diagnosis, icd10_code, admission_orders, diet_order, activity_level, dvt_prophylaxis, expected_los, insurance_auth } = req.body;
        const r = await pool.query('INSERT INTO admissions (patient_id,patient_name,admission_type,admitting_doctor,attending_doctor,department,ward_id,bed_id,diagnosis,icd10_code,admission_orders,diet_order,activity_level,dvt_prophylaxis,expected_los,insurance_auth) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *',
            [patient_id, patient_name, admission_type || 'Regular', admitting_doctor, attending_doctor, department, ward_id, bed_id, diagnosis, icd10_code, admission_orders, diet_order || 'Regular', activity_level || 'Bed Rest', dvt_prophylaxis, expected_los || 3, insurance_auth]);
        if (bed_id) await pool.query("UPDATE beds SET status='Occupied', current_patient_id=$1, current_admission_id=$2 WHERE id=$3", [patient_id, r.rows[0].id, bed_id]);
        await pool.query("UPDATE patients SET status='Admitted' WHERE id=$1", [patient_id]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/admissions/:id/discharge', requireAuth, async (req, res) => {
    try {
        const { discharge_type, discharge_summary, discharge_instructions, discharge_medications, followup_date, followup_doctor } = req.body;
        await pool.query('UPDATE admissions SET status=$1, discharge_date=$2, discharge_type=$3, discharge_summary=$4, discharge_instructions=$5, discharge_medications=$6, followup_date=$7, followup_doctor=$8 WHERE id=$9',
            ['Discharged', new Date().toISOString(), discharge_type || 'Regular', discharge_summary, discharge_instructions, discharge_medications, followup_date, followup_doctor, req.params.id]);
        const adm = (await pool.query('SELECT bed_id, patient_id FROM admissions WHERE id=$1', [req.params.id])).rows[0];
        if (adm?.bed_id) await pool.query("UPDATE beds SET status='Available', current_patient_id=0, current_admission_id=0 WHERE id=$1", [adm.bed_id]);
        if (adm?.patient_id) await pool.query("UPDATE patients SET status='Discharged' WHERE id=$1", [adm.patient_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/admissions/:id/rounds', requireAuth, async (req, res) => {
    try {
        const { patient_id, doctor_name, subjective, objective, assessment, plan, vitals_summary, orders, diet_changes } = req.body;
        const r = await pool.query('INSERT INTO admission_daily_rounds (admission_id,patient_id,round_date,round_time,doctor_name,subjective,objective,assessment,plan,vitals_summary,orders,diet_changes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
            [req.params.id, patient_id, new Date().toISOString().split('T')[0], new Date().toTimeString().split(' ')[0], doctor_name, subjective, objective, assessment, plan, vitals_summary, orders, diet_changes]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/admissions/:id/rounds', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM admission_daily_rounds WHERE admission_id=$1 ORDER BY id DESC', [req.params.id])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/bed-transfers', requireAuth, async (req, res) => {
    try {
        const { admission_id, patient_id, from_ward, from_bed, to_ward, to_bed, transfer_reason, transferred_by } = req.body;
        await pool.query('INSERT INTO bed_transfers (admission_id,patient_id,from_ward,from_bed,to_ward,to_bed,transfer_reason,transferred_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [admission_id, patient_id, from_ward, from_bed, to_ward, to_bed, transfer_reason, transferred_by]);
        if (from_bed) await pool.query("UPDATE beds SET status='Available', current_patient_id=0, current_admission_id=0 WHERE id=$1", [from_bed]);
        if (to_bed) await pool.query("UPDATE beds SET status='Occupied', current_patient_id=$1, current_admission_id=$2 WHERE id=$3", [patient_id, admission_id, to_bed]);
        await pool.query('UPDATE admissions SET ward_id=$1, bed_id=$2 WHERE id=$3', [to_ward, to_bed, admission_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
