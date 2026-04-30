const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');
const { emitClinicalAlert } = require('../services/socket.service'); // we'll use this to notify nurse/doctor

// 1. Get Inventory
router.get('/inventory', requireAuth, async (req, res) => {
    try {
        const items = (await pool.query('SELECT * FROM inventory_items ORDER BY category, item_name_en')).rows;
        res.json(items);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// 2. Get Pending eMAR prescriptions
router.get('/prescriptions', requireAuth, async (req, res) => {
    try {
        // We get active emar orders that haven't been completely dispensed yet
        // For simplicity, we just fetch all Active orders from emar_orders table
        // (Assuming emar_orders table has status column)
        const query = `
            SELECT o.*, p.name_en as patient_name, p.name_ar as patient_name_ar 
            FROM emar_orders o 
            LEFT JOIN patients p ON o.patient_id = p.id
            WHERE o.status = 'Active'
            ORDER BY o.created_at DESC
        `;
        const orders = (await pool.query(query)).rows;
        res.json(orders);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// 3. Dispense Medication
router.post('/dispense', requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { order_id, patient_id, item_code, quantity } = req.body;
        const pharmacist = req.session.user?.name || 'Pharmacist';

        // 3.1 Check Stock
        const item = (await client.query('SELECT * FROM inventory_items WHERE item_code = $1', [item_code])).rows[0];
        if (!item || item.current_stock < quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient stock or item not found' });
        }

        // 3.2 Deduct Stock
        await client.query('UPDATE inventory_items SET current_stock = current_stock - $1 WHERE item_code = $2', [quantity, item_code]);

        // 3.3 Record Dispensing
        const dispenseResult = await client.query(`
            INSERT INTO pharmacy_dispensing (order_id, patient_id, item_code, quantity, dispensed_by, status)
            VALUES ($1, $2, $3, $4, $5, 'Dispensed') RETURNING *
        `, [order_id || null, patient_id, item_code, quantity, pharmacist]);
        
        // 3.4 Auto-Billing (Zero Leakage)
        const totalPrice = item.unit_price * quantity;
        await client.query(`
            INSERT INTO billing_transactions (patient_id, order_id, service_code, amount, status)
            VALUES ($1, $2, $3, $4, 'Billed')
        `, [patient_id, order_id || null, item_code, totalPrice]);

        // 3.5 Check Low Stock Alert
        let lowStockAlert = false;
        if (item.current_stock - quantity <= item.min_stock_level) {
            lowStockAlert = true;
            // Could emit a low stock alert to management
        }

        // 3.6 Emit Notification to Nursing
        emitClinicalAlert(patient_id, {
            type: 'success',
            time: 'الآن',
            text: `💊 تم صرف الدواء: ${item.item_name_ar} (الكمية: ${quantity}) للمريض #${patient_id} وأصبح جاهزاً للتعاطي.`
        });

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            dispense: dispenseResult.rows[0], 
            lowStockAlert,
            message: 'Medication dispensed and billed successfully'
        });
    } catch (e) { 
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: 'Server error' }); 
    } finally {
        client.release();
    }
});

module.exports = router;
