// ========================================
// ADVANCED PONG GAME - ALL FEATURES
// ========================================

const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// ========================================
// GAME SETTINGS & CONSTANTS
// ========================================

const difficulties = {
    easy: { computerSpeed: 3, ballSpeedIncrease: 1.01, ballMaxSpeed: 7 },
    medium: { computerSpeed: 5, ballSpeedIncrease: 1.02, ballMaxSpeed: 8 },
    hard: { computerSpeed: 7, ballSpeedIncrease: 1.03, ballMaxSpeed: 10 }
};

const powerupTypes = ['biggerPaddle', 'slowerBall', 'speedBoost', 'invincibility', 'magnet', 'slowMotion'];

const achievements = {
    firstBlood: { name: 'First Blood', icon: '🥇', description: 'Score first point' },
    onFire: { name: 'On Fire', icon: '🔥', description: 'Win with 5+ lead' },
    speedDemon: { name: 'Speed Demon', icon: '⚡', description: '20+ rally hits' },
    champion: { name: 'Champion', icon: '🏆', description: 'Beat hard difficulty' },
    powerMaster: { name: 'Power Master', icon: '💥', description: 'Catch 5 power-ups' },
    perfectGame: { name: 'Perfect Game', icon: '👯', description: '10-0 score' }
};

// ========================================
// GAME STATE
// ========================================

const paddleHeight = 80;
const paddleWidth = 10;
const ballSize = 7;

let currentDifficulty = 'medium';
let gameMode = 'single'; // 'single' or 'multiplayer'
let currentTheme = 'dark';

let playerPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6,
    baseHeight: paddleHeight
};

let computerPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: difficulties[currentDifficulty].computerSpeed,
    dy: 0
};

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballSize,
    dx: 5,
    dy: 5,
    speed: 5,
    maxSpeed: difficulties[currentDifficulty].ballMaxSpeed,
    speedIncrease: difficulties[currentDifficulty].ballSpeedIncrease,
    invincible: false
};

let scores = {
    player: 0,
    computer: 0,
    best1: localStorage.getItem('pongBest1') ? parseInt(localStorage.getItem('pongBest1')) : 0,
    best2: localStorage.getItem('pongBest2') ? parseInt(localStorage.getItem('pongBest2')) : 0
};

let statistics = {
    currentRally: 0,
    longestRally: localStorage.getItem('pongLongestRally') ? parseInt(localStorage.getItem('pongLongestRally')) : 0,
    totalGames: localStorage.getItem('pongTotalGames') ? parseInt(localStorage.getItem('pongTotalGames')) : 0,
    powerupsCaught: 0
};

let unlockedAchievements = JSON.parse(localStorage.getItem('pongAchievements') || '{}');

let powerups = [];
let activePowerups = {
    biggerPaddle: false,
    slowerBall: false,
    speedBoost: false,
    invincibility: false,
    magnet: false,
    slowMotion: false
};

let gameRunning = false;
let gamePaused = false;
let keys = {};
let soundEnabled = true;
let musicEnabled = true;
let audioContext;
let backgroundMusicOscillator = null;
let slowMotionFactor = 1;

// ========================================
// INITIALIZATION
// ========================================

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (!soundEnabled || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Sound not available');
    }
}

function startBackgroundMusic() {
    if (!musicEnabled || !audioContext) return;
    
    try {
        if (backgroundMusicOscillator) {
            backgroundMusicOscillator.stop();
        }
        
        const frequencies = [262, 294, 330, 349]; // C D E F
        let index = 0;
        
        const playNote = () => {
            if (!gameRunning || !musicEnabled) return;
            
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.value = frequencies[index % frequencies.length];
            gain.gain.setValueAtTime(0.05, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.5);
            
            index++;
            setTimeout(playNote, 500);
        };
        
        playNote();
    } catch (e) {
        console.log('Music not available');
    }
}

function stopBackgroundMusic() {
    if (backgroundMusicOscillator) {
        try {
            backgroundMusicOscillator.stop();
        } catch (e) {}
        backgroundMusicOscillator = null;
    }
}

// Sound effects
function soundBallHit() {
    playSound(400, 0.1);
}

function soundScore() {
    playSound(800, 0.2);
    setTimeout(() => playSound(1000, 0.2), 100);
}

