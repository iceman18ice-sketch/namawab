/**
 * PATIENTS Routes
 * Auto-extracted from server.js | 14 routes
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


// PATIENTS
// ===== PATIENTS =====
router.get('/api/patients', requireAuth, async (req, res) => {
    try {
        const { search } = req.query;
        let rows;
        if (search) {
            const s = `%${search}%`;
            rows = (await pool.query(`SELECT * FROM patients WHERE (name_ar ILIKE $1 OR name_en ILIKE $2 OR national_id LIKE $3 OR phone LIKE $4 OR CAST(file_number AS TEXT) LIKE $5) ORDER BY id DESC LIMIT 200`, [s, s, s, s, s])).rows;
        } else {
            rows = (await pool.query('SELECT * FROM patients ORDER BY id DESC LIMIT 200')).rows;
        }
        res.json(rows);
    } catch (e) { console.error('Patients query error:', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/patients', requireAuth, async (req, res) => {
    try {
        const { name_ar, name_en, national_id, nationality, gender, phone, department, amount, payment_method, dob, dob_hijri, blood_type, allergies, chronic_diseases, emergency_contact_name, emergency_contact_phone, address, insurance_company, insurance_policy_number, insurance_class } = req.body;
        const maxFile = (await pool.query('SELECT COALESCE(MAX(file_number), 1000) as mf FROM patients')).rows[0].mf;
        let age = 0;
        if (dob) {
            const bd = new Date(dob);
            const ageDifMs = Date.now() - bd.getTime();
            const ageDate = new Date(ageDifMs);
            age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }
        const fileOpenFee = parseFloat(amount) || 0;
        const newFileNum = maxFile + 1;
        const mrn = 'MRN-' + String(newFileNum).padStart(6, '0');
        const result = await pool.query('INSERT INTO patients (file_number, mrn, name_ar, name_en, national_id, nationality, gender, phone, department, amount, payment_method, dob, dob_hijri, age, blood_type, allergies, chronic_diseases, emergency_contact_name, emergency_contact_phone, address, insurance_company, insurance_policy_number, insurance_class) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id',
            [newFileNum, mrn, name_ar || '', name_en || '', national_id || '', nationality || '', gender || '', phone || '', department || '', fileOpenFee, payment_method || '', dob || '', dob_hijri || '', age || 0, blood_type || '', allergies || '', chronic_diseases || '', emergency_contact_name || '', emergency_contact_phone || '', address || '', insurance_company || '', insurance_policy_number || '', insurance_class || '']);
        const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [result.rows[0].id])).rows[0];
        // Auto-create invoice for file opening fee (with VAT for non-Saudis)
        if (fileOpenFee > 0) {
            const vat = await calcVAT(patient.id);
            const { total: finalTotal, vatAmount } = addVAT(fileOpenFee, vat.rate);
            const desc = vat.applyVAT ? `فتح ملف / File Opening Fee (+ ضريبة ${vatAmount} SAR)` : 'فتح ملف / File Opening Fee';
            await pool.query('INSERT INTO invoices (patient_id, patient_name, total, vat_amount, description, service_type, paid, payment_method) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
                [patient.id, name_en || name_ar, finalTotal, vatAmount, desc, 'File Opening', payment_method === 'كاش' || payment_method === 'Cash' ? 1 : 0, payment_method || '']);
        }
        logAudit(req.session.user?.id, req.session.user?.display_name, 'CREATE_PATIENT', 'Patients', 'Created patient ' + (name_en || name_ar) + ' MRN:' + mrn, req.ip);
        res.json(patient);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/patients/:id', requireAuth, async (req, res) => {
    try {
        const { name_ar, name_en, national_id, nationality, gender, phone, dob, dob_hijri, department, status, blood_type, allergies, chronic_diseases, emergency_contact_name, emergency_contact_phone, address, insurance_company, insurance_policy_number, insurance_class } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (name_ar !== undefined) { sets.push(`name_ar=$${i++}`); vals.push(name_ar); }
        if (name_en !== undefined) { sets.push(`name_en=$${i++}`); vals.push(name_en); }
        if (national_id !== undefined) { sets.push(`national_id=$${i++}`); vals.push(national_id); }
        if (nationality !== undefined) { sets.push(`nationality=$${i++}`); vals.push(nationality); }
        if (gender !== undefined) { sets.push(`gender=$${i++}`); vals.push(gender); }
        if (phone !== undefined) { sets.push(`phone=$${i++}`); vals.push(phone); }
        if (dob !== undefined) { sets.push(`dob=$${i++}`); vals.push(dob); }
        if (dob_hijri !== undefined) { sets.push(`dob_hijri=$${i++}`); vals.push(dob_hijri); }
        if (department !== undefined) { sets.push(`department=$${i++}`); vals.push(department); }
        if (status !== undefined) { sets.push(`status=$${i++}`); vals.push(status); }
        if (blood_type !== undefined) { sets.push(`blood_type=$${i++}`); vals.push(blood_type); }
        if (allergies !== undefined) { sets.push(`allergies=$${i++}`); vals.push(allergies); }
        if (chronic_diseases !== undefined) { sets.push(`chronic_diseases=$${i++}`); vals.push(chronic_diseases); }
        if (emergency_contact_name !== undefined) { sets.push(`emergency_contact_name=$${i++}`); vals.push(emergency_contact_name); }
        if (emergency_contact_phone !== undefined) { sets.push(`emergency_contact_phone=$${i++}`); vals.push(emergency_contact_phone); }
        if (address !== undefined) { sets.push(`address=$${i++}`); vals.push(address); }
        if (insurance_company !== undefined) { sets.push(`insurance_company=$${i++}`); vals.push(insurance_company); }
        if (insurance_policy_number !== undefined) { sets.push(`insurance_policy_number=$${i++}`); vals.push(insurance_policy_number); }
        if (insurance_class !== undefined) { sets.push(`insurance_class=$${i++}`); vals.push(insurance_class); }
        if (sets.length > 0) {
            vals.push(req.params.id);
            await pool.query(`UPDATE patients SET ${sets.join(',')} WHERE id=$${i}`, vals);
        }
        const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id])).rows[0];
        res.json(patient);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/api/patients/:id', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query('DELETE FROM medical_records WHERE patient_id=$1', [id]);
        await pool.query('DELETE FROM lab_radiology_orders WHERE patient_id=$1', [id]);
        await pool.query('DELETE FROM prescriptions WHERE patient_id=$1', [id]);
        await pool.query('DELETE FROM dental_records WHERE patient_id=$1', [id]);
        await pool.query('DELETE FROM appointments WHERE patient_id=$1', [id]);
        await pool.query('DELETE FROM approvals WHERE patient_id=$1', [id]);
        await pool.query('DELETE FROM patients WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PATIENT RESULTS (for Doctor to browse)
// ===== PATIENT RESULTS (for Doctor to browse) =====
router.get('/api/patients/:id/results', requireAuth, async (req, res) => {
    try {
        const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [req.params.id])).rows[0];
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        const labOrders = (await pool.query("SELECT * FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=0 ORDER BY created_at DESC", [req.params.id])).rows;
        const radOrders = (await pool.query("SELECT * FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=1 ORDER BY created_at DESC", [req.params.id])).rows;
        const records = (await pool.query('SELECT * FROM medical_records WHERE patient_id=$1 ORDER BY visit_date DESC', [req.params.id])).rows;
        res.json({ patient, labOrders, radOrders, records });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PATIENT ACCOUNT
// ===== PATIENT ACCOUNT =====
router.get('/api/patients/:id/account', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [id])).rows[0];
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        const invoices = (await pool.query('SELECT * FROM invoices WHERE patient_id=$1 ORDER BY id DESC', [id])).rows;
        const records = (await pool.query('SELECT * FROM medical_records WHERE patient_id=$1 ORDER BY id DESC', [id])).rows;
        const labOrders = (await pool.query('SELECT * FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=0 ORDER BY id DESC', [id])).rows;
        const radOrders = (await pool.query('SELECT * FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=1 ORDER BY id DESC', [id])).rows;
        const prescriptions = (await pool.query('SELECT * FROM prescriptions WHERE patient_id=$1 ORDER BY id DESC', [id])).rows;
        const totalBilled = invoices.reduce((s, i) => s + (i.total || 0), 0);
        const totalPaid = invoices.filter(i => i.paid).reduce((s, i) => s + (i.total || 0), 0);
        res.json({ patient, invoices, records, labOrders, radOrders, prescriptions, totalBilled, totalPaid, balance: totalBilled - totalPaid });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PATIENT VISIT TIMELINE
// ===== PATIENT VISIT TIMELINE =====
router.get('/api/patients/:id/timeline', requireAuth, async (req, res) => {
    try {
        const pid = req.params.id;
        const events = [];
        // Medical records
        const records = (await pool.query('SELECT id, diagnosis, visit_date as event_date, symptoms FROM medical_records WHERE patient_id=$1', [pid])).rows;
        records.forEach(r => events.push({ type: 'medical_record', icon: '🩺', title: r.diagnosis || 'Consultation', subtitle: r.symptoms, date: r.event_date }));
        // Lab orders
        const labs = (await pool.query('SELECT id, order_type, status, created_at as event_date FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=0', [pid])).rows;
        labs.forEach(l => events.push({ type: 'lab', icon: '🔬', title: l.order_type, subtitle: l.status, date: l.event_date }));
        // Radiology
        const rads = (await pool.query('SELECT id, order_type, status, created_at as event_date FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=1', [pid])).rows;
        rads.forEach(r => events.push({ type: 'radiology', icon: '📡', title: r.order_type, subtitle: r.status, date: r.event_date }));
        // Prescriptions
        const rxs = (await pool.query('SELECT id, dosage, status, created_at as event_date FROM prescriptions WHERE patient_id=$1', [pid])).rows;
        rxs.forEach(rx => events.push({ type: 'prescription', icon: '💊', title: rx.dosage, subtitle: rx.status, date: rx.event_date }));
        // Invoices
        const invs = (await pool.query('SELECT id, description, total, paid, created_at as event_date FROM invoices WHERE patient_id=$1', [pid])).rows;
        invs.forEach(i => events.push({ type: 'invoice', icon: '🧾', title: i.description, subtitle: `${i.total} SAR - ${i.paid ? 'Paid' : 'Unpaid'}`, date: i.event_date }));
        // Certificates
        const certs = (await pool.query('SELECT id, cert_type, diagnosis, created_at as event_date FROM medical_certificates WHERE patient_id=$1', [pid])).rows;
        certs.forEach(c => events.push({ type: 'certificate', icon: '📋', title: c.cert_type === 'sick_leave' ? 'Sick Leave' : c.cert_type, subtitle: c.diagnosis, date: c.event_date }));
        // Sort by date descending
        events.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        res.json(events);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// SAFE PATIENT DELETE (soft delete if has records)
// ===== SAFE PATIENT DELETE (soft delete if has records) =====
router.delete('/api/patients/:id', requireAuth, async (req, res) => {
    try {
        const pid = req.params.id;
        const invoices = (await pool.query('SELECT COUNT(*) as cnt FROM invoices WHERE patient_id=$1 AND cancelled=0', [pid])).rows[0].cnt;
        const orders = (await pool.query('SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE patient_id=$1', [pid])).rows[0].cnt;
        const records = (await pool.query('SELECT COUNT(*) as cnt FROM medical_records WHERE patient_id=$1', [pid])).rows[0].cnt;
        if (parseInt(invoices) > 0 || parseInt(orders) > 0 || parseInt(records) > 0) {
            await pool.query('UPDATE patients SET is_deleted=1, deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [req.session.user?.display_name || '', pid]);
            logAudit(req.session.user?.id, req.session.user?.display_name, 'SOFT_DELETE', 'Patients', 'Soft deleted patient #' + pid, req.ip);
            return res.json({ success: true, soft_deleted: true, message: 'Patient archived (has records)' });
        }
        await pool.query('DELETE FROM patients WHERE id=$1', [pid]);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'DELETE', 'Patients', 'Deleted patient #' + pid, req.ip);
        res.json({ success: true, deleted: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// VISIT TRACKING
// ===== VISIT TRACKING =====
router.post('/api/visits', requireAuth, async (req, res) => {
    try {
        const { patient_id, visit_type, department, doctor, chief_complaint } = req.body;
        const count = (await pool.query('SELECT COUNT(*) as cnt FROM patient_visits WHERE patient_id=$1', [patient_id])).rows[0].cnt;
        const visitNum = 'V-' + patient_id + '-' + (parseInt(count) + 1);
        const result = await pool.query('INSERT INTO patient_visits (patient_id, visit_number, visit_type, department, doctor, chief_complaint, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [patient_id, visitNum, visit_type || 'Walk-in', department || '', doctor || '', chief_complaint || '', req.session.user?.display_name || '']);
        await pool.query('UPDATE patients SET last_visit_at=NOW(), total_visits=total_visits+1 WHERE id=$1', [patient_id]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/visits/:patient_id', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM patient_visits WHERE patient_id=$1 ORDER BY created_at DESC', [req.params.patient_id])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PATIENT FULL SUMMARY (for Doctor)
// ===== PATIENT FULL SUMMARY (for Doctor) =====
router.get('/api/patients/:id/summary', requireAuth, async (req, res) => {
    try {
        const pid = req.params.id;
        const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [pid])).rows[0];
        if (!patient) return res.status(404).json({ error: 'Not found' });
        const records = (await pool.query('SELECT * FROM medical_records WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 10', [pid])).rows;
        const labs = (await pool.query("SELECT * FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=0 ORDER BY created_at DESC LIMIT 10", [pid])).rows;
        const rads = (await pool.query("SELECT * FROM lab_radiology_orders WHERE patient_id=$1 AND is_radiology=1 ORDER BY created_at DESC LIMIT 5", [pid])).rows;
        const rxs = (await pool.query('SELECT * FROM prescriptions WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 10', [pid])).rows;
        const invoices = (await pool.query('SELECT * FROM invoices WHERE patient_id=$1 AND cancelled=0 ORDER BY created_at DESC LIMIT 10', [pid])).rows;
        const visits = (await pool.query('SELECT * FROM patient_visits WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 10', [pid])).rows;
        const consents = (await pool.query('SELECT pc.*, cft.title_ar FROM patient_consents pc LEFT JOIN consent_form_templates cft ON pc.template_id=cft.id WHERE pc.patient_id=$1 ORDER BY pc.created_at DESC LIMIT 5', [pid])).rows;
        res.json({ patient, records, labs, rads, prescriptions: rxs, invoices, visits, consents });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



// VISIT LIFECYCLE TRACKING
// ===== VISIT LIFECYCLE TRACKING =====
router.post('/api/visits/lifecycle', requireAuth, async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visit_lifecycle (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER,
                patient_name VARCHAR(200),
                appointment_id INTEGER,
                doctor VARCHAR(200),
                department VARCHAR(100),
                status VARCHAR(30) DEFAULT 'arrived',
                arrived_at TIMESTAMP,
                triage_at TIMESTAMP,
                consult_start TIMESTAMP,
                consult_end TIMESTAMP,
                lab_sent_at TIMESTAMP,
                lab_done_at TIMESTAMP,
                pharmacy_sent_at TIMESTAMP,
                pharmacy_done_at TIMESTAMP,
                payment_at TIMESTAMP,
                completed_at TIMESTAMP,
                wait_time_minutes INTEGER,
                consult_duration_minutes INTEGER,
                total_duration_minutes INTEGER,
                triage_level VARCHAR(10),
                pain_score INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const { patient_id, patient_name, appointment_id, doctor, department } = req.body;
        const result = await pool.query(
            'INSERT INTO visit_lifecycle (patient_id, patient_name, appointment_id, doctor, department, status, arrived_at) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP) RETURNING *',
            [patient_id, patient_name, appointment_id, doctor, department, 'arrived']
        );
        res.json(result.rows[0]);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/visits/lifecycle/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const visit = (await pool.query('SELECT * FROM visit_lifecycle WHERE id=$1', [req.params.id])).rows[0];
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        const timeFields = {
            'triage': 'triage_at', 'in_consultation': 'consult_start', 'consultation_done': 'consult_end',
            'lab_pending': 'lab_sent_at', 'lab_done': 'lab_done_at',
            'pharmacy_pending': 'pharmacy_sent_at', 'pharmacy_done': 'pharmacy_done_at',
            'payment': 'payment_at', 'completed': 'completed_at'
        };

        const field = timeFields[status];
        let extra = '';
        if (status === 'in_consultation' && visit.arrived_at) {
            const waitMs = Date.now() - new Date(visit.arrived_at).getTime();
            extra = ', wait_time_minutes=' + Math.round(waitMs / 60000);
        }
        if (status === 'consultation_done' && visit.consult_start) {
            const consultMs = Date.now() - new Date(visit.consult_start).getTime();
            extra = ', consult_duration_minutes=' + Math.round(consultMs / 60000);
        }
        if (status === 'completed' && visit.arrived_at) {
            const totalMs = Date.now() - new Date(visit.arrived_at).getTime();
            extra = ', total_duration_minutes=' + Math.round(totalMs / 60000);
        }

        await pool.query('UPDATE visit_lifecycle SET status=$1' + (field ? ', ' + field + '=CURRENT_TIMESTAMP' : '') + extra + ' WHERE id=$2', [status, req.params.id]);
        const updated = (await pool.query('SELECT * FROM visit_lifecycle WHERE id=$1', [req.params.id])).rows[0];
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/visits/lifecycle/today', requireAuth, async (req, res) => {
    try {
        await pool.query('CREATE TABLE IF NOT EXISTS visit_lifecycle (id SERIAL PRIMARY KEY, patient_id INTEGER, patient_name VARCHAR(200), appointment_id INTEGER, doctor VARCHAR(200), department VARCHAR(100), status VARCHAR(30), arrived_at TIMESTAMP, triage_at TIMESTAMP, consult_start TIMESTAMP, consult_end TIMESTAMP, lab_sent_at TIMESTAMP, lab_done_at TIMESTAMP, pharmacy_sent_at TIMESTAMP, pharmacy_done_at TIMESTAMP, payment_at TIMESTAMP, completed_at TIMESTAMP, wait_time_minutes INTEGER, consult_duration_minutes INTEGER, total_duration_minutes INTEGER, triage_level VARCHAR(10), pain_score INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        const { doctor } = req.query;
        let q = "SELECT * FROM visit_lifecycle WHERE created_at::date = CURRENT_DATE";
        let p = [];
        if (doctor) { q += " AND doctor=$1"; p = [doctor]; }
        q += " ORDER BY arrived_at DESC";
        const rows = (await pool.query(q, p)).rows;
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
