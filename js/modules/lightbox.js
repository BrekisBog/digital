let lightboxImages = [];
let currentLightboxIndex = 0;

function openLightbox(images, index = 0) {
    lightboxImages = images;
    currentLightboxIndex = index;
    showLightboxImage();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function showLightboxImage() {
    const img = document.getElementById('lightbox-img');
    const counter = document.getElementById('lightbox-counter');
    const caption = document.getElementById('lightbox-caption');
    
    img.src = lightboxImages[currentLightboxIndex];
    counter.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
    caption.textContent = `Скриншот ${currentLightboxIndex + 1}`;
    
    document.getElementById('lightbox-prev').style.display = currentLightboxIndex > 0 ? 'flex' : 'none';
    document.getElementById('lightbox-next').style.display = currentLightboxIndex < lightboxImages.length - 1 ? 'flex' : 'none';
}

function nextLightboxImage() {
    if (currentLightboxIndex < lightboxImages.length - 1) {
        currentLightboxIndex++;
        showLightboxImage();
    }
}

function prevLightboxImage() {
    if (currentLightboxIndex > 0) {
        currentLightboxIndex--;
        showLightboxImage();
    }
}

function initLightbox() {
    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev')?.addEventListener('click', prevLightboxImage);
    document.getElementById('lightbox-next')?.addEventListener('click', nextLightboxImage);
    
    document.getElementById('lightbox')?.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') closeLightbox();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('lightbox').classList.contains('active')) {
            closeLightbox();
        }
        if (document.getElementById('lightbox').classList.contains('active')) {
            if (e.key === 'ArrowLeft') prevLightboxImage();
            if (e.key === 'ArrowRight') nextLightboxImage();
        }
    });
}