function soundPowerup() {
    playSound(1200, 0.1);
    setTimeout(() => playSound(1500, 0.1), 50);
}

function soundAchievement() {
    playSound(600, 0.15);
    setTimeout(() => playSound(900, 0.15), 75);
}

// ========================================
// EVENT LISTENERS
// ========================================

// Keyboard
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    initAudio();
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse
canvas.addEventListener('mousemove', (e) => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    const paddleCenter = playerPaddle.y + playerPaddle.height / 2;
    if (mouseY < paddleCenter - 10) {
        playerPaddle.dy = -playerPaddle.speed;
    } else if (mouseY > paddleCenter + 10) {
        playerPaddle.dy = playerPaddle.speed;
    } else {
        playerPaddle.dy = 0;
    }
});

// Touch support for mobile
canvas.addEventListener('touchmove', (e) => {
    initAudio();
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchY = touch.clientY - rect.top;
    
    const paddleCenter = playerPaddle.y + playerPaddle.height / 2;
    if (touchY < paddleCenter - 10) {
        playerPaddle.dy = -playerPaddle.speed;
    } else if (touchY > paddleCenter + 10) {
        playerPaddle.dy = playerPaddle.speed;
    } else {
        playerPaddle.dy = 0;
    }
});

// Buttons
document.getElementById('startBtn').addEventListener('click', () => {
    initAudio();
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        statistics.totalGames++;
        localStorage.setItem('pongTotalGames', statistics.totalGames);
        document.getElementById('startBtn').textContent = '⏹️ Stop Game';
        document.getElementById('gameStatus').textContent = 'Game Running';
        startBackgroundMusic();
    } else {
        gameRunning = false;
        gamePaused = false;
        stopBackgroundMusic();
        document.getElementById('startBtn').textContent = '▶️ Start Game';
        document.getElementById('gameStatus').textContent = 'Game Stopped';
    }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? '▶️ Resume' : '⏸️ Pause';
        document.getElementById('gameStatus').textContent = gamePaused ? 'Game Paused' : 'Game Running';
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    scores.player = 0;
    scores.computer = 0;
    gameRunning = false;
    gamePaused = false;
    statistics.currentRally = 0;
    statistics.powerupsCaught = 0;
    activePowerups = {
        biggerPaddle: false,
        slowerBall: false,
        speedBoost: false,
        invincibility: false,
        magnet: false,
        slowMotion: false
    };
    playerPaddle.height = paddleHeight;
    powerups = [];
    slowMotionFactor = 1;
    stopBackgroundMusic();
    document.getElementById('startBtn').textContent = '▶️ Start Game';
    document.getElementById('gameStatus').textContent = 'Press Start to Play';
    document.getElementById('pauseBtn').textContent = '⏸️ Pause';
    updateScore();
    updateStatsDisplay();
    updatePowerupsDisplay();
    resetBall();
});

// Theme selector
document.getElementById('theme')?.addEventListener('change', (e) => {
    document.body.className = e.target.value;
    currentTheme = e.target.value;
    localStorage.setItem('pongTheme', currentTheme);
});

// Game mode selector
document.getElementById('gameMode')?.addEventListener('change', (e) => {
    gameMode = e.target.value;
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
        difficultySelect.disabled = gameMode === 'multiplayer';
    }
    const computerInfo = document.getElementById('computerInfo');
    const controlsInfo = document.getElementById('controlsInfo');
    const player2Label = document.getElementById('player2Label');
    
    if (gameMode === 'multiplayer') {
        if (computerInfo) computerInfo.textContent = '👥 Player 2 uses W/S keys to control the right paddle';
        if (controlsInfo) controlsInfo.innerHTML = '⬆️⬇️ <strong>Arrow Keys (Up/Down)</strong> OR W/S for Player 1, W/S for Player 2';
        if (player2Label) player2Label.textContent = '👤 Player 2';
    } else {
        if (computerInfo) computerInfo.textContent = '🤖 Computer controls the right paddle';
        if (controlsInfo) controlsInfo.innerHTML = '🖱️ <strong>Mouse</strong> or ⬆️⬇️ <strong>Arrow Keys (Up/Down)</strong> to control the left paddle';
        if (player2Label) player2Label.textContent = '🤖 Computer';
    }
    
    scores.player = 0;
    scores.computer = 0;
    updateScore();
});

