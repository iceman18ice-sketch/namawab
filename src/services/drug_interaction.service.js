/**
 * Drug-Drug Interaction Check Service
 * Checks ordered medications against existing patient prescriptions
 * and the drug_interactions knowledge base
 */
const { pool } = require('../../db_postgres');

class DrugInteractionService {

    /**
     * Check a single drug against patient's current medications
     * Returns array of interactions found
     */
    async checkDrug(patientId, drugName) {
        if (!drugName) return [];
        const normalized = drugName.trim().toLowerCase();

        // Get patient's current active medications
        const currentMeds = await this._getPatientMeds(patientId);

        // Check all interactions
        const interactions = [];
        for (const med of currentMeds) {
            const found = await this._findInteraction(normalized, med.toLowerCase());
            if (found.length > 0) interactions.push(...found);
        }

        return interactions;
    }

    /**
     * Check multiple drugs at once (for order sets)
     */
    async checkMultipleDrugs(patientId, drugNames) {
        const allInteractions = [];
        const seen = new Set();

        // Check each drug against patient meds
        for (const drug of drugNames) {
            const results = await this.checkDrug(patientId, drug);
            for (const r of results) {
                const key = `${r.drug_a}-${r.drug_b}`;
                if (!seen.has(key)) { seen.add(key); allInteractions.push(r); }
            }
        }

        // Check drugs against each other (within the order set)
        for (let i = 0; i < drugNames.length; i++) {
            for (let j = i + 1; j < drugNames.length; j++) {
                const found = await this._findInteraction(drugNames[i].toLowerCase(), drugNames[j].toLowerCase());
                for (const r of found) {
                    const key = `${r.drug_a}-${r.drug_b}`;
                    if (!seen.has(key)) { seen.add(key); allInteractions.push(r); }
                }
            }
        }

        return allInteractions;
    }

    /**
     * Create a clinical alert for an interaction
     */
    async createAlert(patientId, patientName, interaction) {
        await pool.query(
            `INSERT INTO clinical_alerts (patient_id, patient_name, alert_type, category, title, message, severity, source)
             VALUES ($1,$2,'Drug Interaction','Pharmacy',$3,$4,$5,'Drug Interaction Check')`,
            [patientId, patientName,
             `⚠️ ${interaction.drug_a} + ${interaction.drug_b}: ${interaction.interaction_type}`,
             `${interaction.description}\n\nRecommended Action: ${interaction.clinical_action}`,
             interaction.severity === 'Contraindicated' ? 'Critical' : interaction.severity === 'Major' ? 'High' : 'Medium']
        );
    }

    // Get patient's active medications from prescriptions and nursing vitals
    async _getPatientMeds(patientId) {
        const meds = new Set();

        // From prescriptions
        const rx = await pool.query(
            `SELECT p.dosage as med_name FROM prescriptions p WHERE p.patient_id=$1 AND p.status != 'Cancelled'`,
            [patientId]);
        rx.rows.forEach(r => { if (r.med_name) meds.add(r.med_name); });

        // From nursing current_medications field
        const nursing = await pool.query(
            'SELECT current_medications FROM nursing_vitals WHERE patient_id=$1 ORDER BY created_at DESC LIMIT 1',
            [patientId]);
        if (nursing.rows[0]?.current_medications) {
            nursing.rows[0].current_medications.split(/[,;\n]/).forEach(m => {
                const trimmed = m.trim();
                if (trimmed) meds.add(trimmed);
            });
        }

        // From active CPOE orders
        const orders = await pool.query(
            `SELECT item_name FROM cpoe_active_orders WHERE patient_id=$1 AND item_type='med' AND status NOT IN ('Cancelled','Completed')`,
            [patientId]);
        orders.rows.forEach(r => { if (r.item_name) meds.add(r.item_name); });

        return Array.from(meds);
    }

    // Find interaction between two drugs
    async _findInteraction(drugA, drugB) {
        const { rows } = await pool.query(
            `SELECT * FROM drug_interactions 
             WHERE (LOWER(drug_a) LIKE $1 AND LOWER(drug_b) LIKE $2)
                OR (LOWER(drug_a) LIKE $2 AND LOWER(drug_b) LIKE $1)
                OR (LOWER(drug_a) LIKE $1 AND $2 LIKE '%' || LOWER(drug_b) || '%')
                OR ($1 LIKE '%' || LOWER(drug_a) || '%' AND LOWER(drug_b) LIKE $2)
                OR ($1 LIKE '%' || LOWER(drug_a) || '%' AND $2 LIKE '%' || LOWER(drug_b) || '%')`,
            [`%${drugA}%`, `%${drugB}%`]
        );
        return rows;
    }
}

module.exports = new DrugInteractionService();
