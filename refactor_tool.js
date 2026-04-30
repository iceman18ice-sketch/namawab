/**
 * Refactor Tool: Extract routes from server.js into modular files
 * This tool reads server.js, identifies route sections, groups them by module,
 * and generates modular route files under src/routes/
 * 
 * Safe: Does NOT modify server.js — only creates new files
 */
const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.join(__dirname, 'server.js');
const ROUTES_DIR = path.join(__dirname, 'src', 'routes');
const lines = fs.readFileSync(SERVER_FILE, 'utf8').split('\n');

// Define module groups: each maps section keywords → module file
const MODULE_MAP = {
    'dashboard': { file: 'dashboard.routes.js', prefix: '/api', sections: ['DASHBOARD', 'ENHANCED DASHBOARD', 'DASHBOARD CHARTS'] },
    'patients': { file: 'patients.routes.js', prefix: '/api', sections: ['PATIENTS', 'PATIENT RESULTS', 'PATIENT ACCOUNT', 'PATIENT VISIT TIMELINE', 'PATIENT FULL SUMMARY', 'SAFE PATIENT DELETE', 'VISIT TRACKING', 'VISIT LIFECYCLE'] },
    'appointments': { file: 'appointments.routes.js', prefix: '/api', sections: ['APPOINTMENTS', 'FOLLOW-UP APPOINTMENTS', 'APPOINTMENT CONFLICT', 'APPOINTMENT CHECK-IN', 'NO-SHOW', 'DUPLICATE APPOINTMENT', 'ONLINE BOOKINGS'] },
    'lab': { file: 'lab.routes.js', prefix: '/api', sections: ['LAB', 'LAB & RADIOLOGY ORDERS', 'LAB REFERENCE'] },
    'radiology': { file: 'radiology.routes.js', prefix: '/api', sections: ['RADIOLOGY'] },
    'pharmacy': { file: 'pharmacy.routes.js', prefix: '/api', sections: ['PHARMACY', 'PRESCRIPTIONS', 'DRUG INTERACTION', 'ALLERGY CROSS', 'DRUG EXPIRY', 'PHARMACY STOCK', 'PHARMACY PRESCRIPTIONS'] },
    'nursing': { file: 'nursing.routes.js', prefix: '/api', sections: ['NURSING', 'eMAR', 'NURSING CARE', 'NURSING ASSESSMENT', 'TRIAGE'] },
    'hr': { file: 'hr.routes.js', prefix: '/api', sections: ['HR', 'EMPLOYEES'] },
    'finance': { file: 'finance.routes.js', prefix: '/api', sections: ['FINANCE', 'INVOICES', 'BILLING SUMMARY', 'PARTIAL PAYMENT', 'INVOICE CANCEL', 'CASH DRAWER', 'DAILY CASH', 'P&L REPORT', 'AGING REPORT', 'DOCTOR REVENUE', 'DOCTOR COMMISSION', 'FINANCIAL DAILY'] },
    'insurance': { file: 'insurance.routes.js', prefix: '/api', sections: ['INSURANCE'] },
    'inventory': { file: 'inventory.routes.js', prefix: '/api', sections: ['INVENTORY', 'STOCK MOVEMENT', 'DEPARTMENT RESOURCE'] },
    'surgery': { file: 'surgery.routes.js', prefix: '/api', sections: ['SURGERY'] },
    'blood_bank': { file: 'blood_bank.routes.js', prefix: '/api', sections: ['BLOOD BANK'] },
    'emergency': { file: 'emergency.routes.js', prefix: '/api', sections: ['EMERGENCY'] },
    'inpatient': { file: 'inpatient.routes.js', prefix: '/api', sections: ['INPATIENT'] },
    'icu': { file: 'icu.routes.js', prefix: '/api', sections: ['ICU'] },
    'settings': { file: 'settings.routes.js', prefix: '/api', sections: ['SETTINGS', 'BACKUP', 'DATABASE BACKUP'] },
    'messaging': { file: 'messaging.routes.js', prefix: '/api', sections: ['MESSAGING'] },
    'reports': { file: 'reports.routes.js', prefix: '/api', sections: ['REPORTS', 'MEDICAL CERTIFICATES', 'MEDICAL REPORTS', 'PRINT API'] },
    'consent': { file: 'consent.routes.js', prefix: '/api', sections: ['CONSENT'] },
    'catalog': { file: 'catalog.routes.js', prefix: '/api', sections: ['CATALOG', 'MEDICAL SERVICES', 'DIAGNOSIS TEMPLATES'] },
    'cssd': { file: 'cssd.routes.js', prefix: '/api', sections: ['CSSD'] },
    'dietary': { file: 'dietary.routes.js', prefix: '/api', sections: ['DIETARY'] },
    'infection': { file: 'infection.routes.js', prefix: '/api', sections: ['INFECTION'] },
    'quality': { file: 'quality.routes.js', prefix: '/api', sections: ['QUALITY'] },
    'maintenance': { file: 'maintenance.routes.js', prefix: '/api', sections: ['MAINTENANCE'] },
    'transport': { file: 'transport.routes.js', prefix: '/api', sections: ['TRANSPORT'] },
    'cosmetic': { file: 'cosmetic.routes.js', prefix: '/api', sections: ['COSMETIC'] },
    'portal': { file: 'portal.routes.js', prefix: '/api', sections: ['PATIENT PORTAL'] },
    'zatca': { file: 'zatca.routes.js', prefix: '/api', sections: ['ZATCA'] },
    'telemedicine': { file: 'telemedicine.routes.js', prefix: '/api', sections: ['TELEMEDICINE'] },
    'pathology': { file: 'pathology.routes.js', prefix: '/api', sections: ['PATHOLOGY'] },
    'social_work': { file: 'social_work.routes.js', prefix: '/api', sections: ['SOCIAL WORK'] },
    'mortuary': { file: 'mortuary.routes.js', prefix: '/api', sections: ['MORTUARY'] },
    'cme': { file: 'cme.routes.js', prefix: '/api', sections: ['CME'] },
    'rehab': { file: 'rehab.routes.js', prefix: '/api', sections: ['REHABILITATION'] },
    'medical_records': { file: 'medical_records.routes.js', prefix: '/api', sections: ['MEDICAL RECORDS'] },
    'clinical_pharmacy': { file: 'clinical_pharmacy.routes.js', prefix: '/api', sections: ['CLINICAL PHARMACY'] },
    'obgyn': { file: 'obgyn.routes.js', prefix: '/api', sections: ['OB/GYN'] },
    'referral': { file: 'referral.routes.js', prefix: '/api', sections: ['REFERRAL'] },
    'audit': { file: 'audit.routes.js', prefix: '/api', sections: ['AUDIT TRAIL'] },
    'notifications': { file: 'notifications.routes.js', prefix: '/api', sections: ['NOTIFICATIONS'] },
    'blueprint': { file: 'blueprint.routes.js', prefix: '/api', sections: ['MASTER BLUEPRINT'] },
    'waiting': { file: 'waiting.routes.js', prefix: '/api', sections: ['WAITING QUEUE'] },
    'forms': { file: 'forms.routes.js', prefix: '/api', sections: ['FORM BUILDER'] },
    'doctor': { file: 'doctor.routes.js', prefix: '/api', sections: ['DOCTOR PROCEDURE', 'DOCTOR: NEXT', 'DOCTOR: MY QUEUE'] },
};