// Difficulty selector
document.getElementById('difficulty')?.addEventListener('change', (e) => {
    if (!gameRunning) {
        currentDifficulty = e.target.value;
        const settings = difficulties[currentDifficulty];
        computerPaddle.speed = settings.computerSpeed;
        ball.maxSpeed = settings.ballMaxSpeed;
        ball.speedIncrease = settings.ballSpeedIncrease;
    }
});

// Sound toggle
document.getElementById('soundToggle')?.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
});

// Music toggle
document.getElementById('musicToggle')?.addEventListener('change', (e) => {
    musicEnabled = e.target.checked;
    if (gameRunning && musicEnabled) {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
});

// ========================================
// PADDLE UPDATES
// ========================================

function updatePlayerPaddle() {
    if (gameMode === 'multiplayer') {
        // Player 1: Arrow keys
        if (keys['ArrowUp']) {
            playerPaddle.dy = -playerPaddle.speed;
        } else if (keys['ArrowDown']) {
            playerPaddle.dy = playerPaddle.speed;
        } else {
            playerPaddle.dy = 0;
        }
    }

    playerPaddle.y += playerPaddle.dy;

    if (playerPaddle.y < 0) playerPaddle.y = 0;
    if (playerPaddle.y + playerPaddle.height > canvas.height) {
        playerPaddle.y = canvas.height - playerPaddle.height;
    }
}

function updateComputerPaddle() {
    if (gameMode === 'multiplayer') {
        // Player 2: W/S keys
        if (keys['w'] || keys['W']) {
            computerPaddle.dy = -computerPaddle.speed;
        } else if (keys['s'] || keys['S']) {
            computerPaddle.dy = computerPaddle.speed;
        } else {
            computerPaddle.dy = 0;
        }
        computerPaddle.y += computerPaddle.dy;
    } else {
        // AI
        const computerCenter = computerPaddle.y + computerPaddle.height / 2;
        const ballCenter = ball.y;

        if (ballCenter < computerCenter - 20) {
            computerPaddle.y -= computerPaddle.speed;
        } else if (ballCenter > computerCenter + 20) {
            computerPaddle.y += computerPaddle.speed;
        }
    }

    if (computerPaddle.y < 0) computerPaddle.y = 0;
    if (computerPaddle.y + computerPaddle.height > canvas.height) {
        computerPaddle.y = canvas.height - computerPaddle.height;
    }
}

// ========================================
// POWER-UPS
// ========================================

function generatePowerup(x, y) {
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    powerups.push({ x, y, type, size: 20, duration: 0 });
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Check collision with player paddle
        if (
            powerup.x > playerPaddle.x &&
            powerup.x < playerPaddle.x + playerPaddle.width &&
            powerup.y > playerPaddle.y &&
            powerup.y < playerPaddle.y + playerPaddle.height
        ) {
            activatePowerup(powerup.type);
            statistics.powerupsCaught++;
            powerups.splice(i, 1);
            soundPowerup();
            checkAchievement('powerMaster');
            continue;
        }
        
        if (powerup.y > canvas.height || powerup.y < 0) {
            powerups.splice(i, 1);
        }
    }
}

function activatePowerup(type) {
    soundPowerup();
    
    if (type === 'biggerPaddle') {
        playerPaddle.height = paddleHeight * 1.5;
        activePowerups.biggerPaddle = true;
        setTimeout(() => {
            playerPaddle.height = paddleHeight;
            activePowerups.biggerPaddle = false;
            updatePowerupsDisplay();
        }, 8000);
    } else if (type === 'slowerBall') {
        activePowerups.slowerBall = true;
        const originalSpeed = ball.speed;
        ball.speed = originalSpeed * 0.7;
        setTimeout(() => {
            ball.speed = originalSpeed;
            activePowerups.slowerBall = false;
            updatePowerupsDisplay();
        }, 8000);
    } else if (type === 'speedBoost') {
        activePowerups.speedBoost = true;
        playerPaddle.speed *= 1.5;
        setTimeout(() => {
            playerPaddle.speed /= 1.5;
            activePowerups.speedBoost = false;
            updatePowerupsDisplay();
        }, 8000);
    } else if (type === 'invincibility') {
        activePowerups.invincibility = true;
        ball.invincible = true;
        setTimeout(() => {
            ball.invincible = false;
            activePowerups.invincibility = false;
            updatePowerupsDisplay();
        }, 5000);
    } else if (type === 'magnet') {
        activePowerups.magnet = true;
        setTimeout(() => {
            activePowerups.magnet = false;
            updatePowerupsDisplay();
        }, 8000);
    } else if (type === 'slowMotion') {
        activePowerups.slowMotion = true;
        slowMotionFactor = 0.5;
        setTimeout(() => {
            slowMotionFactor = 1;
            activePowerups.slowMotion = false;
            updatePowerupsDisplay();
        }, 8000);
    }
    
    updatePowerupsDisplay();
}

