/**
 * DASHBOARD Routes
 * Auto-extracted from server.js | 4 routes
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


// DASHBOARD
// ===== DASHBOARD =====
router.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const patients = (await pool.query('SELECT COUNT(*) as cnt FROM patients')).rows[0].cnt;
        const revenue = (await pool.query('SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE paid=1')).rows[0].total;
        const waiting = (await pool.query("SELECT COUNT(*) as cnt FROM patients WHERE status='Waiting'")).rows[0].cnt;
        const pendingClaims = (await pool.query("SELECT COUNT(*) as cnt FROM insurance_claims WHERE status='Pending'")).rows[0].cnt;
        const todayAppts = (await pool.query("SELECT COUNT(*) as cnt FROM appointments WHERE appt_date=CURRENT_DATE::TEXT")).rows[0].cnt;
        const employees = (await pool.query('SELECT COUNT(*) as cnt FROM employees')).rows[0].cnt;
        res.json({ patients, revenue, waiting, pendingClaims, todayAppts, employees });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// ENHANCED DASHBOARD STATS
// ===== ENHANCED DASHBOARD STATS =====
router.get('/api/dashboard/enhanced', requireAuth, async (req, res) => {
    try {
        const today = 'CURRENT_DATE';
        const todayRevenue = (await pool.query(`SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE created_at::date = CURRENT_DATE`)).rows[0].total;
        const monthRevenue = (await pool.query(`SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE created_at >= date_trunc('month', CURRENT_DATE)`)).rows[0].total;
        const unpaidTotal = (await pool.query(`SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE paid = 0`)).rows[0].total;
        const todayAppts = (await pool.query(`SELECT COUNT(*) as cnt FROM appointments WHERE appt_date = CURRENT_DATE::TEXT`)).rows[0].cnt;
        const pendingLab = (await pool.query(`SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE status = 'Requested' AND is_radiology = 0`)).rows[0].cnt;
        const pendingRad = (await pool.query(`SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE status = 'Requested' AND is_radiology = 1`)).rows[0].cnt;
        const pendingRx = (await pool.query(`SELECT COUNT(*) as cnt FROM pharmacy_prescriptions_queue WHERE status = 'Pending'`)).rows[0].cnt;
        const pendingReferrals = (await pool.query(`SELECT COUNT(*) as cnt FROM patient_referrals WHERE status = 'Pending'`)).rows[0].cnt;
        // Top doctors by revenue this month
        const topDoctors = (await pool.query(`
            SELECT mr.doctor_id, su.display_name, COUNT(DISTINCT mr.patient_id) as patients,
                   COALESCE(SUM(i.total), 0) as revenue
            FROM medical_records mr
            LEFT JOIN system_users su ON mr.doctor_id = su.id
            LEFT JOIN invoices i ON i.patient_id = mr.patient_id AND i.service_type = 'Consultation'
            WHERE mr.visit_date >= date_trunc('month', CURRENT_DATE)
            GROUP BY mr.doctor_id, su.display_name
            ORDER BY revenue DESC LIMIT 5
        `)).rows;
        // Revenue by service type
        const revenueByType = (await pool.query(`
            SELECT service_type, COALESCE(SUM(total), 0) as total, COUNT(*) as cnt
            FROM invoices WHERE created_at >= date_trunc('month', CURRENT_DATE)
            GROUP BY service_type ORDER BY total DESC
        `)).rows;
        res.json({ todayRevenue, monthRevenue, unpaidTotal, todayAppts, pendingLab, pendingRad, pendingRx, pendingReferrals, topDoctors, revenueByType });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// ENHANCED DASHBOARD STATS (today KPIs)
// ===== ENHANCED DASHBOARD STATS (today KPIs) =====
router.get('/api/dashboard/today', requireAuth, async (req, res) => {
    try {
        const todayRev = (await pool.query("SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE DATE(created_at)=CURRENT_DATE AND cancelled=0")).rows[0].total;
        const todayPatients = (await pool.query("SELECT COUNT(DISTINCT patient_id) as cnt FROM invoices WHERE DATE(created_at)=CURRENT_DATE")).rows[0].cnt;
        const todayInvoices = (await pool.query("SELECT COUNT(*) as cnt FROM invoices WHERE DATE(created_at)=CURRENT_DATE AND cancelled=0")).rows[0].cnt;
        const pendingLab = (await pool.query("SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE status='Requested' AND is_radiology=0")).rows[0].cnt;
        const pendingRad = (await pool.query("SELECT COUNT(*) as cnt FROM lab_radiology_orders WHERE status='Requested' AND is_radiology=1")).rows[0].cnt;
        const pendingRx = (await pool.query("SELECT COUNT(*) as cnt FROM pharmacy_prescriptions_queue WHERE status='Pending'")).rows[0].cnt;
        const waitingPatients = (await pool.query("SELECT COUNT(*) as cnt FROM patients WHERE status='Waiting'")).rows[0].cnt;
        res.json({ todayRevenue: parseFloat(todayRev), todayPatients: parseInt(todayPatients), todayInvoices: parseInt(todayInvoices), pendingLab: parseInt(pendingLab), pendingRad: parseInt(pendingRad), pendingRx: parseInt(pendingRx), waitingPatients: parseInt(waitingPatients) });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// DASHBOARD CHARTS DATA
// ===== DASHBOARD CHARTS DATA =====
router.get('/api/dashboard/charts', requireAuth, async (req, res) => {
    try {
        // Revenue trend (last 30 days)
        const revenueTrend = (await pool.query(`
            SELECT DATE(created_at) as day, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
            FROM invoices WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND total > 0
            GROUP BY DATE(created_at) ORDER BY day
        `)).rows;

        // Patients by department (this month)
        const byDepartment = (await pool.query(`
            SELECT COALESCE(department,'General') as dept, COUNT(*) as count
            FROM appointments WHERE appt_date >= DATE_TRUNC('month', CURRENT_DATE)::date::text
            GROUP BY department ORDER BY count DESC LIMIT 10
        `)).rows;

        // Top doctors by patient count (this month)
        const topDoctors = (await pool.query(`
            SELECT a.doctor_name as doctor, COUNT(*) as patients, COALESCE(SUM(i.total),0) as revenue
            FROM appointments a LEFT JOIN invoices i ON i.description ILIKE '%' || a.doctor_name || '%'
            AND i.created_at >= DATE_TRUNC('month', CURRENT_DATE)
            WHERE a.appt_date >= DATE_TRUNC('month', CURRENT_DATE)::date::text
            GROUP BY a.doctor_name ORDER BY patients DESC LIMIT 8
        `)).rows;

        // Patient flow by hour (today)
        const hourlyFlow = (await pool.query(`
            SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
            FROM appointments WHERE appt_date = CURRENT_DATE::text
            GROUP BY hour ORDER BY hour
        `)).rows;

        // Payment methods breakdown (this month)
        const paymentMethods = (await pool.query(`
            SELECT COALESCE(payment_method,'Cash') as method, COUNT(*) as count, COALESCE(SUM(total),0) as total
            FROM invoices WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) AND total > 0
            GROUP BY payment_method
        `)).rows;

        // Weekly comparison
        const thisWeek = (await pool.query("SELECT COUNT(*) as patients, COALESCE(SUM(total),0) as revenue FROM invoices WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) AND total > 0")).rows[0];
        const lastWeek = (await pool.query("SELECT COUNT(*) as patients, COALESCE(SUM(total),0) as revenue FROM invoices WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days' AND created_at < DATE_TRUNC('week', CURRENT_DATE) AND total > 0")).rows[0];

        res.json({ revenueTrend, byDepartment, topDoctors, hourlyFlow, paymentMethods, thisWeek, lastWeek });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});



module.exports = router;
