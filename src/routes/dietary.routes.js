/**
 * DIETARY Routes
 * Auto-extracted from server.js | 7 routes
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


// DIETARY
// ===== DIETARY =====
router.get('/api/dietary/orders', requireAuth, async (req, res) => {
    try { res.json((await pool.query("SELECT * FROM diet_orders WHERE status='Active' ORDER BY id DESC")).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/dietary/orders', requireAuth, async (req, res) => {
    try {
        const { admission_id, patient_id, patient_name, diet_type, diet_type_ar, texture, fluid, allergies, restrictions, supplements, ordered_by, meal_preferences, notes } = req.body;
        const r = await pool.query('INSERT INTO diet_orders (admission_id,patient_id,patient_name,diet_type,diet_type_ar,texture,fluid,allergies,restrictions,supplements,ordered_by,meal_preferences,start_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
            [admission_id, patient_id, patient_name, diet_type || 'Regular', diet_type_ar || 'عادي', texture || 'Normal', fluid || 'Normal', allergies, restrictions, supplements, ordered_by, meal_preferences, new Date().toISOString().split('T')[0], notes]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/dietary/orders/:id', requireAuth, async (req, res) => {
    try {
        const { diet_type, diet_type_ar, texture, fluid, restrictions, status } = req.body;
        const sets = []; const vals = []; let i = 1;
        if (diet_type) { sets.push(`diet_type=$${i++}`); vals.push(diet_type); }
        if (diet_type_ar) { sets.push(`diet_type_ar=$${i++}`); vals.push(diet_type_ar); }
        if (texture) { sets.push(`texture=$${i++}`); vals.push(texture); }
        if (fluid) { sets.push(`fluid=$${i++}`); vals.push(fluid); }
        if (restrictions) { sets.push(`restrictions=$${i++}`); vals.push(restrictions); }
        if (status) { sets.push(`status=$${i++}`); vals.push(status); }
        vals.push(req.params.id);
        await pool.query(`UPDATE diet_orders SET ${sets.join(',')} WHERE id=$${i}`, vals);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/dietary/meals', requireAuth, async (req, res) => {
    try {
        const { order_id, patient_id, meal_type, meal_date, items, calories } = req.body;
        const r = await pool.query('INSERT INTO diet_meals (order_id,patient_id,meal_type,meal_date,items,calories) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [order_id, patient_id, meal_type, meal_date || new Date().toISOString().split('T')[0], items, calories || 0]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/api/dietary/meals/:id/deliver', requireAuth, async (req, res) => {
    try {
        await pool.query('UPDATE diet_meals SET delivered=1, delivered_by=$1 WHERE id=$2', [req.body.delivered_by || '', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.get('/api/nutrition/assessments', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM nutrition_assessments ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/api/nutrition/assessments', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, height_cm, weight_kg, caloric_needs, protein_needs, screening_score, malnutrition_risk, plan, assessed_by } = req.body;
        const bmi = height_cm && weight_kg ? parseFloat((weight_kg / ((height_cm / 100) ** 2)).toFixed(1)) : 0;
        const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        const r = await pool.query('INSERT INTO nutrition_assessments (patient_id,patient_name,assessment_date,height_cm,weight_kg,bmi,bmi_category,caloric_needs,protein_needs,screening_score,malnutrition_risk,plan,assessed_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
            [patient_id, patient_name, new Date().toISOString().split('T')[0], height_cm || 0, weight_kg || 0, bmi, cat, caloric_needs || 0, protein_needs || 0, screening_score || 0, malnutrition_risk || 'Low', plan, assessed_by]);
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
