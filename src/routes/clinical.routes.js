/**
 * Clinical Workflows API Routes
 * CPOE Order Sets, Drug Interaction Checks, Nursing Flowsheets, Alerts
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');
const { logAudit } = require('../utils/helpers');
const drugChecker = require('../services/drug_interaction.service');

// ==================== CPOE ORDER SETS ====================

// Get all order sets
router.get('/cpoe/order-sets', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT os.*, (SELECT COUNT(*) FROM cpoe_order_set_items WHERE order_set_id=os.id) as item_count
             FROM cpoe_order_sets os WHERE os.is_active=1 ORDER BY os.usage_count DESC, os.name`);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Get order set with items
router.get('/cpoe/order-sets/:id', requireAuth, async (req, res) => {
    try {
        const set = (await pool.query('SELECT * FROM cpoe_order_sets WHERE id=$1', [req.params.id])).rows[0];
        if (!set) return res.status(404).json({ error: 'Not found' });
        const items = (await pool.query('SELECT * FROM cpoe_order_set_items WHERE order_set_id=$1 ORDER BY sort_order', [req.params.id])).rows;
        res.json({ ...set, items });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Create custom order set
router.post('/cpoe/order-sets', requireAuth, async (req, res) => {
    try {
        const { name, name_ar, specialty, diagnosis_code, diagnosis_name, description, items } = req.body;
        const result = await pool.query(
            `INSERT INTO cpoe_order_sets (name, name_ar, specialty, diagnosis_code, diagnosis_name, description, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [name, name_ar || '', specialty || 'General', diagnosis_code || '', diagnosis_name || '', description || '', req.session.user.name]);

        if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                await pool.query(
                    `INSERT INTO cpoe_order_set_items (order_set_id, item_type, item_name, item_name_ar, dosage, frequency, route, priority, instructions, sort_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                    [result.rows[0].id, it.item_type || 'lab', it.item_name || '', it.item_name_ar || '',
                     it.dosage || '', it.frequency || '', it.route || '', it.priority || 'Routine', it.instructions || '', i + 1]);
            }
        }
        logAudit(req.session.user.id, req.session.user.name, 'CPOE_CREATE', 'Clinical', `Created order set: ${name}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// Apply order set to patient (creates active orders)
router.post('/cpoe/order-sets/:id/apply', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name } = req.body;
        const set = (await pool.query('SELECT * FROM cpoe_order_sets WHERE id=$1', [req.params.id])).rows[0];
        if (!set) return res.status(404).json({ error: 'Order set not found' });
        const items = (await pool.query('SELECT * FROM cpoe_order_set_items WHERE order_set_id=$1 ORDER BY sort_order', [req.params.id])).rows;

        // Drug interaction check for medication items
        const medItems = items.filter(i => i.item_type === 'med').map(i => i.item_name);
        let interactions = [];
        if (medItems.length > 0) {
            interactions = await drugChecker.checkMultipleDrugs(patient_id, medItems);
            // Create alerts for each interaction
            for (const ix of interactions) {
                await drugChecker.createAlert(patient_id, patient_name, ix);
            }
        }

        // Create active orders
        const created = [];
        for (const item of items) {
            const order = await pool.query(
                `INSERT INTO cpoe_active_orders (patient_id, patient_name, order_set_id, item_type, item_code, item_name, dosage, frequency, duration, route, priority, ordered_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
                [patient_id, patient_name || '', set.id, item.item_type, item.item_code || '', item.item_name,
                 item.dosage || '', item.frequency || '', item.duration || '', item.route || '', item.priority || 'Routine', req.session.user.name]);
            created.push(order.rows[0]);
        }

        // Increment usage count
        await pool.query('UPDATE cpoe_order_sets SET usage_count = usage_count + 1 WHERE id=$1', [req.params.id]);

        logAudit(req.session.user.id, req.session.user.name, 'CPOE_APPLY', 'Clinical',
            `Applied order set "${set.name}" for patient ${patient_name} (${items.length} orders)`, req.ip);

        res.json({
            success: true,
            orders: created,
            interactions: interactions,
            hasWarnings: interactions.length > 0,
            message: interactions.length > 0
                ? `⚠️ ${interactions.length} drug interaction(s) detected — review clinical alerts`
                : `✅ ${created.length} orders placed successfully`
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// Get patient's active orders
router.get('/cpoe/orders/:patientId', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM cpoe_active_orders WHERE patient_id=$1 ORDER BY ordered_at DESC', [req.params.patientId]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Update order status
router.put('/cpoe/orders/:id', requireAuth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const completedAt = ['Completed', 'Cancelled'].includes(status) ? 'NOW()' : 'NULL';
        await pool.query(
            `UPDATE cpoe_active_orders SET status=$1, notes=$2, completed_at=${completedAt} WHERE id=$3`,
            [status, notes || '', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== DRUG INTERACTION CHECK ====================

// Check single drug
router.post('/drug-check', requireAuth, async (req, res) => {
    try {
        const { patient_id, drug_name } = req.body;
        const interactions = await drugChecker.checkDrug(patient_id, drug_name);
        res.json({
            drug: drug_name,
            interactions,
            hasCritical: interactions.some(i => i.severity === 'Contraindicated' || i.severity === 'Major'),
            count: interactions.length
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Check multiple drugs
router.post('/drug-check/batch', requireAuth, async (req, res) => {
    try {
        const { patient_id, drugs } = req.body;
        const interactions = await drugChecker.checkMultipleDrugs(patient_id, drugs);
        res.json({
            drugs,
            interactions,
            hasCritical: interactions.some(i => i.severity === 'Contraindicated' || i.severity === 'Major'),
            count: interactions.length
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== NURSING FLOWSHEETS ====================

// --- Intake/Output ---
router.get('/flowsheet/io/:patientId', requireAuth, async (req, res) => {
    try {
        const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { rows } = await pool.query(
            'SELECT * FROM flowsheet_intake_output WHERE patient_id=$1 AND record_time >= $2 ORDER BY record_time DESC',
            [req.params.patientId, since]);

        // Calculate totals
        let totalIntake = 0, totalOutput = 0;
        rows.forEach(r => { totalIntake += r.intake_amount || 0; totalOutput += r.output_amount || 0; });

        res.json({ records: rows, summary: { totalIntake, totalOutput, balance: totalIntake - totalOutput } });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/flowsheet/io', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, shift, intake_type, intake_amount, intake_details, output_type, output_amount, output_details, iv_fluid, iv_rate, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO flowsheet_intake_output (patient_id, patient_name, shift, intake_type, intake_amount, intake_details, output_type, output_amount, output_details, iv_fluid, iv_rate, nurse, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [patient_id, patient_name || '', shift || 'Morning', intake_type || 'Oral', intake_amount || 0,
             intake_details || '', output_type || 'Urine', output_amount || 0, output_details || '',
             iv_fluid || '', iv_rate || 0, req.session.user.name, notes || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Wound Care ---
router.get('/flowsheet/wound/:patientId', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM flowsheet_wound_care WHERE patient_id=$1 ORDER BY record_time DESC', [req.params.patientId]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/flowsheet/wound', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, wound_location, wound_type, wound_size, wound_stage, drainage_type, drainage_amount, dressing_type, dressing_changed, wound_status, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO flowsheet_wound_care (patient_id, patient_name, wound_location, wound_type, wound_size, wound_stage, drainage_type, drainage_amount, dressing_type, dressing_changed, wound_status, nurse, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [patient_id, patient_name || '', wound_location || '', wound_type || '', wound_size || '',
             wound_stage || 'Stage I', drainage_type || 'None', drainage_amount || '', dressing_type || '',
             dressing_changed || 0, wound_status || 'Improving', req.session.user.name, notes || '']);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Pain Assessment ---
router.get('/flowsheet/pain/:patientId', requireAuth, async (req, res) => {
    try {
        const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { rows } = await pool.query(
            'SELECT * FROM flowsheet_pain WHERE patient_id=$1 AND record_time >= $2 ORDER BY record_time DESC',
            [req.params.patientId, since]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/flowsheet/pain', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, pain_score, pain_location, pain_type, pain_quality, pain_onset, aggravating, relieving, intervention, post_intervention_score, notes } = req.body;
        const result = await pool.query(
            `INSERT INTO flowsheet_pain (patient_id, patient_name, pain_score, pain_location, pain_type, pain_quality, pain_onset, aggravating, relieving, intervention, post_intervention_score, nurse, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [patient_id, patient_name || '', pain_score || 0, pain_location || '', pain_type || 'Acute',
             pain_quality || '', pain_onset || '', aggravating || '', relieving || '',
             intervention || '', post_intervention_score || 0, req.session.user.name, notes || '']);

        // Auto-alert for severe pain
        if (pain_score >= 8) {
            await pool.query(
                `INSERT INTO clinical_alerts (patient_id, patient_name, alert_type, category, title, message, severity, source)
                 VALUES ($1,$2,'Pain Alert','Nursing',$3,$4,'High','Pain Assessment')`,
                [patient_id, patient_name, `🔴 Severe Pain Score: ${pain_score}/10`,
                 `Location: ${pain_location}\nType: ${pain_type}\nIntervention: ${intervention}`]);
        }

        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- GCS Score ---
router.get('/flowsheet/gcs/:patientId', requireAuth, async (req, res) => {
    try {
        const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { rows } = await pool.query(
            'SELECT * FROM flowsheet_gcs WHERE patient_id=$1 AND record_time >= $2 ORDER BY record_time DESC',
            [req.params.patientId, since]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/flowsheet/gcs', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, eye_response, verbal_response, motor_response, pupil_left, pupil_right, pupil_left_size, pupil_right_size, notes } = req.body;
        const total = (eye_response || 4) + (verbal_response || 5) + (motor_response || 6);
        const result = await pool.query(
            `INSERT INTO flowsheet_gcs (patient_id, patient_name, eye_response, verbal_response, motor_response, total_score, pupil_left, pupil_right, pupil_left_size, pupil_right_size, nurse, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
            [patient_id, patient_name || '', eye_response || 4, verbal_response || 5, motor_response || 6,
             total, pupil_left || 'PERRL', pupil_right || 'PERRL', pupil_left_size || 3,
             pupil_right_size || 3, req.session.user.name, notes || '']);

        // Auto-alert for critical GCS
        if (total <= 8) {
            await pool.query(
                `INSERT INTO clinical_alerts (patient_id, patient_name, alert_type, category, title, message, severity, source)
                 VALUES ($1,$2,'GCS Alert','Nursing',$3,$4,'Critical','GCS Assessment')`,
                [patient_id, patient_name, `🚨 Critical GCS: ${total}/15`,
                 `Eye: ${eye_response} | Verbal: ${verbal_response} | Motor: ${motor_response}\nImmediate medical evaluation required.`]);
        }

        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Consolidated Flowsheet (24h view) ---
router.get('/flowsheet/summary/:patientId', requireAuth, async (req, res) => {
    try {
        const pid = req.params.patientId;
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const [vitals, io, pain, gcs, wounds] = await Promise.all([
            pool.query('SELECT * FROM nursing_vitals WHERE patient_id=$1 AND created_at >= $2 ORDER BY created_at DESC', [pid, since]),
            pool.query('SELECT * FROM flowsheet_intake_output WHERE patient_id=$1 AND record_time >= $2 ORDER BY record_time DESC', [pid, since]),
            pool.query('SELECT * FROM flowsheet_pain WHERE patient_id=$1 AND record_time >= $2 ORDER BY record_time DESC', [pid, since]),
            pool.query('SELECT * FROM flowsheet_gcs WHERE patient_id=$1 AND record_time >= $2 ORDER BY record_time DESC', [pid, since]),
            pool.query('SELECT * FROM flowsheet_wound_care WHERE patient_id=$1 ORDER BY record_time DESC LIMIT 10', [pid])
        ]);

        // I/O Summary
        let totalIntake = 0, totalOutput = 0;
        io.rows.forEach(r => { totalIntake += r.intake_amount || 0; totalOutput += r.output_amount || 0; });

        res.json({
            vitals: vitals.rows,
            intakeOutput: { records: io.rows, totalIntake, totalOutput, balance: totalIntake - totalOutput },
            pain: pain.rows,
            gcs: gcs.rows,
            wounds: wounds.rows,
            latestGCS: gcs.rows[0]?.total_score || 15,
            latestPain: pain.rows[0]?.pain_score || 0
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== CLINICAL ALERTS ====================

// Get alerts for a patient
router.get('/alerts/:patientId', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM clinical_alerts WHERE patient_id=$1 AND is_dismissed=0 ORDER BY created_at DESC', [req.params.patientId]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Get all unread alerts
router.get('/alerts', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM clinical_alerts WHERE is_dismissed=0 ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Dismiss alert
router.put('/alerts/:id/dismiss', requireAuth, async (req, res) => {
    try {
        await pool.query(
            'UPDATE clinical_alerts SET is_dismissed=1, dismissed_by=$1, dismissed_at=NOW() WHERE id=$2',
            [req.session.user.name, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Mark alert as read
router.put('/alerts/:id/read', requireAuth, async (req, res) => {
    try {
        await pool.query('UPDATE clinical_alerts SET is_read=1 WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
