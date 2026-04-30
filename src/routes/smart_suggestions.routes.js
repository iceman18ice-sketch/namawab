const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');

/**
 * SMART API: Get Diagnoses
 * Prioritizes diagnoses mapped to the doctor's specialty.
 */
router.get('/api/smart/diagnoses', async (req, res) => {
    try {
        const userRole = req.session?.user?.role || 'user';
        const doctorSpecialty = req.session?.user?.speciality || null;
        
        // Check if "View All" is requested or if user is admin
        const isViewAll = req.query.specialty === 'ALL' || userRole === 'admin';
        
        let query = `
            SELECT i.code, i.description_en, i.description_ar,
                   CASE WHEN sd.specialty_id IS NOT NULL THEN true ELSE false END as is_recommended
            FROM icd10_codes i
            LEFT JOIN specialty_diagnoses sd 
                   ON i.code = sd.icd10_code AND sd.specialty_id = $1
            ${isViewAll ? '' : 'WHERE sd.specialty_id IS NOT NULL'}
            ORDER BY is_recommended DESC, i.code ASC
            LIMIT ${isViewAll ? 500 : 50}
        `;
        
        const { rows } = await pool.query(query, [doctorSpecialty]);
        res.json({
            specialty: isViewAll ? 'ALL' : doctorSpecialty,
            recommended_count: rows.filter(r => r.is_recommended).length,
            diagnoses: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * SMART API: Get Orders (Labs)
 * Prioritizes labs mapped to the doctor's specialty.
 */
router.get('/api/smart/labs', async (req, res) => {
    try {
        const userRole = req.session?.user?.role || 'user';
        const doctorSpecialty = req.session?.user?.speciality || null;
        const isViewAll = req.query.specialty === 'ALL' || userRole === 'admin';
        
        let query = `
            SELECT l.id, l.test_name, l.category,
                   CASE WHEN sl.specialty_id IS NOT NULL THEN true ELSE false END as is_recommended
            FROM lab_tests_catalog l
            LEFT JOIN specialty_labs sl 
                   ON l.id = sl.lab_id AND sl.specialty_id = $1
            ${isViewAll ? '' : 'WHERE sl.specialty_id IS NOT NULL'}
            ORDER BY is_recommended DESC, l.test_name ASC
            LIMIT ${isViewAll ? 500 : 50}
        `;
        
        const { rows } = await pool.query(query, [doctorSpecialty]);
        res.json({
            specialty: isViewAll ? 'ALL' : doctorSpecialty,
            recommended_count: rows.filter(r => r.is_recommended).length,
            labs: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * SMART API: Get Orders (Radiology)
 * Prioritizes radiology exams mapped to the doctor's specialty.
 */
router.get('/api/smart/radiology', async (req, res) => {
    try {
        const userRole = req.session?.user?.role || 'user';
        const doctorSpecialty = req.session?.user?.speciality || null;
        const isViewAll = req.query.specialty === 'ALL' || userRole === 'admin';
        
        let query = `
            SELECT r.id, r.exact_name, r.modality,
                   CASE WHEN sr.specialty_id IS NOT NULL THEN true ELSE false END as is_recommended
            FROM radiology_catalog r
            LEFT JOIN specialty_radiology sr 
                   ON r.id = sr.radiology_id AND sr.specialty_id = $1
            ${isViewAll ? '' : 'WHERE sr.specialty_id IS NOT NULL'}
            ORDER BY is_recommended DESC, r.exact_name ASC
            LIMIT ${isViewAll ? 500 : 50}
        `;
        
        const { rows } = await pool.query(query, [doctorSpecialty]);
        res.json({
            specialty: isViewAll ? 'ALL' : doctorSpecialty,
            recommended_count: rows.filter(r => r.is_recommended).length,
            radiology: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
