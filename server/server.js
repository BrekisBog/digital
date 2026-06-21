const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const requestsRoutes = require('./routes/requests');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../style')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/requests', requestsRoutes);

app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Админ-панель: http://localhost:${PORT}/admin/login.html`);
    console.log(`Логин: ${process.env.ADMIN_USERNAME} | Пароль: ${process.env.ADMIN_PASSWORD}`);
});

module.exports = app;