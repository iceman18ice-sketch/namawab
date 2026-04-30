/**
 * CONSENT Routes
 * Auto-extracted from server.js | 11 routes
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


// CONSENT FORMS
// ===== CONSENT FORMS =====
router.get('/api/consent-forms', requireAuth, async (req, res) => {
    try {
        const { patient_id } = req.query;
        if (patient_id) { res.json((await pool.query('SELECT * FROM consent_forms WHERE patient_id=$1 ORDER BY id DESC', [patient_id])).rows); }
        else { res.json((await pool.query('SELECT * FROM consent_forms ORDER BY id DESC')).rows); }
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/consent-forms', requireAuth, async (req, res) => {
    try {
        const { patient_id, patient_name, form_type, form_title, form_title_ar, content, doctor_name, surgery_id, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO consent_forms (patient_id, patient_name, form_type, form_title, form_title_ar, content, doctor_name, surgery_id, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
            [patient_id || 0, patient_name || '', form_type || 'general', form_title || '', form_title_ar || '', content || '', doctor_name || req.session.user.name || '', surgery_id || 0, notes || '']);
        res.json((await pool.query('SELECT * FROM consent_forms WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/consent-forms/:id', requireAuth, async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM consent_forms WHERE id=$1', [req.params.id])).rows[0]); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/consent-forms/:id/sign', requireAuth, async (req, res) => {
    try {
        const { patient_signature, witness_name, witness_signature } = req.body;
        await pool.query("UPDATE consent_forms SET patient_signature=$1, witness_name=$2, witness_signature=$3, signed_at=NOW()::TEXT, status='Signed' WHERE id=$4",
            [patient_signature || '', witness_name || '', witness_signature || '', req.params.id]);
        res.json((await pool.query('SELECT * FROM consent_forms WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/consent-forms/templates/list', requireAuth, async (req, res) => {
    try {
        res.json([
            { type: 'surgical', title: 'Surgical Consent', title_ar: 'إقرار عملية جراحية', file: '25_إقرار_عملية_جراحية_عامة_Surgical_Consent.html', content: 'أقر أنا الموقع أدناه بموافقتي على إجراء العملية الجراحية الموضحة في هذا النموذج، وقد تم شرح طبيعة العملية والمضاعفات المحتملة والبدائل العلاجية المتاحة لي بالتفصيل.' },
            { type: 'anesthesia', title: 'Anesthesia Consent', title_ar: 'إقرار تخدير', file: '26_إقرار_تخدير_Anesthesia_Consent.html', content: 'أقر بموافقتي على إجراء التخدير اللازم للعملية، وقد تم إبلاغي بنوع التخدير المقترح والمخاطر المحتملة بما في ذلك الحساسية وصعوبة التنفس.' },
            { type: 'admission', title: 'Admission Consent', title_ar: 'إقرار قبول ودخول', file: '27_إقرار_قبول_ودخول_Admission_Consent.html', content: 'أقر بموافقتي على الدخول للمستشفى وتلقي العلاج اللازم، وأوافق على اتباع التعليمات واللوائح الداخلية للمستشفى.' },
            { type: 'blood_transfusion', title: 'Blood Transfusion Consent', title_ar: 'إقرار نقل دم', file: '28_إقرار_نقل_دم_Blood_Transfusion_Consent.html', content: 'أقر بموافقتي على إجراء نقل الدم أو مشتقاته حسب الحالة الطبية، وقد تم إعلامي بالمخاطر المحتملة بما في ذلك ردود الفعل التحسسية.' },
            { type: 'treatment_refusal', title: 'Treatment Refusal', title_ar: 'إقرار رفض علاج', file: '29_إقرار_رفض_علاج_Treatment_Refusal.html', content: 'أقر أنني قررت رفض العلاج/الإجراء الطبي الموصى به رغم شرح الطبيب للمخاطر المترتبة على ذلك، وأتحمل كامل المسؤولية.' },
            { type: 'medical_photography', title: 'Medical Photography Consent', title_ar: 'إقرار تصوير طبي', file: '19_إقرار_نشر_الصور_Social_Media_Photo_Consent.html', content: 'أوافق على التقاط صور/فيديو للحالة الطبية لأغراض التوثيق الطبي والتعليم والبحث العلمي، مع الحفاظ على السرية.' },
            { type: 'ama_discharge', title: 'Discharge Against Medical Advice', title_ar: 'إقرار خروج ضد المشورة الطبية', file: '30_إقرار_خروج_ضد_المشورة_AMA_Discharge.html', content: 'أقر بأنني أرغب بالخروج من المستشفى ضد المشورة الطبية، وقد تم إعلامي بالمخاطر المحتملة، وأتحمل كامل المسؤولية.' },
            { type: 'privacy', title: 'Privacy Policy Consent', title_ar: 'إقرار سياسة الخصوصية', file: '31_إقرار_سياسة_الخصوصية_Privacy_Policy_Consent.html', content: 'أوافق على سياسة الخصوصية وحماية البيانات الشخصية، وأجيز للمستشفى استخدام بياناتي الطبية وفقاً للأنظمة واللوائح المعمول بها.' },

// COSMETIC / DERMATOLOGY CONSENT TEMPLATES
            // ===== COSMETIC / DERMATOLOGY CONSENT TEMPLATES =====
            { type: 'cosmetic_general', title: 'General Cosmetic Surgery Consent', title_ar: 'إقرار جراحة تجميلية عام', file: '01_إقرار_جراحة_تجميلية_عام_General_Cosmetic_Consent.html', content: 'أقر أنا الموقع أدناه بموافقتي على إجراء العملية التجميلية الموضحة.' },
            { type: 'rhinoplasty', title: 'Rhinoplasty Consent', title_ar: 'إقرار تجميل الأنف', file: '02_إقرار_تجميل_الأنف_Rhinoplasty_Consent.html', content: 'أقر بموافقتي على عملية تجميل الأنف.' },
            { type: 'botox_filler', title: 'Botox & Filler Consent', title_ar: 'إقرار بوتوكس وفيلر', file: '03_إقرار_بوتوكس_وفيلر_Botox_Filler_Consent.html', content: 'أقر بموافقتي على حقن البوتوكس/الفيلر.' },
            { type: 'liposuction', title: 'Liposuction / Body Contouring Consent', title_ar: 'إقرار شفط الدهون وشد البطن', file: '04_إقرار_شفط_دهون_وشد_بطن_Liposuction_Consent.html', content: 'أقر بموافقتي على عملية نحت الجسم.' },
            { type: 'laser_treatment', title: 'Laser Treatment Consent', title_ar: 'إقرار علاج ليزر', file: '05_إقرار_علاج_ليزر_Laser_Treatment_Consent.html', content: 'أقر بموافقتي على العلاج بالليزر.' },
            { type: 'hair_transplant', title: 'Hair Transplant Consent', title_ar: 'إقرار زراعة الشعر', file: '06_إقرار_زراعة_شعر_Hair_Transplant_Consent.html', content: 'أقر بموافقتي على زراعة الشعر.' },
            { type: 'chemical_peeling', title: 'Chemical Peeling Consent', title_ar: 'إقرار التقشير الكيميائي', file: '07_إقرار_التقشير_الكيميائي_Chemical_Peeling_Consent.html', content: 'أقر بموافقتي على التقشير الكيميائي.' },
            { type: 'hair_bleaching', title: 'Hair Bleaching Consent', title_ar: 'إقرار تشقير الشعر', file: '08_إقرار_تشقير_الشعر_Hair_Bleaching_Consent.html', content: 'أقر بموافقتي على تشقير الشعر.' },
            { type: 'hyaluronidase', title: 'Hyaluronidase (Filler Dissolution) Consent', title_ar: 'إقرار إذابة الفيلر', file: '09_إقرار_إذابة_الفيلر_Hyaluronidase_Consent.html', content: 'أقر بموافقتي على إذابة الفيلر بالهيالورونيداز.' },
            { type: 'steroid_injection', title: 'Steroid Injection Consent', title_ar: 'إقرار حقن الكورتيزون', file: '10_إقرار_حقن_الكورتيزون_Steroid_Injection_Consent.html', content: 'أقر بموافقتي على حقن الكورتيزون.' },
            { type: 'lip_rejuvenation', title: 'Lip Rejuvenation Consent', title_ar: 'إقرار توريد الشفايف', file: '11_إقرار_توريد_الشفايف_Lip_Rejuvenation_Consent.html', content: 'أقر بموافقتي على توريد الشفايف.' },
            { type: 'q_switched_laser', title: 'Q-Switched / Carbon Laser Consent', title_ar: 'إقرار الليزر الكربوني', file: '12_إقرار_الليزر_الكربوني_Q_Switched_Laser_Consent.html', content: 'أقر بموافقتي على الليزر الكربوني (Q-Switched).' },
            { type: 'sculptra', title: 'Sculptra (PLLA) Consent', title_ar: 'إقرار سكلبترا', file: '13_إقرار_سكلبترا_Sculptra_Consent.html', content: 'أقر بموافقتي على حقن سكلبترا.' },
            { type: 'skin_tags_removal', title: 'Skin Tags / Moles Removal Consent', title_ar: 'إقرار إزالة الزوائد الجلدية', file: '14_إقرار_إزالة_الزوائد_الجلدية_Skin_Tags_Removal_Consent.html', content: 'أقر بموافقتي على إزالة الزوائد الجلدية.' },
            { type: 'tattoo_removal', title: 'Tattoo Removal Consent', title_ar: 'إقرار إزالة الوشم', file: '15_إقرار_إزالة_الوشم_Tattoo_Removal_Consent.html', content: 'أقر بموافقتي على إزالة الوشم بالليزر.' },
            { type: 'fractional_laser', title: 'Fractional Laser Consent', title_ar: 'إقرار ليزر الفراكشنال', file: '16_إقرار_ليزر_الفراكشنال_Fractional_Laser_Consent.html', content: 'أقر بموافقتي على ليزر الفراكشنال.' },
            { type: 'dermapen_scarlet', title: 'Dermapen / Scarlet RF + PRP Consent', title_ar: 'إقرار الديرمابن / سكارليت مع البلازما', file: '17_إقرار_الديرمابن_سكارليت_Dermapen_Scarlet_Consent.html', content: 'أقر بموافقتي على الميكرونيدلينغ.' },
            { type: 'roaccutane', title: 'Roaccutane (Isotretinoin) Consent', title_ar: 'إقرار الرواكتان', file: '18_إقرار_الرواكتان_Roaccutane_Consent.html', content: 'أقر بموافقتي على علاج الآيزوتريتينوين.' },
            { type: 'social_media_photo', title: 'Social Media Photo/Video Consent', title_ar: 'إقرار نشر الصور على التواصل الاجتماعي', file: '19_إقرار_نشر_الصور_Social_Media_Photo_Consent.html', content: 'أوافق طوعياً على التصوير والنشر على التواصل الاجتماعي.' },
            { type: 'glow_sessions', title: 'Glow / Rejuvenation Sessions Consent', title_ar: 'إقرار جلسات النضارة', file: '20_إقرار_جلسات_النضارة_Glow_Sessions_Consent.html', content: 'أقر بموافقتي على جلسة النضارة.' },
            { type: 'general_medical', title: 'General Medical Procedure Consent', title_ar: 'إقرار إجراء طبي عام', file: '21_إقرار_إجراء_طبي_عام_General_Medical_Procedure_Consent.html', content: 'أقر بموافقتي على الإجراء الطبي.' },
            { type: 'injection_info', title: 'Injection Info Card', title_ar: 'بطاقة معلومات الحقن', file: '22_بطاقة_معلومات_الحقن_Injection_Info_Card.html', content: 'بطاقة معلومات الحقن.' },
            { type: 'mesotherapy', title: 'General Mesotherapy Consent', title_ar: 'إقرار الميزوثيرابي', file: '23_إقرار_الميزوثيرابي_General_Mesotherapy_Consent.html', content: 'أقر بموافقتي على الميزوثيرابي.' },
            { type: 'cosmetic_info_card', title: 'Cosmetic Procedures Info Card', title_ar: 'بطاقة معلومات إجراءات التجميل', file: '24_نموذج_بطاقة_معلومات_إجراءات_التجميل_Cosmetic_Info_Card.html', content: 'بطاقة معلومات إجراءات التجميل.' }
        ]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// CONSENT FORM HTML RENDERER (Auto-fill patient data)
// ===== CONSENT FORM HTML RENDERER (Auto-fill patient data) =====
router.get('/api/consent-forms/render/:type', requireAuth, async (req, res) => {
    try {
        const { patient_id, doctor_name } = req.query;
        // Get template file mapping
        const templatesResp = await new Promise((resolve) => {
            const templates = [
                { type: 'surgical', file: '25_إقرار_عملية_جراحية_عامة_Surgical_Consent.html' },
                { type: 'anesthesia', file: '26_إقرار_تخدير_Anesthesia_Consent.html' },
                { type: 'admission', file: '27_إقرار_قبول_ودخول_Admission_Consent.html' },
                { type: 'blood_transfusion', file: '28_إقرار_نقل_دم_Blood_Transfusion_Consent.html' },
                { type: 'treatment_refusal', file: '29_إقرار_رفض_علاج_Treatment_Refusal.html' },
                { type: 'medical_photography', file: '19_إقرار_نشر_الصور_Social_Media_Photo_Consent.html' },
                { type: 'ama_discharge', file: '30_إقرار_خروج_ضد_المشورة_AMA_Discharge.html' },
                { type: 'privacy', file: '31_إقرار_سياسة_الخصوصية_Privacy_Policy_Consent.html' },
                { type: 'cosmetic_general', file: '01_إقرار_جراحة_تجميلية_عام_General_Cosmetic_Consent.html' },
                { type: 'rhinoplasty', file: '02_إقرار_تجميل_الأنف_Rhinoplasty_Consent.html' },
                { type: 'botox_filler', file: '03_إقرار_بوتوكس_وفيلر_Botox_Filler_Consent.html' },
                { type: 'liposuction', file: '04_إقرار_شفط_دهون_وشد_بطن_Liposuction_Consent.html' },
                { type: 'laser_treatment', file: '05_إقرار_علاج_ليزر_Laser_Treatment_Consent.html' },
                { type: 'hair_transplant', file: '06_إقرار_زراعة_شعر_Hair_Transplant_Consent.html' },
                { type: 'chemical_peeling', file: '07_إقرار_التقشير_الكيميائي_Chemical_Peeling_Consent.html' },
                { type: 'hair_bleaching', file: '08_إقرار_تشقير_الشعر_Hair_Bleaching_Consent.html' },
                { type: 'hyaluronidase', file: '09_إقرار_إذابة_الفيلر_Hyaluronidase_Consent.html' },
                { type: 'steroid_injection', file: '10_إقرار_حقن_الكورتيزون_Steroid_Injection_Consent.html' },
                { type: 'lip_rejuvenation', file: '11_إقرار_توريد_الشفايف_Lip_Rejuvenation_Consent.html' },
                { type: 'q_switched_laser', file: '12_إقرار_الليزر_الكربوني_Q_Switched_Laser_Consent.html' },
                { type: 'sculptra', file: '13_إقرار_سكلبترا_Sculptra_Consent.html' },
                { type: 'skin_tags_removal', file: '14_إقرار_إزالة_الزوائد_الجلدية_Skin_Tags_Removal_Consent.html' },
                { type: 'tattoo_removal', file: '15_إقرار_إزالة_الوشم_Tattoo_Removal_Consent.html' },
                { type: 'fractional_laser', file: '16_إقرار_ليزر_الفراكشنال_Fractional_Laser_Consent.html' },
                { type: 'dermapen_scarlet', file: '17_إقرار_الديرمابن_سكارليت_Dermapen_Scarlet_Consent.html' },
                { type: 'roaccutane', file: '18_إقرار_الرواكتان_Roaccutane_Consent.html' },
                { type: 'social_media_photo', file: '19_إقرار_نشر_الصور_Social_Media_Photo_Consent.html' },
                { type: 'glow_sessions', file: '20_إقرار_جلسات_النضارة_Glow_Sessions_Consent.html' },
                { type: 'general_medical', file: '21_إقرار_إجراء_طبي_عام_General_Medical_Procedure_Consent.html' },
                { type: 'injection_info', file: '22_بطاقة_معلومات_الحقن_Injection_Info_Card.html' },
                { type: 'mesotherapy', file: '23_إقرار_الميزوثيرابي_General_Mesotherapy_Consent.html' },
                { type: 'cosmetic_info_card', file: '24_نموذج_بطاقة_معلومات_إجراءات_التجميل_Cosmetic_Info_Card.html' }
            ];
            resolve(templates.find(t => t.type === req.params.type));
        });
        if (!templatesResp) return res.status(404).json({ error: 'Template not found' });
        const filePath = path.join(__dirname, 'public', 'consent-forms', templatesResp.file);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'HTML file not found' });
        let html = fs.readFileSync(filePath, 'utf8');
        // Auto-fill patient data if patient_id provided
        if (patient_id) {
            const patient = (await pool.query('SELECT * FROM patients WHERE id=$1', [patient_id])).rows[0];
            if (patient) {
                const now = new Date();
                const dateStr = now.toISOString().split('T')[0];
                const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
                // Calculate age
                let age = '';
                if (patient.dob) {
                    const dob = new Date(patient.dob);
                    age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
                }
                // Inject auto-fill script at end of body
                const fillScript = `<script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const data = {
                            name: '${(patient.name_ar || patient.name_en || '').replace(/'/g, "\\'")}',
                            fileNo: '${patient.file_number || ''}',
                            idNo: '${patient.national_id || ''}',
                            age: '${age}',
                            phone: '${patient.phone || ''}',
                            date: '${dateStr}',
                            time: '${timeStr}',
                            gender: '${patient.gender || ''}',
                            doctor: '${(doctor_name || '').replace(/'/g, "\\'")}'
                        };
                        // Fill all .line spans after label fields
                        const fields = document.querySelectorAll('.field');
                        fields.forEach(f => {
                            const label = f.querySelector('label');
                            const line = f.querySelector('.line');
                            if (!label || !line) return;
                            const txt = label.textContent;
                            if (txt.includes('اسم المريض') || txt.includes('Name:')) line.textContent = data.name;
                            else if (txt.includes('رقم الملف') || txt.includes('File')) line.textContent = data.fileNo;
                            else if (txt.includes('رقم الهوية') || txt.includes('ID #')) line.textContent = data.idNo;
                            else if (txt.includes('العمر') || txt.includes('Age')) line.textContent = data.age;
                            else if (txt.includes('الجوال') || txt.includes('Phone')) line.textContent = data.phone;
                            else if (txt.includes('التاريخ') || txt.includes('Date:')) line.textContent = data.date;
                            else if (txt.includes('الوقت') || txt.includes('Time:')) line.textContent = data.time;
                            else if ((txt.includes('الجراح') || txt.includes('Surgeon') || txt.includes('الطبيب المعالج') || txt.includes('طبيب التخدير')) && data.doctor) line.textContent = data.doctor;
                        });
                    });
                </script>`;
                html = html.replace('</body>', fillScript + '\n</body>');
            }
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



// CONSENT FORMS
// ===== CONSENT FORMS =====
router.get('/api/consent/templates', requireAuth, async (req, res) => {
    try {
        const { category } = req.query;
        let q = 'SELECT * FROM consent_form_templates WHERE is_active=1';
        const params = [];
        if (category) { q += ' AND category=$1'; params.push(category); }
        q += ' ORDER BY category, id';
        res.json((await pool.query(q, params)).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/consent/templates/:id', requireAuth, async (req, res) => {
    try {
        const t = (await pool.query('SELECT * FROM consent_form_templates WHERE id=$1', [req.params.id])).rows[0];
        if (!t) return res.status(404).json({ error: 'Not found' });
        res.json(t);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/consent/sign', requireAuth, async (req, res) => {
    try {
        const { template_id, patient_id, patient_name, signature_data, witness_name, witness_signature, doctor_name, procedure_details, notes } = req.body;
        if (!signature_data) return res.status(400).json({ error: 'Signature required' });
        const tmpl = (await pool.query('SELECT * FROM consent_form_templates WHERE id=$1', [template_id])).rows[0];
        if (!tmpl) return res.status(404).json({ error: 'Template not found' });
        const result = await pool.query(
            'INSERT INTO patient_consents (template_id, patient_id, patient_name, form_type, title, signature_data, witness_name, witness_signature, doctor_name, procedure_details, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
            [template_id, patient_id, patient_name || '', tmpl.form_type, tmpl.title_ar, signature_data, witness_name || '', witness_signature || '', doctor_name || '', procedure_details || '', notes || '', req.session.user?.display_name || '']);
        logAudit(req.session.user?.id, req.session.user?.display_name, 'SIGN_CONSENT', 'Consent', tmpl.title_ar + ' - Patient: ' + patient_name, req.ip);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/consent/patient/:patient_id', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT pc.*, cft.title_ar as template_title, cft.category FROM patient_consents pc LEFT JOIN consent_form_templates cft ON pc.template_id=cft.id WHERE pc.patient_id=$1 ORDER BY pc.created_at DESC', [req.params.patient_id])).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/consent/recent', requireAuth, async (req, res) => {
    try {
        res.json((await pool.query('SELECT pc.*, cft.title_ar as template_title, cft.category FROM patient_consents pc LEFT JOIN consent_form_templates cft ON pc.template_id=cft.id ORDER BY pc.created_at DESC LIMIT 50')).rows);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



module.exports = router;
