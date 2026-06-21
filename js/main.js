document.addEventListener('DOMContentLoaded', () => {
    // 1. Рендерим данные в DOM
    renderServices();
    renderProcess();
    renderPricing();
    renderAdvantages();
    renderContactInfo();
    renderPortfolio();
    
    // 2. Принудительно закрываем детальный просмотр портфолио
    if (typeof closeProjectDetail === 'function') {
        closeProjectDetail();
    }
    
    // 3. Инициализируем интерактивные модули
    initPortfolio();
    initPricingTabs();
    initReviewsSlider();
    initContactForm();
    initNavigation();
    initLightbox();
    initPrivacyModal();
    initScrollAnimations();
});