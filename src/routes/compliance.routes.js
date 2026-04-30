/**
 * Saudi Healthcare Compliance API Routes
 * NPHIES, Wasfaty, Yaqeen, ZATCA Phase 2
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');
const { logAudit } = require('../utils/helpers');
const nphies = require('../services/nphies.service');
const wasfaty = require('../services/wasfaty.service');
const zatca = require('../services/zatca.service');
const yaqeen = require('../services/yaqeen.service');

// ==================== NPHIES ====================

// Check patient eligibility
router.post('/nphies/eligibility', requireAuth, async (req, res) => {
    try {
        const result = await nphies.checkEligibility(req.body.patient_id, req.body);
        logAudit(req.session.user.id, req.session.user.name, 'NPHIES_ELIGIBILITY', 'Insurance', `Checked eligibility for patient ${req.body.patient_id}`, req.ip);
        res.json(result);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get eligibility history
router.get('/nphies/eligibility', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM nphies_eligibility ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Submit pre-authorization
router.post('/nphies/preauth', requireAuth, async (req, res) => {
    try {
        const result = await nphies.submitPreAuth(req.body.patient_id, req.body);
        logAudit(req.session.user.id, req.session.user.name, 'NPHIES_PREAUTH', 'Insurance', `PreAuth for patient ${req.body.patient_id}`, req.ip);
        res.json(result);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get pre-auth list
router.get('/nphies/preauth', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM nphies_preauth ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Submit claim
router.post('/nphies/claims', requireAuth, async (req, res) => {
    try {
        const result = await nphies.submitClaim(req.body.patient_id, req.body);
        logAudit(req.session.user.id, req.session.user.name, 'NPHIES_CLAIM', 'Insurance', `Claim for patient ${req.body.patient_id}`, req.ip);
        res.json(result);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get claims list
router.get('/nphies/claims', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM nphies_claims ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// NPHIES config
router.get('/nphies/config', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, provider_id, license_number, base_url, sender_id, receiver_id, is_production, updated_at FROM nphies_config LIMIT 1');
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/nphies/config', requireAuth, async (req, res) => {
    try {
        const { provider_id, license_number, base_url, sender_id, receiver_id, api_key, is_production } = req.body;
        await pool.query(
            `UPDATE nphies_config SET provider_id=$1, license_number=$2, base_url=$3, sender_id=$4, receiver_id=$5, api_key=$6, is_production=$7, updated_at=NOW() WHERE id=1`,
            [provider_id, license_number, base_url, sender_id, receiver_id, api_key || '', is_production ? 1 : 0]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== WASFATY ====================

// Submit e-prescription to Wasfaty
router.post('/wasfaty/submit', requireAuth, async (req, res) => {
    try {
        const result = await wasfaty.submitPrescription(req.body.prescription_id, req.body);
        logAudit(req.session.user.id, req.session.user.name, 'WASFATY_SUBMIT', 'Pharmacy', `Submitted Rx ${req.body.prescription_id} to Wasfaty`, req.ip);
        res.json(result);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get Wasfaty prescriptions
router.get('/wasfaty/prescriptions', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM wasfaty_prescriptions ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Check Wasfaty status
router.get('/wasfaty/status/:ref', requireAuth, async (req, res) => {
    try {
        const result = await wasfaty.checkStatus(req.params.ref);
        if (!result) return res.status(404).json({ error: 'Not found' });
        res.json(result);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== ZATCA Phase 2 ====================

// Generate ZATCA XML for an invoice
router.post('/zatca/generate/:invoiceId', requireAuth, async (req, res) => {
    try {
        const result = await zatca.generateInvoice(req.params.invoiceId);
        logAudit(req.session.user.id, req.session.user.name, 'ZATCA_GENERATE', 'Finance', `Generated ZATCA XML for invoice ${req.params.invoiceId}`, req.ip);
        res.json(result);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Sign ZATCA invoice
router.post('/zatca/sign/:invoiceId', requireAuth, async (req, res) => {
    try {
        const result = await zatca.signInvoice(req.params.invoiceId);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Report/Clear with ZATCA
router.post('/zatca/report/:invoiceId', requireAuth, async (req, res) => {
    try {
        const result = await zatca.reportInvoice(req.params.invoiceId);
        logAudit(req.session.user.id, req.session.user.name, 'ZATCA_REPORT', 'Finance', `Reported invoice ${req.params.invoiceId} to ZATCA`, req.ip);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== YAQEEN ====================

// Verify patient identity
router.post('/yaqeen/verify', requireAuth, async (req, res) => {
    try {
        const { patient_id, national_id, id_type } = req.body;
        if (!patient_id || !national_id) return res.status(400).json({ error: 'Missing patient_id or national_id' });
        const result = await yaqeen.verifyIdentity(patient_id, national_id, id_type);
        logAudit(req.session.user.id, req.session.user.name, 'YAQEEN_VERIFY', 'Patient', `Verified ID for patient ${patient_id}`, req.ip);
        res.json(result);
    } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Check verification status
router.get('/yaqeen/status/:patientId', requireAuth, async (req, res) => {
    try {
        const verified = await yaqeen.isVerified(parseInt(req.params.patientId));
        const log = (await pool.query('SELECT * FROM yaqeen_verifications WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 1', [req.params.patientId])).rows[0];
        res.json({ verified, lastVerification: log || null });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Verification history
router.get('/yaqeen/log', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM yaqeen_verifications ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