// Step 1: Find all section boundaries
const sections = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('// ===== ') && line.endsWith('=====')) {
        const title = line.replace(/^\/\/ =+ /, '').replace(/ =+$/, '').trim();
        sections.push({ title, startLine: i });
    }
}

// Set end lines
for (let i = 0; i < sections.length; i++) {
    sections[i].endLine = (i + 1 < sections.length) ? sections[i + 1].startLine - 1 : lines.length - 1;
}

// Step 2: Match sections to modules
function matchModule(sectionTitle) {
    for (const [modName, mod] of Object.entries(MODULE_MAP)) {
        for (const keyword of mod.sections) {
            if (sectionTitle.toUpperCase().includes(keyword.toUpperCase())) {
                return modName;
            }
        }
    }
    return null;
}

// Group sections by module
const moduleGroups = {};
const unmapped = [];
for (const sec of sections) {
    // Skip non-route sections
    if (['INIT & START', 'SINGLE SESSION', 'DISCOUNT LIMIT', 'CATALOG EDIT RESTRICTION', 'VAT HELPER', 'SPA CATCH-ALL', 'AUTH ROUTES', 'PASSWORD CHANGE'].some(k => sec.title.toUpperCase().includes(k))) continue;
    if (sec.title.toUpperCase().includes('MIGRATION')) continue;
    
    const mod = matchModule(sec.title);
    if (mod) {
        if (!moduleGroups[mod]) moduleGroups[mod] = [];
        moduleGroups[mod].push(sec);
    } else {
        unmapped.push(sec);
    }
}

