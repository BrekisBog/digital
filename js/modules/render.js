function renderServices() {
    const container = document.getElementById('services-grid');
    if (container) {
        container.innerHTML = servicesData.map(s => `
            <div class="service-card anim-item">
                <div class="service-icon"><i class="fas fa-${s.icon}"></i></div>
                <h3 class="service-title">${s.title}</h3>
                <p class="service-description-text">${s.description}</p>
            </div>
        `).join('');
    }
}

function renderProcess() {
    const container = document.getElementById('process-grid');
    if (container) {
        container.innerHTML = stepsData.map(s => `
            <div class="process-step anim-item">
                <div class="process-number">${s.number}</div>
                <h3 class="process-step-title">${s.title}</h3>
                <p class="process-step-description">${s.description}</p>
            </div>
        `).join('');
    }
}

function renderPricing() {
    const trackDev = document.getElementById('carousel-track-dev');
    const trackMarketing = document.getElementById('carousel-track-marketing');
    
    if (trackDev) {
        trackDev.innerHTML = devPlansData.map(p => `
            <div class="pricing-card anim-item">
                <h3 class="pricing-name">${p.name}</h3>
                <div class="pricing-price">${p.price}</div>
                <div class="pricing-period">Срок: ${p.period}</div>
                <div class="pricing-features">${p.features.map(f => `<div class="pricing-feature"><i class="fas fa-check-circle"></i><span>${f}</span></div>`).join('')}</div>
                <a href="#contact" class="pricing-button">Обсудить проект</a>
            </div>
        `).join('');
    }
    
    if (trackMarketing) {
        trackMarketing.innerHTML = marketingPlansData.map(p => `
            <div class="pricing-card anim-item">
                <h3 class="pricing-name">${p.name}</h3>
                <div class="pricing-price">${p.price}</div>
                <div class="pricing-period">Срок: ${p.period}</div>
                <div class="pricing-features">${p.features.map(f => `<div class="pricing-feature"><i class="fas fa-check-circle"></i><span>${f}</span></div>`).join('')}</div>
                <a href="#contact" class="pricing-button">Обсудить проект</a>
            </div>
        `).join('');
    }
}

function renderAdvantages() {
    const container = document.getElementById('advantages-grid');
    if (container) {
        container.innerHTML = advantagesData.map(a => `
            <div class="advantage-card anim-item">
                <div class="advantage-icon"><i class="fas fa-${a.icon}"></i></div>
                <h3 class="advantage-card-title">${a.title}</h3>
                <p class="advantage-card-text">${a.text}</p>
            </div>
        `).join('');
    }
}

function renderContactInfo() {
    const container = document.getElementById('contact-info');
    if (container) {
        container.innerHTML = contactInfoData.map(ci => `
            <div class="contact-info-item">
                <div class="contact-info-icon"><i class="fas fa-${ci.icon}"></i></div>
                <div>
                    <div class="contact-info-label">${ci.label}</div>
                    ${ci.href ? `<a href="${ci.href}" class="contact-info-value">${ci.value}</a>` : `<span class="contact-info-value">${ci.value}</span>`}
                </div>
            </div>
        `).join('') + `
            <div class="contact-social-label">Мы в соцсетях:</div>
            <div class="contact-social-links">
                <a href="#" class="contact-social-link"><i class="fab fa-telegram-plane"></i></a>
                <a href="#" class="contact-social-link"><i class="fab fa-whatsapp"></i></a>
                <a href="#" class="contact-social-link"><i class="fab fa-vk"></i></a>
            </div>
        `;
    }
}

