const express = require('express');
const router = express.Router();
const pool = require('../db');

async function assignManagerToSession(sessionId) {
    const freeManager = await pool.query(`
        SELECT id, username, current_chats 
        FROM admins 
        WHERE role = 'manager' 
        AND is_online = true
        ORDER BY current_chats ASC 
        LIMIT 1
    `);
    
    if (freeManager.rows.length === 0) {
        await pool.query(`
            UPDATE sessions 
            SET status = 'waiting', assigned_to = NULL 
            WHERE session_id = $1
        `, [sessionId]);
        return null;
    }
    
    const manager = freeManager.rows[0];
    
    await pool.query(`
        UPDATE sessions 
        SET assigned_to = $1, status = 'active' 
        WHERE session_id = $2
    `, [manager.id, sessionId]);
    
    await pool.query(`
        UPDATE admins 
        SET current_chats = current_chats + 1 
        WHERE id = $1
    `, [manager.id]);
    
    console.log(`Чат ${sessionId} назначен менеджеру ${manager.username}`);
    return manager;
}

router.post('/send', async (req, res) => {
    const { session_id, message } = req.body;
    
    if (!session_id || !message || message.trim() === '') {
        return res.status(400).json({ error: 'Неверные данные' });
    }
    
    try {
        let session = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [session_id]);
        
        if (session.rows.length === 0) {
            await pool.query(`
                INSERT INTO sessions (session_id, status, last_activity, created_at) 
                VALUES ($1, 'new', NOW(), NOW())
            `, [session_id]);
            
            await assignManagerToSession(session_id);
            
        } else if (session.rows[0].assigned_to === null) {
            await assignManagerToSession(session_id);
        }
        
        await pool.query(`
            INSERT INTO messages (session_id, sender, message, is_read) 
            VALUES ($1, 'client', $2, false)
        `, [session_id, message.trim()]);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== НОВЫЙ МАРШРУТ ДЛЯ ЗАЯВОК ==========
router.post('/request', async (req, res) => {
    const { name, contact, message } = req.body;
    
    console.log('📋 Получена заявка:', { name, contact, message });
    
    if (!name || !contact) {
        return res.status(400).json({ error: 'Заполните имя и контакт' });
    }
    
    try {
        const freeManager = await pool.query(`
            SELECT id FROM admins 
            WHERE role = 'manager' AND is_online = true
            ORDER BY current_chats ASC 
            LIMIT 1
        `);
        
        const assignedTo = freeManager.rows[0]?.id || null;
        
        await pool.query(`
            INSERT INTO requests (client_name, client_contact, client_message, status, assigned_to) 
            VALUES ($1, $2, $3, 'Новая', $4)
        `, [name, contact, message || '', assignedTo]);
        
        console.log('✅ Заявка сохранена');
        res.json({ success: true, message: 'Заявка отправлена' });
        
    } catch (err) {
        console.error('❌ Ошибка сохранения заявки:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// =============================================

router.get('/messages/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const lastId = parseInt(req.query.last_id) || 0;
    
    try {
        const result = await pool.query(`
            SELECT * FROM messages 
            WHERE session_id = $1 AND id > $2 
            ORDER BY created_at ASC
        `, [sessionId, lastId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/unread/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT COUNT(*) as count 
            FROM messages 
            WHERE session_id = $1 AND sender = 'admin' AND is_read = false
        `, [sessionId]);
        
        res.json({ unread: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;