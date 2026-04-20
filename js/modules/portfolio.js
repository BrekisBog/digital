let currentProjectId = null;

function openProjectDetail(projectId) {
    const project = projectsFullData[projectId];
    if (!project) return;
    currentProjectId = projectId;
    
    document.getElementById('header').classList.add('project-mode');
    
    document.getElementById('case-hero-img').src = project.image;
    document.getElementById('case-category').textContent = project.category;
    document.getElementById('case-title').textContent = project.title;
    document.getElementById('case-year').textContent = project.year;
    document.getElementById('case-duration').textContent = project.duration;
    document.getElementById('case-description').textContent = project.description;
    
    document.getElementById('case-cards').innerHTML = `
        <div class="case-info-card"><div class="case-info-icon"><i class="fas fa-bullseye" style="color:#0ea5e9;"></i></div><div><div class="case-info-title">Задача</div><div class="case-info-text">${project.challenge}</div></div></div>
        <div class="case-info-card"><div class="case-info-icon"><i class="fas fa-lightbulb" style="color:#16a34a;"></i></div><div><div class="case-info-title">Решение</div><div class="case-info-text">${project.solution}</div></div></div>
        <div class="case-info-card"><div class="case-info-icon"><i class="fas fa-chart-line" style="color:#0ea5e9;"></i></div><div><div class="case-info-title">Результат</div><div class="case-info-text">${project.result}</div></div></div>
    `;
    
    document.getElementById('case-tags').innerHTML = project.tags.map(tag => `<span class="case-tag">${tag}</span>`).join('');
    
    const sc = document.getElementById('case-screenshots');
    if (project.screenshots && project.screenshots.length >= 3) {
        sc.innerHTML = `
            <div class="case-screenshot-item full-width" data-index="0"><img class="case-screenshot-img" src="${project.screenshots[0]}" alt="Скриншот 1" loading="lazy"></div>
            <div class="case-screenshot-item" data-index="1"><img class="case-screenshot-img" src="${project.screenshots[1]}" alt="Скриншот 2" loading="lazy"></div>
            <div class="case-screenshot-item" data-index="2"><img class="case-screenshot-img" src="${project.screenshots[2]}" alt="Скриншот 3" loading="lazy"></div>
        `;
    } else if (project.screenshots && project.screenshots.length === 2) {
        sc.innerHTML = `
            <div class="case-screenshot-item full-width" data-index="0"><img class="case-screenshot-img" src="${project.screenshots[0]}" alt="Скриншот 1" loading="lazy"></div>
            <div class="case-screenshot-item" data-index="1"><img class="case-screenshot-img" src="${project.screenshots[1]}" alt="Скриншот 2" loading="lazy"></div>
        `;
    } else if (project.screenshots && project.screenshots.length === 1) {
        sc.innerHTML = `<div class="case-screenshot-item full-width" data-index="0"><img class="case-screenshot-img" src="${project.screenshots[0]}" alt="Скриншот" loading="lazy"></div>`;
    } else {
        sc.innerHTML = `<div class="case-screenshot-item full-width" style="background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:white;font-size:1rem;font-weight:600;padding:2rem;text-align:center">Скриншоты проекта скоро будут добавлены</div>`;
    }
    
    sc.querySelectorAll('.case-screenshot-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            openLightbox(project.screenshots, index);
        });
    });
    
    const projectIds = Object.keys(projectsFullData);
    const currentIndex = projectIds.indexOf(projectId);
    const prevId = currentIndex > 0 ? projectIds[currentIndex - 1] : null;
    const nextId = currentIndex < projectIds.length - 1 ? projectIds[currentIndex + 1] : null;
    
    let navHtml = '';
    if (prevId) {
        const prevProject = projectsFullData[prevId];
        navHtml += `<a href="#" class="case-nav-link case-nav-prev" data-project-id="${prevId}"><div class="case-nav-arrow"><i class="fas fa-arrow-left"></i></div><div class="case-nav-text"><div class="case-nav-label">Предыдущий</div><div class="case-nav-title">${prevProject.title}</div></div></a>`;
    }
    if (nextId) {
        const nextProject = projectsFullData[nextId];
        navHtml += `<a href="#" class="case-nav-link case-nav-next" data-project-id="${nextId}"><div class="case-nav-text"><div class="case-nav-label">Следующий</div><div class="case-nav-title">${nextProject.title}</div></div><div class="case-nav-arrow"><i class="fas fa-arrow-right"></i></div></a>`;
    }
    document.getElementById('case-navigation').innerHTML = navHtml;
    
    document.querySelectorAll('.case-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openProjectDetail(link.getAttribute('data-project-id'));
        });
    });
    
    document.getElementById('main-content').classList.add('hide');
    document.getElementById('case-study').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeProjectDetail() {
    document.getElementById('header').classList.remove('project-mode');
    document.getElementById('main-content').classList.remove('hide');
    document.getElementById('case-study').classList.remove('active');
    currentProjectId = null;
}

function initPortfolio() {
    const container = document.getElementById('portfolio-grid');
    if (container) {
        container.innerHTML = projectsForMain.map((project, i) => `
            <div class="portfolio-item anim-item" data-project-id="${project.id}">
                <div class="portfolio-image-wrapper"><img src="${project.image}" alt="${project.title}" class="portfolio-image" loading="lazy"><div class="portfolio-overlay"></div></div>
                <div class="portfolio-number">${String(i + 1).padStart(2, '0')}</div>
                <div class="portfolio-info">
                    <div><div class="portfolio-category">${project.category}</div><div class="portfolio-title">${project.title}</div></div>
                    <div class="portfolio-info-arrow"><i class="fas fa-arrow-right"></i></div>
                </div>
            </div>
        `).join('');
    }
    
    document.querySelectorAll('.portfolio-item').forEach(item => {
        item.addEventListener('click', () => openProjectDetail(item.getAttribute('data-project-id')));
    });
    
    document.getElementById('back-to-portfolio')?.addEventListener('click', closeProjectDetail);
    
    document.getElementById('case-cta-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeProjectDetail();
        setTimeout(() => {
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });
}