// ========== НОВАЯ ФУНКЦИЯ ДЛЯ ПОРТФОЛИО ==========
function renderPortfolio() {
    const container = document.getElementById('portfolio-grid');
    if (container && typeof projectsForMain !== 'undefined' && projectsForMain.length > 0) {
        container.innerHTML = projectsForMain.map((project, index) => `
            <div class="portfolio-item anim-item" data-project-id="${project.id}">
                <div class="portfolio-image-wrapper">
                    <img src="${project.image}" alt="${project.title}" class="portfolio-image" loading="lazy">
                    <div class="portfolio-overlay"></div>
                </div>
                <div class="portfolio-number">${String(index + 1).padStart(2, '0')}</div>
                <div class="portfolio-info">
                    <div>
                        <div class="portfolio-category">${project.category}</div>
                        <div class="portfolio-title">${project.title}</div>
                    </div>
                    <div class="portfolio-info-arrow"><i class="fas fa-arrow-right"></i></div>
                </div>
            </div>
        `).join('');
    } else if (container) {
        container.innerHTML = '<div class="empty-state" style="text-align:center; padding:40px;">Портфолио загружается...</div>';
    }
}
// ==============================================

// 🔥 Инициализация карусели цен (мобильно-устойчивая)
function initCarousel(type, totalSlides) {
    const track = document.getElementById(`carousel-track-${type}`);
    const dotsContainer = document.getElementById(`carousel-dots-${type}`);
    const wrapper = document.querySelector(`#carousel-${type} .carousel-wrapper`);
    let prevBtn = document.querySelector(`.carousel-prev[data-carousel="${type}"]`);
    let nextBtn = document.querySelector(`.carousel-next[data-carousel="${type}"]`);
    
    if (!track || !dotsContainer || !wrapper) return;
    
    let currentIndex = 0;
    let maxIndex = 0;
    let observer = null;
    let resizeTimer = null;

    function getSlidesPerView() {
        const w = window.innerWidth;
        return w <= 768 ? 1 : w <= 1024 ? 2 : 3;
    }

    function updateCarousel() {
        const cards = track.querySelectorAll('.pricing-card');
        if (!cards.length) return;
        
        const gap = parseFloat(getComputedStyle(track).gap) || (window.innerWidth <= 768 ? 12 : 24);
        const cardWidth = cards[0].getBoundingClientRect().width;
        const offset = currentIndex * (cardWidth + gap);
        
        track.style.transform = `translateX(-${offset}px)`;
        
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        
        if (prevBtn) { prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1'; prevBtn.disabled = currentIndex === 0; }
        if (nextBtn) { nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1'; nextBtn.disabled = currentIndex >= maxIndex; }
    }

    function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        updateCarousel();
    }

    function createDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', (e) => { e.stopPropagation(); goToSlide(i); });
            dotsContainer.appendChild(dot);
        }
    }

    function handleResize() {
        const newSpv = getSlidesPerView();
        maxIndex = Math.max(0, totalSlides - newSpv);
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        createDots();
        updateCarousel();
    }

    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        prevBtn = newPrev;
        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); if (currentIndex > 0) goToSlide(currentIndex - 1); });
    }
    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        nextBtn = newNext;
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); if (currentIndex < maxIndex) goToSlide(currentIndex + 1); });
    }

    if (observer) observer.disconnect();
    observer = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => requestAnimationFrame(handleResize), 60);
    });
    observer.observe(wrapper);

    createDots();
    updateCarousel();
}

// Переключение вкладок цен
function initPricingTabs() {
    const tabs = document.querySelectorAll('.pricing-tab');
    const containers = document.querySelectorAll('.pricing-carousel-container');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            const tabId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            containers.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const activeContainer = document.getElementById(`carousel-${tabId}`);
            if (activeContainer) {
                activeContainer.classList.add('active');
                requestAnimationFrame(() => {
                    if (tabId === 'dev') initCarousel('dev', devPlansData.length);
                    else initCarousel('marketing', marketingPlansData.length);
                });
            }
        });
    });
    
    const activeTab = document.querySelector('.pricing-tab.active');
    if (activeTab) {
        const tabId = activeTab.dataset.tab;
        requestAnimationFrame(() => {
            if (tabId === 'dev') initCarousel('dev', devPlansData.length);
            else initCarousel('marketing', marketingPlansData.length);
        });
    }
}