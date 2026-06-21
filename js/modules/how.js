// ===== ЛОГИКА ЭТАПОВ РАБОТЫ =====
function initProcessStages() {
    const stagesData = {
        1: {
            title: "Аналитика и исследования",
            description: "На первом этапе проводится всесторонний анализ цифрового присутствия компании. Оцениваются ключевые метрики: трафик, конверсия, поведенческие факторы, позиции в поисковой выдаче. Используются инструменты веб-аналитики, такие как Google Analytics, Яндекс.Метрика, Ahrefs и SEMrush."
        },
        2: {
            title: "Разработка стратегии",
            description: "На основе полученных данных разрабатывается маркетинговая стратегия, адаптированная под специфику бизнеса клиента и особенности регионального рынка. Учитываются сезонность спроса, поведенческие паттерны аудитории и конкурентные преимущества компании."
        },
        3: {
            title: "Реализация и интеграция",
            description: "Этап реализации включает координацию работы специалистов различных направлений: SEO-экспертов, таргетологов, контент-маркетологов и аналитиков. Важнейшим аспектом является синхронная работа всех инструментов для достижения синергетического эффекта."
        },
        4: {
            title: "Мониторинг и оптимизация",
            description: "Постоянный мониторинг эффективности кампаний позволяет оперативно реагировать на изменения в поведении аудитории и корректировать стратегию. Используются инструменты сквозной аналитики, которые отслеживают ключевые показатели."
        }
    };

    const buttons = document.querySelectorAll('.stage-btn');
    const contentTitle = document.getElementById('contentTitle');
    const contentDescription = document.getElementById('contentDescription');

    if (!buttons.length || !contentTitle || !contentDescription) return;

    function updateStage(stageId) {
        const data = stagesData[stageId];
        if (!data) return;
        contentTitle.textContent = data.title;
        contentDescription.textContent = data.description;
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const stageId = button.getAttribute('data-stage');
            updateStage(stageId);
        });
    });
}

// Запускаем после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProcessStages);
} else {
    initProcessStages();
}