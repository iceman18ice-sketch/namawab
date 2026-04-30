const express = require('express');
const router = express.Router();
const { getDb } = require('../database.js');

// 1. Fetch consents based on specialty/department
router.get('/patient/:id', (req, res) => {
  const db = getDb();
  // We assume the frontend passes the required specialty_id as a query param, or we fetch all.
  const specialtyId = req.query.specialty;
  
  try {
    let templates;
    if (specialtyId) {
      templates = db.prepare('SELECT * FROM consent_templates WHERE specialty_id = ? OR specialty_id IS NULL').all(specialtyId);
    } else {
      templates = db.prepare('SELECT * FROM consent_templates').all();
    }

    // Check which ones are already signed
    const signed = db.prepare('SELECT template_id, signed_at FROM patient_consents WHERE patient_id = ?').all(req.params.id);
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
router.post('/sign', (req, res) => {
  const db = getDb();
  const { patient_id, template_id, doctor_id, signature_image, witness_name, witness_signature } = req.body;
  
  if (!patient_id || !template_id || !signature_image) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const insert = db.prepare(`
      INSERT INTO patient_consents (patient_id, template_id, doctor_id, signature_image, witness_name, witness_signature)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(patient_id, template_id, doctor_id || 1, signature_image, witness_name || '', witness_signature || '');
    res.json({ success: true, consent_id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save consent' });
  }
});

// 3. Generate print-ready layout data
router.get('/print/:id', (req, res) => {
  const db = getDb();
  try {
    const consent = db.prepare(`
      SELECT pc.*, ct.title_ar, ct.title_en, ct.content_ar, ct.content_en, p.name_en, p.name_ar, p.national_id
      FROM patient_consents pc
      JOIN consent_templates ct ON pc.template_id = ct.template_id
      JOIN patients p ON pc.patient_id = p.id
      WHERE pc.consent_id = ?
    `).get(req.params.id);

    if (!consent) return res.status(404).json({ error: 'Consent not found' });
    res.json(consent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Print error' });
  }
});

module.exports = router;
