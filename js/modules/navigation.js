function initNavigation() {
    const header = document.getElementById('header');

    window.addEventListener('scroll', () => {
        header?.classList.toggle('header-scrolled', window.scrollY > 20);
    });

    document.querySelectorAll('[data-nav]').forEach(link => {
        link.addEventListener('click', () => {
            const target = document.getElementById(link.getAttribute('data-nav'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.remove('open');
        });
    });

    const menuBtn = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });
    }
  
    document.getElementById('logo-home')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('contact-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('current-year').innerText = new Date().getFullYear();
}