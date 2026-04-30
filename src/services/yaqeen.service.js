/**
 * Yaqeen Identity Verification Service
 * Verifies Saudi National ID / Iqama via Yaqeen/Elm integration
 */
const { pool } = require('../../db_postgres');

class YaqeenService {
    constructor() {
        this.baseUrl = 'https://yakeen.elm.sa/YakeenService';
    }

    /**
     * Verify a patient's national ID
     */
    async verifyIdentity(patientId, nationalId, idType = 'NationalID') {
        const payload = {
            chargeCode: process.env.YAQEEN_CHARGE_CODE || '',
            userName: process.env.YAQEEN_USERNAME || '',
            password: process.env.YAQEEN_PASSWORD || '',
            nin: nationalId,
            idType: idType
        };

        // Store verification request
        const result = await pool.query(
            `INSERT INTO yaqeen_verifications (patient_id, national_id, id_type, request_payload, verification_status)
             VALUES ($1,$2,$3,$4,'Submitted') RETURNING *`,
            [patientId, nationalId, idType, JSON.stringify(payload)]
        );

        // In production: call Yaqeen SOAP/REST API
        // const response = await this._callYaqeenAPI(payload);

        // Stub: simulate successful verification
        const patient = (await pool.query('SELECT name_ar, name_en, dob FROM patients WHERE id=$1', [patientId])).rows[0];
        const verificationId = result.rows[0].id;

        await pool.query(
            `UPDATE yaqeen_verifications SET verification_status='Verified',
             full_name_ar=$1, full_name_en=$2, date_of_birth=$3,
             verified_at=NOW() WHERE id=$4`,
            [patient?.name_ar || '', patient?.name_en || '', patient?.dob || '', verificationId]
        );

        // Update patient record
        await pool.query(
            `UPDATE patients SET yaqeen_verified=1, yaqeen_verified_at=NOW() WHERE id=$1`,
            [patientId]
        );

        return {
            id: verificationId,
            status: 'Verified',
            patientId,
            nationalId,
            verifiedAt: new Date().toISOString()
        };
    }

    /**
     * Check if patient is already verified
     */
    async isVerified(patientId) {
        const { rows } = await pool.query('SELECT yaqeen_verified FROM patients WHERE id=$1', [patientId]);
        return rows[0]?.yaqeen_verified === 1;
    }
}

module.exports = new YaqeenService();
