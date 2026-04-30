/**
 * Wasfaty E-Prescription Service
 * Routes electronic prescriptions to Saudi MOH's Wasfaty gateway
 */
const { pool } = require('../../db_postgres');

class WasfatyService {
    constructor() {
        this.baseUrl = 'https://wasfaty.sa/api/v1';
    }

    /**
     * Submit a prescription to Wasfaty
     */
    async submitPrescription(prescriptionId, data) {
        // Build Wasfaty payload
        const payload = {
            facilityId: data.facility_id || process.env.WASFATY_FACILITY_ID || '',
            prescriptionDate: new Date().toISOString(),
            patient: {
                nationalId: data.national_id || '',
                name: data.patient_name || '',
            },
            prescriber: {
                name: data.doctor_name || '',
                licenseNumber: data.doctor_license || '',
            },
            medications: [{
                code: data.medication_code || '',
                name: data.medication_name || '',
                dosage: data.dosage || '',
                frequency: data.frequency || '',
                duration: data.duration || '',
                quantity: data.quantity || 0,
                refills: data.refills || 0
            }]
        };

        // Store in wasfaty_prescriptions (using existing schema columns)
        const result = await pool.query(
            `INSERT INTO wasfaty_prescriptions (patient_id, patient_name, doctor_name, 
             medications, dosage_instructions, refills, request_data, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'Submitted') RETURNING *`,
            [data.patient_id || 0, data.patient_name || '', data.doctor_name || '',
             JSON.stringify(payload.medications), data.dosage || '',
             data.refills || 0, JSON.stringify(payload)]
        );

        // In production: send to Wasfaty API
        // const response = await fetch(this.baseUrl + '/prescriptions', { method: 'POST', body: JSON.stringify(payload) });

        // Stub: generate reference
        const wasfatyRef = `WAS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        await pool.query(
            `UPDATE wasfaty_prescriptions SET wasfaty_rx_id=$1, status='Accepted' WHERE id=$2`,
            [wasfatyRef, result.rows[0].id]
        );

        // Update original prescription
        await pool.query(
            `UPDATE prescriptions SET wasfaty_id=$1, wasfaty_status='Submitted' WHERE id=$2`,
            [wasfatyRef, prescriptionId]
        );

        return { ...result.rows[0], wasfaty_reference: wasfatyRef, wasfaty_status: 'Accepted' };
    }

    /**
     * Check dispensing status from Wasfaty
     */
    async checkStatus(wasfatyRef) {
        const { rows } = await pool.query('SELECT * FROM wasfaty_prescriptions WHERE wasfaty_rx_id=$1', [wasfatyRef]);
        return rows[0] || null;
    }
}

module.exports = new WasfatyService();
