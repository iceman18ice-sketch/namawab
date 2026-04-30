/**
 * APPOINTMENTS Routes
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


// APPOINTMENTS
// ===== APPOINTMENTS =====
router.get('/api/appointments', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM appointments ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/appointments', requireAuth, async (req, res) => {
    try {
        const { patient_name, patient_id, doctor_name, department, appt_date, appt_time, notes, fee } = req.body;
        const apptFee = parseFloat(fee) || 0;
        const result = await pool.query('INSERT INTO appointments (patient_id, patient_name, doctor_name, department, appt_date, appt_time, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
            [patient_id || null, patient_name, doctor_name, department, appt_date, appt_time, notes || '']);
        // Auto-create invoice for appointment fee
        if (apptFee > 0 && patient_id) {
            await pool.query('INSERT INTO invoices (patient_id, patient_name, total, description, service_type, paid) VALUES ($1,$2,$3,$4,$5,0)',
                [patient_id, patient_name, apptFee, `رسوم موعد: ${doctor_name} - ${appt_date}`, 'Appointment']);
        }
        const appt = (await pool.query('SELECT * FROM appointments WHERE id=$1', [result.rows[0].id])).rows[0];

        // AUTO: Add to waiting queue when appointment is today
        try {
            const apptDate = new Date(date);
            const today = new Date();
            if (apptDate.toDateString() === today.toDateString()) {
                await pool.query(
                    "INSERT INTO waiting_queue (patient_id, patient_name, doctor, department, status, check_in_time) VALUES ($1, $2, $3, $4, 'Waiting', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING",
                    [patient_id, patient_name, doctor, department || 'General']
                );
            }
        } catch (qe) { console.error('Queue auto-insert:', qe.message); }
        res.json(appt);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/api/appointments/:id', requireAuth, async (req, res) => {
    try { await pool.query('DELETE FROM appointments WHERE id=$1', [req.params.id]); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// ONLINE BOOKINGS
// ===== ONLINE BOOKINGS =====
router.get('/api/bookings', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM online_bookings ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// ONLINE BOOKINGS MANAGEMENT
// ===== ONLINE BOOKINGS MANAGEMENT =====
router.put('/api/bookings/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE online_bookings SET status=$1 WHERE id=$2', [status, req.params.id]);
        res.json((await pool.query('SELECT * FROM online_bookings WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// FOLLOW-UP APPOINTMENTS
// ===== FOLLOW-UP APPOINTMENTS =====
router.post('/api/appointments/followup', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, doctor_name, appt_date, appt_time, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO appointments (patient_id, patient_name, doctor_name, department, appt_date, appt_time, notes, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
            [patient_id, patient_name, doctor_name || req.session.user.name, '', appt_date, appt_time || '09:00', `متابعة: ${notes || ''}`, 'Confirmed']);
        res.json((await pool.query('SELECT * FROM appointments WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// APPOINTMENT CONFLICT CHECK
// ===== APPOINTMENT CONFLICT CHECK =====
router.get('/api/appointments/check-conflict', requireAuth, async (req, res) => {
    try {
        const { doctor, date, time_slot, exclude_id } = req.query;
        let query = "SELECT * FROM appointments WHERE doctor=$1 AND appointment_date=$2 AND time_slot=$3 AND status != 'Cancelled'";
        let params = [doctor, date, time_slot];
        if (exclude_id) { query += ' AND id != $4'; params.push(exclude_id); }
        const conflicts = (await pool.query(query, params)).rows;
        res.json({ hasConflict: conflicts.length > 0, conflicts });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// APPOINTMENT CHECK-IN
// ===== APPOINTMENT CHECK-IN =====
router.put('/api/appointments/:id/checkin', requireAuth, async (req, res) => {
    try {
        const appt = (await pool.query('SELECT * FROM appointments WHERE id=$1', [req.params.id])).rows[0];
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        // Update appointment status
        await pool.query("UPDATE appointments SET status='Checked-In', check_in_time=CURRENT_TIMESTAMP WHERE id=$1", [req.params.id]);

        // Create visit lifecycle entry
        await pool.query('CREATE TABLE IF NOT EXISTS visit_lifecycle (id SERIAL PRIMARY KEY, patient_id INTEGER, patient_name VARCHAR(200), appointment_id INTEGER, doctor VARCHAR(200), department VARCHAR(100), status VARCHAR(30), arrived_at TIMESTAMP, triage_at TIMESTAMP, consult_start TIMESTAMP, consult_end TIMESTAMP, lab_sent_at TIMESTAMP, lab_done_at TIMESTAMP, pharmacy_sent_at TIMESTAMP, pharmacy_done_at TIMESTAMP, payment_at TIMESTAMP, completed_at TIMESTAMP, wait_time_minutes INTEGER, consult_duration_minutes INTEGER, total_duration_minutes INTEGER, triage_level VARCHAR(10), pain_score INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        const visit = await pool.query(
            'INSERT INTO visit_lifecycle (patient_id, patient_name, appointment_id, doctor, department, status, arrived_at) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP) RETURNING *',
            [appt.patient_id, appt.patient_name, appt.id, appt.doctor, appt.department || 'General', 'arrived']
        );

        // Auto-add to waiting queue
        await pool.query(
            "INSERT INTO waiting_queue (patient_id, patient_name, doctor, department, status, check_in_time) VALUES ($1,$2,$3,$4,'Waiting',CURRENT_TIMESTAMP)",
            [appt.patient_id, appt.patient_name, appt.doctor, appt.department || 'General']
        );

        logAudit(req.session.user?.id, req.session.user?.display_name, 'CHECK_IN', 'Appointments',
            'Patient ' + appt.patient_name + ' checked in for Dr. ' + appt.doctor, req.ip);

        res.json({ success: true, visit_id: visit.rows[0].id });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});


// NO-SHOW MARKING
// ===== NO-SHOW MARKING =====
router.put('/api/appointments/:id/noshow', requireAuth, async (req, res) => {
    try {
        await pool.query("UPDATE appointments SET status='No-Show' WHERE id=$1", [req.params.id]);
        const appt = (await pool.query('SELECT * FROM appointments WHERE id=$1', [req.params.id])).rows[0];
        logAudit(req.session.user?.id, req.session.user?.display_name, 'NO_SHOW', 'Appointments',
            'Patient ' + (appt?.patient_name || '') + ' marked as No-Show', req.ip);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DUPLICATE APPOINTMENT PREVENTION
// ===== DUPLICATE APPOINTMENT PREVENTION =====
router.post('/api/appointments/check-duplicate', requireAuth, async (req, res) => {
    try {
        const { patient_id, date, doctor } = req.body;
        const existing = (await pool.query(
            "SELECT * FROM appointments WHERE patient_id=$1 AND date=$2 AND doctor=$3 AND status NOT IN ('Cancelled','No-Show')",
            [patient_id, date, doctor]
        )).rows;
        res.json({ duplicate: existing.length > 0, existing });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
