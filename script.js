// Данные приложения
let gameData = {
    stats: {
        energy: 50,
        focus: 50,
        health: 50
    },
    experience: {
        totalXP: 0,
        level: 1,
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
    lastResetDate: new Date().toDateString(),
    equipment: [],
    titles: []
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

// Система уровней (экспоненциальная)
function getXPForLevel(level) {
    if (level <= 1) return 0;
    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
        totalXP += 50 * i; // 100, 150, 200, 250...
    }
    return totalXP;
}

function getLevelFromXP(xp) {
    let level = 1;
    let requiredXP = 0;
    while (requiredXP <= xp) {
        level++;
        requiredXP = getXPForLevel(level);
    }
    return level - 1;
}
// Расчет XP за квесты
function calculateQuestXP(level, progress = 100) {
    const baseXP = {
        'E': 20,   // Простые задачи
        'D': 80,   // Небольшие проекты
        'C': 200,  // Средние цели
        'B': 400,  // Важные миссии
        'A': 1000, // Системные изменения
        'S': 5000  // Легендарные достижения
    };
    return Math.round((baseXP[level] || 80) * (progress / 100));
}

// Добавление опыта
function addExperience(category, xp) {
    // Применяем бонусы от здоровья
    const healthBonus = calculateHealthBonus();
    const routineBonus = calculateRoutineBonus();
    const finalXP = Math.round(xp * healthBonus * routineBonus);
    
    // Добавляем опыт в категорию
    gameData.experience.categories[category].xp += finalXP;
    gameData.experience.totalXP += finalXP;
    
    // Проверяем повышение уровня категории
    const categoryData = gameData.experience.categories[category];
    const newCategoryLevel = getLevelFromXP(categoryData.xp);
    
    if (newCategoryLevel > categoryData.level) {
        categoryData.level = newCategoryLevel;
        showLevelUpNotification(`${categories[category]} достиг ${newCategoryLevel} уровня!`);
    }
    
    // Проверяем общий уровень
    const newMainLevel = getLevelFromXP(gameData.experience.totalXP);
    
    if (newMainLevel > gameData.experience.level) {
        gameData.experience.level = newMainLevel;
        showLevelUpNotification(`🎉 Поздравляем! Вы достигли ${newMainLevel} уровня!`);
        giveReward(newMainLevel);
    }
    
    updateExperienceDisplay();
    saveGameData();
    
    // Показываем уведомление о получении XP
    showMiniNotification(`+${finalXP} XP в "${categories[category]}"`);
}

// Расчет бонусов от здоровья
function calculateHealthBonus() {
    let bonus = 1.0;
    
    if (gameData.stats.energy >= 80) bonus += 0.3;
    else if (gameData.stats.energy >= 60) bonus += 0.2;
    else if (gameData.stats.energy >= 40) bonus += 0.1;
    
    if (gameData.stats.focus >= 80) bonus += 0.2;
    else if (gameData.stats.focus >= 60) bonus += 0.1;
    
    if (gameData.stats.health >= 80) bonus += 0.2;
    else if (gameData.stats.health >= 60) bonus += 0.1;
    
    return bonus;
}

// Расчет бонусов от рутины
function calculateRoutineBonus() {
    const routineCompletion = calculateRoutineCompletion();
    
    if (routineCompletion >= 80) return 1.5;      // +50%
    else if (routineCompletion >= 60) return 1.3; // +30%
    else if (routineCompletion >= 40) return 1.2; // +20%
    else if (routineCompletion >= 20) return 1.1; // +10%
    
    return 1.0;
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
// Обновление характеристик на основе здоровья
function updateStatsFromHealth() {
    const health = gameData.health;
    let baseEnergy = 30;
    let baseFocus = 30;
    let baseHealth = 30;
    
    // Каждый элемент здоровья дает +10-15 к характеристикам
    if (health.food) {
        baseEnergy += 10;
        baseFocus += 5;
        baseHealth += 10;
    }
    
    if (health.healthyFood) {
        baseEnergy += 15;
        baseFocus += 10;
        baseHealth += 15;
    }
    
    if (health.pleasureFood) {
        baseEnergy += 5;
        baseFocus += 5;
        baseHealth += 5;
    }
    
    if (health.exercise) {
        baseEnergy += 20;
        baseFocus += 15;
        baseHealth += 15;
    }
    
    if (health.sleep) {
        baseEnergy += 25;
        baseFocus += 20;
        baseHealth += 10;
    }
    
    // Вода дает бонус в зависимости от количества
    if (health.water >= 2000) {
        baseEnergy += 15;
        baseFocus += 15;
        baseHealth += 10;
    } else if (health.water >= 1500) {
        baseEnergy += 10;
        baseFocus += 10;
        baseHealth += 5;
    } else if (health.water >= 1000) {
        baseEnergy += 5;
        baseFocus += 5;
    }
    
    // Ограничиваем максимум в 100
    gameData.stats.energy = Math.min(100, baseEnergy);
    gameData.stats.focus = Math.min(100, baseFocus);
    gameData.stats.health = Math.min(100, baseHealth);
    
    updateStatsDisplay();
}

// Обработка изменений здоровья
function updateHealthFromUI() {
    const oldHealth = { ...gameData.health };
    
    // Считываем состояние чекбоксов
    gameData.health.food = document.getElementById('food-check').checked;
    gameData.health.healthyFood = document.getElementById('healthy-food-check').checked;
    gameData.health.pleasureFood = document.getElementById('pleasure-food-check').checked;
    gameData.health.exercise = document.getElementById('exercise-check').checked;
    gameData.health.sleep = document.getElementById('sleep-check').checked;
    
    // Проверяем, что было отмечено впервые сегодня
    const healthTasks = ['food', 'healthyFood', 'pleasureFood', 'exercise', 'sleep'];
    const healthNames = {
        food: '🍽️ Еда (3 раза)',
        healthyFood: '🥗 Здоровое питание',
        pleasureFood: '🍰 Питание в удовольствие',
        exercise: '🏃‍♀️ Физическая активность',
        sleep: '😴 Достаточный сон'
    };
    
    healthTasks.forEach(task => {
        if (!oldHealth[task] && gameData.health[task]) {
            addExperience('self', 2); // 2 XP за каждую галочку здоровья
            showMiniNotification(`+2 XP за "${healthNames[task]}"`);
        }
    });
    
    updateStatsFromHealth();
    updateMultiplierDisplay();
    saveGameData();
}

// Обработка слайдера воды
function updateWaterFromUI() {
    const waterSlider = document.getElementById('water-slider');
    gameData.health.water = parseInt(waterSlider.value);
    document.getElementById('water-display').textContent = waterSlider.value;
    
    updateStatsFromHealth();
    updateMultiplierDisplay();
    saveGameData();
}
// Обработка рутинных задач
function updateRoutineFromUI() {
    const oldRoutine = {};
    Object.keys(gameData.routine).forEach(key => {
        oldRoutine[key] = gameData.routine[key].done;
    });
    
    // Считываем новое состояние
    Object.keys(gameData.routine).forEach(key => {
        const checkbox = document.getElementById(`${key}-check`);
        if (checkbox) {
            const wasCompleted = oldRoutine[key];
            const isCompleted = checkbox.checked;
            
            // Даем XP за новые выполненные задачи
            if (!wasCompleted && isCompleted) {
                giveRoutineXP(key);
            }
            
            gameData.routine[key].done = isCompleted;
        }
    });
    
    updateMultiplierDisplay();
    saveGameData();
}

// XP за рутинные задачи
function giveRoutineXP(taskKey) {
    let baseXP = 3; // Базовые 3 XP за рутину
    let category = 'self';
    
    // Разные задачи дают разный XP и в разные категории
    if (taskKey.includes('nesuda')) {
        category = 'management';
        baseXP = 4; // Рабочие задачи чуть больше
    } else if (taskKey === 'family') {
        category = 'family';
        baseXP = 3;
    } else if (taskKey === 'home') {
        category = 'self';
        baseXP = 2;
    }
    
    addExperience(category, baseXP);
    showMiniNotification(`+${baseXP} XP за "${gameData.routine[taskKey].text}"`);
}

// Редактирование задач рутины
function editRoutineTask(taskKey) {
    const currentText = gameData.routine[taskKey].text;
    const newText = prompt('Измените задачу:', currentText);
    
    if (newText && newText.trim() !== '') {
        gameData.routine[taskKey].text = newText.trim();
        updateRoutineDisplay();
        saveGameData();
    }
}

// Система наград за уровни
function giveReward(level) {
    const rewards = {
        2: { type: 'title', name: 'Ученица Целителя', description: 'Первые шаги к мастерству' },
        3: { type: 'equipment', name: 'Стетоскоп Мудрости', description: '+10% XP к медицинским квестам' },
        5: { type: 'title', name: 'Хранительница Знаний', description: 'Накопительница мудрости веков' },
        7: { type: 'equipment', name: 'Мантия Баланса', description: '+15% XP ко всем действиям' },
        10: { type: 'title', name: 'Мастер Жизни', description: 'Гармония тела, разума и души' },
        12: { type: 'equipment', name: 'Кольцо Фокуса', description: '+20% к характеристике Фокус' },
        15: { type: 'title', name: 'Легенда Танзании', description: 'Ваша слава распространилась по всей стране' },
        20: { type: 'equipment', name: 'Корона Целительницы', description: '+25% XP ко всем категориям' }
    };
    
    const reward = rewards[level];
    if (reward) {
        // Добавляем награду в инвентарь
        if (reward.type === 'title') {
            gameData.titles.push(reward);
        } else if (reward.type === 'equipment') {
            gameData.equipment.push(reward);
        }
        
        // Показываем уведомление через секунду после уведомления об уровне
        setTimeout(() => {
            const icons = { title: '👑', equipment: '⚔️', ability: '✨' };
            alert(`${icons[reward.type]} Получена награда!\n\n"${reward.name}"\n${reward.description}`);
        }, 1500);
        
        saveGameData();
    }
}

// Уведомления
function showLevelUpNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #d4af37, #ffd700);
        color: #1a0f0a; padding: 20px 30px; border-radius: 15px;
        font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.2em;
        z-index: 2000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        border: 2px solid #b8941f; animation: levelUp 3s ease-in-out forwards;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Анимация
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
        if (document.body.contains(notification)) document.body.removeChild(notification);
        if (document.head.contains(style)) document.head.removeChild(style);
    }, 3000);
}

function showMiniNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: rgba(212, 175, 55, 0.9); color: #1a0f0a;
        padding: 10px 15px; border-radius: 8px;
        font-size: 0.9em; font-weight: bold; z-index: 1500;
        animation: slideIn 0.5s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 2500);
}
// Обновление отображения опыта
function updateExperienceDisplay() {
    const currentLevel = gameData.experience.level;
    const currentXP = gameData.experience.totalXP;
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    
    document.getElementById('main-level').textContent = currentLevel;
    document.getElementById('total-xp').textContent = `${currentXP} XP`;
    
    const progressPercent = neededXP > 0 ? (progressXP / neededXP) * 100 : 0;
    document.getElementById('xp-bar-fill').style.width = progressPercent + '%';
    document.getElementById('xp-bar-text').textContent = `${progressXP} / ${neededXP} XP`;
    
    // Обновляем уровни категорий
    Object.keys(gameData.experience.categories).forEach(category => {
        const level = gameData.experience.categories[category].level;
        const element = document.getElementById(`${category}-level`);
        if (element) {
            element.textContent = level;
        }
    });
}

// Обновление отображения характеристик
function updateStatsDisplay() {
    document.getElementById('energy-fill').style.width = gameData.stats.energy + '%';
    document.getElementById('energy-value').textContent = gameData.stats.energy;
    
    document.getElementById('focus-fill').style.width = gameData.stats.focus + '%';
    document.getElementById('focus-value').textContent = gameData.stats.focus;
    
    document.getElementById('health-fill').style.width = gameData.stats.health + '%';
    document.getElementById('health-value').textContent = gameData.stats.health;
}

