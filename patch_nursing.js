const fs = require('fs');

let content = fs.readFileSync('src/routes/nursing.routes.js', 'utf8');

// Add import
if (!content.includes('emitClinicalAlert')) {
    content = content.replace(
        "const { logAudit, calcVAT, addVAT } = require('../utils/helpers');",
        "const { logAudit, calcVAT, addVAT } = require('../utils/helpers');\nconst { emitClinicalAlert } = require('../services/socket.service');"
    );
}

// Add endpoints at the end before module.exports
if (!content.includes('/api/nursing/flowsheets')) {
    const endpoints = `
// NURSING EXECUTION LOOP (Flowsheets & Tasks)
// ===== NURSING EXECUTION LOOP =====
router.post('/api/nursing/flowsheets', requireAuth, async (req, res) => {
    try {
        const { patient_id, gcs_score, pain_scale, io_balance } = req.body;
        // Check for critical alerts
        if (parseInt(gcs_score) <= 8 || parseInt(pain_scale) >= 8) {
            emitClinicalAlert(patient_id, {
                type: 'urgent',
                time: 'الآن',
                text: \`🚨 تنبيه حرج: مقياس غلاسكو (GCS) \${gcs_score} ومستوى الألم \${pain_scale}/10 للمريض #\${patient_id}. تدخل فوري مطلوب!\`
            });
        }
        res.json({ success: true, message: 'Flowsheet updated' });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/nursing/orders/:id/collect', requireAuth, async (req, res) => {
    try {
        const orderId = req.params.id;
        await pool.query("UPDATE lab_radiology_orders SET status='Sample Collected' WHERE id=$1", [orderId]);
        const order = (await pool.query("SELECT * FROM lab_radiology_orders WHERE id=$1", [orderId])).rows[0];
        
        if (order) {
            emitClinicalAlert(order.patient_id, {
                type: 'success',
                time: 'الآن',
                text: \`💉 تم سحب العينة لطلب (\${order.order_type}) من قبل التمريض.\`
            });
        }
        res.json({ success: true, order });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

`;
    content = content.replace('module.exports = router;', endpoints + 'module.exports = router;');
}

fs.writeFileSync('src/routes/nursing.routes.js', content, 'utf8');
console.log('Patched nursing.routes.js successfully');
