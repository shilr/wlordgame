// 游戏状态管理
const gameState = {
    day: 1,
    location: "apartment",
    player: {
        stamina: 100,
        health: 100,
        food: 3,
        water: 3,
        inventory: [],
        skills: {
            combat: 1,
            survival: 1,
            social: 1
        }
    },
    storyProgress: 0,
    factionReputation: {
        raiders: 0,
        sanctuary: 0
    }
};

// 场景数据
const scenes = {
    apartment: {
        title: "废弃公寓",
        description: "你在一间废弃的公寓中醒来，头痛欲裂。窗外传来奇怪的嘶吼声，阳光透过破碎的窗户洒进来，照亮了房间里的血迹...",
        options: [
            { text: "检查柜子", action: checkCabinet },
            { text: "搜索客厅", action: searchLivingRoom },
            { text: "尝试打开窗户", action: tryOpenWindow }
        ]
    },
    cabinet: {
        title: "检查柜子",
        description: "你打开柜子，发现了一罐罐头食品和一瓶矿泉水。突然，你听到门外传来脚步声...",
        options: [
            { text: "拿走罐头和矿泉水", action: takeSupplies },
            { text: "放下物品，悄悄离开", action: leaveQuietly }
        ]
    },
    livingRoom: {
        title: "搜索客厅",
        description: "客厅里一片狼藉，电视机倒在地上，窗帘被撕成了碎片。你在茶几下发现了一把铁棍。",
        options: [
            { text: "拿起铁棍", action: takeCrowbar },
            { text: "继续搜索", action: continueSearching }
        ]
    }
};

// 游戏初始化
function initGame() {
    updateUI();
    loadScene("apartment");
}

// 更新UI显示
function updateUI() {
    document.getElementById('stamina').textContent = gameState.player.stamina;
    document.getElementById('health').textContent = gameState.player.health;
    document.getElementById('food').textContent = gameState.player.food;
    document.getElementById('water').textContent = gameState.player.water;
    document.getElementById('diary-date').textContent = `第${gameState.day}天`;
}

// 加载场景
function loadScene(sceneId) {
    const scene = scenes[sceneId];
    gameState.location = sceneId;
    
    document.getElementById('scene-title').textContent = scene.title;
    document.getElementById('scene-text').textContent = scene.description;
    
    const optionsContainer = document.querySelector('.interaction-options');
    optionsContainer.innerHTML = '';
    
    scene.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = option.action;
        optionsContainer.appendChild(button);
    });
    
    // 添加到日记
    addToDiary(scene.description);
}

// 添加到日记
function addToDiary(text) {
    const diaryContent = document.getElementById('diary-content');
    const entry = document.createElement('p');
    entry.textContent = text;
    diaryContent.appendChild(entry);
}

// 场景动作函数
function checkCabinet() {
    loadScene("cabinet");
}

function searchLivingRoom() {
    loadScene("livingRoom");
}

function tryOpenWindow() {
    const roll = Math.random();
    if (roll > 0.7) {
        addToDiary("你成功打开了窗户，看到了外面的世界：街道上到处都是废弃的车辆和游荡的行尸...");
        gameState.player.stamina -= 15;
    } else {
        addToDiary("窗户被钉死了，你无法打开它。");
        gameState.player.stamina -= 10;
    }
    updateUI();
}

function takeSupplies() {
    gameState.player.food += 1;
    gameState.player.water += 1;
    addToDiary("你拿走了罐头和矿泉水，但门外传来了更近的脚步声...");
    gameState.player.stamina -= 10;
    updateUI();
    // 触发战斗或逃跑场景
    setTimeout(() => {
        encounterEnemy("zombie");
    }, 1000);
}

function leaveQuietly() {
    addToDiary("你决定不冒险，悄悄离开了柜子。");
    loadScene("apartment");
}

function takeCrowbar() {
    gameState.player.inventory.push("铁棍");
    gameState.player.skills.combat += 1;
    addToDiary("你拿起了铁棍，感觉更有安全感了。");
    updateUI();
    loadScene("apartment");
}

