const express = require('express');
const router = express.Router();
const pool = require('../db');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    const adminId = req.session.admin.id;
    const role = req.session.admin.role;
    
    try {
        let query;
        let params;
        
        if (role === 'admin') {
            query = `
                SELECT r.*, a.username as manager_name, s.status_color
                FROM requests r
                LEFT JOIN admins a ON r.assigned_to = a.id
                LEFT JOIN request_statuses s ON r.status = s.status_name
                ORDER BY 
                    CASE WHEN r.status = 'Новая' THEN 1 ELSE 2 END,
                    r.created_at DESC
            `;
            params = [];
        } else {
            query = `
                SELECT r.*, a.username as manager_name, s.status_color
                FROM requests r
                LEFT JOIN admins a ON r.assigned_to = a.id
                LEFT JOIN request_statuses s ON r.status = s.status_name
                WHERE r.assigned_to = $1 OR r.assigned_to IS NULL
                ORDER BY 
                    CASE WHEN r.status = 'Новая' THEN 1 ELSE 2 END,
                    r.created_at DESC
            `;
            params = [adminId];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/statuses', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM request_statuses ORDER BY sort_order');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/status', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.session.admin.id;
    const role = req.session.admin.role;
    
    try {
        if (role !== 'admin') {
            const check = await pool.query('SELECT assigned_to FROM requests WHERE id = $1', [id]);
            if (check.rows.length > 0 && check.rows[0].assigned_to !== adminId) {
                return res.status(403).json({ error: 'Нет доступа' });
            }
        }
        
        await pool.query(`UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [status, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/comment', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const adminName = req.session.admin.username;
    
    try {
        await pool.query(`
            UPDATE requests 
            SET client_message = CASE 
                WHEN client_message IS NULL OR client_message = '' THEN $1
                ELSE client_message || '\n\n---\n[' || $2 || '] ' || $1
            END,
            updated_at = CURRENT_TIMESTAMP 
            WHERE id = $3
        `, [comment, adminName, id]);
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/assign', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { manager_id } = req.body;
    const role = req.session.admin.role;
    
    if (role !== 'admin') {
        return res.status(403).json({ error: 'Только администратор может назначать' });
    }
    
    try {
        await pool.query(`UPDATE requests SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [manager_id, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;