const express = require('express');
const router = express.Router();
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');

// 1. Fetch consents based on specialty/department
router.get('/api/specialty-consents/patient/:id', async (req, res) => {
  const { specialty } = req.query;
  const patientId = req.params.id;
  
  try {
    let templates;
    if (specialty) {
      templates = (await pool.query('SELECT * FROM consent_templates WHERE specialty_id = $1 OR specialty_id IS NULL', [specialty])).rows;
    } else {
      templates = (await pool.query('SELECT * FROM consent_templates')).rows;
    }

    // Check which ones are already signed
    const signed = (await pool.query('SELECT template_id, signed_at FROM patient_consents WHERE patient_id = $1', [patientId])).rows;
    const signedMap = {};
    for (const s of signed) signedMap[s.template_id] = s.signed_at;

    const result = templates.map(t => ({
      ...t,
      is_signed: !!signedMap[t.template_id],
      signed_at: signedMap[t.template_id] || null
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Save signature
router.post('/api/specialty-consents/sign', async (req, res) => {
  const { patient_id, template_id, doctor_id, signature_image, witness_name, witness_signature } = req.body;
  
  if (!patient_id || !template_id || !signature_image) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const query = `
      INSERT INTO patient_consents (patient_id, template_id, doctor_id, signature_image, witness_name, witness_signature)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING consent_id
    `;
    const result = await pool.query(query, [patient_id, template_id, doctor_id || req.session?.user?.id || 1, signature_image, witness_name || '', witness_signature || '']);
    res.json({ success: true, consent_id: result.rows[0].consent_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save consent' });
  }
});

// 3. Generate print-ready layout data
router.get('/api/specialty-consents/print/:id', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT pc.*, ct.title_ar, ct.title_en, ct.content_ar, ct.content_en, p.name_en, p.name_ar, p.national_id
      FROM patient_consents pc
      JOIN consent_templates ct ON pc.template_id = ct.template_id
      JOIN patients p ON pc.patient_id = p.id
      WHERE pc.consent_id = $1
    `;
    const consent = (await pool.query(query, [req.params.id])).rows[0];

    if (!consent) return res.status(404).json({ error: 'Consent not found' });
    res.json(consent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Print error' });
  }
});

module.exports = router;
