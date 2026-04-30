/**
 * SURGERY Routes
 * Auto-extracted from server.js | 21 routes
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


// SURGERY MANAGEMENT
// ===== SURGERY MANAGEMENT =====
router.get('/api/surgeries', requireAuth, async (req, res) => {
    try {
        const { status, date } = req.query;
        let q = 'SELECT * FROM surgeries';
        const params = [];
        const conds = [];
        if (status) { params.push(status); conds.push(`status=$${params.length}`); }
        if (date) { params.push(date); conds.push(`scheduled_date=$${params.length}`); }
        if (conds.length) q += ' WHERE ' + conds.join(' AND ');
        q += ' ORDER BY scheduled_date DESC, scheduled_time DESC';
        res.json((await pool.query(q, params)).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/surgeries', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, surgeon_id, surgeon_name, anesthetist_id, anesthetist_name,
            procedure_name, procedure_name_ar, surgery_type, operating_room, priority,
            scheduled_date, scheduled_time, estimated_duration, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO surgeries (patient_id, patient_name, surgeon_id, surgeon_name, anesthetist_id, anesthetist_name,
             procedure_name, procedure_name_ar, surgery_type, operating_room, priority,
             scheduled_date, scheduled_time, estimated_duration, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
            [patient_id, patient_name || '', surgeon_id || 0, surgeon_name || '', anesthetist_id || 0, anesthetist_name || '',
                procedure_name || '', procedure_name_ar || '', surgery_type || 'Elective', operating_room || '',
                priority || 'Normal', scheduled_date || '', scheduled_time || '', estimated_duration || 60, notes || '']);
        res.json((await pool.query('SELECT * FROM surgeries WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/surgeries/:id', requireAuth, async (req, res) => {
    try {
        const { status, operating_room, scheduled_date, scheduled_time, actual_start, actual_end, post_op_notes, preop_status } = req.body;
        const fields = []; const params = []; let idx = 1;
        if (status !== undefined) { fields.push(`status=$${idx++}`); params.push(status); }
        if (operating_room !== undefined) { fields.push(`operating_room=$${idx++}`); params.push(operating_room); }
        if (scheduled_date !== undefined) { fields.push(`scheduled_date=$${idx++}`); params.push(scheduled_date); }
        if (scheduled_time !== undefined) { fields.push(`scheduled_time=$${idx++}`); params.push(scheduled_time); }
        if (actual_start !== undefined) { fields.push(`actual_start=$${idx++}`); params.push(actual_start); }
        if (actual_end !== undefined) { fields.push(`actual_end=$${idx++}`); params.push(actual_end); }
        if (post_op_notes !== undefined) { fields.push(`post_op_notes=$${idx++}`); params.push(post_op_notes); }
        if (preop_status !== undefined) { fields.push(`preop_status=$${idx++}`); params.push(preop_status); }
        if (fields.length) {
            params.push(req.params.id);
            await pool.query(`UPDATE surgeries SET ${fields.join(',')} WHERE id=$${idx}`, params);
        }
        res.json((await pool.query('SELECT * FROM surgeries WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/api/surgeries/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM surgery_preop_tests WHERE surgery_id=$1', [req.params.id]);
        await pool.query('DELETE FROM surgery_preop_assessments WHERE surgery_id=$1', [req.params.id]);
        await pool.query('DELETE FROM surgery_anesthesia_records WHERE surgery_id=$1', [req.params.id]);
        await pool.query('DELETE FROM consent_forms WHERE surgery_id=$1', [req.params.id]);
        await pool.query('DELETE FROM surgeries WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Pre-op Assessment
router.get('/api/surgeries/:id/preop', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM surgery_preop_assessments WHERE surgery_id=$1', [req.params.id])).rows[0] || null); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/surgeries/:id/preop', requireAuth, async (req, res) => {
    try {
        const s = req.body;
        const existing = (await pool.query('SELECT id FROM surgery_preop_assessments WHERE surgery_id=$1', [req.params.id])).rows[0];
        const surgery = (await pool.query('SELECT patient_id FROM surgeries WHERE id=$1', [req.params.id])).rows[0];
        const pid = surgery?.patient_id || 0;
        // Calculate overall status
        const checkItems = [s.npo_confirmed, s.allergies_reviewed, s.medications_reviewed, s.labs_reviewed,
        s.imaging_reviewed, s.blood_type_confirmed, s.consent_signed, s.anesthesia_clearance, s.nursing_assessment];
        const completedCount = checkItems.filter(x => x).length;
        const overall = completedCount === checkItems.length ? 'Complete' : completedCount > 0 ? 'In Progress' : 'Incomplete';
        if (existing) {
            await pool.query(`UPDATE surgery_preop_assessments SET npo_confirmed=$1, allergies_reviewed=$2, allergies_notes=$3,
                medications_reviewed=$4, medications_notes=$5, labs_reviewed=$6, labs_notes=$7, imaging_reviewed=$8, imaging_notes=$9,
                blood_type_confirmed=$10, blood_reserved=$11, consent_signed=$12, anesthesia_clearance=$13,
                nursing_assessment=$14, nursing_notes=$15, cardiac_clearance=$16, cardiac_notes=$17,
                pulmonary_clearance=$18, infection_screening=$19, dvt_prophylaxis=$20, overall_status=$21, assessed_by=$22
                WHERE surgery_id=$23`,
                [s.npo_confirmed ? 1 : 0, s.allergies_reviewed ? 1 : 0, s.allergies_notes || '',
                s.medications_reviewed ? 1 : 0, s.medications_notes || '', s.labs_reviewed ? 1 : 0, s.labs_notes || '',
                s.imaging_reviewed ? 1 : 0, s.imaging_notes || '', s.blood_type_confirmed ? 1 : 0, s.blood_reserved ? 1 : 0,
                s.consent_signed ? 1 : 0, s.anesthesia_clearance ? 1 : 0, s.nursing_assessment ? 1 : 0, s.nursing_notes || '',
                s.cardiac_clearance ? 1 : 0, s.cardiac_notes || '', s.pulmonary_clearance ? 1 : 0,
                s.infection_screening ? 1 : 0, s.dvt_prophylaxis ? 1 : 0, overall, req.session.user.name || '', req.params.id]);
        } else {
            await pool.query(`INSERT INTO surgery_preop_assessments (surgery_id, patient_id, npo_confirmed, allergies_reviewed, allergies_notes,
                medications_reviewed, medications_notes, labs_reviewed, labs_notes, imaging_reviewed, imaging_notes,
                blood_type_confirmed, blood_reserved, consent_signed, anesthesia_clearance,
                nursing_assessment, nursing_notes, cardiac_clearance, cardiac_notes,
                pulmonary_clearance, infection_screening, dvt_prophylaxis, overall_status, assessed_by)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
                [req.params.id, pid, s.npo_confirmed ? 1 : 0, s.allergies_reviewed ? 1 : 0, s.allergies_notes || '',
                s.medications_reviewed ? 1 : 0, s.medications_notes || '', s.labs_reviewed ? 1 : 0, s.labs_notes || '',
                s.imaging_reviewed ? 1 : 0, s.imaging_notes || '', s.blood_type_confirmed ? 1 : 0, s.blood_reserved ? 1 : 0,
                s.consent_signed ? 1 : 0, s.anesthesia_clearance ? 1 : 0, s.nursing_assessment ? 1 : 0, s.nursing_notes || '',
                s.cardiac_clearance ? 1 : 0, s.cardiac_notes || '', s.pulmonary_clearance ? 1 : 0,
                s.infection_screening ? 1 : 0, s.dvt_prophylaxis ? 1 : 0, overall, req.session.user.name || '']);
        }
        // Update surgery preop_status
        await pool.query('UPDATE surgeries SET preop_status=$1 WHERE id=$2', [overall, req.params.id]);
        res.json((await pool.query('SELECT * FROM surgery_preop_assessments WHERE surgery_id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Pre-op Tests
router.get('/api/surgeries/:id/preop-tests', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM surgery_preop_tests WHERE surgery_id=$1 ORDER BY id', [req.params.id])).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/surgeries/:id/preop-tests', requireAuth, async (req, res) => {
    try {
        const { test_type, test_name, notes } = req.body;
        const surgery = (await pool.query('SELECT patient_id FROM surgeries WHERE id=$1', [req.params.id])).rows[0];
        const result = await pool.query('INSERT INTO surgery_preop_tests (surgery_id, patient_id, test_type, test_name, notes) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [req.params.id, surgery?.patient_id || 0, test_type || 'Lab', test_name || '', notes || '']);
        res.json((await pool.query('SELECT * FROM surgery_preop_tests WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/surgery-preop-tests/:id', requireAuth, async (req, res) => {
    try {
        const { is_completed, result_summary } = req.body;
        if (is_completed !== undefined) await pool.query('UPDATE surgery_preop_tests SET is_completed=$1 WHERE id=$2', [is_completed ? 1 : 0, req.params.id]);
        if (result_summary) await pool.query('UPDATE surgery_preop_tests SET result_summary=$1 WHERE id=$2', [result_summary, req.params.id]);
        res.json((await pool.query('SELECT * FROM surgery_preop_tests WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Anesthesia Records
router.get('/api/surgeries/:id/anesthesia', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM surgery_anesthesia_records WHERE surgery_id=$1', [req.params.id])).rows[0] || null); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/surgeries/:id/anesthesia', requireAuth, async (req, res) => {
    try {
        const a = req.body;
        const surgery = (await pool.query('SELECT patient_id FROM surgeries WHERE id=$1', [req.params.id])).rows[0];
        const existing = (await pool.query('SELECT id FROM surgery_anesthesia_records WHERE surgery_id=$1', [req.params.id])).rows[0];
        if (existing) {
            await pool.query(`UPDATE surgery_anesthesia_records SET anesthetist_name=$1, asa_class=$2, anesthesia_type=$3,
                airway_assessment=$4, mallampati_score=$5, premedication=$6, induction_agents=$7, maintenance_agents=$8,
                muscle_relaxants=$9, monitors_used=$10, iv_access=$11, fluid_given=$12, blood_loss_ml=$13,
                complications=$14, recovery_notes=$15, notes=$16 WHERE surgery_id=$17`,
                [a.anesthetist_name || '', a.asa_class || 'ASA I', a.anesthesia_type || 'General',
                a.airway_assessment || '', a.mallampati_score || '', a.premedication || '', a.induction_agents || '',
                a.maintenance_agents || '', a.muscle_relaxants || '', a.monitors_used || '', a.iv_access || '',
                a.fluid_given || '', a.blood_loss_ml || 0, a.complications || '', a.recovery_notes || '', a.notes || '', req.params.id]);
        } else {
            await pool.query(`INSERT INTO surgery_anesthesia_records (surgery_id, patient_id, anesthetist_name, asa_class, anesthesia_type,
                airway_assessment, mallampati_score, premedication, induction_agents, maintenance_agents,
                muscle_relaxants, monitors_used, iv_access, fluid_given, blood_loss_ml,
                complications, recovery_notes, notes)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
                [req.params.id, surgery?.patient_id || 0, a.anesthetist_name || '', a.asa_class || 'ASA I', a.anesthesia_type || 'General',
                a.airway_assessment || '', a.mallampati_score || '', a.premedication || '', a.induction_agents || '',
                a.maintenance_agents || '', a.muscle_relaxants || '', a.monitors_used || '', a.iv_access || '',
                a.fluid_given || '', a.blood_loss_ml || 0, a.complications || '', a.recovery_notes || '', a.notes || '']);
        }
        res.json((await pool.query('SELECT * FROM surgery_anesthesia_records WHERE surgery_id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Operating Rooms
router.get('/api/operating-rooms', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM operating_rooms ORDER BY id')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/operating-rooms', requireAuth, async (req, res) => {
    try {
        const { room_name, room_name_ar, location, equipment } = req.body;
        const result = await pool.query('INSERT INTO operating_rooms (room_name, room_name_ar, location, equipment) VALUES ($1,$2,$3,$4) RETURNING id',
            [room_name || '', room_name_ar || '', location || '', equipment || '']);
        res.json((await pool.query('SELECT * FROM operating_rooms WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// COSMETIC / PLASTIC SURGERY
// ===== COSMETIC / PLASTIC SURGERY =====
router.get('/api/cosmetic/procedures', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM cosmetic_procedures WHERE is_active=1 ORDER BY category, name_en')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/cosmetic/cases', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM cosmetic_cases ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cosmetic/cases', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, procedure_id, procedure_name, surgery_date, surgery_time, anesthesia_type, operating_room, total_cost, pre_op_notes } = req.body;
        const result = await pool.query('INSERT INTO cosmetic_cases (patient_id, patient_name, procedure_id, procedure_name, surgeon, surgery_date, surgery_time, anesthesia_type, operating_room, total_cost, pre_op_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
            [patient_id, patient_name || '', procedure_id || 0, procedure_name || '', req.session.user.name, surgery_date || '', surgery_time || '', anesthesia_type || 'Local', operating_room || '', total_cost || 0, pre_op_notes || '']);
        logAudit(req.session.user.id, req.session.user.name, 'COSMETIC_CASE', 'Cosmetic Surgery', `New case: ${procedure_name} for ${patient_name}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/cosmetic/cases/:id', requireAuth, async (req, res) => {
    try {
        const { status, operative_notes, post_op_notes, complications, duration_minutes } = req.body;
        await pool.query('UPDATE cosmetic_cases SET status=$1, operative_notes=$2, post_op_notes=$3, complications=$4, duration_minutes=$5 WHERE id=$6',
            [status || 'Completed', operative_notes || '', post_op_notes || '', complications || '', duration_minutes || 0, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
// Consent Forms
router.get('/api/cosmetic/consents', requireAuth, async (req, res) => {
    try {
        const { case_id } = req.query;
        if (case_id) res.json((await pool.query('SELECT * FROM cosmetic_consents WHERE case_id=$1 ORDER BY created_at DESC', [case_id])).rows);
        else res.json((await pool.query('SELECT * FROM cosmetic_consents ORDER BY created_at DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cosmetic/consents', requireAuth, async (req, res) => {
    try {
        const { case_id, patient_id, patient_name, procedure_name, consent_type, risks_explained, alternatives_explained, expected_results, limitations, patient_questions, is_photography_consent, is_anesthesia_consent, is_blood_transfusion_consent, witness_name } = req.body;
        const now = new Date();
        const result = await pool.query('INSERT INTO cosmetic_consents (case_id, patient_id, patient_name, procedure_name, consent_type, surgeon, risks_explained, alternatives_explained, expected_results, limitations, patient_questions, is_photography_consent, is_anesthesia_consent, is_blood_transfusion_consent, witness_name, consent_date, consent_time, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *',
            [case_id || 0, patient_id, patient_name || '', procedure_name || '', consent_type || 'Surgery', req.session.user.name, risks_explained || '', alternatives_explained || '', expected_results || '', limitations || '', patient_questions || '', is_photography_consent ? 1 : 0, is_anesthesia_consent ? 1 : 0, is_blood_transfusion_consent ? 1 : 0, witness_name || '', now.toISOString().split('T')[0], now.toTimeString().substring(0, 5), 'Signed']);
        logAudit(req.session.user.id, req.session.user.name, 'CONSENT_SIGNED', 'Cosmetic Surgery', `Consent for ${procedure_name} - patient ${patient_name}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
// Follow-ups
router.get('/api/cosmetic/followups', requireAuth, async (req, res) => {
    try {
        const { case_id } = req.query;
        if (case_id) res.json((await pool.query('SELECT * FROM cosmetic_followups WHERE case_id=$1 ORDER BY followup_date DESC', [case_id])).rows);
        else res.json((await pool.query('SELECT * FROM cosmetic_followups ORDER BY followup_date DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/cosmetic/followups', requireAuth, async (req, res) => {
    try {
        const { case_id, patient_id, patient_name, followup_date, days_post_op, healing_status, pain_level, swelling, complications, patient_satisfaction, surgeon_notes, next_followup } = req.body;
        const result = await pool.query('INSERT INTO cosmetic_followups (case_id, patient_id, patient_name, followup_date, days_post_op, healing_status, pain_level, swelling, complications, patient_satisfaction, surgeon_notes, next_followup, surgeon) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
            [case_id || 0, patient_id, patient_name || '', followup_date || new Date().toISOString().split('T')[0], days_post_op || 0, healing_status || 'Good', pain_level || 0, swelling || 'Mild', complications || '', patient_satisfaction || 0, surgeon_notes || '', next_followup || '', req.session.user.name]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
