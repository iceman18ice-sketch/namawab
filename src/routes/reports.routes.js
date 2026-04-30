/**
 * REPORTS Routes
 * Auto-extracted from server.js | 29 routes
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


// REPORTS
// ===== REPORTS =====
router.get('/api/reports/financial', requireAuth, async (req, res) => {
    try {
        const totalRevenue = (await pool.query('SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE paid=1')).rows[0].total;
        const totalPending = (await pool.query('SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE paid=0')).rows[0].total;
        const invoiceCount = (await pool.query('SELECT COUNT(*) as cnt FROM invoices')).rows[0].cnt;
        const monthlyRevenue = (await pool.query("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE paid=1 AND created_at >= date_trunc('month', CURRENT_DATE)")).rows[0].total;
        res.json({ totalRevenue, totalPending, invoiceCount, monthlyRevenue });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/reports/patients', requireAuth, async (req, res) => {
    try {
        const totalPatients = (await pool.query('SELECT COUNT(*) as cnt FROM patients')).rows[0].cnt;
        const todayPatients = (await pool.query("SELECT COUNT(*) as cnt FROM patients WHERE created_at >= CURRENT_DATE")).rows[0].cnt;
        const deptStats = (await pool.query('SELECT department, COUNT(*) as cnt FROM patients GROUP BY department ORDER BY cnt DESC')).rows;
        const statusStats = (await pool.query('SELECT status, COUNT(*) as cnt FROM patients GROUP BY status')).rows;
        res.json({ totalPatients, todayPatients, deptStats, statusStats });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/reports/lab', requireAuth, async (req, res) => {
    try {
        const totalOrders = (await pool.query('SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE is_radiology=0')).rows[0].cnt;
        const pendingOrders = (await pool.query("SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE is_radiology=0 AND status='Requested'")).rows[0].cnt;
        const completedOrders = (await pool.query("SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE is_radiology=0 AND status='Completed'")).rows[0].cnt;
        res.json({ totalOrders, pendingOrders, completedOrders });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// MEDICAL CERTIFICATES
// ===== MEDICAL CERTIFICATES =====
router.get('/api/medical/certificates', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) {
            res.json((await pool.query('SELECT * FROM medical_certificates WHERE patient_id=$1 ORDER BY id DESC', [patient_id])).rows);
        } else {
            res.json((await pool.query('SELECT * FROM medical_certificates ORDER BY id DESC')).rows);
        }
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/medical/certificates', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, cert_type, diagnosis, notes, start_date, end_date, days } = req.body;
        const doctorName = req.session.user.name || '';
        const doctorId = req.session.user.id || 0;
        const result = await pool.query(
            'INSERT INTO medical_certificates (patient_id, patient_name, doctor_id, doctor_name, cert_type, diagnosis, notes, start_date, end_date, days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
            [patient_id, patient_name || '', doctorId, doctorName, cert_type || 'sick_leave', diagnosis || '', notes || '', start_date || '', end_date || '', days || 0]);
        res.json((await pool.query('SELECT * FROM medical_certificates WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PRINT API
// ===== PRINT API =====
router.get('/api/print/invoice/:id', requireAuth, async (req, res) => {
    try {
        const inv = (await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0];
        if (!inv) return res.status(404).json({ error: 'Not found' });
        const settings = {};
        const settingsRows = (await pool.query('SELECT * FROM company_settings')).rows;
        settingsRows.forEach(s => settings[s.setting_key] = s.setting_value);
        res.json({ invoice: inv, company: settings });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/print/prescription/:id', requireAuth, async (req, res) => {
    try {
        const rx = (await pool.query('SELECT p.*, m.name as med_name FROM prescriptions p LEFT JOIN medications m ON p.medication_id=m.id WHERE p.id=$1', [req.params.id])).rows[0];
        if (!rx) return res.status(404).json({ error: 'Not found' });
        const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [rx.patient_id])).rows[0];
        res.json({ prescription: rx, patient });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/print/lab-report/:id', requireAuth, async (req, res) => {
    try {
        const order = (await pool.query('SELECT * FROM lab_radiology_orders WHERE id=$1', [req.params.id])).rows[0];
        if (!order) return res.status(404).json({ error: 'Not found' });
        const results = (await pool.query('SELECT lr.*, lt.test_name, lt.normal_range FROM lab_results lr LEFT JOIN lab_tests_catalog lt ON lr.test_id=lt.id WHERE lr.order_id=$1', [req.params.id])).rows;
        const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [order.patient_id])).rows[0];
        res.json({ order, results, patient });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// SPA fallback
// [MOVED] catch-all to end of routes


// MEDICAL REPORTS & SICK LEAVE
// ===== MEDICAL REPORTS & SICK LEAVE =====
router.post('/api/medical-reports', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, report_type, diagnosis, icd_code, start_date, end_date, duration_days, notes, fitness_status } = req.body;
        const doctor = req.session.user?.display_name || '';
        const reportNum = 'MR-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS medical_reports (
                id SERIAL PRIMARY KEY,
                report_number VARCHAR(30),
                patient_id INTEGER,
                patient_name VARCHAR(200),
                report_type VARCHAR(50),
                diagnosis TEXT,
                icd_code VARCHAR(20),
                start_date DATE,
                end_date DATE,
                duration_days INTEGER,
                notes TEXT,
                fitness_status VARCHAR(50),
                doctor VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const result = await pool.query(
            'INSERT INTO medical_reports (report_number, patient_id, patient_name, report_type, diagnosis, icd_code, start_date, end_date, duration_days, notes, fitness_status, doctor) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
            [reportNum, patient_id, patient_name, report_type, diagnosis, icd_code, start_date, end_date, duration_days || 0, notes, fitness_status, doctor]
        );

        logAudit(req.session.user?.id, doctor, 'CREATE_MEDICAL_REPORT', 'MedReport', reportNum + ' - ' + report_type, req.ip);
        res.json(result.rows[0]);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/medical-reports', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        let q = 'SELECT * FROM medical_reports';
        let p = [];
        if (patient_id) { q += ' WHERE patient_id=$1'; p = [patient_id]; }
        q += ' ORDER BY created_at DESC LIMIT 100';
        const rows = (await pool.query(q, p)).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/medical-reports/:id', requireAuth, async (req, res) => {
    try {
        const row = (await pool.query('SELECT * FROM medical_reports WHERE id=$1', [req.params.id])).rows[0];
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



// INFECTION CONTROL REPORTS
// ===== INFECTION CONTROL REPORTS =====
router.get('/api/infection-control/reports', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS infection_control_reports (id SERIAL PRIMARY KEY, patient_name VARCHAR(200), infection_type VARCHAR(100), ward VARCHAR(100), isolation_type VARCHAR(50), culture_results TEXT, action_taken TEXT, status VARCHAR(30) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        res.json((await pool.query('SELECT * FROM infection_control_reports ORDER BY created_at DESC')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/infection-control/reports', requireAuth, async (req, res) => {
    try {
        const { patient_name, infection_type, ward, isolation_type, culture_results, action_taken, status } = req.body;
        const r = await pool.query('INSERT INTO infection_control_reports (patient_name,infection_type,ward,isolation_type,culture_results,action_taken,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [patient_name, infection_type, ward, isolation_type, culture_results, action_taken, status || 'active']);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/infection-control/reports/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const r = await pool.query('UPDATE infection_control_reports SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// MASTER BLUEPRINT APIs
// ===== MASTER BLUEPRINT APIs =====

router.get('/api/departments', requireAuth, async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM departments_catalog ORDER BY name_en')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/departments', requireRole('Admin', 'CEO', 'CMO', 'COO'), async (req, res) => {
    try {
        const { name_en, name_ar, head_of_department, is_center_of_excellence } = req.body;
        await pool.query('INSERT INTO departments_catalog (name_en, name_ar, head_of_department, is_center_of_excellence) VALUES ($1, $2, $3, $4)', [name_en, name_ar, head_of_department, is_center_of_excellence ? 1 : 0]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/telehealth', requireRole('Admin', 'Doctor', 'Consultant', 'telehealth'), async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM telehealth_sessions ORDER BY scheduled_time DESC')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/quality/incidents', requireAuth, async (req, res) => {
    try {
        const { incident_type, description, severity, department } = req.body;
        const reporter = req.session.user ? req.session.user.display_name : 'System';
        await pool.query('INSERT INTO incident_reports (reporter_name, incident_type, description, severity, department) VALUES ($1, $2, $3, $4, $5)', [reporter, incident_type, description, severity, department]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/quality/incidents', requireRole('Admin', 'CMO', 'CNO', 'Head of Department', 'quality'), async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM incident_reports ORDER BY created_at DESC')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/finance/procedure-costs', requireRole('Admin', 'CFO', 'finance'), async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM procedure_costs ORDER BY procedure_name')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/academic/programs', requireRole('Admin', 'CMO', 'academic'), async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM academic_programs')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/quality/surveys', requireRole('Admin', 'CMO', 'CNO', 'Head of Department', 'quality'), async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM patient_surveys ORDER BY created_at DESC')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/clinical_pathways', requireAuth, async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM clinical_pathways ORDER BY disease_name')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/clinical_pathways', requireRole('Admin', 'CMO', 'Consultant'), async (req, res) => {
    try {
        const { disease_name, department, steps } = req.body;
        const creator = req.session.user ? req.session.user.display_name : 'System';
        await pool.query('INSERT INTO clinical_pathways (disease_name, department, steps, created_by) VALUES ($1, $2, $3, $4)', [disease_name, department, steps, creator]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/quality/surveys', requireAuth, async (req, res) => {
    try {
        const { patient_id, department, rating, feedback } = req.body;
        await pool.query('INSERT INTO patient_surveys (patient_id, department, rating, feedback) VALUES ($1, $2, $3, $4)', [patient_id, department, rating, feedback]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/finance/procedure-costs', requireRole('Admin', 'CFO', 'finance'), async (req, res) => {
    try {
        const { procedure_name, department, base_cost, consumables_cost } = req.body;
        const total = parseFloat(base_cost || 0) + parseFloat(consumables_cost || 0);
        await pool.query('INSERT INTO procedure_costs (procedure_name, department, base_cost, consumables_cost, total_cost) VALUES ($1, $2, $3, $4, $5)', [procedure_name, department, base_cost, consumables_cost, total]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/academic/programs', requireRole('Admin', 'CMO', 'academic'), async (req, res) => {
    try {
        const { program_name, director, start_date, end_date } = req.body;
        await pool.query('INSERT INTO academic_programs (program_name, director, start_date, end_date) VALUES ($1, $2, $3, $4)', [program_name, director, start_date, end_date]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/academic/trials', requireAuth, async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM clinical_trials ORDER BY created_at DESC')).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/academic/trials', requireRole('Admin', 'CMO', 'academic'), async (req, res) => {
    try {
        const { trial_name, phase, pi_name, status, irb_approval } = req.body;
        await pool.query('INSERT INTO clinical_trials (trial_name, phase, pi_name, status, irb_approval) VALUES ($1, $2, $3, $4, $5)', [trial_name, phase, pi_name, status, irb_approval]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
