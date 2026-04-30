/**
 * RADIOLOGY Routes
 * Auto-extracted from server.js | 5 routes
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
const multer = require('multer');
const uploadDir = path.join(__dirname, '../../public/uploads/radiology');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });


// RADIOLOGY
// ===== RADIOLOGY =====
router.get('/api/radiology/orders', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT lo.*, p.name_en as patient_name FROM lab_radiology_orders lo LEFT JOIN patients p ON lo.patient_id=p.id WHERE lo.is_radiology=1 ORDER BY lo.id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/radiology/catalog', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM radiology_catalog ORDER BY id')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/radiology/orders/:id', requireAuth, async (req, res) => {
    try {
        const { status, result: testResult } = req.body;
        if (status) await pool.query('UPDATE lab_radiology_orders SET status=$1 WHERE id=$2', [status, req.params.id]);
        if (testResult) await pool.query('UPDATE lab_radiology_orders SET results=$1 WHERE id=$2', [testResult, req.params.id]);
        res.json((await pool.query('SELECT * FROM lab_radiology_orders WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/radiology/orders', requireAuth, async (req, res) => {
    try {
        const { patient_id, doctor_id, order_type, description, price } = req.body;
        // Auto-lookup price from radiology catalog if not provided
        let radPrice = parseFloat(price) || 0;
        if (!radPrice && order_type) {
            const catalogMatch = (await pool.query('SELECT price FROM radiology_catalog WHERE exact_name ILIKE $1 LIMIT 1', [`%${order_type}%`])).rows[0];
            if (catalogMatch) radPrice = catalogMatch.price;
        }
        const result = await pool.query('INSERT INTO lab_radiology_orders (patient_id, doctor_id, order_type, description, is_radiology, price) VALUES ($1,$2,$3,$4,1,$5) RETURNING id',
            [patient_id, doctor_id || 0, order_type || '', description || '', radPrice]);
        // Auto-create invoice for radiology (with VAT for non-Saudis)
        if (radPrice > 0 && patient_id) {
            const p = (await pool.query('SELECT name_en, name_ar FROM patients WHERE id=$1', [patient_id])).rows[0];
            const vat = await calcVAT(patient_id);
            const { total: finalTotal, vatAmount } = addVAT(radPrice, vat.rate);
            const desc = `أشعة: ${order_type}` + (vat.applyVAT ? ` (+ ضريبة ${vatAmount} SAR)` : '');
            await pool.query('INSERT INTO invoices (patient_id, patient_name, total, vat_amount, description, service_type, paid) VALUES ($1,$2,$3,$4,$5,$6,0)',
                [patient_id, p?.name_en || p?.name_ar || '', finalTotal, vatAmount, desc, 'Radiology']);
        }
        res.json((await pool.query('SELECT * FROM lab_radiology_orders WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/radiology/orders/:id/upload', requireAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const orderId = req.params.id;
        const order = (await pool.query('SELECT * FROM lab_radiology_orders WHERE id=$1', [orderId])).rows[0];
        if (!order) return res.status(404).json({ error: 'Order not found' });
        const imagePath = `/uploads/radiology/${req.file.filename}`;
        const existingResults = order.results || '';
        const imageTag = `[IMG:${imagePath}]`;
        const newResults = existingResults ? `${existingResults}\n${imageTag}` : imageTag;
        await pool.query('UPDATE lab_radiology_orders SET results=$1 WHERE id=$2', [newResults, orderId]);
        const updated = (await pool.query('SELECT * FROM lab_radiology_orders WHERE id=$1', [orderId])).rows[0];
        res.json({ success: true, path: imagePath, order: updated });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
