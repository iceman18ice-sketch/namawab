/**
 * Nama Medical ERP — Modular Server Entry Point
 * 
 * This replaces the monolithic server.js with a clean modular architecture.
 * All 392+ API routes are loaded from src/routes/ via express.Router().
 * 
 * Architecture:
 *   server_modular.js → src/routes/*.routes.js → src/middleware/auth.js
 *                                              → src/utils/helpers.js
 *                                              → db_postgres.js (145 tables)
 */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const { pool, initDatabase } = require('./db_postgres');
const { insertSampleData, populateLabCatalog, populateRadiologyCatalog } = require('./seed_data_pg');
const { populateMedicalServices, populateBaseDrugs } = require('./seed_services_pg');
const { addExtraLabTests, addExtraRadiology } = require('./seed_extra_catalog');
const { runComplianceMigration } = require('./src/services/compliance_migration');
const { runClinicalMigration } = require('./src/services/clinical_migration');
const { setupSwagger } = require('./src/config/swagger');
const { setupSocketIO, getOnlineCount } = require('./src/services/socket.service');
const http = require('http');

// ===== EXPRESS APP =====
const app = express();
app.use(compression());
const PORT = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, message: { error: 'Too many requests' }, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

// Input sanitization
function sanitizeInput(obj) {
    if (typeof obj === 'string') return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    if (Array.isArray(obj)) return obj.map(sanitizeInput);
    if (obj && typeof obj === 'object') { for (const k of Object.keys(obj)) obj[k] = sanitizeInput(obj[k]); }
    return obj;
}
app.use((req, res, next) => { if (req.body && typeof req.body === 'object') req.body = sanitizeInput(req.body); next(); });

// ===== CORE MIDDLEWARE =====
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15
    }),
    secret: process.env.SESSION_SECRET || 'nama-medical-erp-secret-x7k9m2p4q8w1',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 8 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST || 'localhost'),
        sameSite: 'lax'
    },
    rolling: true
}));

// ===== HTML CACHE-BUSTING =====
const BUILD_VERSION = Date.now().toString();
function serveHTMLWithVersion(htmlFile) {
    return (req, res) => {
        const filePath = path.join(__dirname, 'public', htmlFile);
        fs.readFile(filePath, 'utf8', (err, html) => {
            if (err) return res.status(404).send('Not found');
            const out = html
                .replace(/(<script\s+src=")(\/js\/[^"?]+\.js)"/g, `$1$2?v=${BUILD_VERSION}"`)
                .replace(/(<link[^>]+href=")(\/css\/[^"?]+\.css)"/g, `$1$2?v=${BUILD_VERSION}"`);
            res.type('html').send(out);
        });
    };
}
app.get(['/', '/index.html'], serveHTMLWithVersion('index.html'));
app.get('/admin.html', serveHTMLWithVersion('admin.html'));
app.get('/login.html', serveHTMLWithVersion('login.html'));

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, 'public')));
app.use('/portal', express.static('d:\\NamaMedical\\AppServerPortal'));

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
    try {
        const dbCheck = await pool.query('SELECT NOW()');
        const sessionCheck = await pool.query('SELECT COUNT(*) as active FROM user_sessions WHERE expire > NOW()');
        res.json({
            status: 'healthy',
            uptime: Math.floor(process.uptime()),
            database: 'connected',
            activeSessions: parseInt(sessionCheck.rows[0].active),
            timestamp: dbCheck.rows[0].now,
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            architecture: 'modular'
        });
    } catch (e) { res.status(503).json({ status: 'unhealthy', error: e.message }); }
});

// ===== API REQUEST LOGGER =====
app.use('/api/', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 2000) console.warn(`⚠️ Slow API: ${req.method} ${req.originalUrl} - ${duration}ms [${res.statusCode}]`);
    });
    next();
});

// ===== SWAGGER API DOCS =====
setupSwagger(app);

// ===== MOUNT ALL MODULAR ROUTES =====
const mountRoutes = require('./src/routes/index');
mountRoutes(app);

// ===== DB MIGRATIONS =====
async function runMigrations() {
    try {
        await pool.query(`DO $$ BEGIN ALTER TABLE system_users ADD COLUMN last_ip TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`);
        await pool.query(`DO $$ BEGIN ALTER TABLE pharmacy_prescriptions_queue ADD COLUMN doctor TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`);
        await pool.query(`DO $$ BEGIN ALTER TABLE audit_trail ADD COLUMN user_name TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`);
        await pool.query(`DO $$ BEGIN ALTER TABLE audit_trail ADD COLUMN details TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`);
    } catch (e) { console.error('Migration error:', e.message); }
}

// ===== PASSWORD AUTO-MIGRATION =====
async function migratePasswords() {
    const { rows } = await pool.query("SELECT id, password_hash FROM system_users WHERE password_hash != '' AND password_hash NOT LIKE '$2%'");
    if (rows.length > 0) {
        console.log(`  🔐 Migrating ${rows.length} plain-text password(s) to bcrypt...`);
        for (const u of rows) {
            const hash = await bcrypt.hash(u.password_hash, 10);
            await pool.query('UPDATE system_users SET password_hash=$1 WHERE id=$2', [hash, u.id]);
        }
        console.log('  ✅ Password migration complete');
    }
}

// ===== SPA CATCH-ALL (must be LAST) =====
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    return serveHTMLWithVersion('index.html')(req, res, next);
});

// ===== START SERVER =====
async function startServer() {
    try {
        console.log('\n  🐘 Connecting to PostgreSQL...');
        await initDatabase();
        await runMigrations();
        await runComplianceMigration();
        await runClinicalMigration();
        await migratePasswords();
        await insertSampleData();
        await populateLabCatalog();
        await populateRadiologyCatalog();
        await addExtraLabTests();
        await addExtraRadiology();
        await populateMedicalServices();
        await populateBaseDrugs();
        const server = http.createServer(app);
        setupSocketIO(server);
        server.listen(PORT, () => {
            console.log(`\n  ✅ Medical Center Web is running! (MODULAR)`);
            console.log(`  🌐 Open: http://localhost:${PORT}`);
            console.log(`  📖 Swagger: http://localhost:${PORT}/api/docs`);
            console.log(`  📦 Database: PostgreSQL (nama_medical_web)`);
            console.log(`  🔒 Session Store: PostgreSQL (user_sessions)`);
            console.log(`  🏗️  Architecture: Modular (46 route modules)`);
            console.log(`  🇸🇦 Compliance: ZATCA P2 + NPHIES + Wasfaty + Yaqeen`);
            console.log(`  🩺 Clinical: CPOE + Drug Checks + Flowsheets + Alerts`);
            console.log(`  🔌 Socket.io: Real-time notifications active\n`);
        });
    } catch (err) {
        console.error('  ❌ Failed to start:', err.message);
        process.exit(1);
    }
}

startServer();
