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

// Система опыта (НОВЫЕ УВЕЛИЧЕННЫЕ ЗНАЧЕНИЯ)
function calculateQuestXP(level, progress = 100) {
    const baseXP = {
        'E': 25,    // Простые задачи, 1-2 дня
        'D': 75,    // Небольшие проекты, неделя  
        'C': 200,   // Средние цели, месяц
        'B': 500,   // Важные миссии, 2-3 месяца
        'A': 1000,  // Системные изменения, полгода
        'S': 2500   // Легендарные достижения, год+
    };
    
    return Math.round((baseXP[level] || 75) * (progress / 100));
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
        
        // Проверяем награды
        checkLevelRewards(newMainLevel);
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

// Обновление здоровья (С XP ЗА ГАЛОЧКИ!)
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
    const oldHealth = { ...gameData.health };
    
    gameData.health.food = document.getElementById('food-check').checked;
    gameData.health.healthyFood = document.getElementById('healthy-food-check').checked;
    gameData.health.pleasureFood = document.getElementById('pleasure-food-check').checked;
    gameData.health.exercise = document.getElementById('exercise-check').checked;
    gameData.health.sleep = document.getElementById('sleep-check').checked;
    
    // XP за новые галочки здоровья
    const healthTasks = ['food', 'healthyFood', 'pleasureFood', 'exercise', 'sleep'];
    const healthNames = {
        food: '🍽️ Еда',
        healthyFood: '🥗 Здоровое питание', 
        pleasureFood: '🍰 Питание в удовольствие',
        exercise: '🏃‍♀️ Физическая активность',
        sleep: '😴 Достаточный сон'
    };
    
    healthTasks.forEach(task => {
        if (!oldHealth[task] && gameData.health[task]) {
            addExperience('self', 1);
            showMiniNotification(`+1 XP за "${healthNames[task]}"`);
        }
    });
    
    updateStats();
    updateMultiplier();
    saveGameData();
}

// Обновление рутины (С XP ЗА ЗАДАЧИ!)
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
    const oldRoutine = {};
    Object.keys(gameData.routine).forEach(key => {
        oldRoutine[key] = gameData.routine[key].done;
    });
    
    Object.keys(gameData.routine).forEach(key => {
        const checkbox = document.getElementById(`${key}-check`);
        if (checkbox) {
            const wasCompleted = oldRoutine[key];
            const isCompleted = checkbox.checked;
            
            // XP за новые задачи рутины
            if (!wasCompleted && isCompleted) {
                giveRoutineXP(key);
            }
            
            gameData.routine[key].done = isCompleted;
        }
    });
    
    updateMultiplier();
    saveGameData();
}

// XP за рутину
function giveRoutineXP(taskKey) {
    let baseXP = 2;
    let category = 'self';
    
    if (taskKey.includes('nesuda')) {
        category = 'management';
        baseXP = 3;
    } else if (taskKey === 'family') {
        category = 'family';
    }
    
    let healthMultiplier = 1.0;
    if (gameData.stats.energy >= 80) healthMultiplier += 0.5;
    else if (gameData.stats.energy >= 60) healthMultiplier += 0.3;
    
    const finalXP = Math.round(baseXP * healthMultiplier);
    addExperience(category, finalXP);
    showMiniNotification(`+${finalXP} XP за "${gameData.routine[taskKey].text}"`);
}

// Мини-уведомления
function showMiniNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: rgba(212, 175, 55, 0.9); color: #1a0f0a;
        padding: 10px 15px; border-radius: 8px;
        font-size: 0.9em; font-weight: bold; z-index: 1500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2000);
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