// Обновление отображения здоровья
function updateHealthDisplay() {
    document.getElementById('food-check').checked = gameData.health.food;
    document.getElementById('healthy-food-check').checked = gameData.health.healthyFood;
    document.getElementById('pleasure-food-check').checked = gameData.health.pleasureFood;
    document.getElementById('exercise-check').checked = gameData.health.exercise;
    document.getElementById('sleep-check').checked = gameData.health.sleep;
    document.getElementById('water-slider').value = gameData.health.water;
    document.getElementById('water-display').textContent = gameData.health.water;
}

// Обновление отображения рутины
function updateRoutineDisplay() {
    Object.keys(gameData.routine).forEach(key => {
        const checkbox = document.getElementById(`${key}-check`);
        const text = document.getElementById(`${key}-text`);
        
        if (checkbox && text) {
            checkbox.checked = gameData.routine[key].done;
            text.textContent = gameData.routine[key].text;
        }
    });
}

// Обновление отображения множителей
function updateMultiplierDisplay() {
    const healthBonus = calculateHealthBonus();
    const routineBonus = calculateRoutineBonus();
    const totalMultiplier = healthBonus * routineBonus;
    const routineCompletion = calculateRoutineCompletion();
    
    document.getElementById('multiplier-display').innerHTML = `
        <div>Множитель опыта: ×${totalMultiplier.toFixed(1)}</div>
        <div style="font-size: 0.8em; margin-top: 5px;">
            💪 Здоровье: ×${healthBonus.toFixed(1)} | 📋 Рутина: ×${routineBonus.toFixed(1)}
        </div>
        <div style="font-size: 0.8em; color: #cdaa3d;">
            Рутина выполнена на ${routineCompletion.toFixed(0)}%
        </div>
    `;
}