function continueSearching() {
    const roll = Math.random();
    if (roll > 0.5) {
        addToDiary("你继续搜索，在沙发垫下找到了一些药品。");
        gameState.player.health += 10;
    } else {
        addToDiary("你继续搜索，但什么也没找到。");
    }
    gameState.player.stamina -= 15;
    updateUI();
    loadScene("apartment");
}

// 战斗系统
function encounterEnemy(enemyType) {
    let enemy = {
        type: enemyType,
        health: enemyType === "zombie" ? 50 : 70,
        damage: enemyType === "zombie" ? 10 : 15
    };
    
    const battleLog = [];
    battleLog.push(`遭遇了${enemyType === "zombie" ? "行尸" : "掠夺者"}！`);
    
    while (gameState.player.health > 0 && enemy.health > 0) {
        // 玩家回合
        const playerDamage = Math.floor(Math.random() * 20) + gameState.player.skills.combat * 5;
        enemy.health -= playerDamage;
        battleLog.push(`你对敌人造成了${playerDamage}点伤害！`);
        
        // 敌人回合
        if (enemy.health > 0) {
            gameState.player.health -= enemy.damage;
            battleLog.push(`敌人对你造成了${enemy.damage}点伤害！`);
        }
        
        gameState.player.stamina -= 10;
        updateUI();
    }
    
    if (gameState.player.health <= 0) {
        battleLog.push("你被击败了...");
        gameOver();
    } else {
        battleLog.push("你击败了敌人！");
        if (enemyType === "raider") {
            gameState.player.inventory.push("掠夺者的装备");
            gameState.factionReputation.raiders -= 10;
        } else {
            gameState.player.food += 1;
        }
    }
    
    // 显示战斗日志
    showBattleLog(battleLog);
    updateUI();
}

function showBattleLog(log) {
    const battleLog = document.createElement('div');
    battleLog.className = 'battle-log';
    log.forEach(entry => {
        const p = document.createElement('p');
        p.textContent = entry;
        battleLog.appendChild(p);
    });
    document.getElementById('diary-content').appendChild(battleLog);
}

// 游戏结束
function gameOver() {
    const optionsContainer = document.querySelector('.interaction-options');
    optionsContainer.innerHTML = '';
    
    const restartButton = document.createElement('button');
    restartButton.textContent = "重新开始";
    restartButton.onclick = resetGame;
    optionsContainer.appendChild(restartButton);
    
    addToDiary("游戏结束...");
}

// 重置游戏
function resetGame() {
    gameState.day = 1;
    gameState.location = "apartment";
    gameState.player = {
        stamina: 100,
        health: 100,
        food: 3,
        water: 3,
        inventory: [],
        skills: {
            combat: 1,
            survival: 1,
            social: 1
        }
    };
    gameState.storyProgress = 0;
    gameState.factionReputation = {
        raiders: 0,
        sanctuary: 0
    };
    
    document.getElementById('diary-content').innerHTML = '';
    initGame();
}

// 保存游戏
function saveGame() {
    localStorage.setItem('wastelandSurvival', JSON.stringify(gameState));
    addToDiary("游戏已保存。");
}

// 加载游戏
function loadGame() {
    const savedData = localStorage.getItem('wastelandSurvival');
    if (savedData) {
        Object.assign(gameState, JSON.parse(savedData));
        updateUI();
        loadScene(gameState.location);
        addToDiary("游戏已加载。");
    } else {
        addToDiary("没有找到保存的游戏。");
    }
}

// 主菜单
function goToMainMenu() {
    const optionsContainer = document.querySelector('.interaction-options');
    optionsContainer.innerHTML = '';
    
    const newGameButton = document.createElement('button');
    newGameButton.textContent = "新游戏";
    newGameButton.onclick = resetGame;
    optionsContainer.appendChild(newGameButton);
    
    const loadGameButton = document.createElement('button');
    loadGameButton.textContent = "加载游戏";
    loadGameButton.onclick = loadGame;
    optionsContainer.appendChild(loadGameButton);
}

// 初始化游戏
window.onload = initGame;