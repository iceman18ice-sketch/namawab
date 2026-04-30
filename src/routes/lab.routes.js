const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');
const { calcVAT, addVAT } = require('../utils/helpers');
const { emitNewOrder } = require('../services/socket.service');

// LAB
router.get('/api/lab/orders', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT lo.*, p.name_en as patient_name FROM lab_radiology_orders lo LEFT JOIN patients p ON lo.patient_id=p.id WHERE lo.is_radiology=0 ORDER BY lo.id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/lab/orders', requireAuth, async (req, res) => {
    try {
        const { patient_id, doctor_id, order_type, description, price } = req.body;
        let labPrice = parseFloat(price) || 0;
        if (!labPrice && order_type) {
            const catalogMatch = (await pool.query('SELECT price FROM lab_tests_catalog WHERE test_name ILIKE $1 LIMIT 1', [`%${order_type}%`])).rows[0];
            if (catalogMatch) labPrice = catalogMatch.price;
        }
        const result = await pool.query('INSERT INTO lab_radiology_orders (patient_id, doctor_id, order_type, description, is_radiology, price, status, approval_status) VALUES ($1,$2,$3,$4,0,$5,\'Requested\',\'Paid\') RETURNING *',
            [patient_id, doctor_id || 0, order_type || '', description || '', labPrice]);
        
        const newOrder = result.rows[0];
        newOrder.item_type = 'lab';
        emitNewOrder(newOrder); // Emit the new order!

        res.json(newOrder);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/lab/orders/direct', requireAuth, async (req, res) => {
    try {
        const { patient_id, order_type, description } = req.body;
        const r = await pool.query(
            `INSERT INTO lab_radiology_orders (patient_id, doctor_id, order_type, description, status, is_radiology, approval_status) 
             VALUES ($1, $2, $3, $4, 'Requested', 0, 'Paid') RETURNING *`,
            [patient_id || 0, req.session.user?.id || 0, order_type || '', description || '']
        );
        const newOrder = r.rows[0];
        newOrder.item_type = 'lab';
        emitNewOrder(newOrder); // Emit the new order!
        res.json(newOrder);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/lab/orders/:id', requireAuth, async (req, res) => {
    try {
        const { status, results } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (status) { sets.push(`status=$${i++}`); vals.push(status); }
        if (results !== undefined) { sets.push(`results=$${i++}`); vals.push(results); }
        if (status === 'Done') { sets.push(`result_date=$${i++}`); vals.push(new Date().toISOString()); }
        vals.push(req.params.id);
        await pool.query(`UPDATE lab_radiology_orders SET ${sets.join(',')} WHERE id=$${i}`, vals);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
