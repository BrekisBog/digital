document.addEventListener('DOMContentLoaded', () => {
    // 1. Рендерим данные в DOM
    renderServices();
    renderProcess();
    renderPricing();
    renderAdvantages();
    renderContactInfo();
    
    // 2. Инициализируем интерактивные модули
    initPortfolio();
    initPricingTabs();      // Переключение вкладок + карусель цен
    initReviewsSlider();    // Слайдер отзывов
    initContactForm();      // Валидация и отправка формы
    initNavigation();       // Хедер, мобильное меню, якоря
    initLightbox();         // Увеличение скриншотов
    initPrivacyModal();     // Модальное окно политики
    initScrollAnimations(); // Появление элементов при скролле
});