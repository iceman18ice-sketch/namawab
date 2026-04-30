/**
 * Auth Routes - Login, Logout, Session, Password Change
 * Extracted from server.js
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { pool } = require('../../db_postgres');
const { requireAuth } = require('../middleware/auth');
const { logAudit } = require('../utils/helpers');

// Rate limiting for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

// Track active session IDs per user to prevent concurrent logins
const activeUserSessions = new Map();

// ===== LOGIN =====
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
        const { rows } = await pool.query('SELECT id, display_name, role, speciality, permissions, password_hash FROM system_users WHERE username=$1 AND is_active=1', [username]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
        const user = rows[0];
        // Check bcrypt hash, or fallback to plain text (auto-migrate)
        let valid = false;
        if (user.password_hash && user.password_hash.startsWith('$2')) {
            valid = await bcrypt.compare(password, user.password_hash);
        } else {
            valid = (password === user.password_hash);
            if (valid) {
                const hash = await bcrypt.hash(password, 10);
                await pool.query('UPDATE system_users SET password_hash=$1 WHERE id=$2', [hash, user.id]);
            }
        }
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        // Single session enforcement
        const previousSessionId = activeUserSessions.get(user.id);
        if (previousSessionId && previousSessionId !== req.sessionID) {
            req.sessionStore.destroy(previousSessionId, (err) => {
                if (err) console.error('Error destroying old session:', err);
            });
        }

        req.session.user = { id: user.id, name: user.display_name, role: user.role, speciality: user.speciality || '', permissions: user.permissions || '' };
        activeUserSessions.set(user.id, req.sessionID);

        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
        await pool.query('UPDATE system_users SET last_ip=$1 WHERE id=$2', [clientIp, user.id]).catch(() => {});
        logAudit(user.id, user.display_name, 'LOGIN', 'Auth', `User logged in as ${user.role}`, clientIp);
        res.json({ success: true, user: req.session.user });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ===== LOGOUT =====
router.post('/logout', (req, res) => {
    if (req.session && req.session.user) {
        activeUserSessions.delete(req.session.user.id);
    }
    req.session.destroy();
    res.json({ success: true });
});

// ===== SESSION CHECK =====
router.get('/me', (req, res) => {
    if (req.session && req.session.user) return res.json({ user: req.session.user });
    res.status(401).json({ error: 'Not logged in' });
});

// ===== CHANGE PASSWORD =====
router.put('/change-password', requireAuth, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) return res.status(400).json({ error: 'Missing fields' });
        if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

        const user = (await pool.query('SELECT * FROM system_users WHERE id=$1', [req.session.user.id])).rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(current_password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect', error_ar: 'كلمة المرور الحالية غير صحيحة' });

        const hashed = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE system_users SET password_hash=$1 WHERE id=$2', [hashed, req.session.user.id]);

        logAudit(req.session.user.id, req.session.user.name, 'CHANGE_PASSWORD', 'Auth', 'Password changed', req.ip);
        res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
