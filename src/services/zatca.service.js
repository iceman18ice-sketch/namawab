/**
 * ZATCA Phase 2 E-Invoicing Service
 * Implements XML generation, signing, and reporting for Saudi tax compliance
 */
const { pool } = require('../../db_postgres');
const crypto = require('crypto');

class ZatcaService {
    constructor() {
        this.icsn = 0; // Invoice Counter Serial Number
    }

    /**
     * Generate ZATCA-compliant XML invoice
     */
    async generateInvoice(invoiceId) {
        const inv = (await pool.query('SELECT * FROM zatca_invoices WHERE invoice_id=$1 OR id=$1', [invoiceId])).rows[0];
        if (!inv) throw new Error('Invoice not found');

        // Get next ICSN
        const lastIcsn = (await pool.query('SELECT MAX(icsn_counter) as max_icsn FROM zatca_invoices WHERE icsn_counter > 0')).rows[0];
        const nextIcsn = (parseInt(lastIcsn?.max_icsn) || 0) + 1;

        // Get previous invoice hash (PIH)
        const lastInvoice = (await pool.query("SELECT xml_hash FROM zatca_invoices WHERE icsn_counter > 0 ORDER BY icsn_counter DESC LIMIT 1")).rows[0];
        const pih = lastInvoice?.xml_hash || '0'.repeat(64);

        // Generate UUID
        const uuid = crypto.randomUUID();

        // Build UBL 2.1 XML
        const xml = this._buildXML(inv, nextIcsn, uuid, pih);

        // Calculate hash
        const xmlHash = crypto.createHash('sha256').update(xml).digest('hex');

        // Generate QR code TLV
        const qrCode = this._generateQR(inv, xmlHash);

        // Update invoice
        await pool.query(
            `UPDATE zatca_invoices SET icsn_counter=$1, pih_hash=$2, uuid=$3, 
             xml_content=$4, xml_hash=$5, qr_code=$6, clearance_status='Generated'
             WHERE id=$7`,
            [nextIcsn, pih, uuid, xml, xmlHash, qrCode, inv.id]
        );

        return { id: inv.id, icsn: nextIcsn, uuid, xmlHash, qrCode, status: 'Generated' };
    }

    /**
     * Sign XML invoice (stub — requires actual ZATCA certificate)
     */
    async signInvoice(invoiceId) {
        const inv = (await pool.query('SELECT * FROM zatca_invoices WHERE id=$1', [invoiceId])).rows[0];
        if (!inv || !inv.xml_content) throw new Error('Invoice XML not generated');

        // In production: sign with ZATCA-issued certificate
        // const signed = signWithCertificate(inv.xml_content, certificate, privateKey);

        // Stub: mark as signed
        const signedXml = inv.xml_content; // Would be actual signed XML in production
        await pool.query(
            `UPDATE zatca_invoices SET signed_xml=$1, clearance_status='Signed' WHERE id=$2`,
            [signedXml, invoiceId]
        );

        return { id: invoiceId, status: 'Signed' };
    }

    /**
     * Report/Clear invoice with ZATCA
     */
    async reportInvoice(invoiceId) {
        const inv = (await pool.query('SELECT * FROM zatca_invoices WHERE id=$1', [invoiceId])).rows[0];
        if (!inv) throw new Error('Invoice not found');

        // Standard invoices (B2B) need clearance, Simplified (B2C) need reporting
        const isStandard = inv.invoice_type === 'Standard';
        const endpoint = isStandard ? 'clearance' : 'reporting';

        // In production: POST to ZATCA API
        // const response = await fetch(`https://gw-fatoora.zatca.gov.sa/e-invoicing/core/${endpoint}/single`, {
        //     method: 'POST', headers: { Authorization: 'Bearer ...' },
        //     body: JSON.stringify({ invoiceHash: inv.xml_hash, uuid: inv.uuid, invoice: Buffer.from(inv.signed_xml).toString('base64') })
        // });

        // Stub: simulate success
        const statusField = isStandard ? 'clearance_status' : 'reporting_status';
        await pool.query(
            `UPDATE zatca_invoices SET ${statusField}='Reported', submission_status='Accepted',
             submission_date=$1, zatca_response='ACCEPTED - Stub Response' WHERE id=$2`,
            [new Date().toISOString(), invoiceId]
        );

        return { id: invoiceId, type: endpoint, status: 'Accepted' };
    }

    // UBL 2.1 XML builder
    _buildXML(inv, icsn, uuid, pih) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${inv.invoice_number || inv.id}</cbc:ID>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>${new Date().toISOString().split('T')[0]}</cbc:IssueDate>
    <cbc:IssueTime>${new Date().toISOString().split('T')[1].substring(0, 8)}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="${inv.invoice_type === 'Standard' ? '0100000' : '0200000'}">${inv.invoice_type === 'Standard' ? '388' : '388'}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID><cbc:UUID>${icsn}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pih}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification><cbc:ID schemeID="CRN">${inv.seller_vat || ''}</cbc:ID></cac:PartyIdentification>
            <cac:PartyName><cbc:Name>${inv.seller_name || ''}</cbc:Name></cac:PartyName>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName><cbc:Name>${inv.buyer_name || ''}</cbc:Name></cac:PartyName>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${inv.vat_amount || 0}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:TaxExclusiveAmount currencyID="SAR">${inv.total_before_vat || 0}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">${inv.total_with_vat || 0}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="SAR">${inv.total_with_vat || 0}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
</Invoice>`;
    }

    // TLV QR code generation
    _generateQR(inv, hash) {
        const tlv = (tag, val) => {
            const v = Buffer.from(val, 'utf8');
            return Buffer.concat([Buffer.from([tag]), Buffer.from([v.length]), v]);
        };
        const qrBuf = Buffer.concat([
            tlv(1, inv.seller_name || ''),
            tlv(2, inv.seller_vat || ''),
            tlv(3, new Date().toISOString()),
            tlv(4, String(inv.total_with_vat || 0)),
            tlv(5, String(inv.vat_amount || 0)),
            tlv(6, hash)
        ]);
        return qrBuf.toString('base64');
    }
}

module.exports = new ZatcaService();