function updatePowerupsDisplay() {
    const active = [];
    if (activePowerups.biggerPaddle) active.push('🎯 Bigger Paddle');
    if (activePowerups.slowerBall) active.push('🐢 Slower Ball');
    if (activePowerups.speedBoost) active.push('⚡ Speed Boost');
    if (activePowerups.invincibility) active.push('🛡️ Invincibility');
    if (activePowerups.magnet) active.push('🧲 Magnet');
    if (activePowerups.slowMotion) active.push('⏱️ Slow Motion');
    
    const element = document.getElementById('powerupsText');
    if (element) {
        element.textContent = active.length > 0 ? active.join(', ') : 'None';
    }
}

// ========================================
// BALL PHYSICS
// ========================================

function updateBall() {
    ball.x += ball.dx * slowMotionFactor;
    ball.y += ball.dy * slowMotionFactor;

    // Wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
        playSound(200, 0.1);
    }

    // Player paddle collision
    if (
        ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height
    ) {
        ball.dx = -ball.dx;
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        
        const deltaY = ball.y - (playerPaddle.y + playerPaddle.height / 2);
        ball.dy = (deltaY / (playerPaddle.height / 2)) * ball.speed;
        
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        if (speed < ball.maxSpeed) {
            ball.dx *= ball.speedIncrease;
            ball.dy *= ball.speedIncrease;
        }
        
        statistics.currentRally++;
        
        soundBallHit();
        
        if (Math.random() < 0.15) {
            generatePowerup(ball.x, ball.y);
        }
    }

    // Computer paddle collision
    if (
        ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height
    ) {
        if (!ball.invincible) {
            ball.dx = -ball.dx;
            ball.x = computerPaddle.x - ball.radius;
            
            const deltaY = ball.y - (computerPaddle.y + computerPaddle.height / 2);
            ball.dy = (deltaY / (computerPaddle.height / 2)) * ball.speed;
            
            const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
            if (speed < ball.maxSpeed) {
                ball.dx *= ball.speedIncrease;
                ball.dy *= ball.speedIncrease;
            }
        }
        
        soundBallHit();
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        scores.computer++;
        if (statistics.currentRally > statistics.longestRally) {
            statistics.longestRally = statistics.currentRally;
            localStorage.setItem('pongLongestRally', statistics.longestRally);
        }
        statistics.currentRally = 0;
        updateScore();
        soundScore();
        checkAchievements();
        resetBall();
    }
    if (ball.x + ball.radius > canvas.width) {
        scores.player++;
        if (statistics.currentRally > statistics.longestRally) {
            statistics.longestRally = statistics.currentRally;
            localStorage.setItem('pongLongestRally', statistics.longestRally);
        }
        statistics.currentRally = 0;
        updateScore();
        soundScore();
        checkAchievements();
        resetBall();
    }

    updateStatsDisplay();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
    ball.invincible = false;
}

// ========================================
// ACHIEVEMENTS
// ========================================

function checkAchievement(specific) {
    if (specific === 'firstBlood') {
        if ((scores.player === 1 || scores.computer === 1) && !unlockedAchievements['firstBlood']) {
            unlockAchievement('firstBlood');
        }
    } else if (specific === 'powerMaster') {
        if (statistics.powerupsCaught >= 5 && !unlockedAchievements['powerMaster']) {
            unlockAchievement('powerMaster');
        }
    }
}

