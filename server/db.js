const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Создание таблиц
async function initDatabase() {
    const client = await pool.connect();
    try {
        // Таблица сообщений
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                sender VARCHAR(50) NOT NULL CHECK (sender IN ('client', 'admin')),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица сессий
        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(255) PRIMARY KEY,
                client_info TEXT,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица администраторов
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Проверяем, есть ли админ, если нет — создаём
        const bcrypt = require('bcryptjs');
        const result = await client.query('SELECT * FROM admins WHERE username = $1', [process.env.ADMIN_USERNAME]);
        if (result.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
            await client.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', [
                process.env.ADMIN_USERNAME,
                hash
            ]);
            console.log('✅ Администратор создан');
        }

        console.log('✅ База данных инициализирована');
    } catch (error) {
        console.error('Ошибка инициализации БД:', error);
    } finally {
        client.release();
    }
}

initDatabase();

module.exports = pool;