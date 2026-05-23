const express = require('express');
const router = express.Router();
const pool = require('../db');
const { isAuthenticated } = require('../middleware/auth');

router.get('/sessions', isAuthenticated, async (req, res) => {
    const role = req.session.admin.role;
    
    try {
        let query;
        
        if (role === 'admin') {
            query = `
                SELECT 
                    s.session_id,
                    s.status,
                    s.assigned_to,
                    a.username as manager_name,
                    s.last_activity,
                    (SELECT message FROM messages WHERE session_id = s.session_id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT COUNT(*) FROM messages WHERE session_id = s.session_id AND sender = 'client' AND is_read = false) as unread_count
                FROM sessions s
                LEFT JOIN admins a ON s.assigned_to = a.id
                ORDER BY s.last_activity DESC
            `;
        } else {
            query = `
                SELECT 
                    s.session_id,
                    s.status,
                    s.assigned_to,
                    s.last_activity,
                    (SELECT message FROM messages WHERE session_id = s.session_id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT COUNT(*) FROM messages WHERE session_id = s.session_id AND sender = 'client' AND is_read = false) as unread_count
                FROM sessions s
                WHERE s.assigned_to = $1
                ORDER BY s.last_activity DESC
            `;
        }
        
        const result = await pool.query(query, role === 'admin' ? [] : [req.session.admin.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/messages/:sessionId', isAuthenticated, async (req, res) => {
    const { sessionId } = req.params;
    const adminId = req.session.admin.id;
    const role = req.session.admin.role;
    
    try {
        if (role !== 'admin') {
            const check = await pool.query(
                'SELECT assigned_to FROM sessions WHERE session_id = $1',
                [sessionId]
            );
            
            if (check.rows.length > 0 && check.rows[0].assigned_to !== adminId) {
                return res.status(403).json({ error: 'Нет доступа к этому чату' });
            }
        }
        
        const result = await pool.query(
            'SELECT id, sender, message, created_at, is_read FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
            [sessionId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/send', isAuthenticated, async (req, res) => {
    const { session_id, message } = req.body;
    const adminId = req.session.admin.id;
    const role = req.session.admin.role;
    
    if (!session_id || !message) {
        return res.status(400).json({ error: 'Неверные данные' });
    }
    
    try {
        if (role !== 'admin') {
            const check = await pool.query(
                'SELECT assigned_to FROM sessions WHERE session_id = $1',
                [session_id]
            );
            
            if (check.rows.length > 0 && check.rows[0].assigned_to !== adminId) {
                return res.status(403).json({ error: 'Нет доступа' });
            }
        }
        
        await pool.query(
            'INSERT INTO messages (session_id, sender, message, is_read) VALUES ($1, $2, $3, true)',
            [session_id, 'admin', message]
        );
        
        await pool.query(
            'UPDATE sessions SET last_activity = NOW() WHERE session_id = $1',
            [session_id]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/mark-read', isAuthenticated, async (req, res) => {
    const { session_id } = req.body;
    
    try {
        await pool.query(
            'UPDATE messages SET is_read = true WHERE session_id = $1 AND sender = $2',
            [session_id, 'client']
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;