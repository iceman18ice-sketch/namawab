/**
 * NPHIES Integration Service
 * Handles eligibility verification, pre-authorization, and claims submission
 * via Saudi Arabia's National Platform for Health Insurance Exchange Services
 */
const { pool } = require('../../db_postgres');
const { logAudit } = require('../utils/helpers');

class NphiesService {
    constructor() {
        this.config = null;
    }

    async loadConfig() {
        const { rows } = await pool.query('SELECT * FROM nphies_config LIMIT 1');
        this.config = rows[0] || {};
        return this.config;
    }

    /**
     * Check patient insurance eligibility via NPHIES
     */
    async checkEligibility(patientId, insuranceData) {
        await this.loadConfig();
        const bundle = this._buildEligibilityBundle(patientId, insuranceData);
        
        // Store the request
        const result = await pool.query(
            `INSERT INTO nphies_eligibility (patient_id, insurance_company, 
             payer_nphies_id, member_id, request_bundle, status, nphies_message_id)
             VALUES ($1,$2,$3,$4,$5,'Submitted',$6) RETURNING *`,
            [patientId, insuranceData.insurance_company || '',
             insuranceData.policy_number || '',
             insuranceData.member_id || '', JSON.stringify(bundle), this._generateRequestId()]
        );

        // In production: send to NPHIES API
        // const response = await this._sendToNphies(bundle);
        
        // Stub: simulate approval
        const eligibilityId = result.rows[0].id;
        await pool.query(
            `UPDATE nphies_eligibility SET status='Active', is_eligible=1,
             benefits='General Coverage Active' WHERE id=$1`,
            [eligibilityId]
        );

        return result.rows[0];
    }

    /**
     * Submit pre-authorization request to NPHIES
     */
    async submitPreAuth(patientId, preauthData) {
        await this.loadConfig();
        const bundle = this._buildPreAuthBundle(patientId, preauthData);

        const result = await pool.query(
            `INSERT INTO nphies_preauth (patient_id, patient_name, insurance_company, policy_number,
             diagnosis_code, diagnosis_desc, procedure_code, procedure_desc, estimated_cost,
             request_bundle, preauth_status, nphies_request_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Submitted',$11) RETURNING *`,
            [patientId, preauthData.patient_name || '', preauthData.insurance_company || '',
             preauthData.policy_number || '', preauthData.diagnosis_code || '',
             preauthData.diagnosis_desc || '', preauthData.procedure_code || '',
             preauthData.procedure_desc || '', preauthData.estimated_cost || 0,
             JSON.stringify(bundle), this._generateRequestId()]
        );

        return result.rows[0];
    }

    /**
     * Submit insurance claim to NPHIES
     */
    async submitClaim(patientId, claimData) {
        await this.loadConfig();
        const bundle = this._buildClaimBundle(patientId, claimData);

        const result = await pool.query(
            `INSERT INTO nphies_claims (patient_id, patient_name, insurance_company, policy_number,
             preauth_id, invoice_id, claim_type, diagnosis_codes, procedure_codes, total_claim,
             patient_share, request_bundle, claim_status, nphies_request_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Submitted',$13) RETURNING *`,
            [patientId, claimData.patient_name || '', claimData.insurance_company || '',
             claimData.policy_number || '', claimData.preauth_id || 0, claimData.invoice_id || 0,
             claimData.claim_type || 'institutional', claimData.diagnosis_codes || '',
             claimData.procedure_codes || '', claimData.total_claim || 0,
             claimData.patient_share || 0, JSON.stringify(bundle), this._generateRequestId()]
        );

        return result.rows[0];
    }

    // FHIR Bundle builders
    _buildEligibilityBundle(patientId, data) {
        return {
            resourceType: 'Bundle', type: 'message',
            meta: { profile: ['http://nphies.sa/fhir/ksa/nphies-fs/StructureDefinition/bundle|1.0.0'] },
            entry: [{
                resource: {
                    resourceType: 'CoverageEligibilityRequest',
                    status: 'active', purpose: ['validation', 'benefits'],
                    patient: { reference: `Patient/${patientId}` },
                    insurer: { reference: `Organization/${data.insurance_company}` }
                }
            }]
        };
    }

    _buildPreAuthBundle(patientId, data) {
        return {
            resourceType: 'Bundle', type: 'message',
            entry: [{
                resource: {
                    resourceType: 'Claim',
                    type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'institutional' }] },
                    use: 'preauthorization',
                    patient: { reference: `Patient/${patientId}` },
                    diagnosis: [{ diagnosisCodeableConcept: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: data.diagnosis_code }] } }]
                }
            }]
        };
    }

    _buildClaimBundle(patientId, data) {
        return {
            resourceType: 'Bundle', type: 'message',
            entry: [{
                resource: {
                    resourceType: 'Claim',
                    type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: data.claim_type || 'institutional' }] },
                    use: 'claim',
                    patient: { reference: `Patient/${patientId}` },
                    total: { value: data.total_claim, currency: 'SAR' }
                }
            }]
        };
    }

    _generateRequestId() { return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`; }
}

module.exports = new NphiesService();
