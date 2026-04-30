/**
 * Utility Helpers - Audit Trail, VAT Calculation
 * Extracted from server.js for modular architecture
 */
const { pool } = require('../../db_postgres');

// Audit trail helper
async function logAudit(userId, userName, action, module, details, ip) {
    try {
        await pool.query(
            'INSERT INTO audit_trail (user_id, user_name, action, module, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6)',
            [userId, userName, action, module, details || '', ip || '']
        );
    } catch (e) { console.error('Audit log error:', e.message); }
}

// VAT calculation helper
async function calcVAT(patientId) {
    if (!patientId) return { rate: 0, vatAmount: 0, applyVAT: false };
    const p = (await pool.query('SELECT nationality FROM patients WHERE id=$1', [patientId])).rows[0];
    const nat = (p && p.nationality) || '';
    const isSaudi = nat === 'سعودي' || nat.toLowerCase() === 'saudi';
    return { rate: isSaudi ? 0 : 0.15, applyVAT: !isSaudi };
}

function addVAT(amount, vatRate) {
    const vat = Math.round(amount * vatRate * 100) / 100;
    return { total: Math.round((amount + vat) * 100) / 100, vatAmount: vat };
}

module.exports = { logAudit, calcVAT, addVAT };
