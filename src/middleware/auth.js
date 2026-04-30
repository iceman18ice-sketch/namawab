/**
 * Authentication & Authorization Middleware
 * Extracted from server.js for modular architecture
 */

// ===== AUTH CHECK =====
function requireAuth(req, res, next) {
    if (req.session && req.session.user) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// ===== CATALOG EDIT RESTRICTION (Admin/Manager only) =====
const requireCatalogAccess = (req, res, next) => {
    const role = (req.session.user?.role || '').toLowerCase();
    if (['admin', 'manager', 'administrator'].includes(role)) return next();
    return res.status(403).json({ error: 'Access denied. Only Admin/Manager can edit catalog items.' });
};

// ===== DISCOUNT LIMIT BY ROLE =====
const MAX_DISCOUNT_BY_ROLE = { admin: 100, manager: 50, cashier: 10, receptionist: 10, doctor: 20 };

// ===== RBAC - Role-Based Access Control =====
const ROLE_PERMISSIONS = {
    'Admin': '*',
    'CEO': '*', 'CMO': '*', 'CNO': '*', 'CFO': '*', 'COO': '*',
    'Head of Department': ['dashboard', 'patients', 'appointments', 'reports', 'messaging', 'quality', 'academic', 'finance', 'hr'],
    'Consultant': ['dashboard', 'patients', 'appointments', 'doctor', 'lab', 'radiology', 'pharmacy', 'nursing', 'waiting', 'reports', 'messaging', 'surgery', 'consent', 'icu', 'academic', 'telehealth'],
    'Senior Specialist': ['dashboard', 'patients', 'appointments', 'doctor', 'lab', 'radiology', 'pharmacy', 'nursing', 'waiting', 'reports', 'messaging', 'surgery', 'consent', 'icu', 'telehealth'],
    'Specialist': ['dashboard', 'patients', 'appointments', 'doctor', 'lab', 'radiology', 'pharmacy', 'nursing', 'waiting', 'reports', 'messaging', 'surgery', 'consent', 'icu', 'telehealth'],
    'Resident': ['dashboard', 'patients', 'appointments', 'doctor', 'lab', 'radiology', 'pharmacy', 'nursing', 'waiting', 'reports', 'messaging', 'consent', 'academic'],
    'Doctor': ['dashboard', 'patients', 'appointments', 'doctor', 'lab', 'radiology', 'pharmacy', 'nursing', 'waiting', 'reports', 'messaging', 'surgery', 'consent', 'icu', 'telehealth'],
    'Specialized Nurse': ['dashboard', 'patients', 'nursing', 'waiting', 'vitals', 'icu', 'emergency', 'inpatient', 'transport', 'dietary', 'quality'],
    'General Nurse': ['dashboard', 'patients', 'nursing', 'waiting', 'vitals', 'icu', 'emergency', 'inpatient', 'transport', 'dietary'],
    'Nursing Assistant': ['dashboard', 'patients', 'vitals', 'waiting', 'transport'],
    'Nurse': ['dashboard', 'patients', 'nursing', 'waiting', 'vitals', 'icu', 'emergency', 'inpatient', 'transport', 'dietary'],
    'Clinical Pharmacist': ['dashboard', 'pharmacy', 'inventory', 'messaging', 'quality'],
    'Pharmacist': ['dashboard', 'pharmacy', 'inventory', 'messaging'],
    'Physiotherapist': ['dashboard', 'patients', 'appointments', 'messaging'],
    'Biomedical Engineer': ['dashboard', 'maintenance', 'inventory', 'messaging'],
    'Lab Technician': ['dashboard', 'lab', 'messaging'],
    'Radiologist': ['dashboard', 'radiology', 'messaging'],
    'Reception': ['dashboard', 'patients', 'appointments', 'waiting', 'messaging', 'accounts'],
    'Finance': ['dashboard', 'finance', 'insurance', 'reports', 'accounts', 'invoices'],
    'HR': ['dashboard', 'hr', 'messaging', 'reports'],
    'IT': ['dashboard', 'settings', 'messaging', 'maintenance'],
    'Staff': ['dashboard', 'messaging']
};

function requireRole(...modules) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) return res.status(401).json({ error: 'Unauthorized' });
        const role = req.session.user.role;
        const perms = ROLE_PERMISSIONS[role];
        if (perms === '*') return next(); // Admin
        if (perms && modules.some(m => perms.includes(m))) return next();
        res.status(403).json({ error: 'Access denied' });
    };
}

module.exports = {
    requireAuth,
    requireCatalogAccess,
    requireRole,
    MAX_DISCOUNT_BY_ROLE,
    ROLE_PERMISSIONS
};
