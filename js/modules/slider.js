function initReviewsSlider() {
    const track = document.getElementById('sliderTrack');
    const container = document.querySelector('.slider-container');
    const dotsContainer = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!track || !container || typeof reviewsData === 'undefined' || reviewsData.length === 0) return;

    let currentIndex = reviewsData.length;
    const slides = [...reviewsData, ...reviewsData, ...reviewsData];
    let isAnimating = false;
    let slideWidth = 0, gap = 24;
    let touchStartX = 0, touchEndX = 0;
    let slidesPerView = 1;

    function getSlidesPerView() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    function render() {
        slidesPerView = getSlidesPerView();
        track.innerHTML = '';
        
        slides.forEach((r, i) => {
            const card = document.createElement('div');
            card.className = 'slider-card' + (i === currentIndex ? ' center' : '');
            
            // Устанавливаем ширину через CSS классы, а не инлайн
            if (slidesPerView === 1) {
                card.style.flex = '0 0 100%';
                card.style.minWidth = '100%';
            } else if (slidesPerView === 2) {
                card.style.flex = '0 0 calc(50% - 8px)';
                card.style.minWidth = 'calc(50% - 8px)';
            } else {
                card.style.flex = '0 0 calc(33.333% - 16px)';
                card.style.minWidth = 'calc(33.333% - 16px)';
            }
            
            card.innerHTML = `
                <div class="review-card">
                    <div class="review-stars">${'<i class="fas fa-star"></i>'.repeat(r.rating)}</div>
                    <p class="review-text">${r.text}</p>
                    <div class="review-author">
                        <div class="review-avatar">${r.avatar}</div>
                        <div><div class="review-name">${r.name}</div><div class="review-position">${r.position}</div></div>
                    </div>
                </div>`;
            track.appendChild(card);
        });
    }

    function measure() {
        const card = track.querySelector('.slider-card');
        if (!card) return;
        slideWidth = card.offsetWidth;
        gap = parseFloat(getComputedStyle(track).gap) || (slidesPerView === 1 ? 0 : 24);
    }

    function updatePosition(animate = true) {
        track.style.transition = animate ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
        
        const totalWidth = slideWidth + gap;
        // Простой сдвиг - без дополнительного центрирования
        let offset = currentIndex * totalWidth;
        
        // Корректируем offset, чтобы показывать нужное количество карточек
        if (slidesPerView === 2) {
            offset = offset - (slideWidth + gap) / 2;
        } else if (slidesPerView === 3) {
            offset = offset - (slideWidth + gap);
        }
        
        track.style.transform = `translateX(-${offset}px)`;
    }

    function updateCenterClass() {
        const cards = track.querySelectorAll('.slider-card');
        cards.forEach((c, i) => {
            c.classList.toggle('center', i === currentIndex);
            if (window.innerWidth <= 768) {
                if (i === currentIndex) {
                    c.style.opacity = '1';
                    c.style.visibility = 'visible';
                } else {
                    c.style.opacity = '0';
                    c.style.visibility = 'hidden';
                }
            } else {
                c.style.opacity = i === currentIndex ? '1' : '0.5';
                c.style.visibility = 'visible';
            }
        });
    }

    function updateDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        const realIndex = currentIndex % reviewsData.length;
        reviewsData.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'slider-dot' + (i === realIndex ? ' active' : '');
            dot.onclick = (e) => { e.stopPropagation(); goToSlide(i + reviewsData.length); };
            dotsContainer.appendChild(dot);
        });
    }

    function goToSlide(index) {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex = index;
        updateCenterClass(); 
        updateDots(); 
        updatePosition(true);
        
        setTimeout(() => {
            // Бесконечная прокрутка
            if (currentIndex < reviewsData.length) {
                currentIndex += reviewsData.length;
                updatePosition(false);
            } else if (currentIndex >= 2 * reviewsData.length) {
                currentIndex -= reviewsData.length;
                updatePosition(false);
            }
            updateCenterClass();
            isAnimating = false;
        }, 400);
    }

    // Touch Swipe для мобильных
    track.addEventListener('touchstart', e => { 
        touchStartX = e.changedTouches[0].screenX; 
    }, { passive: true });
    
    track.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToSlide(currentIndex + 1);
            } else {
                goToSlide(currentIndex - 1);
            }
        }
    }, { passive: true });

    function rebuild() {
        slidesPerView = getSlidesPerView();
        render();
        requestAnimationFrame(() => { 
            measure(); 
            updatePosition(false); 
            updateCenterClass(); 
            updateDots(); 
        });
    }

    render();
    requestAnimationFrame(() => { 
        measure(); 
        updatePosition(false); 
        updateCenterClass(); 
        updateDots(); 
    });

    prevBtn?.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn?.addEventListener('click', () => goToSlide(currentIndex + 1));

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            rebuild();
        }, 150);
    });
}