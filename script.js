// Данные приложения
let gameData = {
    stats: {
        energy: 70,
        focus: 65,
        health: 80
    },
    experience: {
        totalXP: 0,
        level: 1,
        currentLevelXP: 0,
        nextLevelXP: 100,
        categories: {
            medical: { xp: 0, level: 1 },
            science: { xp: 0, level: 1 },
            languages: { xp: 0, level: 1 },
            management: { xp: 0, level: 1 },
            family: { xp: 0, level: 1 },
            self: { xp: 0, level: 1 }
        }
    },
    health: {
        food: false,
        healthyFood: false,
        pleasureFood: false,
        exercise: false,
        sleep: false,
        water: 0
    },
    routine: {
        nesuda1: { text: 'Написать смены спецов', done: false },
        nesuda2: { text: 'Проверить отчеты', done: false },
        nesuda3: { text: 'Планирование недели', done: false },
        home: { text: 'Разобрать почту', done: false },
        family: { text: 'Позвонить родителям', done: false }
    },
    quests: [],
    questIdCounter: 1,
    lastResetDate: new Date().toDateString()
};

// Категории квестов
const categories = {
    medical: '🩺 Медицинские знания',
    science: '🔬 Наука',
    languages: '🌍 Языки',
    management: '🏛️ Менеджмент',
    family: '👨‍👩‍👧 Семья',
    self: '✨ Я сама'
};

// Загрузка данных при запуске
window.addEventListener('load', function() {
    loadGameData();
    checkDailyReset();
    updateUI();
    renderQuests();
    
    // Обработчики здоровья
    document.querySelectorAll('#food-check, #healthy-food-check, #pleasure-food-check, #exercise-check, #sleep-check').forEach(checkbox => {
        checkbox.addEventListener('change', updateHealthFromUI);
    });
    
    // Обработчики рутины
    document.querySelectorAll('#nesuda1-check, #nesuda2-check, #nesuda3-check, #home-check, #family-check').forEach(checkbox => {
        checkbox.addEventListener('change', updateRoutineFromUI);
    });
    
    document.getElementById('water-slider').addEventListener('input', function() {
        gameData.health.water = parseInt(this.value);
        document.getElementById('water-display').textContent = this.value;
        updateMultiplier();
        saveGameData();
    });
});

// Проверка смены дня
function checkDailyReset() {
    const today = new Date().toDateString();
    if (gameData.lastResetDate !== today) {
        // Сброс здоровья и рутины
        gameData.health = {
            food: false,
            healthyFood: false,
            pleasureFood: false,
            exercise: false,
            sleep: false,
            water: 0
        };
        
        Object.keys(gameData.routine).forEach(key => {
            gameData.routine[key].done = false;
        });
        
        gameData.lastResetDate = today;
        saveGameData();
    }
}

// Сохранение/загрузка данных
function saveGameData() {
    try {
        localStorage.setItem('rpgQuestData', JSON.stringify(gameData));
    } catch (e) {
        console.log('Сохранение недоступно');
    }
}

