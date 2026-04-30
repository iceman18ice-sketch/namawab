const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');
const crypto = require('crypto');

// Utility to verify admin/cfo roles (Simplified for the demo)
const requireExecutive = (req, res, next) => {
    // In real app, check req.session.user.role === 'admin' || 'cfo'
    next();
};

// 1. Fetch pending claims for NPHIES
router.get('/claims', requireAuth, requireExecutive, async (req, res) => {
    try {
        const claims = (await pool.query(`
            SELECT b.*, p.name_en as patient_name, s.name_en as service_name
            FROM billing_transactions b
            LEFT JOIN patients p ON b.patient_id = p.id
            LEFT JOIN service_catalog s ON b.service_code = s.service_code
            WHERE b.status = 'Billed' AND b.nphies_status != 'Approved'
            ORDER BY b.created_at DESC
        `)).rows;
        res.json(claims);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// 2. Submit to NPHIES Orchestrator
router.post('/submit-nphies', requireAuth, requireExecutive, async (req, res) => {
    try {
        const { transaction_id } = req.body;
        
        // Update status to Submitted
        await pool.query('UPDATE billing_transactions SET nphies_status = $1 WHERE transaction_id = $2', ['Submitted', transaction_id]);
        
        // Mock NPHIES API Call delay
        setTimeout(async () => {
            // Randomly approve or reject for demo
            const isApproved = Math.random() > 0.3; // 70% approval rate
            const newStatus = isApproved ? 'Approved' : 'Rejected';
            
            await pool.query('UPDATE billing_transactions SET nphies_status = $1, status = $2 WHERE transaction_id = $3', 
                [newStatus, isApproved ? 'Claimed' : 'Billed', transaction_id]);
            
            // Note: If rejected, we should emit to doctor via socket in real implementation
        }, 2000);

        res.json({ success: true, message: 'Claim submitted to NPHIES Gateway successfully' });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// 3. ZATCA Final Invoicing (TLV QR Code & XML generation mock)
router.post('/zatca-invoice', requireAuth, requireExecutive, async (req, res) => {
    try {
        const { patient_id } = req.body;
        
        // Fetch all billed/claimed transactions for this encounter
        const txs = (await pool.query('SELECT * FROM billing_transactions WHERE patient_id = $1 AND status != \'Paid\'', [patient_id])).rows;
        
        if (txs.length === 0) {
            return res.status(400).json({ error: 'No pending transactions found for this patient' });
        }

        const totalAmount = txs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        const vatAmount = totalAmount * 0.15;
        const grandTotal = totalAmount + vatAmount;

        // TLV Encoding (Tag, Length, Value) for ZATCA Phase 2
        // Mocking the hex generation for demo
        const zatcaPayload = {
            seller: 'Nama Medical Center',
            vat_no: '310123456700003',
            timestamp: new Date().toISOString(),
            total: grandTotal.toFixed(2),
            vat: vatAmount.toFixed(2)
        };
        const qrBase64 = Buffer.from(JSON.stringify(zatcaPayload)).toString('base64');
        
        // Mark as Paid
        for (const tx of txs) {
            await pool.query('UPDATE billing_transactions SET status = $1 WHERE transaction_id = $2', ['Paid', tx.transaction_id]);
        }

        res.json({
            success: true,
            invoice: {
                invoice_number: 'INV-' + Date.now(),
                patient_id,
                total_amount: totalAmount,
                vat_amount: vatAmount,
                grand_total: grandTotal,
                qr_base64: qrBase64,
                xml_hash: crypto.createHash('sha256').update(JSON.stringify(txs)).digest('hex')
            }
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// 4. Executive Dashboard Analytics
router.get('/dashboard', requireAuth, requireExecutive, async (req, res) => {
    try {
        const totalRev = (await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM billing_transactions")).rows[0].total;
        const pendingClaimsCount = (await pool.query("SELECT COUNT(*) FROM billing_transactions WHERE nphies_status='Submitted'")).rows[0].count;
        const paidCount = (await pool.query("SELECT COUNT(*) FROM billing_transactions WHERE status='Paid'")).rows[0].count;
        
        // Revenue by department (Mocked grouping by service catalog department)
        const revByDept = (await pool.query(`
            SELECT s.department, SUM(b.amount) as revenue
            FROM billing_transactions b
            JOIN service_catalog s ON b.service_code = s.service_code
            GROUP BY s.department
        `)).rows;

        // Daily revenue trend (last 7 days)
        const dailyRev = (await pool.query(`
            SELECT DATE(created_at) as date, SUM(amount) as total
            FROM billing_transactions
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) DESC
            LIMIT 7
        `)).rows.reverse();

        res.json({
            metrics: {
                totalRevenue: parseFloat(totalRev),
                pendingClaims: parseInt(pendingClaimsCount),
                paidInvoices: parseInt(paidCount)
            },
            revenueByDept: revByDept,
            dailyRevenue: dailyRev
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
