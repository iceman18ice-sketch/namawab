/**
 * DOCTOR Routes
 * Auto-extracted from server.js | 3 routes
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


// DOCTOR PROCEDURE BILLING
// ===== DOCTOR PROCEDURE BILLING =====
router.post('/api/medical/bill-procedures', requireAuth, async (req, res) => {
    try {
        const { patient_id, services } = req.body;
        if (!patient_id || !services || !services.length) return res.status(400).json({ error: 'Missing patient or services' });
        const p = (await pool.query('SELECT name_en, name_ar FROM patients WHERE id=$1', [patient_id])).rows[0];
        if (!p) return res.status(404).json({ error: 'Patient not found' });
        let totalBilled = 0;
        const descriptions = [];
        for (const svc of services) {
            totalBilled += parseFloat(svc.price) || 0;
            descriptions.push(`${svc.nameEn || svc.nameAr} (${svc.price} SAR)`);
        }
        if (totalBilled > 0) {
            const vat = await calcVAT(patient_id);
            const { total: finalTotal, vatAmount } = addVAT(totalBilled, vat.rate);
            const desc = descriptions.join(' | ') + (vat.applyVAT ? ` (+ ضريبة ${vatAmount} SAR)` : '');
            await pool.query('INSERT INTO invoices (patient_id, patient_name, total, vat_amount, description, service_type, paid) VALUES ($1,$2,$3,$4,$5,$6,0)',
                [patient_id, p.name_en || p.name_ar, finalTotal, vatAmount, desc, 'Consultation']);
        }
        res.json({ success: true, totalBilled, invoiceCount: 1 });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DOCTOR: NEXT PATIENT
// ===== DOCTOR: NEXT PATIENT =====
router.get('/api/doctor/next-patient', requireAuth, async (req, res) => {
    try {
        const doctorName = req.session.user?.display_name || '';

        // Get next waiting patient for this doctor
        const next = (await pool.query(
            "SELECT * FROM waiting_queue WHERE doctor ILIKE $1 AND status='Waiting' ORDER BY check_in_time ASC LIMIT 1",
            ['%' + doctorName + '%']
        )).rows[0];

        if (!next) return res.json({ hasNext: false });

        // Update status to In-Progress
        await pool.query("UPDATE waiting_queue SET status='In Progress' WHERE id=$1", [next.id]);

        // Get patient details
        let patient = null;
        if (next.patient_id) {
            patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [next.patient_id])).rows[0];
        }

        // Get visit lifecycle
        let visit = null;
        try {
            visit = (await pool.query(
                "SELECT * FROM visit_lifecycle WHERE patient_id=$1 AND created_at::date=CURRENT_DATE ORDER BY id DESC LIMIT 1",
                [next.patient_id]
            )).rows[0];
            if (visit) {
                await pool.query("UPDATE visit_lifecycle SET status='in_consultation', consult_start=CURRENT_TIMESTAMP WHERE id=$1", [visit.id]);
            }
        } catch (e) { }

        // Get recent vitals
        let vitals = null;
        try {
            vitals = (await pool.query(
                "SELECT * FROM nursing_vitals WHERE patient_id=$1 ORDER BY id DESC LIMIT 1",
                [next.patient_id]
            )).rows[0];
        } catch (e) { }

        // Get waiting count
        const waitingCount = (await pool.query(
            "SELECT COUNT(*) as cnt FROM waiting_queue WHERE doctor ILIKE $1 AND status='Waiting'",
            ['%' + doctorName + '%']
        )).rows[0].cnt;

        res.json({
            hasNext: true,
            queue: next,
            patient,
            vitals,
            visit,
            waiting_count: parseInt(waitingCount)
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});


// DOCTOR: MY QUEUE
// ===== DOCTOR: MY QUEUE =====
router.get('/api/doctor/my-queue', requireAuth, async (req, res) => {
    try {
        const doctorName = req.session.user?.display_name || '';
        const rows = (await pool.query(
            "SELECT * FROM waiting_queue WHERE doctor ILIKE $1 AND status IN ('Waiting','In Progress') ORDER BY CASE status WHEN 'In Progress' THEN 0 ELSE 1 END, check_in_time ASC",
            ['%' + doctorName + '%']
        )).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



module.exports = router;