// Step 3: Count routes in each section
function countRoutes(startLine, endLine) {
    let count = 0;
    for (let i = startLine; i <= endLine && i < lines.length; i++) {
        if (/app\.(get|post|put|delete|patch)\(/.test(lines[i])) count++;
    }
    return count;
}

// Step 4: Generate route files
let totalRoutes = 0;
let filesCreated = 0;

for (const [modName, secs] of Object.entries(moduleGroups)) {
    const mod = MODULE_MAP[modName];
    let routeCount = 0;
    let codeLines = [];
    
    for (const sec of secs) {
        const sectionLines = lines.slice(sec.startLine, sec.endLine + 1);
        const rc = countRoutes(sec.startLine, sec.endLine);
        routeCount += rc;
        codeLines.push(`\n// ${sec.title}`);
        codeLines.push(...sectionLines);
    }
    
    if (routeCount === 0) continue;
    
    // Convert app.get/post/etc to router.get/post/etc
    let code = codeLines.join('\n');
    code = code.replace(/app\.(get|post|put|delete|patch)\(/g, 'router.$1(');
    
    // Build module file
    const fileContent = `/**
 * ${modName.toUpperCase()} Routes
 * Auto-extracted from server.js | ${routeCount} routes
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

${code}

module.exports = router;
`;
    
    const filePath = path.join(ROUTES_DIR, mod.file);
    fs.writeFileSync(filePath, fileContent);
    totalRoutes += routeCount;
    filesCreated++;
    console.log(`  ✅ ${mod.file.padEnd(30)} ${routeCount} routes (${secs.length} sections)`);
}

console.log(`\n  📊 Summary:`);
console.log(`     Files created: ${filesCreated}`);
console.log(`     Routes extracted: ${totalRoutes}`);
console.log(`     Unmapped sections: ${unmapped.length}`);
if (unmapped.length) {
    unmapped.forEach(s => console.log(`       ⚠️ ${s.title} (line ${s.startLine + 1})`));
}

// Step 5: Generate index.js router loader
const indexLines = [`/**
 * Route Index - Auto-generated by refactor_tool.js
 * Loads all modular route files and mounts them on the Express app
 */
module.exports = function mountRoutes(app) {
`];

for (const [modName, mod] of Object.entries(MODULE_MAP)) {
    if (!moduleGroups[modName]) continue;
    const routeCount = moduleGroups[modName].reduce((sum, s) => sum + countRoutes(s.startLine, s.endLine), 0);
    if (routeCount === 0) continue;
    indexLines.push(`    // ${modName} (${routeCount} routes)`);
    indexLines.push(`    app.use('/', require('./${mod.file}'));`);
}

indexLines.push(`\n    console.log('  📦 Modular routes loaded: ${filesCreated} modules, ${totalRoutes} routes');\n};`);

fs.writeFileSync(path.join(ROUTES_DIR, 'index.js'), indexLines.join('\n'));
console.log(`  ✅ index.js (route loader) created`);
console.log(`\n  🎉 Refactoring complete! Files in: src/routes/`);
