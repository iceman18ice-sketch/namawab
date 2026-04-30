/**
 * FINANCE Routes
 * Auto-extracted from server.js | 23 routes
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


// INVOICES
// ===== INVOICES =====
router.get('/api/invoices', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM invoices ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/invoices', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, total, description, service_type, payment_method, discount, discount_reason } = req.body;
        // Generate sequential invoice number
        const maxInv = (await pool.query("SELECT invoice_number FROM invoices WHERE invoice_number LIKE 'INV-%' ORDER BY id DESC LIMIT 1")).rows[0];
        let nextNum = 1;
        if (maxInv && maxInv.invoice_number) { const parts = maxInv.invoice_number.split('-'); nextNum = parseInt(parts[2]) + 1; }
        const invNumber = 'INV-' + new Date().getFullYear() + '-' + String(nextNum).padStart(5, '0');
        const createdBy = req.session.user?.display_name || '';
        const result = await pool.query(
            'INSERT INTO invoices (patient_id, patient_name, total, description, service_type, payment_method, discount, discount_reason, invoice_number, created_by, original_amount) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
            [patient_id || null, patient_name, total || 0, description || '', service_type || '', payment_method || '', discount || 0, discount_reason || '', invNumber, createdBy, (total || 0) + (discount || 0)]);
        logAudit(req.session.user?.id, createdBy, 'CREATE_INVOICE', 'Finance', invNumber + ' - ' + (total || 0) + ' SAR for ' + patient_name, req.ip);
        res.json((await pool.query('SELECT * FROM invoices WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// BILLING SUMMARY
// ===== BILLING SUMMARY =====
router.get('/api/billing/summary/:patient_id', requireAuth, async (req, res) => {
    try {
        const pid = req.params.patient_id;
        const invoices = (await pool.query('SELECT * FROM invoices WHERE patient_id=$1 ORDER BY id DESC', [pid])).rows;
        const byType = {};
        invoices.forEach(inv => {
            const t = inv.service_type || 'Other';
            if (!byType[t]) byType[t] = { count: 0, total: 0, paid: 0 };
            byType[t].count++;
            byType[t].total += parseFloat(inv.total) || 0;
            if (inv.paid) byType[t].paid += parseFloat(inv.total) || 0;
        });
        const totalBilled = invoices.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
        const totalPaid = invoices.filter(i => i.paid).reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
        res.json({ invoices, byType, totalBilled, totalPaid, balance: totalBilled - totalPaid });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// FINANCE
// ===== FINANCE =====
router.get('/api/finance/accounts', requireAuth, requireRole('finance', 'accounts', 'invoices'), async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM finance_chart_of_accounts WHERE is_active=1 ORDER BY account_code')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/finance/accounts', requireAuth, requireRole('finance', 'accounts', 'invoices'), async (req, res) => {
    try {
        const { account_code, account_name_ar, account_name_en, parent_id, account_type } = req.body;
        const result = await pool.query('INSERT INTO finance_chart_of_accounts (account_code, account_name_ar, account_name_en, parent_id, account_type) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [account_code || '', account_name_ar || '', account_name_en || '', parent_id || 0, account_type || '']);
        res.json((await pool.query('SELECT * FROM finance_chart_of_accounts WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/finance/journal', requireAuth, requireRole('finance', 'accounts', 'invoices'), async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM finance_journal_entries ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/finance/vouchers', requireAuth, requireRole('finance', 'accounts', 'invoices'), async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM finance_vouchers ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// INVOICES (Enhanced)
// ===== INVOICES (Enhanced) =====
router.post('/api/invoices/generate', requireAuth, async (req, res) => {
    try {
        const { patient_id, items } = req.body;
        const p = (await pool.query('SELECT * FROM patients WHERE id=$1', [patient_id])).rows[0];
        if (!p) return res.status(404).json({ error: 'Patient not found' });
        const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const description = items.map(i => i.description).join(' | ');
        const result = await pool.query('INSERT INTO invoices (patient_id, patient_name, total, description, service_type) VALUES ($1,$2,$3,$4,$5) RETURNING id',
            [patient_id, p.name_en || p.name_ar, total, description, 'Medical Services']);
        res.json((await pool.query('SELECT * FROM invoices WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/invoices/:id/pay', requireAuth, async (req, res) => {
    try {
        const { payment_method } = req.body;
        await pool.query('UPDATE invoices SET paid=1, payment_method=$1 WHERE id=$2', [payment_method || 'Cash', req.params.id]);
        res.json((await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DOCTOR COMMISSION REPORT
// ===== DOCTOR COMMISSION REPORT =====
router.get('/api/reports/commissions', requireAuth, async (req, res) => {
    try {
        const doctors = (await pool.query("SELECT id, display_name, speciality, commission_type, commission_value FROM system_users WHERE role='Doctor'")).rows;
        const results = [];
        for (const dr of doctors) {
            // Get all invoices where doctor is linked via medical_records or consultation invoices
            const revenue = (await pool.query(
                `SELECT COALESCE(SUM(i.total), 0) as total FROM invoices i 
                 WHERE i.service_type = 'Consultation' 
                 AND i.description ILIKE $1`, [`%${dr.display_name}%`]
            )).rows[0].total || 0;
            // Also get revenue from lab/radiology orders by this doctor
            const orderRevenue = (await pool.query(
                `SELECT COALESCE(SUM(price), 0) as total FROM lab_radiology_orders WHERE doctor_id=$1`, [dr.id]
            )).rows[0].total || 0;
            const totalRevenue = parseFloat(revenue) + parseFloat(orderRevenue);
            let commission = 0;
            if (dr.commission_type === 'percentage') {
                commission = totalRevenue * (dr.commission_value / 100);
            } else {
                // Fixed per patient
                const patientCount = (await pool.query(
                    'SELECT COUNT(DISTINCT patient_id) as cnt FROM medical_records WHERE doctor_id=$1', [dr.id]
                )).rows[0].cnt || 0;
                commission = patientCount * dr.commission_value;
            }
            results.push({
                doctor_id: dr.id, doctor_name: dr.display_name, speciality: dr.speciality,
                commission_type: dr.commission_type, commission_value: dr.commission_value,
                totalRevenue, commission: Math.round(commission * 100) / 100
            });
        }
        res.json(results);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// FINANCIAL DAILY CLOSE
// ===== FINANCIAL DAILY CLOSE =====
router.get('/api/finance/daily-close', requireAuth, requireRole('finance', 'accounts', 'invoices'), async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM daily_close ORDER BY created_at DESC LIMIT 30')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/finance/daily-close', requireAuth, requireRole('finance', 'accounts', 'invoices'), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Aggregate today's transactions
        const cash = (await pool.query("SELECT COALESCE(SUM(total),0) as t, COUNT(*) as c FROM invoices WHERE created_at::date=CURRENT_DATE AND payment_method='Cash'")).rows[0];
        const card = (await pool.query("SELECT COALESCE(SUM(total),0) as t FROM invoices WHERE created_at::date=CURRENT_DATE AND payment_method='Card'")).rows[0];
        const ins = (await pool.query("SELECT COALESCE(SUM(total),0) as t FROM invoices WHERE created_at::date=CURRENT_DATE AND payment_method='Insurance'")).rows[0];
        const totalTx = (await pool.query("SELECT COUNT(*) as c FROM invoices WHERE created_at::date=CURRENT_DATE")).rows[0];
        const { opening_balance, closing_balance, notes } = req.body;
        const totalCash = Number(cash.t); const totalCard = Number(card.t); const totalIns = Number(ins.t);
        const variance = Number(closing_balance || 0) - (Number(opening_balance || 0) + totalCash);
        const result = await pool.query('INSERT INTO daily_close (close_date, cashier, total_cash, total_card, total_insurance, total_transactions, opening_balance, closing_balance, variance, notes, status, closed_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
            [today, req.session.user.name, totalCash, totalCard, totalIns, Number(totalTx.c), Number(opening_balance || 0), Number(closing_balance || 0), variance, notes || '', 'Closed', req.session.user.name]);
        logAudit(req.session.user.id, req.session.user.name, 'DAILY_CLOSE', 'Finance', `Daily close for ${today}: Cash=${totalCash}, Card=${totalCard}`, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// P&L REPORT
// ===== P&L REPORT =====
router.get('/api/reports/pnl', requireAuth, async (req, res) => {
    try {
        const { from, to } = req.query;
        let dateFilter = '';
        let params = [];
        if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
            dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
            params = [from, to + ' 23:59:59'];
        }
        const revenue = (await pool.query(`SELECT COALESCE(SUM(total),0) as total, COALESCE(SUM(CASE WHEN paid=1 THEN total ELSE 0 END),0) as collected, COALESCE(SUM(discount),0) as discounts FROM invoices ${dateFilter}`, params)).rows[0];
        const byType = (await pool.query(`SELECT service_type, COUNT(*) as cnt, COALESCE(SUM(total),0) as total FROM invoices ${dateFilter} GROUP BY service_type ORDER BY total DESC`, params)).rows;
        const expenses = (await pool.query('SELECT COALESCE(SUM(cost_price * stock_qty),0) as drug_cost FROM pharmacy_drug_catalog WHERE is_active=1')).rows[0];
        res.json({
            totalRevenue: parseFloat(revenue.total),
            totalCollected: parseFloat(revenue.collected),
            totalDiscounts: parseFloat(revenue.discounts),
            totalUncollected: parseFloat(revenue.total) - parseFloat(revenue.collected),
            estimatedCosts: parseFloat(expenses.drug_cost),
            netProfit: parseFloat(revenue.collected) - parseFloat(expenses.drug_cost),
            byType
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// INVOICE CANCEL (Credit Note)
// ===== INVOICE CANCEL (Credit Note) =====
router.post('/api/invoices/cancel/:id', requireAuth, async (req, res) => {
    try {
        const { reason } = req.body;
        const inv = (await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0];
        if (!inv) return res.status(404).json({ error: 'Invoice not found' });
        if (inv.cancelled) return res.status(400).json({ error: 'Already cancelled' });
        await pool.query('UPDATE invoices SET cancelled=1, cancel_reason=$1, cancelled_by=$2, cancelled_at=NOW() WHERE id=$3',
            [reason || '', req.session.user?.display_name || '', req.params.id]);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'CANCEL_INVOICE', 'Finance', 'Cancelled ' + inv.invoice_number + ' (' + inv.total + ' SAR)', req.ip);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DAILY CASH RECONCILIATION
// ===== DAILY CASH RECONCILIATION =====
router.get('/api/reports/daily-cash', requireAuth, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const byCash = (await pool.query("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE payment_method='Cash' AND DATE(created_at)=$1 AND cancelled=0", [date])).rows[0].total;
        const byCard = (await pool.query("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE payment_method IN ('Card','POS','شبكة') AND DATE(created_at)=$1 AND cancelled=0", [date])).rows[0].total;
        const byTransfer = (await pool.query("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE payment_method IN ('Transfer','تحويل') AND DATE(created_at)=$1 AND cancelled=0", [date])).rows[0].total;
        const byInsurance = (await pool.query("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE payment_method='Insurance' AND DATE(created_at)=$1 AND cancelled=0", [date])).rows[0].total;
        const total = (await pool.query("SELECT COALESCE(SUM(total),0) as total, COUNT(*) as cnt FROM invoices WHERE DATE(created_at)=$1 AND cancelled=0", [date])).rows[0];
        const byCreator = (await pool.query("SELECT COALESCE(created_by,'Unknown') as staff, COUNT(*) as cnt, COALESCE(SUM(total),0) as total FROM invoices WHERE DATE(created_at)=$1 AND cancelled=0 GROUP BY created_by ORDER BY total DESC", [date])).rows;
        const byService = (await pool.query("SELECT service_type, COUNT(*) as cnt, COALESCE(SUM(total),0) as total FROM invoices WHERE DATE(created_at)=$1 AND cancelled=0 GROUP BY service_type ORDER BY total DESC", [date])).rows;
        res.json({ date, totalRevenue: parseFloat(total.total), invoiceCount: parseInt(total.cnt), cash: parseFloat(byCash), card: parseFloat(byCard), transfer: parseFloat(byTransfer), insurance: parseFloat(byInsurance), byStaff: byCreator, byService });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DOCTOR REVENUE + COMMISSIONS
// ===== DOCTOR REVENUE + COMMISSIONS =====
router.get('/api/reports/doctor-revenue', requireAuth, async (req, res) => {
    try {
        const { from, to } = req.query;
        let dateFilter = '', params = [];
        if (from && to) { dateFilter = " AND i.created_at BETWEEN $1 AND ($2::text || ' 23:59:59')::timestamp"; params = [from, to]; }
        const doctors = (await pool.query(`SELECT su.id, su.display_name, su.speciality, su.commission_type, su.commission_value,
            COALESCE(COUNT(DISTINCT i.id),0) as invoice_count,
            COALESCE(SUM(i.total),0) as total_revenue
            FROM system_users su
            LEFT JOIN invoices i ON i.description LIKE '%' || su.display_name || '%' AND i.cancelled=0 ${dateFilter}
            WHERE su.role='Doctor' AND su.is_active=1
            GROUP BY su.id ORDER BY total_revenue DESC`, params)).rows;
        doctors.forEach(d => {
            d.total_revenue = parseFloat(d.total_revenue);
            if (d.commission_type === 'percentage') d.commission = (d.total_revenue * (d.commission_value || 0) / 100);
            else d.commission = parseFloat(d.commission_value || 0) * parseInt(d.invoice_count || 0);
        });
        res.json(doctors);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// AGING REPORT (30/60/90/120 days)
// ===== AGING REPORT (30/60/90/120 days) =====
router.get('/api/reports/aging', requireAuth, async (req, res) => {
    try {
        const current = (await pool.query("SELECT patient_name, total, created_at, invoice_number FROM invoices WHERE paid=0 AND cancelled=0 AND created_at >= CURRENT_DATE - 30 ORDER BY created_at DESC")).rows;
        const d30 = (await pool.query("SELECT patient_name, total, created_at, invoice_number FROM invoices WHERE paid=0 AND cancelled=0 AND created_at BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 30 ORDER BY created_at DESC")).rows;
        const d60 = (await pool.query("SELECT patient_name, total, created_at, invoice_number FROM invoices WHERE paid=0 AND cancelled=0 AND created_at BETWEEN CURRENT_DATE - 90 AND CURRENT_DATE - 60 ORDER BY created_at DESC")).rows;
        const d90 = (await pool.query("SELECT patient_name, total, created_at, invoice_number FROM invoices WHERE paid=0 AND cancelled=0 AND created_at < CURRENT_DATE - 90 ORDER BY created_at DESC")).rows;
        const sum = arr => arr.reduce((s, r) => s + parseFloat(r.total), 0);
        res.json({
            current: { items: current, total: sum(current), count: current.length },
            days30: { items: d30, total: sum(d30), count: d30.length },
            days60: { items: d60, total: sum(d60), count: d60.length },
            days90plus: { items: d90, total: sum(d90), count: d90.length },
            grandTotal: sum(current) + sum(d30) + sum(d60) + sum(d90)
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// PARTIAL PAYMENT & REFUND
// ===== PARTIAL PAYMENT & REFUND =====
router.put('/api/invoices/:id/partial-pay', requireAuth, async (req, res) => {
    try {
        const { amount_paid, payment_method } = req.body;
        const invoice = (await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0];
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const prevPaid = parseFloat(invoice.amount_paid || 0);
        const newPaid = prevPaid + parseFloat(amount_paid);
        const total = parseFloat(invoice.total);
        const balance = total - newPaid;
        const isPaid = balance <= 0 ? 1 : 0;

        await pool.query(
            'UPDATE invoices SET amount_paid=$1, balance_due=$2, paid=$3, payment_method=$4 WHERE id=$5',
            [newPaid, Math.max(0, balance), isPaid, payment_method || invoice.payment_method, req.params.id]
        );

        logAudit(req.session.user?.id, req.session.user?.display_name, 'PARTIAL_PAYMENT', 'Invoice',
            invoice.invoice_number + ' paid ' + amount_paid + ' (total paid: ' + newPaid + '/' + total + ')', req.ip);

        res.json({ success: true, amount_paid: newPaid, balance_due: Math.max(0, balance), fully_paid: isPaid });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/invoices/:id/refund', requireAuth, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const invoice = (await pool.query('SELECT * FROM invoices WHERE id=$1', [req.params.id])).rows[0];
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const refundNum = 'REF-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
        await pool.query(
            "INSERT INTO invoices (patient_id, patient_name, total, description, service_type, payment_method, invoice_number, created_by, discount_reason) VALUES ($1,$2,$3,$4,'Refund',$5,$6,$7,$8)",
            [invoice.patient_id, invoice.patient_name, -(parseFloat(amount)), 'Refund for ' + invoice.invoice_number + ': ' + reason, invoice.payment_method, refundNum, req.session.user?.display_name, reason]
        );

        logAudit(req.session.user?.id, req.session.user?.display_name, 'REFUND', 'Invoice', refundNum + ' amount: ' + amount + ' reason: ' + reason, req.ip);
        res.json({ success: true, refund_number: refundNum });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// CASH DRAWER
// ===== CASH DRAWER =====
router.post('/api/cash-drawer/open', requireAuth, async (req, res) => {
    try {
        const { opening_balance } = req.body;
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cash_drawer (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                user_name VARCHAR(200),
                opening_balance DECIMAL(12,2) DEFAULT 0,
                closing_balance DECIMAL(12,2),
                expected_balance DECIMAL(12,2),
                difference DECIMAL(12,2),
                status VARCHAR(20) DEFAULT 'open',
                opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP,
                notes TEXT
            )
        `);

        // Check if already open
        const existing = (await pool.query("SELECT * FROM cash_drawer WHERE user_id=$1 AND status='open'", [req.session.user?.id])).rows[0];
        if (existing) return res.status(400).json({ error: 'Drawer already open. Close current session first.' });

        const result = await pool.query(
            'INSERT INTO cash_drawer (user_id, user_name, opening_balance) VALUES ($1,$2,$3) RETURNING *',
            [req.session.user?.id, req.session.user?.display_name, opening_balance || 0]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/cash-drawer/close', requireAuth, async (req, res) => {
    try {
        const { counted_cash, notes } = req.body;
        const drawer = (await pool.query("SELECT * FROM cash_drawer WHERE user_id=$1 AND status='open'", [req.session.user?.id])).rows[0];
        if (!drawer) return res.status(400).json({ error: 'No open drawer found' });

        // Calculate expected from invoices during session
        const cashInvoices = (await pool.query(
            "SELECT COALESCE(SUM(CASE WHEN total > 0 THEN total ELSE 0 END),0) as income, COALESCE(SUM(CASE WHEN total < 0 THEN ABS(total) ELSE 0 END),0) as refunds FROM invoices WHERE payment_method='Cash' AND created_at >= $1 AND created_by=$2",
            [drawer.opened_at, drawer.user_name]
        )).rows[0];

        const expected = parseFloat(drawer.opening_balance) + parseFloat(cashInvoices.income) - parseFloat(cashInvoices.refunds);
        const difference = parseFloat(counted_cash) - expected;

        await pool.query(
            "UPDATE cash_drawer SET closing_balance=$1, expected_balance=$2, difference=$3, status='closed', closed_at=CURRENT_TIMESTAMP, notes=$4 WHERE id=$5",
            [counted_cash, expected, difference, notes, drawer.id]
        );

        logAudit(req.session.user?.id, req.session.user?.display_name, 'CLOSE_CASH_DRAWER', 'Finance',
            'Expected: ' + expected.toFixed(2) + ' Counted: ' + counted_cash + ' Diff: ' + difference.toFixed(2), req.ip);

        res.json({ expected: expected.toFixed(2), counted: counted_cash, difference: difference.toFixed(2), income: cashInvoices.income, refunds: cashInvoices.refunds });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/cash-drawer/current', requireAuth, async (req, res) => {
    try {
        const drawer = (await pool.query("SELECT * FROM cash_drawer WHERE user_id=$1 AND status='open' ORDER BY id DESC LIMIT 1", [req.session.user?.id])).rows[0];
        if (!drawer) return res.json({ open: false });

        const cashInvoices = (await pool.query(
            "SELECT COALESCE(SUM(CASE WHEN total > 0 THEN total ELSE 0 END),0) as income, COUNT(CASE WHEN total > 0 THEN 1 END) as tx_count FROM invoices WHERE payment_method='Cash' AND created_at >= $1 AND created_by=$2",
            [drawer.opened_at, drawer.user_name]
        )).rows[0];

        res.json({ open: true, drawer, income: cashInvoices.income, tx_count: cashInvoices.tx_count });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



// FINANCE SUMMARY
// ===== FINANCE SUMMARY =====
router.get('/api/finance/summary', requireAuth, requireRole('finance', 'accounts', 'invoices'), async (req, res) => {
    try {
        const { from, to } = req.query;
        let where = "WHERE total > 0";
        let p = [];
        if (from) { where += " AND created_at >= $" + (p.length + 1); p.push(from); }
        if (to) { where += " AND created_at <= $" + (p.length + 1); p.push(to + ' 23:59:59'); }

        const total = (await pool.query("SELECT COALESCE(SUM(total),0) as revenue, COUNT(*) as count FROM invoices " + where, p)).rows[0];
        const paid = (await pool.query("SELECT COALESCE(SUM(total),0) as paid FROM invoices " + where + " AND paid=1", p)).rows[0];
        const unpaid = (await pool.query("SELECT COALESCE(SUM(total),0) as unpaid FROM invoices " + where + " AND (paid=0 OR paid IS NULL)", p)).rows[0];
        const byMethod = (await pool.query("SELECT COALESCE(payment_method,'Cash') as method, SUM(total) as amount, COUNT(*) as cnt FROM invoices " + where + " AND paid=1 GROUP BY payment_method ORDER BY amount DESC", p)).rows;
        const byService = (await pool.query("SELECT COALESCE(service_type,description,'Other') as service, SUM(total) as amount, COUNT(*) as cnt FROM invoices " + where + " GROUP BY COALESCE(service_type,description,'Other') ORDER BY amount DESC LIMIT 10", p)).rows;
        const daily = (await pool.query("SELECT DATE(created_at) as day, SUM(total) as amount FROM invoices " + where + " GROUP BY DATE(created_at) ORDER BY day", p)).rows;

        res.json({ revenue: total.revenue, count: total.count, paid: paid.paid, unpaid: unpaid.unpaid, byMethod, byService, daily });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
