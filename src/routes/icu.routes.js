/**
 * ICU Routes
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


// ICU
// ===== ICU =====
router.get('/api/icu/patients', requireAuth, async (req, res) => {
    try { res.json((await pool.query("SELECT a.*, b.bed_number, w.ward_name, w.ward_name_ar FROM admissions a JOIN beds b ON a.bed_id=b.id JOIN wards w ON a.ward_id=w.id WHERE a.status='Active' AND w.ward_type IN ('ICU','NICU','CCU') ORDER BY a.admission_date DESC")).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/icu/monitoring', requireAuth, async (req, res) => {
    try {
        const { admission_id, patient_id, hr, sbp, dbp, map, rr, spo2, temp, etco2, cvp, fio2, peep, urine_output, notes, recorded_by } = req.body;
        const r = await pool.query('INSERT INTO icu_monitoring (admission_id,patient_id,hr,sbp,dbp,map,rr,spo2,temp,etco2,cvp,fio2,peep,urine_output,notes,recorded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *',
            [admission_id, patient_id, hr, sbp, dbp, map, rr, spo2, temp, etco2, cvp, fio2, peep, urine_output, notes, recorded_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/icu/monitoring/:admissionId', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM icu_monitoring WHERE admission_id=$1 ORDER BY monitor_time DESC LIMIT 50', [req.params.admissionId])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/icu/ventilator', requireAuth, async (req, res) => {
    try {
        const { admission_id, patient_id, vent_mode, fio2, tidal_volume, respiratory_rate, peep, pip, ie_ratio, ps, ett_size, ett_position, cuff_pressure, notes, recorded_by } = req.body;
        const r = await pool.query('INSERT INTO icu_ventilator (admission_id,patient_id,vent_mode,fio2,tidal_volume,respiratory_rate,peep,pip,ie_ratio,ps,ett_size,ett_position,cuff_pressure,notes,recorded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *',
            [admission_id, patient_id, vent_mode, fio2 || 21, tidal_volume, respiratory_rate, peep, pip, ie_ratio || '1:2', ps, ett_size, ett_position, cuff_pressure, notes, recorded_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/icu/ventilator/:admissionId', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM icu_ventilator WHERE admission_id=$1 ORDER BY created_at DESC LIMIT 20', [req.params.admissionId])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/icu/scores', requireAuth, async (req, res) => {
    try {
        const { admission_id, patient_id, apache_ii, sofa, gcs, rass, cam_icu, braden, morse_fall, pain_score, calculated_by } = req.body;
        const r = await pool.query('INSERT INTO icu_scores (admission_id,patient_id,score_date,apache_ii,sofa,gcs,rass,cam_icu,braden,morse_fall,pain_score,calculated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
            [admission_id, patient_id, new Date().toISOString().split('T')[0], apache_ii || 0, sofa || 0, gcs || 15, rass || 0, cam_icu || 0, braden || 23, morse_fall || 0, pain_score || 0, calculated_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/icu/scores/:admissionId', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM icu_scores WHERE admission_id=$1 ORDER BY created_at DESC', [req.params.admissionId])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/icu/fluid-balance', requireAuth, async (req, res) => {
    try {
        const { admission_id, patient_id, shift, iv_fluids, oral_intake, blood_products, medications_iv, urine, drains, ngt_output, stool, vomit, insensible, recorded_by } = req.body;
        const ti = (parseInt(iv_fluids) || 0) + (parseInt(oral_intake) || 0) + (parseInt(blood_products) || 0) + (parseInt(medications_iv) || 0);
        const to = (parseInt(urine) || 0) + (parseInt(drains) || 0) + (parseInt(ngt_output) || 0) + (parseInt(stool) || 0) + (parseInt(vomit) || 0) + (parseInt(insensible) || 0);
        const r = await pool.query('INSERT INTO icu_fluid_balance (admission_id,patient_id,balance_date,shift,iv_fluids,oral_intake,blood_products,medications_iv,total_intake,urine,drains,ngt_output,stool,vomit,insensible,total_output,net_balance,recorded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *',
            [admission_id, patient_id, new Date().toISOString().split('T')[0], shift || 'Day', iv_fluids || 0, oral_intake || 0, blood_products || 0, medications_iv || 0, ti, urine || 0, drains || 0, ngt_output || 0, stool || 0, vomit || 0, insensible || 0, to, ti - to, recorded_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/icu/fluid-balance/:admissionId', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM icu_fluid_balance WHERE admission_id=$1 ORDER BY created_at DESC', [req.params.admissionId])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