// Общее обновление UI
function updateUI() {
    updateStatsFromHealth();
    updateStatsDisplay();
    updateHealthDisplay();
    updateRoutineDisplay();
    updateExperienceDisplay();
    updateMultiplierDisplay();
}

// Сохранение и загрузка данных
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
            const savedData = JSON.parse(saved);
            gameData = { ...gameData, ...savedData };
        }
    } catch (e) {
        console.log('Загрузка недоступна');
    }
}

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
// Отображение квестов
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

// Создание карточки квеста
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
    
    // Прогресс-бар
    let progressHtml = `
        <div class="quest-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                <div class="progress-text">${progressPercent}%</div>
            </div>
        </div>
    `;
    
    // Этапы квеста (если есть)
    let stagesHtml = '';
    if (quest.stages && quest.stages.length > 0) {
        stagesHtml = '<div class="quest-stages">';
        quest.stages.forEach((stage, index) => {
            const completed = stage.completed ? 'completed' : '';
            stagesHtml += `
                <div class="stage-item ${completed}">
                    <input type="checkbox" class="stage-checkbox" 
                           ${stage.completed ? 'checked' : ''} 
                           onchange="toggleStage(${quest.id}, ${index})">
                    <span class="stage-name">${stage.name}</span>
                    <span class="stage-percent">${stage.percent}%</span>
                </div>
            `;
        });
        stagesHtml += '</div>';
    }
    
    // Кнопки управления
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
        ${stagesHtml}
        ${controlsHtml}
    `;
    
    return card;
}

// Обновление прогресса квеста
function updateQuestProgress(questId, increment) {
    const quest = gameData.quests.find(q => q.id === questId);
    if (!quest) return;
    
    quest.progress = Math.min(100, quest.progress + increment);
    
    if (quest.progress >= 100) {
        completeQuest(questId);
    } else {
        renderQuests();
        saveGameData();
    }
}

// Переключение этапа квеста
function toggleStage(questId, stageIndex) {
    const quest = gameData.quests.find(q => q.id === questId);
    if (!quest || !quest.stages || !quest.stages[stageIndex]) return;
    
    const stage = quest.stages[stageIndex];
    stage.completed = !stage.completed;
    
    // Пересчитываем общий прогресс на основе выполненных этапов
    let totalProgress = 0;
    quest.stages.forEach(s => {
        if (s.completed) {
            totalProgress += s.percent;
        }
    });
    
    quest.progress = Math.min(100, totalProgress);
    
    if (quest.progress >= 100) {
        completeQuest(questId);
    } else {
        renderQuests();
        saveGameData();
    }
}

// Завершение квеста
function completeQuest(questId) {
    const questIndex = gameData.quests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    
    const quest = gameData.quests[questIndex];
    let baseXP = calculateQuestXP(quest.level, 100);
    
    // Штраф за просрочку
    if (quest.deadline && isOverdue(quest.deadline)) {
        baseXP = Math.round(baseXP * 0.8); // -20% за просрочку
    }
    
    addExperience(quest.category, baseXP);
    
    const penalty = quest.deadline && isOverdue(quest.deadline) ? ' (-20% за просрочку)' : '';
    alert(`🎉 Квест "${quest.title}" завершен!\n+${baseXP} XP в категории "${categories[quest.category]}"${penalty}`);
    
    gameData.quests.splice(questIndex, 1);
    renderQuests();
    saveGameData();
}

// Удаление квеста
function deleteQuest(questId) {
    if (!confirm('❌ Удалить этот квест?\n\nВы потеряете весь прогресс!')) return;
    
    const questIndex = gameData.quests.findIndex(q => q.id === questId);
    if (questIndex !== -1) {
        gameData.quests.splice(questIndex, 1);
        renderQuests();
        saveGameData();
    }
}

// Фильтрация квестов
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
// Показать модальное окно создания квеста
function showAddQuestModal() {
    document.getElementById('addQuestModal').style.display = 'block';
}

// Закрыть модальное окно
function closeAddQuestModal() {
    document.getElementById('addQuestModal').style.display = 'none';
    
    // Очищаем форму
    document.getElementById('quest-title').value = '';
    document.getElementById('quest-description').value = '';
    document.getElementById('quest-category').value = 'medical';
    document.getElementById('quest-level').value = 'E';
    document.getElementById('progress-type').value = 'simple';
    document.getElementById('quest-deadline').value = '';
    document.getElementById('initial-progress').value = '0';
    
    // Скрываем дополнительные опции
    document.getElementById('steps-options').style.display = 'none';
    document.getElementById('stages-options').style.display = 'none';
    
    // Очищаем этапы
    const stagesList = document.getElementById('stages-list');
    stagesList.innerHTML = `
        <div class="stage-item" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
            <input type="text" placeholder="Название этапа..." style="flex: 1; padding: 8px; border: 1px solid #d4af37; border-radius: 5px; background: rgba(0,0,0,0.3); color: #d4af37;">
            <input type="number" placeholder="%" min="1" max="100" style="width: 60px; padding: 8px; border: 1px solid #d4af37; border-radius: 5px; background: rgba(0,0,0,0.3); color: #d4af37;">
            <button type="button" onclick="removeStage(this)" style="background: #c44; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">×</button>
        </div>
    `;
}

// Переключение типов прогресса
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

// Создание квеста
function addQuest() {
    const title = document.getElementById('quest-title').value.trim();
    const category = document.getElementById('quest-category').value;
    const level = document.getElementById('quest-level').value;
    const description = document.getElementById('quest-description').value.trim();
    const deadline = document.getElementById('quest-deadline').value;
    const initialProgress = parseInt(document.getElementById('initial-progress').value) || 0;
    const progressType = document.getElementById('progress-type').value;
    
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
        createdAt: new Date().toISOString(),
        progressType: progressType
    };
    
    // Добавляем специфичные для типа прогресса данные
    if (progressType === 'steps') {
        const stepsFrom = parseInt(document.getElementById('steps-from').value) || 0;
        const stepsTo = parseInt(document.getElementById('steps-to').value) || 100;
        const stepsUnit = document.getElementById('steps-unit').value.trim() || 'единиц';
        
        newQuest.steps = {
            from: stepsFrom,
            to: stepsTo,
            current: stepsFrom,
            unit: stepsUnit
        };
    } else if (progressType === 'stages') {
        const stageInputs = document.querySelectorAll('#stages-list .stage-item');
        const stages = [];
        
        stageInputs.forEach(stageItem => {
            const nameInput = stageItem.querySelector('input[type="text"]');
            const percentInput = stageItem.querySelector('input[type="number"]');
            
            if (nameInput.value.trim() && percentInput.value) {
                stages.push({
                    name: nameInput.value.trim(),
                    percent: parseInt(percentInput.value),
                    completed: false
                });
            }
        });
        
        if (stages.length > 0) {
            newQuest.stages = stages;
        }
    }
    
    gameData.quests.push(newQuest);
    renderQuests();
    saveGameData();
    closeAddQuestModal();
    
    showMiniNotification(`Квест "${title}" создан!`);
}

// Генератор квестов на основе описания
function generateQuest() {
    const situation = document.getElementById('situation-input').value.trim();
    
    if (!situation) {
        alert('Опишите ситуацию для создания квеста!');
        return;
    }
    
    const questData = analyzeSituation(situation);
    
    // Заполняем форму
    document.getElementById('quest-title').value = questData.title;
    document.getElementById('quest-category').value = questData.category;
    document.getElementById('quest-level').value = questData.level;
    document.getElementById('quest-description').value = questData.description;
    
    showAddQuestModal();
    document.getElementById('situation-input').value = '';
    
    showMiniNotification('Квест сгенерирован! Проверьте и отредактируйте детали.');
}

// Анализ ситуации для генерации квеста
function analyzeSituation(text) {
    text = text.toLowerCase();
    
    let category = 'self';
    let level = 'C';
    let title = 'Новое задание';
    let description = 'Автоматически созданный квест';
    
    // Определяем категорию
    if (text.includes('дцп') || text.includes('эрготерапи') || text.includes('пациент') || 
        text.includes('медиц') || text.includes('лечен') || text.includes('диагноз')) {
        category = 'medical';
    } else if (text.includes('исследован') || text.includes('пыльц') || 
               text.includes('ловушк') || text.includes('наук') || text.includes('анализ')) {
        category = 'science';
    } else if (text.includes('испанск') || text.includes('английск') || 
               text.includes('язык') || text.includes('ielts') || text.includes('изуча')) {
        category = 'languages';
    } else if (text.includes('клиник') || text.includes('управлен') || 
               text.includes('команд') || text.includes('отчет') || text.includes('планирован')) {
        category = 'management';
    } else if (text.includes('семь') || text.includes('дом') || 
               text.includes('ребен') || text.includes('родител')) {
        category = 'family';
    }
    
    // Определяем уровень сложности
    if (text.includes('начал') || text.includes('попробова') || text.includes('изуча')) {
        level = 'D';
    } else if (text.includes('провест') || text.includes('сделат') || text.includes('освои')) {
        level = 'C';
    } else if (text.includes('внедрит') || text.includes('системно') || text.includes('изменит')) {
        level = 'B';
    } else if (text.includes('создат') || text.includes('революц') || text.includes('кардинально')) {
        level = 'A';
    }
    
    // Генерируем название и описание
    const words = text.split(' ').slice(0, 5).join(' ');
    title = words.charAt(0).toUpperCase() + words.slice(1);
    
    if (title.length > 50) {
        title = title.substring(0, 47) + '...';
    }
    
    description = `Квест создан на основе: "${text.slice(0, 150)}${text.length > 150 ? '...' : ''}"`;
    
    return { title, category, level, description };
}
// Утилиты для работы с датами
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

function isOverdue(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getTime() < now.getTime();
}

// Обработчик клика вне модального окна
window.onclick = function(event) {
    const modal = document.getElementById('addQuestModal');
    if (event.target === modal) {
        closeAddQuestModal();
    }
}

// Инициализация приложения
window.addEventListener('load', function() {
    console.log('Инициализация RPG Quest Board...');
    
    // Загружаем данные
    loadGameData();
    checkDailyReset();
    
    // Добавляем стартовые квесты если их нет
    if (gameData.quests.length === 0) {
        gameData.quests = [
            {
                id: 1,
                title: 'Изучение испанского языка',
                category: 'languages',
                level: 'C',
                description: 'Достичь уровня B1 в испанском языке для работы в Танзании',
                progress: 30,
                deadline: '2026-06-01',
                createdAt: new Date().toISOString(),
                progressType: 'simple'
            },
            {
                id: 2,
                title: 'Создание пыльцевой ловушки',
                category: 'science',
                level: 'B',
                description: 'Разработать прототип для сбора данных о пыльце в регионе',
                progress: 15,
                deadline: '2025-09-01',
                createdAt: new Date().toISOString(),
                progressType: 'simple'
            },
            {
                id: 3,
                title: 'Освоение эрготерапии',
                category: 'medical',
                level: 'C',
                description: 'Изучить методики работы с детьми с ДЦП для расширения практики',
                progress: 0,
                createdAt: new Date().toISOString(),
                progressType: 'stages',
                stages: [
                    { name: 'Изучить теоретические основы', percent: 30, completed: false },
                    { name: 'Пройти онлайн курс', percent: 40, completed: false },
                    { name: 'Практика с пациентами', percent: 30, completed: false }
                ]
            }
        ];
        gameData.questIdCounter = 4;
    }
    
    // Обновляем UI
    updateUI();
    renderQuests();
    
    // Устанавливаем обработчики событий для здоровья
    const healthCheckboxes = [
        'food-check', 'healthy-food-check', 'pleasure-food-check', 
        'exercise-check', 'sleep-check'
    ];
    
    healthCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', updateHealthFromUI);
        }
    });
    
    // Обработчик слайдера воды
    const waterSlider = document.getElementById('water-slider');
    if (waterSlider) {
        waterSlider.addEventListener('input', updateWaterFromUI);
    }
    
    // Устанавливаем обработчики для рутины
    const routineCheckboxes = [
        'nesuda1-check', 'nesuda2-check', 'nesuda3-check', 
        'home-check', 'family-check'
    ];
    
    routineCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', updateRoutineFromUI);
        }
    });
    
    // Обработчик для типа прогресса в модальном окне
    const progressTypeSelect = document.getElementById('progress-type');
    if (progressTypeSelect) {
        progressTypeSelect.addEventListener('change', toggleProgressOptions);
    }
    
    console.log('RPG Quest Board инициализирован успешно!');
    console.log(`Уровень: ${gameData.experience.level}, XP: ${gameData.experience.totalXP}`);
    console.log(`Квестов: ${gameData.quests.length}`);
    
    // Показываем приветственное сообщение при первом запуске
    if (gameData.experience.totalXP === 0) {
        setTimeout(() => {
            alert('🎉 Добро пожаловать в RPG Quest Board!\n\nПревратите свою жизнь в увлекательную игру!\n\n✨ Выполняйте квесты и получайте опыт\n💪 Следите за здоровьем для бонусов\n📋 Делайте рутину для множителей XP\n👑 Получайте награды за достижения');
        }, 1000);
    }
});

// Автосохранение каждые 30 секунд
setInterval(() => {
    saveGameData();
}, 30000);

// Сохранение при закрытии страницы
window.addEventListener('beforeunload', function() {
    saveGameData();
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Ошибка в RPG Quest Board:', e.error);
    // Можно добавить отправку ошибок на сервер или показ уведомления пользователю
});

// Дополнительные утилиты для отладки (можно удалить в продакшене)
window.debugGameData = function() {
    console.log('Текущие данные игры:', gameData);
};

window.resetProgress = function() {
    if (confirm('⚠️ ВНИМАНИЕ! Это сбросит весь прогресс!\n\nВы уверены?')) {
        localStorage.removeItem('rpgQuestData');
        location.reload();
    }
};

window.addTestXP = function(amount = 100) {
    addExperience('self', amount);
    console.log(`Добавлено ${amount} XP для тестирования`);
};

console.log('🎮 RPG Quest Board готов к использованию!');
console.log('💡 Доступные команды для отладки:');
console.log('   debugGameData() - показать данные');
console.log('   resetProgress() - сбросить прогресс');
console.log('   addTestXP(amount) - добавить XP для теста');