function checkAchievements() {
    // First Blood
    if ((scores.player === 1 || scores.computer === 1) && !unlockedAchievements['firstBlood']) {
        unlockAchievement('firstBlood');
    }
    
    // On Fire
    if (Math.abs(scores.player - scores.computer) >= 5 && !unlockedAchievements['onFire']) {
        unlockAchievement('onFire');
    }
    
    // Speed Demon
    if (statistics.currentRally >= 20 && !unlockedAchievements['speedDemon']) {
        unlockAchievement('speedDemon');
    }
    
    // Champion
    if (currentDifficulty === 'hard' && scores.player >= 5 && !unlockedAchievements['champion']) {
        unlockAchievement('champion');
    }
    
    // Perfect Game
    if (scores.player === 10 && scores.computer === 0 && !unlockedAchievements['perfectGame']) {
        unlockAchievement('perfectGame');
    }
}

function unlockAchievement(id) {
    unlockedAchievements[id] = true;
    localStorage.setItem('pongAchievements', JSON.stringify(unlockedAchievements));
    soundAchievement();
    updateAchievementsDisplay();
}

function updateAchievementsDisplay() {
    const list = document.getElementById('achievementsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    for (const [id, achievement] of Object.entries(achievements)) {
        const div = document.createElement('div');
        div.className = 'achievement';
        if (unlockedAchievements[id]) {
            div.classList.add('unlocked');
        }
        
        div.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
        `;
        
        div.title = achievement.description;
        list.appendChild(div);
    }
}

// ========================================
// DISPLAY UPDATES
// ========================================

function updateScore() {
    document.getElementById('playerScore').textContent = scores.player;
    document.getElementById('computerScore').textContent = scores.computer;
    
    if (scores.player > scores.best1) {
        scores.best1 = scores.player;
        localStorage.setItem('pongBest1', scores.best1);
    }
    if (scores.computer > scores.best2) {
        scores.best2 = scores.computer;
        localStorage.setItem('pongBest2', scores.best2);
    }
    
    const best1 = document.getElementById('bestScore1');
    const best2 = document.getElementById('bestScore2');
    if (best1) best1.textContent = `Best: ${scores.best1}`;
    if (best2) best2.textContent = `Best: ${scores.best2}`;
}

function updateStatsDisplay() {
    const rally = document.getElementById('rallyCount');
    const longest = document.getElementById('longestRally');
    const speed = document.getElementById('ballSpeed');
    const games = document.getElementById('totalGames');
    
    if (rally) rally.textContent = statistics.currentRally;
    if (longest) longest.textContent = statistics.longestRally;
    if (speed) speed.textContent = Math.round(Math.sqrt(ball.dx ** 2 + ball.dy ** 2) * 10) / 10;
    if (games) games.textContent = statistics.totalGames;
}

// ========================================
// DRAWING
// ========================================

function drawPaddle(paddle, color = '#00ff00') {
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#00cc00';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    if (activePowerups.invincibility) {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
        ctx.shadowBlur = 15;
    } else {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    }
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawPowerups() {
    for (let powerup of powerups) {
        const colors = {
            biggerPaddle: '#FF6B9D',
            slowerBall: '#00D4FF',
            speedBoost: '#FFD700',
            invincibility: '#FF6B9D',
            magnet: '#9D4EDD',
            slowMotion: '#87CEEB'
        };
        
        ctx.fillStyle = colors[powerup.type] || '#FFD700';
        ctx.fillRect(powerup.x - powerup.size / 2, powerup.y - powerup.size / 2, powerup.size, powerup.size);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(powerup.x - powerup.size / 2, powerup.y - powerup.size / 2, powerup.size, powerup.size);
    }
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCenterLine();
    drawPaddle(playerPaddle);
    drawPaddle(computerPaddle, '#00ff00');
    drawBall();
    drawPowerups();
}

// ========================================
// GAME LOOP
// ========================================

function gameLoop() {
    if (gameRunning && !gamePaused) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
        updatePowerups();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// ========================================
// INITIALIZATION
// ========================================

window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('pongTheme') || 'dark';
    document.body.className = savedTheme;
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
    
    updateScore();
    updateStatsDisplay();
    updatePowerupsDisplay();
    updateAchievementsDisplay();
    
    gameLoop();
});
