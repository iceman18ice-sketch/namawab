/**
 * HR Routes
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


// EMPLOYEES
// ===== EMPLOYEES =====
router.get('/api/employees', requireAuth, async (req, res) => {
    try {
        const { role } = req.query;
        if (role) { res.json((await pool.query('SELECT * FROM employees WHERE role LIKE $1 ORDER BY name', [`%${role}%`])).rows); }
        else { res.json((await pool.query('SELECT * FROM employees ORDER BY id DESC')).rows); }
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/employees', requireAuth, async (req, res) => {
    try {
        const { name, name_ar, name_en, role, department_ar, department_en, salary, commission_type, commission_value } = req.body;
        const result = await pool.query('INSERT INTO employees (name, name_ar, name_en, role, department_ar, department_en, salary, commission_type, commission_value) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
            [name || name_en, name_ar || '', name_en || '', role || 'Staff', department_ar || '', department_en || '', salary || 0, commission_type || 'percentage', parseFloat(commission_value) || 0]);
        res.json((await pool.query('SELECT * FROM employees WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/api/employees/:id', requireAuth, async (req, res) => {
    try { await pool.query('DELETE FROM employees WHERE id=$1', [req.params.id]); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// HR
// ===== HR =====
router.get('/api/hr/employees', requireAuth, requireRole('hr'), async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM hr_employees WHERE is_active=1 ORDER BY id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/hr/employees', requireAuth, requireRole('hr'), async (req, res) => {
    try {
        const { emp_number, name_ar, name_en, national_id, phone, email, department, job_title, hire_date, basic_salary, housing_allowance, transport_allowance } = req.body;
        const result = await pool.query('INSERT INTO hr_employees (emp_number, name_ar, name_en, national_id, phone, email, department, job_title, hire_date, basic_salary, housing_allowance, transport_allowance) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id',
            [emp_number || '', name_ar || '', name_en || '', national_id || '', phone || '', email || '', department || '', job_title || '', hire_date || '', basic_salary || 0, housing_allowance || 0, transport_allowance || 0]);
        res.json((await pool.query('SELECT * FROM hr_employees WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/hr/salaries', requireAuth, requireRole('hr'), async (req, res) => {
    try { res.json((await pool.query('SELECT hs.*, he.name_en as employee_name FROM hr_salaries hs LEFT JOIN hr_employees he ON hs.employee_id=he.id ORDER BY hs.id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/hr/leaves', requireAuth, requireRole('hr'), async (req, res) => {
    try { res.json((await pool.query('SELECT hl.*, he.name_en as employee_name FROM hr_leaves hl LEFT JOIN hr_employees he ON hl.employee_id=he.id ORDER BY hl.id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/hr/attendance', requireAuth, requireRole('hr'), async (req, res) => {
    try { res.json((await pool.query('SELECT ha.*, he.name_en as employee_name FROM hr_attendance ha LEFT JOIN hr_employees he ON ha.employee_id=he.id ORDER BY ha.id DESC')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});


module.exports = router;
