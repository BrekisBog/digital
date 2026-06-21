const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { isAuthenticated } = require('../middleware/auth');

// ============================================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ — ОБНОВЛЕНИЕ ВСЕХ СЧЁТЧИКОВ
// ============================================================
async function updateAllChatCounts(client) {
    await client.query(`
        UPDATE admins 
        SET current_chats = (
            SELECT COUNT(*) FROM sessions WHERE assigned_to = admins.id
        )
        WHERE role = 'manager'
    `);
}

// ============================================================
// СУЩЕСТВУЮЩИЕ МАРШРУТЫ (ЧАТЫ)
// ============================================================

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

// ============================================================
// МАРШРУТЫ ДЛЯ УПРАВЛЕНИЯ МЕНЕДЖЕРАМИ
// ============================================================

// Получить список всех менеджеров (только для admin)
router.get('/managers', isAuthenticated, async (req, res) => {
    if (req.session.admin.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Только для администраторов.' });
    }
    
    try {
        const result = await pool.query(
            `SELECT 
                a.id, 
                a.username, 
                a.role, 
                a.current_chats,
                a.created_at,
                COALESCE(
                    (SELECT COUNT(*) FROM requests WHERE assigned_to = a.id), 
                    0
                ) as requests_count
             FROM admins a
             WHERE a.role = 'manager' 
             ORDER BY a.id ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Создать нового менеджера (только для admin)
router.post('/managers', isAuthenticated, async (req, res) => {
    if (req.session.admin.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Только для администраторов.' });
    }
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Заполните логин и пароль' });
    }
    
    if (username.length < 3) {
        return res.status(400).json({ error: 'Логин должен содержать минимум 3 символа' });
    }
    
    if (password.length < 4) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 4 символа' });
    }
    
    try {
        const existing = await pool.query(
            'SELECT id FROM admins WHERE username = $1',
            [username]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const result = await pool.query(
            `INSERT INTO admins (username, password_hash, role, is_online, current_chats, max_chats) 
             VALUES ($1, $2, 'manager', false, 0, 3) 
             RETURNING id, username, role, is_online, current_chats, created_at`,
            [username, passwordHash]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Менеджер создан',
            manager: result.rows[0]
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// УДАЛЕНИЕ МЕНЕДЖЕРА С ПЕРЕРАСПРЕДЕЛЕНИЕМ
// ============================================================
router.delete('/managers/:id', isAuthenticated, async (req, res) => {
    if (req.session.admin.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Только для администраторов.' });
    }
    
    const managerId = parseInt(req.params.id);
    
    if (managerId === req.session.admin.id) {
        return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const check = await client.query(
            'SELECT role FROM admins WHERE id = $1',
            [managerId]
        );
        
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        if (check.rows[0].role === 'admin') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Нельзя удалить администратора' });
        }
        
        // Находим активных менеджеров
        const activeManagers = await client.query(
            `SELECT id FROM admins 
             WHERE role = 'manager' 
             AND id != $1 
             AND is_online = true 
             ORDER BY current_chats ASC`,
            [managerId]
        );
        
        let assignedTo = null;
        let redistributionMessage = '';
        
        if (activeManagers.rows.length > 0) {
            assignedTo = activeManagers.rows[0].id;
            
            // Переназначаем чаты
            const sessionsResult = await client.query(
                `UPDATE sessions 
                 SET assigned_to = $1, status = 'active' 
                 WHERE assigned_to = $2 
                 RETURNING session_id`,
                [assignedTo, managerId]
            );
            const sessionsCount = sessionsResult.rowCount;
            
            // Переназначаем заявки
            const requestsResult = await client.query(
                `UPDATE requests 
                 SET assigned_to = $1, status = 'В работе', updated_at = CURRENT_TIMESTAMP 
                 WHERE assigned_to = $2 
                 RETURNING id`,
                [assignedTo, managerId]
            );
            const requestsCount = requestsResult.rowCount;
            
            const managerName = await client.query(
                'SELECT username FROM admins WHERE id = $1',
                [assignedTo]
            );
            
            redistributionMessage = `Чаты (${sessionsCount}) и заявки (${requestsCount}) переназначены менеджеру ${managerName.rows[0].username}`;
        } else {
            await client.query(
                `UPDATE sessions SET assigned_to = NULL, status = 'waiting' WHERE assigned_to = $1`,
                [managerId]
            );
            
            await client.query(
                `UPDATE requests SET assigned_to = NULL, status = 'Новая' WHERE assigned_to = $1`,
                [managerId]
            );
            
            redistributionMessage = 'Нет активных менеджеров. Чаты и заявки переведены в очередь ожидания.';
        }
        
        // Удаляем менеджера
        await client.query(
            'DELETE FROM admins WHERE id = $1 AND role = \'manager\'',
            [managerId]
        );
        
        // ============================================================
        // ОБНОВЛЯЕМ ВСЕ СЧЁТЧИКИ (автоматически!)
        // ============================================================
        await updateAllChatCounts(client);
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Менеджер удалён. ' + redistributionMessage,
            redistributed_to: assignedTo
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ============================================================
// ПЕРЕНАЗНАЧЕНИЕ ЧАТОВ И ЗАЯВОК (ВРУЧНУЮ)
// ============================================================

// Получить чаты менеджера
router.get('/managers/:id/sessions', isAuthenticated, async (req, res) => {
    if (req.session.admin.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    
    const managerId = parseInt(req.params.id);
    
    try {
        const result = await pool.query(
            `SELECT session_id, status, last_activity 
             FROM sessions 
             WHERE assigned_to = $1 
             ORDER BY last_activity DESC`,
            [managerId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Получить заявки менеджера
router.get('/managers/:id/requests', isAuthenticated, async (req, res) => {
    if (req.session.admin.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    
    const managerId = parseInt(req.params.id);
    
    try {
        const result = await pool.query(
            `SELECT id, client_name, client_contact, status, created_at 
             FROM requests 
             WHERE assigned_to = $1 
             ORDER BY created_at DESC`,
            [managerId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Переназначить чаты и заявки на другого менеджера
router.post('/managers/:id/reassign', isAuthenticated, async (req, res) => {
    if (req.session.admin.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Только для администраторов.' });
    }
    
    const fromManagerId = parseInt(req.params.id);
    const { targetManagerId, reassignSessions, reassignRequests } = req.body;
    
    if (!targetManagerId) {
        return res.status(400).json({ error: 'Укажите ID менеджера для переназначения' });
    }
    
    if (fromManagerId === targetManagerId) {
        return res.status(400).json({ error: 'Нельзя переназначить самому себе' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const targetCheck = await client.query(
            'SELECT id FROM admins WHERE id = $1 AND role = \'manager\'',
            [targetManagerId]
        );
        
        if (targetCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Целевой менеджер не найден' });
        }
        
        let sessionsCount = 0;
        let requestsCount = 0;
        let resultMessage = [];
        
        // Переназначаем чаты
        if (reassignSessions !== false) {
            const sessionsResult = await client.query(
                `UPDATE sessions 
                 SET assigned_to = $1, status = 'active' 
                 WHERE assigned_to = $2 
                 RETURNING session_id`,
                [targetManagerId, fromManagerId]
            );
            sessionsCount = sessionsResult.rowCount;
            resultMessage.push(`чатов: ${sessionsCount}`);
        }
        
        // Переназначаем заявки
        if (reassignRequests !== false) {
            const requestsResult = await client.query(
                `UPDATE requests 
                 SET assigned_to = $1, status = 'В работе', updated_at = CURRENT_TIMESTAMP 
                 WHERE assigned_to = $2 
                 RETURNING id`,
                [targetManagerId, fromManagerId]
            );
            requestsCount = requestsResult.rowCount;
            resultMessage.push(`заявок: ${requestsCount}`);
        }
        
        // ============================================================
        // ОБНОВЛЯЕМ ВСЕ СЧЁТЧИКИ (автоматически!)
        // ============================================================
        await updateAllChatCounts(client);
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: `Переназначено: ${resultMessage.join(', ')}`,
            sessions: sessionsCount,
            requests: requestsCount
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ============================================================
// ВЫБОРОЧНОЕ ПЕРЕНАЗНАЧЕНИЕ (конкретные чаты и заявки)
// ============================================================
router.post('/managers/:id/reassign-selected', isAuthenticated, async (req, res) => {
    if (req.session.admin.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Только для администраторов.' });
    }
    
    const fromManagerId = parseInt(req.params.id);
    const { targetManagerId, sessionIds, requestIds } = req.body;
    
    if (!targetManagerId) {
        return res.status(400).json({ error: 'Укажите ID менеджера для переназначения' });
    }
    
    if (fromManagerId === targetManagerId) {
        return res.status(400).json({ error: 'Нельзя переназначить самому себе' });
    }
    
    if ((!sessionIds || sessionIds.length === 0) && (!requestIds || requestIds.length === 0)) {
        return res.status(400).json({ error: 'Выберите хотя бы один чат или заявку' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Проверяем, что целевой менеджер существует
        const targetCheck = await client.query(
            'SELECT id FROM admins WHERE id = $1 AND role = \'manager\'',
            [targetManagerId]
        );
        
        if (targetCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Целевой менеджер не найден' });
        }
        
        let sessionsCount = 0;
        let requestsCount = 0;
        let resultMessage = [];
        
        // Переназначаем выбранные чаты
        if (sessionIds && sessionIds.length > 0) {
            const placeholders = sessionIds.map((_, i) => `$${i + 3}`).join(',');
            const sessionsResult = await client.query(
                `UPDATE sessions 
                 SET assigned_to = $1, status = 'active' 
                 WHERE assigned_to = $2 AND session_id IN (${placeholders})
                 RETURNING session_id`,
                [targetManagerId, fromManagerId, ...sessionIds]
            );
            sessionsCount = sessionsResult.rowCount;
            resultMessage.push(`чатов: ${sessionsCount}`);
        }
        
        // Переназначаем выбранные заявки
        if (requestIds && requestIds.length > 0) {
            const placeholders = requestIds.map((_, i) => `$${i + 3}`).join(',');
            const requestsResult = await client.query(
                `UPDATE requests 
                 SET assigned_to = $1, status = 'В работе', updated_at = CURRENT_TIMESTAMP 
                 WHERE assigned_to = $2 AND id IN (${placeholders})
                 RETURNING id`,
                [targetManagerId, fromManagerId, ...requestIds]
            );
            requestsCount = requestsResult.rowCount;
            resultMessage.push(`заявок: ${requestsCount}`);
        }
        
        // Обновляем все счётчики
        await updateAllChatCounts(client);
        
        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: `Переназначено: ${resultMessage.join(', ')}`,
            sessions: sessionsCount,
            requests: requestsCount
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;