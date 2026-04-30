/**
 * Swagger API Documentation Configuration
 * Auto-generates OpenAPI 3.0 docs for all Nama Medical ERP routes
 */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Nama Medical ERP — API Documentation',
            version: '2.0.0',
            description: `
## Complete API Reference for Nama Medical Center ERP

**Architecture:** Modular Express.js (46 route modules, 424+ endpoints)

### Authentication
All API routes require session-based authentication via \`/api/auth/login\`.
Send credentials as JSON and the server returns a session cookie.

### Module Groups
| Group | Routes | Description |
|-------|--------|-------------|
| Auth | 4 | Login, Logout, Session, Password |
| Patients | 14 | Registration, Records, Summary |
| Appointments | 10 | Booking, Check-in, No-show |
| Laboratory | 15 | Orders, Results, Reference Ranges |
| Radiology | 5 | Orders, Image Upload |
| Pharmacy | 25 | Prescriptions, Stock, Drug Interactions |
| Nursing | 13 | Vitals, Assessments, eMAR |
| Finance | 23 | Invoices, Payments, Revenue Reports |
| Surgery | 21 | Scheduling, Tracking |
| Insurance | 8 | Companies, Policies |
| CPOE | 6 | Order Sets, Active Orders |
| Flowsheets | 9 | I/O, Pain, GCS, Wound, Summary |
| Compliance | 19 | ZATCA, NPHIES, Wasfaty, Yaqeen |
| Clinical Alerts | 4 | Auto-alerts, Dismiss |
| + 32 more modules | 248+ | HR, Reports, Settings, etc. |
`,
            contact: { name: 'Nama Medical ERP', email: 'support@namamedical.sa' },
            license: { name: 'Proprietary' }
        },
        servers: [
            { url: 'http://localhost:3001', description: 'Development Server' },
            { url: 'http://localhost:3000', description: 'Docker / Production' }
        ],
        tags: [
            { name: 'Auth', description: 'Authentication & Session Management' },
            { name: 'Patients', description: 'Patient Registration & Records' },
            { name: 'Appointments', description: 'Appointment Scheduling' },
            { name: 'Laboratory', description: 'Lab Orders & Results' },
            { name: 'Radiology', description: 'Radiology Orders & Imaging' },
            { name: 'Pharmacy', description: 'Prescriptions & Drug Management' },
            { name: 'Nursing', description: 'Vitals, Assessments & Flowsheets' },
            { name: 'CPOE', description: 'Computerized Physician Order Entry' },
            { name: 'Finance', description: 'Invoices, Billing & Revenue' },
            { name: 'Insurance', description: 'Insurance Companies & Claims' },
            { name: 'Surgery', description: 'Surgical Scheduling & Tracking' },
            { name: 'HR', description: 'Employee & Staff Management' },
            { name: 'Inventory', description: 'Stock & Supply Management' },
            { name: 'Compliance', description: 'ZATCA, NPHIES, Wasfaty, Yaqeen' },
            { name: 'Clinical', description: 'CPOE, Drug Checks, Flowsheets, Alerts' },
            { name: 'Reports', description: 'Medical Reports & Certificates' },
            { name: 'Settings', description: 'System Configuration' },
            { name: 'Health', description: 'System Health & Monitoring' }
        ],
        components: {
            securitySchemes: {
                sessionAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'connect.sid',
                    description: 'Session cookie obtained via POST /api/auth/login'
                }
            },
            schemas: {
                Patient: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name_en: { type: 'string', example: 'Mohammed Ali' },
                        name_ar: { type: 'string', example: 'محمد علي' },
                        phone: { type: 'string', example: '0551234567' },
                        email: { type: 'string' },
                        dob: { type: 'string', example: '1990-01-15' },
                        gender: { type: 'string', enum: ['Male', 'Female'] },
                        nationality: { type: 'string', example: 'Saudi' },
                        national_id: { type: 'string' },
                        insurance_company: { type: 'string' },
                        insurance_number: { type: 'string' },
                        blood_type: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
                        yaqeen_verified: { type: 'integer', enum: [0, 1] }
                    }
                },
                Invoice: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        patient_id: { type: 'integer' },
                        patient_name: { type: 'string' },
                        total: { type: 'number', example: 500.00 },
                        vat_amount: { type: 'number', example: 75.00 },
                        paid: { type: 'number', example: 0 },
                        service_type: { type: 'string' },
                        description: { type: 'string' }
                    }
                },
                OrderSet: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string', example: 'DKA Management' },
                        name_ar: { type: 'string', example: 'إدارة الحماض الكيتوني' },
                        specialty: { type: 'string' },
                        diagnosis_code: { type: 'string', example: 'E10.1' },
                        item_count: { type: 'integer' }
                    }
                },
                ClinicalAlert: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        patient_id: { type: 'integer' },
                        alert_type: { type: 'string' },
                        severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
                        title: { type: 'string' },
                        message: { type: 'string' },
                        is_dismissed: { type: 'integer' }
                    }
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'healthy' },
                        uptime: { type: 'integer' },
                        database: { type: 'string' },
                        activeSessions: { type: 'integer' },
                        architecture: { type: 'string', example: 'modular' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Server error' }
                    }
                }
            }
        },
        security: [{ sessionAuth: [] }]
    },
    apis: [] // We define paths inline below
};