function loadGameData() {
    try {
        const saved = localStorage.getItem('rpgQuestData');
        if (saved) {
            gameData = { ...gameData, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.log('Загрузка недоступна');
    }
}

// Система опыта
function calculateQuestXP(level, progress = 100) {
    const baseXP = {
        'E': 10,
        'D': 25,
        'C': 50,
        'B': 100,
        'A': 200,
        'S': 500
    };
    
    return Math.round((baseXP[level] || 25) * (progress / 100));
}

function addExperience(category, xp) {
    // Добавляем опыт в категорию
    gameData.experience.categories[category].xp += xp;
    gameData.experience.totalXP += xp;
    
    // Проверяем повышение уровня категории
    const categoryData = gameData.experience.categories[category];
    const newCategoryLevel = Math.floor(categoryData.xp / 50) + 1; // Каждые 50 XP = +1 уровень
    if (newCategoryLevel > categoryData.level) {
        categoryData.level = newCategoryLevel;
        showLevelUpNotification(`${categories[category]} достиг ${newCategoryLevel} уровня!`);
    }
    
    // Проверяем общий уровень
    const newMainLevel = Math.floor(gameData.experience.totalXP / 100) + 1; // Каждые 100 XP = +1 общий уровень
    if (newMainLevel > gameData.experience.level) {
        gameData.experience.level = newMainLevel;
        showLevelUpNotification(`🎉 Поздравляем! Вы достигли ${newMainLevel} уровня!`);
    }
    
    // Обновляем прогресс до следующего уровня
    gameData.experience.currentLevelXP = gameData.experience.totalXP % 100;
    gameData.experience.nextLevelXP = 100;
    
    updateExperienceDisplay();
    saveGameData();
}

function showLevelUpNotification(message) {
    // Создаем красивое уведомление о повышении уровня
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #d4af37, #ffd700);
        color: #1a0f0a;
        padding: 20px 30px;
        border-radius: 15px;
        font-family: 'Cinzel', serif;
        font-weight: bold;
        font-size: 1.2em;
        z-index: 2000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        border: 2px solid #b8941f;
        animation: levelUp 3s ease-in-out forwards;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Добавляем анимацию
    const style = document.createElement('style');
    style.textContent = `
        @keyframes levelUp {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
    }, 3000);
}

function updateExperienceDisplay() {
    document.getElementById('main-level').textContent = gameData.experience.level;
    document.getElementById('total-xp').textContent = `${gameData.experience.totalXP} XP`;
    
    const progressPercent = (gameData.experience.currentLevelXP / gameData.experience.nextLevelXP) * 100;
    document.getElementById('xp-bar-fill').style.width = progressPercent + '%';
    document.getElementById('xp-bar-text').textContent = 
        `${gameData.experience.currentLevelXP} / ${gameData.experience.nextLevelXP} XP`;
    
    // Обновляем уровни категорий
    Object.keys(gameData.experience.categories).forEach(category => {
        const level = gameData.experience.categories[category].level;
        document.getElementById(`${category}-level`).textContent = level;
    });
}

function updateUI() {
    updateStats();
    updateHealth();
    updateRoutine();
    updateMultiplier();
    updateExperienceDisplay();
}

// Обновление статистик
function updateStats() {
    document.getElementById('energy-fill').style.width = gameData.stats.energy + '%';
    document.getElementById('energy-value').textContent = gameData.stats.energy;
    document.getElementById('focus-fill').style.width = gameData.stats.focus + '%';
    document.getElementById('focus-value').textContent = gameData.stats.focus;
    document.getElementById('health-fill').style.width = gameData.stats.health + '%';
    document.getElementById('health-value').textContent = gameData.stats.health;
}

// Обновление здоровья
function updateHealth() {
    document.getElementById('food-check').checked = gameData.health.food;
    document.getElementById('healthy-food-check').checked = gameData.health.healthyFood;
    document.getElementById('pleasure-food-check').checked = gameData.health.pleasureFood;
    document.getElementById('exercise-check').checked = gameData.health.exercise;
    document.getElementById('sleep-check').checked = gameData.health.sleep;
    document.getElementById('water-slider').value = gameData.health.water;
    document.getElementById('water-display').textContent = gameData.health.water;
}

function updateHealthFromUI() {
    gameData.health.food = document.getElementById('food-check').checked;
    gameData.health.healthyFood = document.getElementById('healthy-food-check').checked;
    gameData.health.pleasureFood = document.getElementById('pleasure-food-check').checked;
    gameData.health.exercise = document.getElementById('exercise-check').checked;
    gameData.health.sleep = document.getElementById('sleep-check').checked;
    
    updateStats();
    updateMultiplier();
    saveGameData();
}

// Обновление рутины
function updateRoutine() {
    Object.keys(gameData.routine).forEach(key => {
        const checkbox = document.getElementById(`${key}-check`);
        const text = document.getElementById(`${key}-text`);
        if (checkbox && text) {
            checkbox.checked = gameData.routine[key].done;
            text.textContent = gameData.routine[key].text;
        }
    });
}

function updateRoutineFromUI() {
    Object.keys(gameData.routine).forEach(key => {
        const checkbox = document.getElementById(`${key}-check`);
        if (checkbox) {
            gameData.routine[key].done = checkbox.checked;
        }
    });
    
    updateMultiplier();
    saveGameData();
}

function editRoutineTask(taskKey) {
    const currentText = gameData.routine[taskKey].text;
    const newText = prompt('Измените задачу:', currentText);
    
    if (newText && newText.trim() !== '') {
        gameData.routine[taskKey].text = newText.trim();
        updateRoutine();
        saveGameData();
    }
}

// Вычисление множителя
function updateMultiplier() {
    const health = gameData.health;
    let baseStats = 20; // Базовые 20%
    
    // Каждый элемент здоровья дает +10%
    if (health.food) baseStats += 10;
    if (health.healthyFood) baseStats += 10;
    if (health.pleasureFood) baseStats += 10;
    if (health.exercise) baseStats += 10;
    if (health.sleep) baseStats += 10;
    if (health.water >= 1500) baseStats += 10; // Достаточно воды
    
    // Обновляем характеристики
    gameData.stats.health = Math.min(100, baseStats);
    gameData.stats.energy = Math.min(100, baseStats - 5);
    gameData.stats.focus = Math.min(100, baseStats - 10);
    
    // Вычисляем множитель опыта на основе рутины
    const routineCompletion = calculateRoutineCompletion();
    let multiplier = 1.0;
    
    if (routineCompletion >= 50) {
        multiplier = 1.3; // +30% опыта за выполнение рутины
    }
    
    document.getElementById('multiplier-display').textContent = `Множитель опыта: ×${multiplier.toFixed(1)}`;
    updateStats();
}

function calculateRoutineCompletion() {
    const routine = gameData.routine;
    let completed = 0;
    let total = Object.keys(routine).length;
    
    Object.values(routine).forEach(task => {
        if (task.done) completed++;
    });
    
    return (completed / total) * 100;
}

// НОВЫЕ ФУНКЦИИ ДЛЯ УЛУЧШЕННЫХ КВЕСТОВ

// Показать/скрыть опции прогресса
function toggleProgressOptions() {
    const progressType = document.getElementById('progress-type').value;
    const stepsOptions = document.getElementById('steps-options');
    const stagesOptions = document.getElementById('stages-options');
    
    // Скрываем все опции
    stepsOptions.style.display = 'none';
    stagesOptions.style.display = 'none';
    
    // Показываем нужные
    if (progressType === 'steps') {
        stepsOptions.style.display = 'block';
    } else if (progressType === 'stages') {
        stagesOptions.style.display = 'block';
    }
}

// Добавить этап
function addStage() {
    const stagesList = document.getElementById('stages-list');
    const newStage = document.createElement('div');
    newStage.className = 'stage-item';
    newStage.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
    
    newStage.innerHTML = `
        <input type="text" placeholder="Название этапа..." style="flex: 1; padding: 8px; border: 1px solid #d4af37; border-radius: 5px; background: rgba(0,0,0,0.3); color: #d4af37;">
        <input type="number" placeholder="%" min="1" max="100" style="width: 60px; padding: 8px; border: 1px solid #d4af37; border-radius: 5px; background: rgba(0,0,0,0.3); color: #d4af37;">
        <button type="button" onclick="removeStage(this)" style="background: #c44; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">×</button>
    `;
    
    stagesList.appendChild(newStage);
}

// Удалить этап
function removeStage(button) {
    button.parentElement.remove();
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `⚠️ Просрочено на ${Math.abs(diffDays)} дн.`;
    } else if (diffDays === 0) {
        return '🔥 Сегодня!';
    } else if (diffDays === 1) {
        return '⏰ Завтра';
    } else if (diffDays <= 7) {
        return `📅 Через ${diffDays} дн.`;
    } else {
        return `📅 ${date.toLocaleDateString('ru-RU')}`;
    }
}

// Проверка просрочки
function isOverdue(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getTime() < now.getTime();
}

// Добавим стартовые квесты при первом запуске
if (gameData.quests.length === 0) {
    gameData.quests = [
        {
            id: 1,
            title: 'Изучение испанского языка',
            category: 'languages',
            level: 'C',
            description: 'Достичь уровня B1 в испанском языке через Duolingo',
            progress: 30,
            progressType: 'steps',
            stepsFrom: 10,
            stepsTo: 60,
            stepsUnit: 'уровень',
            stepsCurrent: 25,
            deadline: '2026-06-01',
            stages: [],
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Создание пыльцевой ловушки',
            category: 'science',
            level: 'B',
            description: 'Разработать прототип для сбора данных о пыльце',
            progress: 15,
            progressType: 'stages',
            stages: [
                { name: 'Купить материалы', percent: 30, done: false },
                { name: 'Собрать ловушку', percent: 50, done: false },
                { name: 'Протестировать', percent: 20, done: false }
            ],
            deadline: '2025-09-01',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Подготовка к IELTS',
            category: 'languages',
            level: 'A',
            description: 'Поднять балл с 5.0 до 7.0 для смены жизни',
            progress: 0,
            progressType: 'steps',
            stepsFrom: 5.0,
            stepsTo: 7.0,
            stepsUnit: 'балл',
            stepsCurrent: 5.0,
            deadline: '2025-11-01',
            stages: [],
            createdAt: new Date().toISOString()
        }
    ];
    gameData.questIdCounter = 4;
}
