# Сайт-портфолио для digital-агентства ИП Петров

Современный адаптивный сайт-портфолио с админ-панелью, чат-виджетом и формой обратной связи.

---

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Backend | Node.js, Express |
| База данных | PostgreSQL |
| Инструменты | Git, GitHub |

---

## Структура проекта

```
final/
├── index.html
├── project-detail.html
├── style/
│   ├── style.css
│   ├── index.css
│   ├── login.css
│   ├── manager.css
│   ├── requests.css
│   └── project-detail.css
├── js/
│   ├── main.js
│   ├── data/
│   │   ├── services.js
│   │   ├── projects.js
│   │   ├── pricing.js
│   │   ├── reviews.js
│   │   ├── advantages.js
│   │   ├── process.js
│   │   └── contacts.js
│   ├── modules/
│   │   ├── render.js
│   │   ├── slider.js
│   │   ├── lightbox.js
│   │   ├── form.js
│   │   ├── chat.js
│   │   ├── navigation.js
│   │   ├── animations.js
│   │   ├── modal.js
│   │   ├── portfolio.js
│   │   └── how.js
│   └── utils/
│       └── helpers.js
├── photo/
│   ├── hero-banner.jpg
│   ├── electro.jpg
│   ├── krasota.jpg
│   ├── med.jpg
│   ├── postav.jpg
│   ├── pravo.jpg
│   ├── stroi.jpg
│   └── zaglushka.jpg
└── server/
    ├── server.js
    ├── db.js
    ├── .env
    ├── middleware/
    │   └── auth.js
    ├── routes/
    │   ├── auth.js
    │   ├── admin.js
    │   ├── client.js
    │   └── requests.js
    └── public/
        └── admin/
            ├── index.html
            ├── login.html
            ├── requests.html
            └── managers.html
```

---

## Установка и запуск

### Клонирование репозитория

```bash
git clone https://github.com/BrekisBog/digital.git
cd digital
```

### Установка зависимостей

```bash
cd server
npm install
```

### Настройка базы данных

Создайте файл .env в папке server:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ваш_пароль
DB_NAME=chat_db
SESSION_SECRET=ваш_секретный_ключ
ADMIN_USERNAME=admin
ADMIN_PASSWORD=123456
```

### Запуск сервера

```bash
node server.js
```

Сервер запустится на http://localhost:3000

---

## Доступ к сайту

| Страница | URL |
|----------|-----|
| Главная | http://localhost:3000/ |
| Админ-панель | http://localhost:3000/admin/login.html |
| Логин админа | admin / 123456 |
| Логин менеджера | manager1 / 123456 |

---

## Функционал

### Клиентская часть

- Адаптивная вёрстка
- Карусель цен
- Слайдер отзывов
- Детальные страницы кейсов
- Лайтбокс для изображений
- Чат-виджет
- Форма обратной связи
- Анимации при скролле

### Админ-панель

- Управление чатами
- Управление заявками
- Управление менеджерами
- Авторизация через сессии
- Хэширование паролей

---

## База данных

| Таблица | Описание |
|---------|----------|
| admins | Администраторы и менеджеры |
| sessions | Сессии чата |
| messages | Сообщения |
| requests | Заявки |
| request_statuses | Статусы заявок |

---

## Автор

Брекис Богадан Олегович

Студент специальности 09.02.07 «Информационные системы и программирование»
3 курс

