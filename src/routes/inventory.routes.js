/**
 * INVENTORY Routes
 * Auto-extracted from server.js | 12 routes
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


// DEPARTMENT RESOURCE REQUESTS
// ===== DEPARTMENT RESOURCE REQUESTS =====
router.get('/api/dept-requests', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM inventory_dept_requests ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/dept-requests', requireAuth, async (req, res) => {
    try {
        const { department, requested_by, items, notes } = req.body;
        const result = await pool.query('INSERT INTO inventory_dept_requests (department, requested_by, request_date, notes) VALUES ($1,$2,CURRENT_DATE::TEXT,$3) RETURNING id',
            [department || '', requested_by || req.session.user.name || '', notes || '']);
        const reqId = result.rows[0].id;
        if (items && items.length) {
            for (const item of items) {
                await pool.query('INSERT INTO inventory_dept_request_items (request_id, item_id, qty_requested) VALUES ($1,$2,$3)',
                    [reqId, item.item_id || 0, item.qty || 1]);
            }
        }
        res.json((await pool.query('SELECT * FROM inventory_dept_requests WHERE id=$1', [reqId])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/dept-requests/:id/items', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT dri.*, ii.item_name FROM inventory_dept_request_items dri LEFT JOIN inventory_items ii ON dri.item_id=ii.id WHERE dri.request_id=$1', [req.params.id])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/dept-requests/:id', requireAuth, async (req, res) => {
    try {
        const { status, approved_by } = req.body;
        if (status) {
            await pool.query('UPDATE inventory_dept_requests SET status=$1, approved_by=$2 WHERE id=$3', [status, approved_by || req.session.user.name, req.params.id]);
            // If approved, deduct from inventory
            if (status === 'Approved') {
                const items = (await pool.query('SELECT * FROM inventory_dept_request_items WHERE request_id=$1', [req.params.id])).rows;
                for (const item of items) {
                    const approved = item.qty_approved || item.qty_requested;
                    await pool.query('UPDATE inventory_items SET stock_qty = GREATEST(stock_qty - $1, 0) WHERE id=$2', [approved, item.item_id]);
                }
            }
        }
        res.json((await pool.query('SELECT * FROM inventory_dept_requests WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// INVENTORY
// ===== INVENTORY =====
router.get('/api/inventory/items', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM inventory_items WHERE is_active=1 ORDER BY item_name')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/inventory/items', requireAuth, async (req, res) => {
    try {
        const { item_name, item_code, category, unit, cost_price, stock_qty } = req.body;
        const result = await pool.query('INSERT INTO inventory_items (item_name, item_code, category, unit, cost_price, stock_qty) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
            [item_name, item_code || '', category || '', unit || '', cost_price || 0, stock_qty || 0]);
        res.json((await pool.query('SELECT * FROM inventory_items WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// STOCK MOVEMENT LOG
// ===== STOCK MOVEMENT LOG =====
router.get('/api/pharmacy/stock-log', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM pharmacy_stock_log ORDER BY created_at DESC LIMIT 200')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// INVENTORY LOW STOCK
// ===== INVENTORY LOW STOCK =====
router.get('/api/inventory/low-stock', requireAuth, async (req, res) => {
    try {
        const items = (await pool.query("SELECT * FROM inventory WHERE CAST(quantity AS INTEGER) <= CAST(COALESCE(reorder_level,'10') AS INTEGER) ORDER BY CAST(quantity AS INTEGER) ASC")).rows;
        res.json(items);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// INVENTORY ITEMS
// ===== INVENTORY ITEMS =====
router.get('/api/inventory', requireAuth, async (req, res) => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS inventory (
            id SERIAL PRIMARY KEY, name VARCHAR(200), category VARCHAR(100),
            quantity INTEGER DEFAULT 0, unit VARCHAR(50), reorder_level INTEGER DEFAULT 10,
            location VARCHAR(100), supplier VARCHAR(200), cost NUMERIC(10,2),
            expiry_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        res.json((await pool.query('SELECT * FROM inventory ORDER BY name ASC')).rows);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/inventory', requireAuth, async (req, res) => {
    try {
        const { name, category, quantity, unit, reorder_level, location, supplier, cost, expiry_date } = req.body;
        const r = await pool.query('INSERT INTO inventory (name,category,quantity,unit,reorder_level,location,supplier,cost,expiry_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [name, category, quantity || 0, unit, reorder_level || 10, location, supplier, cost, expiry_date]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/inventory/:id', requireAuth, async (req, res) => {
    try {
        const { name, category, quantity, unit, reorder_level, location, supplier, cost, expiry_date } = req.body;
        const r = await pool.query('UPDATE inventory SET name=$1,category=$2,quantity=$3,unit=$4,reorder_level=$5,location=$6,supplier=$7,cost=$8,expiry_date=$9 WHERE id=$10 RETURNING *',
            [name, category, quantity, unit, reorder_level, location, supplier, cost, expiry_date, req.params.id]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/api/inventory/:id', requireAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM inventory WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