// Generate comprehensive path documentation
options.definition.paths = {
    // ===== AUTH =====
    '/api/auth/login': {
        post: {
            tags: ['Auth'], summary: 'Login', operationId: 'login',
            security: [],
            requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string' }, password: { type: 'string' } } } } } },
            responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } }
        }
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', responses: { '200': { description: 'Logged out' } } } },
    '/api/auth/me': { get: { tags: ['Auth'], summary: 'Get current session', responses: { '200': { description: 'Session info' }, '401': { description: 'Not authenticated' } } } },
    '/api/auth/change-password': { post: { tags: ['Auth'], summary: 'Change password', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { current: { type: 'string' }, newPassword: { type: 'string' } } } } } }, responses: { '200': { description: 'Password changed' } } } },

    // ===== HEALTH =====
    '/api/health': { get: { tags: ['Health'], summary: 'System health check', security: [], responses: { '200': { description: 'System healthy', content: { 'application/json': { schema: { '$ref': '#/components/schemas/HealthCheck' } } } } } } },

    // ===== PATIENTS =====
    '/api/patients': {
        get: { tags: ['Patients'], summary: 'List all patients', responses: { '200': { description: 'Array of patients' } } },
        post: { tags: ['Patients'], summary: 'Register new patient', requestBody: { content: { 'application/json': { schema: { '$ref': '#/components/schemas/Patient' } } } }, responses: { '200': { description: 'Patient created' } } }
    },
    '/api/patients/{id}': {
        get: { tags: ['Patients'], summary: 'Get patient by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Patient details' } } },
        put: { tags: ['Patients'], summary: 'Update patient', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Updated' } } }
    },
    '/api/patients/{id}/summary': { get: { tags: ['Patients'], summary: 'Full patient summary (visits, labs, invoices)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Patient summary' } } } },

    // ===== APPOINTMENTS =====
    '/api/appointments': {
        get: { tags: ['Appointments'], summary: 'List all appointments', responses: { '200': { description: 'Array of appointments' } } },
        post: { tags: ['Appointments'], summary: 'Create appointment', responses: { '200': { description: 'Appointment created' } } }
    },

    // ===== LAB =====
    '/api/lab/orders': {
        get: { tags: ['Laboratory'], summary: 'List lab orders', responses: { '200': { description: 'Lab orders array' } } },
        post: { tags: ['Laboratory'], summary: 'Create lab order', responses: { '200': { description: 'Order created' } } }
    },
    '/api/lab/catalog': { get: { tags: ['Laboratory'], summary: 'Get lab test catalog', responses: { '200': { description: 'Lab catalog' } } } },

    // ===== PHARMACY =====
    '/api/pharmacy/prescriptions': {
        get: { tags: ['Pharmacy'], summary: 'List prescriptions', responses: { '200': { description: 'Prescriptions' } } },
        post: { tags: ['Pharmacy'], summary: 'Create prescription', responses: { '200': { description: 'Created' } } }
    },
    '/api/pharmacy/stock': { get: { tags: ['Pharmacy'], summary: 'Get pharmacy stock', responses: { '200': { description: 'Stock list' } } } },

    // ===== INVOICES =====
    '/api/invoices': {
        get: { tags: ['Finance'], summary: 'List all invoices', responses: { '200': { description: 'Invoices array' } } },
        post: { tags: ['Finance'], summary: 'Create invoice', requestBody: { content: { 'application/json': { schema: { '$ref': '#/components/schemas/Invoice' } } } }, responses: { '200': { description: 'Invoice created' } } }
    },
    '/api/invoices/{id}/pay': { post: { tags: ['Finance'], summary: 'Record payment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Payment recorded' } } } },

    // ===== CPOE =====
    '/api/clinical/cpoe/order-sets': { get: { tags: ['CPOE'], summary: 'List order set templates', responses: { '200': { description: 'Order sets', content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/OrderSet' } } } } } } } },
    '/api/clinical/cpoe/order-sets/{id}': { get: { tags: ['CPOE'], summary: 'Get order set with items', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Order set details' } } } },
    '/api/clinical/cpoe/order-sets/{id}/apply': { post: { tags: ['CPOE'], summary: 'Apply order set to patient', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { patient_id: { type: 'integer' }, patient_name: { type: 'string' } } } } } }, responses: { '200': { description: 'Orders created + drug interaction warnings' } } } },

    // ===== DRUG CHECKS =====
    '/api/clinical/drug-check': { post: { tags: ['Clinical'], summary: 'Check single drug interaction', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { patient_id: { type: 'integer' }, drug_name: { type: 'string' } } } } } }, responses: { '200': { description: 'Interaction results' } } } },

    // ===== FLOWSHEETS =====
    '/api/clinical/flowsheet/summary/{patientId}': { get: { tags: ['Nursing'], summary: '24-hour nursing flowsheet summary', parameters: [{ name: 'patientId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Consolidated vitals, I/O, pain, GCS, wounds' } } } },
    '/api/clinical/flowsheet/pain': { post: { tags: ['Nursing'], summary: 'Record pain assessment', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { patient_id: { type: 'integer' }, pain_score: { type: 'integer', minimum: 0, maximum: 10 }, pain_location: { type: 'string' } } } } } }, responses: { '200': { description: 'Pain recorded (auto-alert if ≥8)' } } } },
    '/api/clinical/flowsheet/gcs': { post: { tags: ['Nursing'], summary: 'Record GCS score', responses: { '200': { description: 'GCS recorded (auto-alert if ≤8)' } } } },

    // ===== ALERTS =====
    '/api/clinical/alerts': { get: { tags: ['Clinical'], summary: 'Get all active clinical alerts', responses: { '200': { description: 'Alert list', content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/ClinicalAlert' } } } } } } } },
    '/api/clinical/alerts/{id}/dismiss': { put: { tags: ['Clinical'], summary: 'Dismiss a clinical alert', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Alert dismissed' } } } },

    // ===== COMPLIANCE =====
    '/api/compliance/nphies/eligibility': { post: { tags: ['Compliance'], summary: 'Check NPHIES insurance eligibility', responses: { '200': { description: 'Eligibility result' } } } },
    '/api/compliance/wasfaty/submit': { post: { tags: ['Compliance'], summary: 'Submit e-prescription to Wasfaty', responses: { '200': { description: 'Wasfaty reference' } } } },
    '/api/compliance/yaqeen/verify': { post: { tags: ['Compliance'], summary: 'Verify patient identity via Yaqeen', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { patient_id: { type: 'integer' }, national_id: { type: 'string' } } } } } }, responses: { '200': { description: 'Verification result' } } } },
    '/api/compliance/zatca/generate/{invoiceId}': { post: { tags: ['Compliance'], summary: 'Generate ZATCA Phase 2 XML', parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'XML generated' } } } }
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: `.swagger-ui .topbar { background: #1a237e; } .swagger-ui .info .title { color: #1a237e; }`,
        customSiteTitle: 'Nama Medical ERP — API Docs',
        customfavIcon: '/favicon.ico'
    }));
    app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
    console.log('  📖 Swagger: http://localhost:' + (process.env.PORT || 3000) + '/api/docs');
}

module.exports = { setupSwagger };
