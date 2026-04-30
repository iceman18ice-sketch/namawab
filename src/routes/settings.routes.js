/**
 * SETTINGS Routes
 * Auto-extracted from server.js | 9 routes
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


// SETTINGS
// ===== SETTINGS =====
// GET settings is allowed for all authenticated users (needed for theme loading)
router.get('/api/settings', requireAuth, async (req, res) => {
    try {
        const rows = (await pool.query('SELECT * FROM company_settings')).rows;
        const settings = {};
        rows.forEach(r => settings[r.setting_key] = r.setting_value);
        res.json(settings);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/settings', requireAuth, requireRole('settings'), async (req, res) => {
    try {
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            await pool.query('INSERT INTO company_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO UPDATE SET setting_value=$2', [key, value]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/api/settings/users', requireAuth, requireRole('settings'), async (req, res) => {
    try { res.json((await pool.query('SELECT id, username, display_name, role, speciality, permissions, commission_type, commission_value, is_active, last_ip, created_at FROM system_users ORDER BY id')).rows); }
    catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/api/settings/users', requireAuth, requireRole('settings'), async (req, res) => {
    try {
        const { username, password, display_name, role, speciality, permissions, commission_type, commission_value } = req.body;
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO system_users (username, password_hash, display_name, role, speciality, permissions, commission_type, commission_value) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
            [username, hash, display_name || '', role || 'Reception', speciality || '', permissions || '', commission_type || 'percentage', parseFloat(commission_value) || 0]);
        res.json((await pool.query('SELECT id, username, display_name, role, speciality, permissions, commission_type, commission_value, is_active, created_at FROM system_users WHERE id=$1', [result.rows[0].id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/api/settings/users/:id', requireAuth, async (req, res) => {
    try {
        const { username, password, display_name, role, speciality, permissions, is_active, commission_type, commission_value } = req.body;
        let query = 'UPDATE system_users SET username=$1, display_name=$2, role=$3, speciality=$4, permissions=$5, is_active=$6, commission_type=$7, commission_value=$8';
        let params = [username, display_name || '', role || 'Reception', speciality || '', permissions || '', is_active === undefined ? 1 : is_active, commission_type || 'percentage', parseFloat(commission_value) || 0];
        let idx = 9;
        if (password && password.trim() !== '') {
            const hash = await bcrypt.hash(password, 10);
            query += `, password_hash=$${idx}`;
            params.push(hash);
            idx++;
        }
        query += ` WHERE id=$${idx}`;
        params.push(req.params.id);
        await pool.query(query, params);
        res.json((await pool.query('SELECT id, username, display_name, role, speciality, permissions, commission_type, commission_value, is_active, created_at FROM system_users WHERE id=$1', [req.params.id])).rows[0]);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/api/settings/users/:id', requireAuth, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (userId === req.session.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
        const userRole = (await pool.query('SELECT role FROM system_users WHERE id=$1', [userId])).rows[0];
        if (userRole && userRole.role === 'Admin') {
            const adminCount = (await pool.query("SELECT COUNT(*) as count FROM system_users WHERE role='Admin'")).rows[0].count;
            if (parseInt(adminCount) <= 1) return res.status(400).json({ error: 'Cannot delete the last admin' });
        }
        await pool.query('DELETE FROM system_users WHERE id=$1', [userId]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// BACKUP ENDPOINT
// ===== BACKUP ENDPOINT =====
router.get('/api/admin/backup-info', requireAuth, async (req, res) => {
    try {
        const tables = (await pool.query("SELECT tablename, pg_total_relation_size(quote_ident(tablename)) as size FROM pg_tables WHERE schemaname='public' ORDER BY size DESC")).rows;
        const dbSize = (await pool.query("SELECT pg_database_size(current_database()) as size")).rows[0];
        res.json({
            database: process.env.DB_NAME || 'nama_medical_web',
            totalSize: dbSize.size,
            totalSizeMB: (dbSize.size / 1024 / 1024).toFixed(2),
            tables: tables.map(t => ({ name: t.tablename, sizeMB: (t.size / 1024 / 1024).toFixed(2) })),
            backupCommand: 'pg_dump -U ' + (process.env.DB_USER || 'postgres') + ' -h ' + (process.env.DB_HOST || 'localhost') + ' ' + (process.env.DB_NAME || 'nama_medical_web') + ' > backup.sql'
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



// DATABASE BACKUP (Admin only)
// ===== DATABASE BACKUP (Admin only) =====
router.post('/api/admin/backup', requireAuth, async (req, res) => {
    try {
        if (req.session.user?.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

        const { execSync } = require('child_process');
        const backupDir = require('path').join(__dirname, 'backups');
        if (!require('fs').existsSync(backupDir)) require('fs').mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = 'nama_backup_' + timestamp + '.sql';
        const filepath = require('path').join(backupDir, filename);

        const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nama_medical_web';
        execSync('pg_dump "' + dbUrl + '" > "' + filepath + '"', { timeout: 60000 });

        logAudit(req.session.user.id, req.session.user.display_name, 'DATABASE_BACKUP', 'Admin', filename, req.ip);

        res.download(filepath, filename, (err) => {
            if (err) res.status(500).json({ error: 'Download failed' });
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Backup failed: ' + e.message }); }
});

router.get('/api/admin/backups', requireAuth, async (req, res) => {
    try {
        if (req.session.user?.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
        const backupDir = require('path').join(__dirname, 'backups');
        if (!require('fs').existsSync(backupDir)) return res.json([]);
        const files = require('fs').readdirSync(backupDir).filter(f => f.endsWith('.sql')).map(f => {
            const stat = require('fs').statSync(require('path').join(backupDir, f));
            return { name: f, size: (stat.size / 1024 / 1024).toFixed(2) + ' MB', date: stat.mtime };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(files);
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});



module.exports = router;
