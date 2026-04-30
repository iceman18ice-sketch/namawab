/**
 * TRANSPORT Routes
 * Auto-extracted from server.js | 3 routes
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


// PATIENT TRANSPORT
// ===== PATIENT TRANSPORT =====
router.get('/api/transport/requests', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM transport_requests ORDER BY request_time DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/transport/requests', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, from_location, to_location, transport_type, priority, requested_by, special_needs } = req.body;
        const r = await pool.query('INSERT INTO transport_requests (patient_id,patient_name,from_location,to_location,transport_type,priority,requested_by,special_needs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [patient_id, patient_name, from_location, to_location, transport_type || 'Wheelchair', priority || 'Routine', requested_by, special_needs]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/transport/requests/:id', requireAuth, async (req, res) => {
    try {
        const { status, assigned_porter, pickup_time, dropoff_time } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (status) { sets.push(`status=$${i++}`); vals.push(status); }
        if (assigned_porter) { sets.push(`assigned_porter=$${i++}`); vals.push(assigned_porter); }
        if (pickup_time) { sets.push(`pickup_time=$${i++}`); vals.push(pickup_time); }
        if (dropoff_time) { sets.push(`dropoff_time=$${i++}`); vals.push(dropoff_time); }
        vals.push(req.params.id);
        await pool.query(`UPDATE transport_requests SET ${sets.join(',')} WHERE id=$${i}`, vals);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
