const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', username);
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Введите логин и пароль' });
    }
    
    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        
        const admin = result.rows[0];
        
        req.session.admin = {
            id: admin.id,
            username: admin.username,
            role: admin.role
        };
        
        console.log('Login successful for:', username, 'Role:', admin.role);
        res.json({ success: true, message: 'Вход выполнен' });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/check', (req, res) => {
    if (req.session && req.session.admin) {
        res.json({ 
            authenticated: true, 
            admin: {
                id: req.session.admin.id,
                username: req.session.admin.username,
                role: req.session.admin.role
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

module.exports = router;