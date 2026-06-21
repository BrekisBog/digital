let currentProjectId = null;

function openProjectDetail(projectId) {
    window.location.href = `project-detail.html?id=${projectId}`;
}

function initPortfolio() {
    document.querySelectorAll('.portfolio-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const projectId = item.getAttribute('data-project-id');
            openProjectDetail(projectId);
        });
    });
}