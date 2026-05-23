// Чат-виджет с подключением к серверу (Node.js + PostgreSQL)

(function() {
    // Получаем или создаём ID сессии
    let sessionId = localStorage.getItem('chat_session_id');
    if (!sessionId) {
        sessionId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('chat_session_id', sessionId);
    }
    
    // Адрес вашего сервера (ЗАМЕНИТЕ НА СВОЙ!)
    const API_URL = 'http://localhost:3000/api/client';
    
    // DOM элементы
    const widgetBtn = document.getElementById('chatWidgetBtn');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('chatCloseBtn');
    const messagesContainer = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    
    let isWindowOpen = false;
    let lastMessageId = 0;
    let pollInterval = null;
    
    // Экранирование HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    // Отображение одного сообщения
    function renderMessage(msg) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender === 'client' ? 'user' : 'admin'}`;
        const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
        msgDiv.innerHTML = `
            <div class="message-bubble">${escapeHtml(msg.message)}</div>
            <div class="message-time">${timeStr}</div>
        `;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Обновляем lastMessageId
        if (msg.id > lastMessageId) lastMessageId = msg.id;
    }
    
    // Очистка контейнера сообщений
    function clearMessages() {
        messagesContainer.innerHTML = '';
    }
    
    // Загрузка всех сообщений с сервера
    async function loadAllMessages() {
        try {
            const response = await fetch(`${API_URL}/messages/${sessionId}`);
            const messages = await response.json();
            
            clearMessages();
            
            if (messages.length === 0) {
                // Показываем приветственное сообщение
                const welcomeDiv = document.createElement('div');
                welcomeDiv.className = 'message admin';
                welcomeDiv.innerHTML = `
                    <div class="message-bubble">👋 Здравствуйте! Напишите ваш вопрос, я помогу подобрать решение.</div>
                    <div class="message-time">только что</div>
                `;
                messagesContainer.appendChild(welcomeDiv);
            } else {
                messages.forEach(msg => {
                    renderMessage(msg);
                });
            }
            
            // Обновляем lastMessageId
            if (messages.length > 0) {
                lastMessageId = messages[messages.length - 1].id;
            }
            
            // Проверяем непрочитанные сообщения от админа
            await checkUnread();
        } catch(e) {
            console.error('Ошибка загрузки сообщений:', e);
            // Если сервер недоступен, показываем офлайн-сообщение
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message admin';
            errorDiv.innerHTML = `
                <div class="message-bubble">⚠️ Сервер временно недоступен. Попробуйте позже.</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            `;
            messagesContainer.appendChild(errorDiv);
        }
    }
    
    // Загрузка новых сообщений (проверка обновлений)
    async function loadNewMessages() {
        try {
            const response = await fetch(`${API_URL}/messages/${sessionId}?last_id=${lastMessageId}`);
            const messages = await response.json();
            
            messages.forEach(msg => {
                renderMessage(msg);
            });
            
            if (messages.length > 0) {
                await checkUnread();
            }
        } catch(e) {
            console.error('Ошибка проверки новых сообщений:', e);
        }
    }
    
    // Проверка непрочитанных сообщений
    async function checkUnread() {
        try {
            const response = await fetch(`${API_URL}/unread/${sessionId}`);
            const data = await response.json();
            
            if (data.unread > 0 && !isWindowOpen) {
                widgetBtn.classList.add('has-unread');
            } else if (isWindowOpen) {
                widgetBtn.classList.remove('has-unread');
            }
        } catch(e) {
            console.error('Ошибка проверки непрочитанных:', e);
        }
    }
    
    // Отправка сообщения
    async function sendUserMessage(text) {
        if (!text.trim()) return;
        
        // Добавляем сообщение пользователя сразу в интерфейс (optimistic update)
        const tempId = Date.now();
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'message user';
        userMsgDiv.id = `temp_msg_${tempId}`;
        userMsgDiv.innerHTML = `
            <div class="message-bubble">${escapeHtml(text.trim())}</div>
            <div class="message-time">Отправка...</div>
        `;
        messagesContainer.appendChild(userMsgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        chatInput.value = '';
        
        try {
            const response = await fetch(`${API_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    session_id: sessionId, 
                    message: text.trim() 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Удаляем временное сообщение
                document.getElementById(`temp_msg_${tempId}`)?.remove();
                // Загружаем реальные сообщения
                await loadAllMessages();
            } else {
                // Ошибка отправки
                userMsgDiv.querySelector('.message-time').textContent = 'Ошибка отправки';
                userMsgDiv.querySelector('.message-bubble').style.background = '#fee2e2';
                userMsgDiv.querySelector('.message-bubble').style.color = '#dc2626';
            }
        } catch(e) {
            console.error('Ошибка отправки:', e);
            userMsgDiv.querySelector('.message-time').textContent = 'Ошибка соединения';
            userMsgDiv.querySelector('.message-bubble').style.background = '#fee2e2';
            userMsgDiv.querySelector('.message-bubble').style.color = '#dc2626';
        }
    }
    
    // Открыть чат
    function openChat() {
        chatWindow.classList.add('open');
        isWindowOpen = true;
        widgetBtn.classList.remove('has-unread');
        loadAllMessages();
        setTimeout(() => { chatInput.focus(); }, 100);
    }
    
    // Закрыть чат
    function closeChat() {
        chatWindow.classList.remove('open');
        isWindowOpen = false;
    }
    
    // Запуск polling для новых сообщений
    function startPolling() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => {
            if (isWindowOpen) {
                loadNewMessages();
            } else {
                checkUnread();
            }
        }, 3000); // Проверяем каждые 3 секунды
    }
    
    // Обработчики событий
    widgetBtn.addEventListener('click', () => {
        if (chatWindow.classList.contains('open')) {
            closeChat();
        } else {
            openChat();
        }
    });
    
    closeBtn.addEventListener('click', closeChat);
    
    sendBtn.addEventListener('click', () => {
        sendUserMessage(chatInput.value);
    });
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendUserMessage(chatInput.value);
        }
    });
    
    // Закрытие при клике вне окна
    document.addEventListener('click', (e) => {
        if (isWindowOpen && !chatWindow.contains(e.target) && !widgetBtn.contains(e.target)) {
            closeChat();
        }
    });
    
    // Инициализация
    startPolling();
    loadAllMessages();
})();