/**
 * ZATCA Routes
 * Auto-extracted from server.js | 8 routes
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


// ZATCA E-INVOICING
// ===== ZATCA E-INVOICING =====
router.get('/api/zatca/invoices', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM zatca_invoices ORDER BY created_at DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/zatca/generate', requireAuth, async (req, res) => {
    try {
        const { invoice_id } = req.body;
        const inv = (await pool.query('SELECT i.*, p.name_ar, p.name_en, p.national_id FROM invoices i LEFT JOIN patients p ON i.patient_id=p.id WHERE i.id=$1', [invoice_id])).rows[0];
        if (!inv) return res.status(404).json({ error: 'Invoice not found' });
        const company = (await pool.query("SELECT setting_value FROM company_settings WHERE setting_key='company_name'")).rows[0];
        const vat = (await pool.query("SELECT setting_value FROM company_settings WHERE setting_key='vat_number'")).rows[0];
        const totalBeforeVat = Number(inv.total) / 1.15;
        const vatAmount = Number(inv.total) - totalBeforeVat;
        const qrData = Buffer.from(JSON.stringify({ seller: company?.setting_value || 'Medical Center', vat: vat?.setting_value || '', date: new Date().toISOString(), total: inv.total, vatAmount: vatAmount.toFixed(2) })).toString('base64');
        const result = await pool.query('INSERT INTO zatca_invoices (invoice_id, invoice_number, seller_name, seller_vat, buyer_name, total_before_vat, vat_amount, total_with_vat, qr_code, submission_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [invoice_id, 'INV-' + String(invoice_id).padStart(8, '0'), company?.setting_value || '', vat?.setting_value || '', inv.name_ar || inv.name_en || '', totalBeforeVat.toFixed(2), vatAmount.toFixed(2), inv.total, qrData, 'Generated']);
        logAudit(req.session.user.id, req.session.user.name, 'ZATCA_GENERATE', 'ZATCA', `E-invoice for INV-${invoice_id}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// ZATCA E-INVOICING
// ===== ZATCA E-INVOICING =====

// -- ZATCA Settings Table --
(async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS zatca_settings (
            id SERIAL PRIMARY KEY,
            seller_name VARCHAR(300),
            seller_name_ar VARCHAR(300),
            tax_number VARCHAR(20),
            commercial_reg VARCHAR(20),
            street VARCHAR(200),
            building_number VARCHAR(20),
            district VARCHAR(100),
            city VARCHAR(100),
            postal_code VARCHAR(10),
            country_code VARCHAR(5) DEFAULT 'SA',
            phase VARCHAR(10) DEFAULT '1',
            invoice_type VARCHAR(20) DEFAULT 'simplified',
            private_key_base64 TEXT,
            certificate_base64 TEXT,
            is_active BOOLEAN DEFAULT true,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    } catch (e) { console.error('ZATCA table error:', e.message); }
})();

// -- ZATCA TLV QR Code Generator --
function zatcaTLV(tag, value) {
    const buf = Buffer.from(value, 'utf-8');
    return Buffer.concat([Buffer.from([tag, buf.length]), buf]);
}

function generateZatcaQRPhase1(sellerName, taxNumber, timestamp, totalWithVat, vatAmount) {
    const tlvData = Buffer.concat([
        zatcaTLV(1, sellerName),
        zatcaTLV(2, taxNumber),
        zatcaTLV(3, timestamp),
        zatcaTLV(4, totalWithVat),
        zatcaTLV(5, vatAmount)
    ]);
    return tlvData.toString('base64');
}

function generateZatcaQRPhase2(sellerName, taxNumber, timestamp, totalWithVat, vatAmount, xmlHash, signature, publicKey, certSignature) {
    const tlvData = Buffer.concat([
        zatcaTLV(1, sellerName),
        zatcaTLV(2, taxNumber),
        zatcaTLV(3, timestamp),
        zatcaTLV(4, totalWithVat),
        zatcaTLV(5, vatAmount),
        zatcaTLV(6, xmlHash || ''),
        zatcaTLV(7, signature || ''),
        zatcaTLV(8, publicKey || ''),
        zatcaTLV(9, certSignature || '')
    ]);
    return tlvData.toString('base64');
}

// -- Get ZATCA Settings --
router.get('/api/zatca/settings', requireAuth, async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM zatca_settings ORDER BY id DESC LIMIT 1')).rows;
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// -- Save ZATCA Settings --
router.post('/api/zatca/settings', requireAuth, async (req, res) => {
    try {
        const { seller_name, seller_name_ar, tax_number, commercial_reg, street, building_number, district, city, postal_code, country_code, phase, invoice_type, private_key_base64, certificate_base64 } = req.body;

        // Upsert: delete old and insert new
        await pool.query('DELETE FROM zatca_settings');
        const r = await pool.query(
            `INSERT INTO zatca_settings (seller_name, seller_name_ar, tax_number, commercial_reg, street, building_number, district, city, postal_code, country_code, phase, invoice_type, private_key_base64, certificate_base64) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            [seller_name, seller_name_ar, tax_number, commercial_reg, street, building_number, district, city, postal_code, country_code || 'SA', phase || '1', invoice_type || 'simplified', private_key_base64, certificate_base64]
        );
        logAudit(req.session.user?.id, req.session.user?.display_name, 'UPDATE_ZATCA_SETTINGS', 'ZATCA', 'ZATCA settings updated - TRN: ' + tax_number, req.ip);
        res.json(r.rows[0]);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// -- Get ZATCA Invoices (all invoices with ZATCA QR data) --
router.get('/api/zatca/invoices', requireAuth, async (req, res) => {
    try {
        const invoices = (await pool.query('SELECT * FROM invoices ORDER BY id DESC LIMIT 200')).rows;
        const settings = (await pool.query('SELECT * FROM zatca_settings LIMIT 1')).rows[0];

        // Generate QR data for each invoice
        const result = invoices.map(inv => {
            let qr_base64 = '';
            if (settings && settings.tax_number) {
                const timestamp = inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString();
                const total = parseFloat(inv.total || 0).toFixed(2);
                const vat = parseFloat(inv.vat_amount || 0).toFixed(2);
                const sellerName = settings.seller_name_ar || settings.seller_name || '';

                if (settings.phase === '2' && settings.private_key_base64 && settings.certificate_base64) {
                    // Phase 2 with digital signature
                    const crypto = require('crypto');
                    const invoiceData = inv.invoice_number + '|' + total + '|' + vat + '|' + timestamp;
                    const xmlHash = crypto.createHash('sha256').update(invoiceData).digest('hex');

                    let signature = '';
                    try {
                        const privateKey = Buffer.from(settings.private_key_base64, 'base64').toString('utf-8');
                        const sign = crypto.createSign('SHA256');
                        sign.update(invoiceData);
                        signature = sign.sign(privateKey, 'base64');
                    } catch (e) { signature = ''; }

                    qr_base64 = generateZatcaQRPhase2(sellerName, settings.tax_number, timestamp, total, vat, xmlHash, signature, settings.certificate_base64 || '', '');
                } else {
                    // Phase 1 simple QR
                    qr_base64 = generateZatcaQRPhase1(sellerName, settings.tax_number, timestamp, total, vat);
                }
            }
            return { ...inv, qr_base64, zatca_status: inv.zatca_status || (settings?.tax_number ? 'ready' : 'no_settings') };
        });

        res.json(result);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// -- Generate QR for single invoice --
router.get('/api/zatca/qr/:invoiceId', requireAuth, async (req, res) => {
    try {
        const inv = (await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.invoiceId])).rows[0];
        if (!inv) return res.status(404).json({ error: 'Invoice not found' });

        const settings = (await pool.query('SELECT * FROM zatca_settings LIMIT 1')).rows[0];
        if (!settings || !settings.tax_number) return res.status(400).json({ error: 'ZATCA settings not configured' });

        const timestamp = inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString();
        const total = parseFloat(inv.total || 0).toFixed(2);
        const vat = parseFloat(inv.vat_amount || 0).toFixed(2);
        const sellerName = settings.seller_name_ar || settings.seller_name || '';

        let qr_base64, phase_used;
        if (settings.phase === '2' && settings.private_key_base64 && settings.certificate_base64) {
            const crypto = require('crypto');
            const invoiceData = inv.invoice_number + '|' + total + '|' + vat + '|' + timestamp;
            const xmlHash = crypto.createHash('sha256').update(invoiceData).digest('hex');
            let signature = '';
            try {
                const privateKey = Buffer.from(settings.private_key_base64, 'base64').toString('utf-8');
                const sign = crypto.createSign('SHA256');
                sign.update(invoiceData);
                signature = sign.sign(privateKey, 'base64');
            } catch (e) { signature = ''; }
            qr_base64 = generateZatcaQRPhase2(sellerName, settings.tax_number, timestamp, total, vat, xmlHash, signature, settings.certificate_base64 || '', '');
            phase_used = '2';
        } else {
            qr_base64 = generateZatcaQRPhase1(sellerName, settings.tax_number, timestamp, total, vat);
            phase_used = '1';
        }

        res.json({ invoice: inv, qr_base64, phase_used, settings: { seller_name: settings.seller_name, tax_number: settings.tax_number, phase: settings.phase } });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// -- Submit invoice to ZATCA (mark as submitted) --
router.post('/api/zatca/submit/:invoiceId', requireAuth, async (req, res) => {
    try {
        await pool.query("DO $$ BEGIN ALTER TABLE invoices ADD COLUMN zatca_status VARCHAR(30) DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;");
        await pool.query("UPDATE invoices SET zatca_status='submitted' WHERE id=$1", [req.params.invoiceId]);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'ZATCA_SUBMIT', 'ZATCA', 'Invoice ' + req.params.invoiceId + ' submitted to ZATCA', req.ip);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// -- Bulk submit invoices --
router.post('/api/zatca/bulk-submit', requireAuth, async (req, res) => {
    try {
        await pool.query("DO $$ BEGIN ALTER TABLE invoices ADD COLUMN zatca_status VARCHAR(30) DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;");
        const { invoice_ids } = req.body;
        if (invoice_ids && invoice_ids.length) {
            await pool.query("UPDATE invoices SET zatca_status='submitted' WHERE id = ANY($1::int[])", [invoice_ids]);
        }
        res.json({ success: true, count: invoice_ids?.length || 0 });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// -- Add zatca_status column if missing --
(async () => {
    try {
        await pool.query("DO $$ BEGIN ALTER TABLE invoices ADD COLUMN zatca_status VARCHAR(30) DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;");
    } catch (e) { }
})();


module.exports = router;
