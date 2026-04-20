function initPrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    
    document.getElementById('open-privacy')?.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    document.getElementById('close-privacy')?.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}