// Вычисление множителя (НОВАЯ УЛУЧШЕННАЯ СИСТЕМА)
function updateMultiplier() {
    const health = gameData.health;
    let baseStats = 20; // Базовые 20%
    
    // Каждый элемент здоровья дает +12%
    if (health.food) baseStats += 12;
    if (health.healthyFood) baseStats += 12;
    if (health.pleasureFood) baseStats += 12;
    if (health.exercise) baseStats += 12;
    if (health.sleep) baseStats += 12;
    if (health.water >= 1500) baseStats += 12;
    
    // Обновляем характеристики
    gameData.stats.health = Math.min(100, baseStats);
    gameData.stats.energy = Math.min(100, baseStats - 5);
    gameData.stats.focus = Math.min(100, baseStats - 10);
    
    // Множители XP
    let healthMultiplier = 1.0;
    let routineMultiplier = 1.0;
    
    // Множитель от характеристик
    if (gameData.stats.energy >= 80) healthMultiplier += 0.5;
    else if (gameData.stats.energy >= 60) healthMultiplier += 0.3;
    else if (gameData.stats.energy >= 40) healthMultiplier += 0.1;
    
    if (gameData.stats.focus >= 70) healthMultiplier += 0.3;
    else if (gameData.stats.focus >= 50) healthMultiplier += 0.2;
    
    if (gameData.stats.health >= 90) healthMultiplier += 0.2;
    else if (gameData.stats.health >= 70) healthMultiplier += 0.1;
    
    // Множитель от рутины
    const routineCompletion = calculateRoutineCompletion();
    if (routineCompletion >= 80) routineMultiplier = 1.3;
    else if (routineCompletion >= 60) routineMultiplier = 1.2;
    else if (routineCompletion >= 40) routineMultiplier = 1.1;
    else if (routineCompletion >= 20) routineMultiplier = 1.05;
    
    const totalMultiplier = healthMultiplier * routineMultiplier;
    
    document.getElementById('multiplier-display').innerHTML = `
        <div>Множитель опыта: ×${totalMultiplier.toFixed(1)}</div>
        <div style="font-size: 0.8em; margin-top: 5px;">
            💪 Здоровье: ×${healthMultiplier.toFixed(1)} | 📋 Рутина: ×${routineMultiplier.toFixed(1)}
        </div>
    `;
    
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

// Показать/скрыть опции прогресса
function toggleProgressOptions() {
    const progressType = document.getElementById('progress-type').value;
    const stepsOptions = document.getElementById('steps-options');
    const stagesOptions = document.getElementById('stages-options');
    
    stepsOptions.style.display = 'none';
    stagesOptions.style.display = 'none';
    
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
/ Работа с квестами
function renderQuests() {
    const grid = document.getElementById('quest-grid');
    grid.innerHTML = '';
    
    gameData.quests.forEach(quest => {
        const card = createQuestCard(quest);
        grid.appendChild(card);
    });
    
    if (gameData.quests.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #cdaa3d; grid-column: 1/-1;">Пока нет активных квестов. Создайте первый!</p>';
    }
}

function createQuestCard(quest) {
    const card = document.createElement('div');
    card.className = 'quest-card';
    card.dataset.category = quest.category;
    
    const progressPercent = Math.round(quest.progress);
    const categoryName = categories[quest.category] || quest.category;
    
    let deadlineHtml = '';
    if (quest.deadline) {
        const deadlineText = formatDate(quest.deadline);
        const overdue = isOverdue(quest.deadline);
        deadlineHtml = `<div class="quest-deadline ${overdue ? 'overdue' : ''}">${deadlineText}</div>`;
    }
    
    let progressHtml = `
        <div class="quest-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                <div class="progress-text">${progressPercent}%</div>
            </div>
        </div>
    `;
    
    let controlsHtml = `
        <div class="quest-controls">
            <button class="btn btn-small" onclick="updateQuestProgress(${quest.id}, 10)">+10%</button>
            <button class="btn btn-small" onclick="updateQuestProgress(${quest.id}, 25)">+25%</button>
            <button class="btn btn-small" onclick="completeQuest(${quest.id})">✅</button>
            <button class="btn btn-small" onclick="deleteQuest(${quest.id})" style="background: #c44;">🗑️</button>
        </div>
    `;
    
    card.innerHTML = `
        <div class="quest-level level-${quest.level}">${quest.level}</div>
        <div class="quest-title">${quest.title}</div>
        <div class="quest-category">${categoryName}</div>
        ${deadlineHtml}
        ${quest.description ? `<p style="color: #cdaa3d; font-size: 0.9em; margin-bottom: 15px;">${quest.description}</p>` : ''}
        ${progressHtml}
        ${controlsHtml}
    `;
    
    return card;
}

function updateQuestProgress(questId, increment) {
    const quest = gameData.quests.find(q => q.id === questId);
    if (quest) {
        const routineCompletion = calculateRoutineCompletion();
        let actualIncrement = increment;
        
        if (routineCompletion >= 50) {
            actualIncrement *= 1.3;
        }
        
        quest.progress = Math.min(100, quest.progress + actualIncrement);
        
        if (quest.progress >= 100) {
            completeQuest(questId);
        } else {
            renderQuests();
            saveGameData();
        }
    }
}

function completeQuest(questId) {
    const questIndex = gameData.quests.findIndex(q => q.id === questId);
    if (questIndex !== -1) {
        const quest = gameData.quests[questIndex];
        
        let baseXP = calculateQuestXP(quest.level, 100);
        const routineCompletion = calculateRoutineCompletion();
        
        if (routineCompletion >= 50) {
            baseXP = Math.round(baseXP * 1.3);
        }
        
        if (quest.deadline && isOverdue(quest.deadline)) {
            baseXP = Math.round(baseXP * 0.8);
        }
        
        addExperience(quest.category, baseXP);
        
        const penalty = quest.deadline && isOverdue(quest.deadline) ? ' (-20% за просрочку)' : '';
        alert(`🎉 Квест "${quest.title}" завершен!\n+${baseXP} XP в категории "${categories[quest.category]}"${penalty}`);
        
        gameData.quests.splice(questIndex, 1);
        renderQuests();
        saveGameData();
    }
}

function deleteQuest(questId) {
    if (confirm('❌ Удалить этот квест?\n\nВы потеряете весь прогресс!')) {
        const questIndex = gameData.quests.findIndex(q => q.id === questId);
        if (questIndex !== -1) {
            gameData.quests.splice(questIndex, 1);
            renderQuests();
            saveGameData();
        }
    }
}

function filterQuests(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.quest-card').forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function showAddQuestModal() {
    document.getElementById('addQuestModal').style.display = 'block';
}

function closeAddQuestModal() {
    document.getElementById('addQuestModal').style.display = 'none';
    document.getElementById('quest-title').value = '';
    document.getElementById('quest-description').value = '';
    document.getElementById('progress-type').value = 'simple';
    document.getElementById('quest-deadline').value = '';
    document.getElementById('initial-progress').value = '0';
    
    document.getElementById('steps-options').style.display = 'none';
    document.getElementById('stages-options').style.display = 'none';
}

function addQuest() {
    const title = document.getElementById('quest-title').value.trim();
    const category = document.getElementById('quest-category').value;
    const level = document.getElementById('quest-level').value;
    const description = document.getElementById('quest-description').value.trim();
    const deadline = document.getElementById('quest-deadline').value;
    const initialProgress = parseInt(document.getElementById('initial-progress').value) || 0;
    
    if (!title) {
        alert('Введите название квеста!');
        return;
    }
    
    const newQuest = {
        id: gameData.questIdCounter++,
        title: title,
        category: category,
        level: level,
        description: description,
        progress: initialProgress,
        deadline: deadline || null,
        createdAt: new Date().toISOString()
    };
    
    gameData.quests.push(newQuest);
    renderQuests();
    saveGameData();
    closeAddQuestModal();
}

function generateQuest() {
    const situation = document.getElementById('situation-input').value.trim();
    
    if (!situation) {
        alert('Опишите ситуацию для создания квеста!');
        return;
    }
    
    let questData = analyzeситuation(situation);
    
    document.getElementById('quest-title').value = questData.title;
    document.getElementById('quest-category').value = questData.category;
    document.getElementById('quest-level').value = questData.level;
    document.getElementById('quest-description').value = questData.description;
    
    showAddQuestModal();
    document.getElementById('situation-input').value = '';
}

function analyzeситuation(text) {
    text = text.toLowerCase();
    
    let category = 'self';
    let level = 'C';
    let title = 'Новое задание';
    let description = 'Автоматически созданный квест';
    
    if (text.includes('дцп') || text.includes('эрготерапи') || text.includes('пациент') || text.includes('медиц')) {
        category = 'medical';
    } else if (text.includes('исследован') || text.includes('пыльц') || text.includes('ловушк') || text.includes('наук')) {
        category = 'science';
    } else if (text.includes('испанск') || text.includes('английск') || text.includes('язык') || text.includes('ielts')) {
        category = 'languages';
    } else if (text.includes('клиник') || text.includes('управлен') || text.includes('команд')) {
        category = 'management';
    } else if (text.includes('семь') || text.includes('дом') || text.includes('ребен')) {
        category = 'family';
    }
    
    if (text.includes('начал') || text.includes('попробова') || text.includes('изуча')) {
        level = 'D';
    } else if (text.includes('провест') || text.includes('сделат')) {
        level = 'C';
    } else if (text.includes('внедрит') || text.includes('системно')) {
        level = 'B';
    }
    
    if (title === 'Новое задание') {
        const words = text.split(' ').slice(0, 4).join(' ');
        title = words.charAt(0).toUpperCase() + words.slice(1);
        description = `Квест создан на основе: "${text.slice(0, 100)}..."`;
    }
    
    return { title, category, level, description };
}

window.onclick = function(event) {
    const modal = document.getElementById('addQuestModal');
    if (event.target === modal) {
        closeAddQuestModal();
    }
}

// Система наград
function checkLevelRewards(level) {
    const rewards = {
        2: { type: 'title', name: 'Ученик Целителя', description: 'Первые шаги к мастерству' },
        3: { type: 'equipment', name: 'Мантия Мудрости', description: '+10% XP ко всем действиям' },
        5: { type: 'title', name: 'Хранитель Знаний', description: 'Накопитель мудрости веков' },
        10: { type: 'title', name: 'Мастер Баланса', description: 'Гармония тела и разума' }
    };
    
    const reward = rewards[level];
    if (reward) {
        setTimeout(() => {
            const icons = { title: '👑', equipment: '⚔️', ability: '✨' };
            const message = `${icons[reward.type]} Получена награда!\n\n"${reward.name}"\n${reward.description}`;
            alert(message);
        }, 1000);
    }
}

// Добавляем стартовые квесты
if (gameData.quests.length === 0) {
    gameData.quests = [
        {
            id: 1,
            title: 'Изучение испанского языка',
            category: 'languages',
            level: 'C',
            description: 'Достичь уровня B1 в испанском языке',
            progress: 30,
            deadline: '2026-06-01',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Создание пыльцевой ловушки',
            category: 'science',
            level: 'B',
            description: 'Разработать прототип для сбора данных о пыльце',
            progress: 15,
            deadline: '2025-09-01',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Освоение эрготерапии',
            category: 'medical',
            level: 'C',
            description: 'Изучить методики работы с детьми с ДЦП',
            progress: 0,
            createdAt: new Date().toISOString()
        }
    ];
    gameData.questIdCounter = 4;
}
