function clearFormErrors(form) {
    form.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'));
    form.querySelectorAll('.error-slot').forEach(el => {
        el.textContent = '';
        el.classList.remove('active');
    });
}

function showError(input, message) {
    input.classList.add('form-input-error');
    const errSlot = input.nextElementSibling;
    if (errSlot && errSlot.classList.contains('error-slot')) {
        errSlot.textContent = message;
        errSlot.classList.add('active');
    }
}

function validateContactForm(form) {
    let isValid = true;
    const name = form.querySelector('[name="name"]');
    const contact = form.querySelector('[name="contact"]');
    const message = form.querySelector('[name="message"]');

    const nameVal = name.value.trim();
    if (!nameVal) {
        showError(name, 'Пожалуйста, введите ваше имя');
        isValid = false;
    } else if (nameVal.length < 2) {
        showError(name, 'Имя должно содержать минимум 2 символа');
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(nameVal)) {
        showError(name, 'Допустимы только буквы, пробелы и дефис');
        isValid = false;
    }

    const contactVal = contact.value.trim();
    if (!contactVal) {
        showError(contact, 'Укажите телефон или email');
        isValid = false;
    } else {
        const digits = contactVal.replace(/\D/g, '');
        const isPhone = digits.length >= 10 && digits.length <= 12 && (digits.startsWith('7') || digits.startsWith('8'));
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactVal);
        
        if (!isPhone && !isEmail) {
            showError(contact, 'Введите корректный email или российский телефон');
            isValid = false;
        }
    }

    const msgVal = message.value.trim();
    if (msgVal.length > 1000) {
        showError(message, 'Максимальная длина сообщения — 1000 символов');
        isValid = false;
    }

    return isValid;
}

function initContactForm() {
    const container = document.getElementById('contact-form-container');
    if (!container) return;
    
    container.innerHTML = `
        <form id="contactForm" class="contact-form" novalidate>
            <div>
                <label class="contact-form-label">Ваше имя *</label>
                <input type="text" name="name" class="contact-form-input" placeholder="Иван Петров" autocomplete="name">
                <div class="error-slot"></div>
            </div>
            <div>
                <label class="contact-form-label">Телефон или Email *</label>
                <input type="text" name="contact" class="contact-form-input" placeholder="+7 (900) 000-00-00 или email@example.com" autocomplete="email tel">
                <div class="error-slot"></div>
            </div>
            <div>
                <label class="contact-form-label">Сообщение</label>
                <textarea name="message" rows="4" class="contact-form-input" placeholder="Расскажите о вашем проекте..."></textarea>
                <div class="error-slot"></div>
            </div>
            <button type="submit" class="contact-form-submit">Отправить заявку</button>
        </form>`;
    
    const form = document.getElementById('contactForm');
    
    form.querySelectorAll('.contact-form-input').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('form-input-error');
            const err = input.nextElementSibling;
            if (err && err.classList.contains('error-slot')) {
                err.textContent = '';
                err.classList.remove('active');
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors(form);
        
        if (!validateContactForm(form)) return;

        const btn = form.querySelector('.contact-form-submit');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Отправка...';
        btn.classList.add('loading');

        const name = form.querySelector('[name="name"]').value;
        const contact = form.querySelector('[name="contact"]').value;
        const message = form.querySelector('[name="message"]').value;

        try {
            const response = await fetch('http://localhost:3000/api/client/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    contact: contact.trim(),
                    message: message.trim() || ''
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                container.innerHTML = `
                    <div style="text-align:center; padding:2.5rem 1rem; color:white; animation: fadeIn 0.5s ease;">
                        <i class="fas fa-check-circle" style="font-size:2.5rem; color:#0ea5e9; margin-bottom:1rem; display:block;"></i>
                        <h3 style="margin-bottom:0.5rem; font-size:1.25rem;">Заявка успешно отправлена!</h3>
                        <p style="color: var(--color-gray-400); line-height: 1.5;">Мы свяжемся с вами в ближайшее время.</p>
                    </div>`;
            } else {
                throw new Error(data.error || 'Ошибка отправки');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            btn.disabled = false;
            btn.textContent = originalText;
            btn.classList.remove('loading');
            
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'text-align:center; padding:1rem; color:#ef4444; margin-top:1rem; background: rgba(239,68,68,0.1); border-radius:12px;';
            errorDiv.textContent = 'Ошибка отправки. Попробуйте позже или позвоните нам.';
            form.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    });
}